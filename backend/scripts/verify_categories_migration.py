import os
import sys

# Adjust path to enable importing app module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Force connection to production for testing environment
if not os.environ.get("MONGODB_URI"):
    os.environ["MONGODB_URI"] = "mongodb://192.168.5.22:27017"

from app.database.connection import db_connection

def run_verification():
    db = db_connection.db
    print("==================================================")
    print("  DWM Portal - Migration Verification Script")
    print("==================================================")
    
    errors = []
    
    # 1. Fetch all work categories
    wcs = list(db["work_categories"].find())
    wc_ids = {wc["id"] for wc in wcs}
    wc_names_lower = {wc["name"].strip().lower() for wc in wcs}
    
    print(f"Loaded {len(wcs)} Work Categories.")
    
    # 2. Fetch all subcategories
    scs = list(db["sub_categories"].find())
    print(f"Loaded {len(scs)} Sub Categories.")
    
    # Check each subcategory
    for sc in scs:
        sc_id = sc.get("id")
        sc_name = sc.get("name", "").strip()
        sc_wc_id = sc.get("workCategoryId")
        sc_dept = sc.get("department")
        sc_legacy_dept = sc.get("dept")
        
        # Check A: no work category records exist in sub_categories
        if sc_name.lower() in wc_names_lower:
            errors.append(
                f"ERROR: Subcategory '{sc_name}' (id={sc_id}) has a name identical to a Work Category. "
                f"Work Categories and Sub Categories must be separate entities."
            )
            
        # Check B: every subcategory has a valid workCategoryId
        if sc_wc_id is None:
            errors.append(f"ERROR: Subcategory '{sc_name}' (id={sc_id}) has no workCategoryId.")
        elif sc_wc_id not in wc_ids:
            errors.append(
                f"ERROR: Subcategory '{sc_name}' (id={sc_id}) references invalid workCategoryId={sc_wc_id}."
            )
            
        # Check C: every subcategory has a valid department value
        if not sc_dept:
            if sc_legacy_dept:
                errors.append(
                    f"ERROR: Subcategory '{sc_name}' (id={sc_id}) has legacy 'dept' field but no 'department' field."
                )
            else:
                errors.append(f"ERROR: Subcategory '{sc_name}' (id={sc_id}) has no department value.")
                
    # 3. Check for duplicates under same department + work category
    dept_wc_name_seen = set()
    for sc in scs:
        sc_name = sc.get("name", "").strip().lower()
        sc_wc_id = sc.get("workCategoryId")
        sc_dept = sc.get("department")
        
        if sc_wc_id is not None and sc_dept:
            key = (sc_wc_id, sc_dept, sc_name)
            if key in dept_wc_name_seen:
                errors.append(
                    f"ERROR: Duplicate subcategory name '{sc.get('name')}' found under department '{sc_dept}' and workCategoryId={sc_wc_id}."
                )
            dept_wc_name_seen.add(key)
            
    print("--------------------------------------------------")
    if errors:
        print(f"FAILED: Verification FAILED with {len(errors)} error(s):")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)
    else:
        print("SUCCESS: Verification PASSED! All subcategories are valid.")
        sys.exit(0)

if __name__ == "__main__":
    run_verification()
