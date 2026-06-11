"""
DWM Portal — Work Category Architecture Rollback Script
=========================================================
Rollback steps:
  1. Drop work_categories collection.
  2. Restore sub_categories from sub_categories_backup.
  3. Restore time_entries from time_entries_backup.
  4. Drop backup collections.

IMPORTANT: This script restores the database to the pre-migration state.
It will PERMANENTLY delete all work_categories data.

Usage:
    cd H:/dwm_production/dwm_production/backend
    python -m scripts.rollback_work_categories

Author: DWM Portal Migration
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from datetime import datetime
from pymongo import MongoClient

from app.core.config import settings

MONGO_URI = settings.MONGODB_URI
DB_NAME   = settings.MONGODB_DB_NAME


def log(msg: str):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def confirm_rollback() -> bool:
    """Interactive confirmation prompt."""
    print("\n" + "=" * 60)
    print("  ⚠️  DWM Portal — WORK CATEGORY ROLLBACK")
    print("=" * 60)
    print("  This will:")
    print("  1. Drop the 'work_categories' collection permanently.")
    print("  2. Restore 'sub_categories' from backup.")
    print("  3. Restore 'time_entries' from backup.")
    print("  4. Drop the backup collections.")
    print("=" * 60)
    answer = input("\n  Type 'ROLLBACK' (all caps) to confirm: ").strip()
    return answer == "ROLLBACK"


def run_rollback():
    if not confirm_rollback():
        print("\n  [ABORT] Rollback cancelled by user.\n")
        return

    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]

    log(f"Connected to MongoDB: {MONGO_URI} / {DB_NAME}")

    # ── Step 1: Drop work_categories ──────────────────────────────────────────
    log("=== STEP 1: Dropping work_categories collection ===")
    if "work_categories" in db.list_collection_names():
        db.drop_collection("work_categories")
        log("  [DROP] work_categories dropped.")
    else:
        log("  [SKIP] work_categories collection does not exist.")

    # Also reset the counter
    db["counters"].delete_one({"_id": "work_category"})
    log("  [RESET] work_category counter deleted.")

    # ── Step 2: Restore sub_categories from backup ────────────────────────────
    log("=== STEP 2: Restoring sub_categories from backup ===")
    backup_sc = list(db["sub_categories_backup"].find({}))

    if not backup_sc:
        log("  [WARN] sub_categories_backup is empty or does not exist. Skipping restore.")
    else:
        db.drop_collection("sub_categories")
        log(f"  [DROP] sub_categories dropped.")
        if backup_sc:
            db["sub_categories"].insert_many(backup_sc)
        log(f"  [RESTORE] {len(backup_sc)} sub_categories restored from backup.")

    # ── Step 3: Restore time_entries from backup ──────────────────────────────
    log("=== STEP 3: Restoring time_entries from backup ===")
    backup_te = list(db["time_entries_backup"].find({}))

    if not backup_te:
        log("  [WARN] time_entries_backup is empty or does not exist. Skipping restore.")
    else:
        db.drop_collection("time_entries")
        log(f"  [DROP] time_entries dropped.")
        if backup_te:
            db["time_entries"].insert_many(backup_te)
        log(f"  [RESTORE] {len(backup_te)} time_entries restored from backup.")

    # ── Step 4: Drop backup collections ──────────────────────────────────────
    log("=== STEP 4: Dropping backup collections ===")
    for col_name in ["sub_categories_backup", "time_entries_backup"]:
        if col_name in db.list_collection_names():
            db.drop_collection(col_name)
            log(f"  [DROP] {col_name} dropped.")
        else:
            log(f"  [SKIP] {col_name} does not exist.")

    log("=== ROLLBACK COMPLETE ✅ ===")
    log("  Database has been restored to pre-migration state.")
    log("  Please restart the FastAPI backend to apply changes.")

    client.close()


if __name__ == "__main__":
    run_rollback()
