"""
DWM Portal — Work Category Architecture Migration Script
=========================================================
Phase 1:  Seed work_categories collection with 9 canonical categories.
Phase 2:  Create backups of sub_categories and time_entries.
Phase 3:  Add workCategoryId + department to existing sub_categories.
Phase 4:  Backfill workCategoryId + subCategoryId into all time_entries.

SAFETY RULES:
  - NO keyword-based guessing for sub_category → work_category mapping.
  - Unknown / ambiguous sub_categories are assigned to "Unassigned" work category.
  - Backups are created BEFORE any modifications.
  - Rollback script available: rollback_work_categories.py

Usage:
    cd H:/dwm_production/dwm_production/backend
    python -m scripts.migrate_work_categories

Author: DWM Portal Migration
"""

import sys
import os

# Add parent path so we can import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from datetime import datetime
from pymongo import MongoClient

# ── Config ────────────────────────────────────────────────────────────────────
from app.core.config import settings

MONGO_URI = settings.MONGODB_URI
DB_NAME   = settings.MONGODB_DB_NAME

# ── Canonical Work Category Seeds ─────────────────────────────────────────────
WORK_CATEGORIES_SEED = [
    {"name": "Task Against Order",       "description": "Work tasks assigned against production orders",    "active": True},
    {"name": "Improvements / Development","description": "Process improvements and software development",   "active": True},
    {"name": "Training",                 "description": "Training sessions and skill development",          "active": True},
    {"name": "Complaints",               "description": "Customer or internal complaint handling",          "active": True},
    {"name": "New Enquiry / RFQ",        "description": "New customer enquiries and request for quotations","active": True},
    {"name": "Travel / OD",              "description": "Travel and on-duty activities",                   "active": True},
    {"name": "Internal Activities",      "description": "Internal department and administrative activities", "active": True},
    {"name": "LBE",                      "description": "LBE activities",                                  "active": True},
    {"name": "Unassigned",               "description": "Fallback category for unclassified sub-categories","active": True},
]

# ── Sub-Category → Work Category explicit manual mapping ──────────────────────
# DO NOT use keyword-based guessing. Only explicitly known mappings are listed.
# Unknown sub-categories will be mapped to "Unassigned".
# Extend this dict with confidence when adding known department-specific mappings.
EXPLICIT_SC_TO_WC_MAP = {
    # Task Against Order
    "Task against order":       "Task Against Order",
    "Task Against Order":       "Task Against Order",
    # Improvements / Development
    "Software Development":     "Improvements / Development",
    "Process Improvement":      "Improvements / Development",
    "Machine Optimization":     "Improvements / Development",
    "Tool Enhancement":         "Improvements / Development",
    # Training
    "Training":                 "Training",
    # Complaints
    "Complaints":               "Complaints",
    # New Enquiry / RFQ
    "New enquiry / RFQ":        "New Enquiry / RFQ",
    "New Enquiry / RFQ":        "New Enquiry / RFQ",
    # Travel / OD
    "Travel / OD":              "Travel / OD",
    "Travel/OD":                "Travel / OD",
    # Internal Activities
    "Internal Activities":      "Internal Activities",
    "Supporting Activities":    "Internal Activities",
    "General":                  "Internal Activities",
    # LBE
    "LBE":                      "LBE",
}


def log(msg: str):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def run_migration():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]

    log(f"Connected to MongoDB: {MONGO_URI} / {DB_NAME}")

    # ──────────────────────────────────────────────────────────────────────────
    # PHASE 1: Seed work_categories collection
    # ──────────────────────────────────────────────────────────────────────────
    log("=== PHASE 1: Seeding work_categories collection ===")

    wc_col = db["work_categories"]
    counters_col = db["counters"]

    # Determine starting ID from counter
    counter_doc = counters_col.find_one({"_id": "work_category"})
    next_id = (counter_doc["seq"] + 1) if counter_doc else 1

    seeded_count = 0
    wc_name_to_id: dict = {}

    for seed in WORK_CATEGORIES_SEED:
        existing = wc_col.find_one({"name": seed["name"]})
        if existing:
            log(f"  [SKIP] Work category already exists: '{seed['name']}' (id={existing['id']})")
            wc_name_to_id[seed["name"]] = existing["id"]
            continue

        doc = {
            "id": next_id,
            "name": seed["name"],
            "description": seed["description"],
            "active": seed["active"]
        }
        wc_col.insert_one(doc)
        wc_name_to_id[seed["name"]] = next_id
        log(f"  [INSERT] Work category id={next_id}: '{seed['name']}'")
        next_id += 1
        seeded_count += 1

    # Update counter
    counters_col.update_one(
        {"_id": "work_category"},
        {"$set": {"seq": next_id - 1}},
        upsert=True
    )
    log(f"  Done. Seeded {seeded_count} new categories. Counter → {next_id - 1}")

    unassigned_id = wc_name_to_id.get("Unassigned")
    if not unassigned_id:
        raise RuntimeError("'Unassigned' work category not found! Cannot continue safely.")

    # ──────────────────────────────────────────────────────────────────────────
    # PHASE 2: Create backups BEFORE modifying any data
    # ──────────────────────────────────────────────────────────────────────────
    log("=== PHASE 2: Creating backups ===")

    # sub_categories backup
    sc_backup_col = db["sub_categories_backup"]
    if sc_backup_col.count_documents({}) == 0:
        all_sc = list(db["sub_categories"].find({}))
        if all_sc:
            sc_backup_col.insert_many(all_sc)
        log(f"  [BACKUP] sub_categories_backup created ({len(all_sc)} documents)")
    else:
        log(f"  [SKIP] sub_categories_backup already exists — not overwriting")

    # time_entries backup
    te_backup_col = db["time_entries_backup"]
    if te_backup_col.count_documents({}) == 0:
        all_te = list(db["time_entries"].find({}))
        if all_te:
            te_backup_col.insert_many(all_te)
        log(f"  [BACKUP] time_entries_backup created ({len(all_te)} documents)")
    else:
        log(f"  [SKIP] time_entries_backup already exists — not overwriting")

    # ──────────────────────────────────────────────────────────────────────────
    # PHASE 3: Update sub_categories with workCategoryId + department
    # ──────────────────────────────────────────────────────────────────────────
    log("=== PHASE 3: Updating sub_categories with workCategoryId ===")

    sc_col = db["sub_categories"]
    all_scs = list(sc_col.find({}))
    sc_id_to_wc_id: dict = {}

    for sc in all_scs:
        sc_name = sc.get("name", "")
        sc_id   = sc.get("id")

        # Resolve workCategoryId
        if sc.get("workCategoryId"):
            wc_id = sc["workCategoryId"]
            log(f"  [SKIP WC] SubCategory '{sc_name}' already has workCategoryId={wc_id}")
        else:
            # Use explicit mapping — NO guessing
            mapped_wc_name = EXPLICIT_SC_TO_WC_MAP.get(sc_name)
            if mapped_wc_name and mapped_wc_name in wc_name_to_id:
                wc_id = wc_name_to_id[mapped_wc_name]
                log(f"  [MAP]  SubCategory '{sc_name}' → '{mapped_wc_name}' (id={wc_id})")
            else:
                wc_id = unassigned_id
                log(f"  [UNASSIGNED] SubCategory '{sc_name}' → Unassigned (id={unassigned_id})")

        sc_id_to_wc_id[sc_id] = wc_id
        
        # Build update operation (rename dept -> department and set active)
        dept = sc.get("department") or sc.get("dept")
        update_set = {"workCategoryId": wc_id, "active": sc.get("active", True)}
        update_unset = {}
        if dept:
            update_set["department"] = dept
            if "dept" in sc:
                update_unset["dept"] = ""
                
        update_op = {"$set": update_set}
        if update_unset:
            update_op["$unset"] = update_unset

        sc_col.update_one({"id": sc_id}, update_op)

    log(f"  Done. Processed {len(all_scs)} sub-categories.")

    # Build sub_category name → id lookup for time_entries backfill
    sc_name_to_id: dict = {sc["name"]: sc["id"] for sc in all_scs if "name" in sc}

    # ──────────────────────────────────────────────────────────────────────────
    # PHASE 4: Backfill time_entries with workCategoryId + subCategoryId
    # ──────────────────────────────────────────────────────────────────────────
    log("=== PHASE 4: Backfilling time_entries with workCategoryId + subCategoryId ===")

    te_col = db["time_entries"]

    # Only process entries that don't have workCategoryId set
    te_to_update = list(te_col.find({"workCategoryId": {"$exists": False}}))
    log(f"  Found {len(te_to_update)} time entries missing workCategoryId.")

    updated_count    = 0
    unassigned_count = 0

    for te in te_to_update:
        te_id       = te.get("id")
        cat_name    = te.get("category", "")
        subcat_name = te.get("subCategory", "")

        # Resolve workCategoryId from category name via explicit map
        mapped_wc_name = EXPLICIT_SC_TO_WC_MAP.get(cat_name)
        if mapped_wc_name and mapped_wc_name in wc_name_to_id:
            wc_id = wc_name_to_id[mapped_wc_name]
        else:
            # Fallback: try to derive from the sub_category's workCategoryId
            sc_id = sc_name_to_id.get(subcat_name)
            wc_id = sc_id_to_wc_id.get(sc_id, unassigned_id) if sc_id else unassigned_id
            if wc_id == unassigned_id:
                unassigned_count += 1

        # Resolve subCategoryId from subCategory name
        sub_cat_id = sc_name_to_id.get(subcat_name)

        update_doc = {"workCategoryId": wc_id}
        if sub_cat_id:
            update_doc["subCategoryId"] = sub_cat_id

        te_col.update_one({"id": te_id}, {"$set": update_doc})
        updated_count += 1

    log(f"  Done. Updated {updated_count} time entries.")
    log(f"  {unassigned_count} entries mapped to Unassigned (no confident mapping found).")

    log("=== MIGRATION COMPLETE ✅ ===")
    log("  Next steps:")
    log("  1. Restart the FastAPI backend.")
    log("  2. Verify GET /work-categories returns 9 categories.")
    log("  3. Verify GET /sub-categories includes workCategoryId.")
    log("  4. Verify time entries have workCategoryId field.")
    log("  5. If anything looks wrong, run rollback_work_categories.py.")

    client.close()


if __name__ == "__main__":
    run_migration()
