from datetime import datetime, timedelta
from typing import Optional
import logging
import bcrypt
from jose import jwt, JWTError
from app.core.config import settings

logger = logging.getLogger(__name__)
# NOTE: We call the `bcrypt` library directly instead of going through
# passlib's CryptContext. passlib 1.7.4 (unmaintained since 2020) detects
# the bcrypt version via `bcrypt.__about__.__version__`, an attribute that
# was removed in bcrypt>=4.1.0. That mismatch is what was causing hashing
# to break whenever the deployed environment picked up a newer bcrypt
# version. Calling bcrypt directly avoids that broken detection code
# entirely while producing the exact same $2b$ hash format passlib did,
# so existing password hashes in the database remain valid with no
# migration needed.

# bcrypt has a hard 72-byte input limit; passwords longer than that are
# silently truncated by the underlying algorithm. We enforce the limit
# explicitly so failures are loud instead of silently truncating.
MAX_PASSWORD_BYTES = 72


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against hashed password."""
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except Exception as e:
        logger.error("verify_password failed: %s", e, exc_info=True)
        return False


def get_password_hash(password: str) -> str:
    """Generates a bcrypt hash of the password."""
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > MAX_PASSWORD_BYTES:
        raise ValueError(
            f"Password must be at most {MAX_PASSWORD_BYTES} bytes (bcrypt limit)."
        )
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generates JWT token with customizable timeout."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decodes JWT access token and returns payload."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError as e:
        logger.error("JWT decoding failed: %s", e, exc_info=True)
        return None