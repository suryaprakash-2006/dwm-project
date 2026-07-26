import os
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

class Settings(BaseModel):
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "dwm_portal")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "supersecretkeychangeinproduction12345")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours
    DEFAULT_USER_PASSWORD: str = "dwm@1234"[:72]

    # ── Daily work hour limits (configurable) ─────────────────────────────────
    MAX_REGULAR_HOURS_PER_DAY: int = 8
    MAX_OVERTIME_HOURS_PER_DAY: int = 8
    MAX_TOTAL_HOURS_PER_DAY: int = 16  # Regular + Overtime combined cap

settings = Settings()
