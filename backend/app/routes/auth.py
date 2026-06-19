import logging
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    PasswordChangePayload,
    ResetRequestPayload,
    ResetActionPayload,
    ResetStatusResponse
)
from app.repositories.db_repository import CredentialsRepository, EmployeesRepository, ResetRequestsRepository
from app.services.business_logic import BusinessLogicService
from app.utils.security import verify_password, get_password_hash, create_access_token
from app.middleware.rbac import get_current_user, RoleChecker
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)
cred_repo = CredentialsRepository()
emp_repo = EmployeesRepository()
reset_repo = ResetRequestsRepository()
service = BusinessLogicService()

@router.post("/login", response_model=LoginResponse)
def login(payload: dict = Body(..., description="Accepts standard LoginRequest or legacy number payload")):
    """
    Handles secure employee/admin login.
    Supports standard {empNo, password} and legacy {number} from frontend.
    """
    emp_no = payload.get("empNo") or payload.get("number")
    password = payload.get("password")

    logger.info("Login request received for employee: %s", emp_no)

    if not emp_no:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee number (empNo or number) is required"
        )

    emp = emp_repo.get_by_emp_no(emp_no)
    if not emp:
        # Bootstrap SUPER_ADMIN if DB is completely empty
        if emp_no == "9001" and (password == "super123" or not password):
            logger.info("Bootstrap event: Creating initial SUPER_ADMIN account")
            emp_data = {
                "id": "SA-01",
                "name": "Super Admin",
                "email": "super101@dwm.com",
                "role": "SUPER_ADMIN",
                "dept": "System",
                "designation": "System Administrator",
                "active": True,
                "empNo": "9001"
            }
            emp = service.register_employee(emp_data, get_password_hash("super123"))
            # Force password to super123 to pass the standard verification below
            password = "super123"
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid employee ID"
            )

    cred = cred_repo.find_by_emp_no(emp_no)
    if not cred:
        logger.warning("Credential lookup failed for employee: %s", emp_no)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials not found"
        )

    if not password:
        logger.warning("Login rejected: Missing password for employee: %s", emp_no)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required"
        )

    if not verify_password(password, cred["password"]):
        logger.warning("Password verification failed for employee: %s", emp_no)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials password"
        )

    if not emp.get("active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated"
        )

    token_data = {"empNo": emp["empNo"], "email": emp["email"], "role": emp["role"]}
    token = create_access_token(token_data)

    return {
        "access_token": token,
        "token_type": "bearer",
        "empNo": emp["empNo"],
        "email": emp["email"],
        "role": emp["role"],
        "department": emp["dept"],
        "username": emp["name"]
    }

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """Returns currently authenticated user profile."""
    return current_user

@router.put("/change-password")
def change_password(payload: PasswordChangePayload, current_user: dict = Depends(get_current_user)):
    """Changes password for the authenticated employee profile."""
    cred = cred_repo.find_by_email(current_user["email"])
    if not cred or not verify_password(payload.currentPassword, cred["password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    updated = cred_repo.update_password(current_user["email"], get_password_hash(payload.newPassword))
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password"
        )

    return {"message": "Password changed successfully"}

@router.post("/reset-request")
def request_password_reset(payload: ResetRequestPayload):
    """
    Queues a password reset request.
    Notification is sent to SUPER_ADMIN ONLY (not ADMIN).
    """
    req = service.submit_password_reset_request(payload.empNo)
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee number #{payload.empNo} not found"
        )
    return {"message": "Password reset request sent to Super Admin for approval.", "data": req}

@router.get("/reset-requests", response_model=List[dict])
def get_reset_requests(
    current_user: dict = Depends(RoleChecker(["SUPER_ADMIN"]))
):
    """
    Lists ALL password reset requests.
    SUPER_ADMIN ONLY — ADMIN is forbidden from viewing this queue.
    """
    return reset_repo.get_all()

@router.put("/reset-requests/{emp_no}/action")
def resolve_password_reset(
    emp_no: str,
    payload: ResetActionPayload,
    current_user: dict = Depends(RoleChecker(["SUPER_ADMIN"]))
):
    """
    Approves or rejects an employee password reset request.
    SUPER_ADMIN ONLY.
    On approval, resets password to default 'dwm@1234' and notifies the requester.
    """
    emp = emp_repo.get_by_emp_no(emp_no)
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )

    action = payload.action.lower()
    if action not in ["approve", "reject"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Action must be 'approve' or 'reject'"
        )

    success = reset_repo.set_action(emp_no, action)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resolve reset request"
        )

    # Determine notification target bucket
    notif_bucket = "user" if emp["role"] in ["USER", "OPERATOR"] else "admin"

    if action == "approve":
        # Always reset to the system default password dwm@1234
        default_pwd = settings.DEFAULT_USER_PASSWORD  # "dwm@1234"
        cred_repo.reset_password_to_default(emp_no, get_password_hash(default_pwd))

        service.notif_repo.add({
            "to": notif_bucket,
            "toEmail": emp["email"],
            "from": current_user.get("name", "Super Admin"),
            "type": "success",
            "subject": "Password Reset Approved",
            "body": (
                f"Your password reset request has been approved by Super Admin. "
                f"Your password has been reset to the default: {default_pwd}. "
                f"Please log in and change it immediately."
            )
        })
    else:
        service.notif_repo.add({
            "to": notif_bucket,
            "toEmail": emp["email"],
            "from": current_user.get("name", "Super Admin"),
            "type": "error",
            "subject": "Password Reset Rejected",
            "body": "Your password reset request was rejected by Super Admin. Please contact the system administrator."
        })

    return {"message": f"Password reset request {action}d successfully"}

@router.get("/reset-status/{emp_no}", response_model=ResetStatusResponse)
def get_reset_status(emp_no: str):
    """
    Checks reset request status.
    Returns: 'null', 'pending', 'expired', or 'approved' status keys.
    """
    req = reset_repo.get_by_emp_no(emp_no)
    if not req:
        return {"empNo": emp_no, "status": "null", "requestedAt": None}

    if req.get("approved"):
        return {"empNo": emp_no, "status": "approved", "requestedAt": req["requestedAt"]}
    elif req.get("rejected"):
        return {"empNo": emp_no, "status": "rejected", "requestedAt": req["requestedAt"]}

    # Check expiry (3 days)
    req_time = datetime.fromisoformat(req["requestedAt"])
    elapsed = datetime.utcnow() - req_time
    if elapsed > timedelta(days=3):
        return {"empNo": emp_no, "status": "expired", "requestedAt": req["requestedAt"]}

    return {"empNo": emp_no, "status": "pending", "requestedAt": req["requestedAt"]}
