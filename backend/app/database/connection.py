import sys
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.errors import ServerSelectionTimeoutError, OperationFailure
from app.core.config import settings

class DatabaseConnection:
    def __init__(self):
        self._client = None
        self._db = None

    def connect(self):
        try:
            self._client = MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=53005,
                connectTimeoutMS=53005,
                socketTimeoutMS=30000,
                maxPoolSize=50,
                retryWrites=True
            )
            # Test connection immediately
            self._client.admin.command("ping")
            self._db = self._client[settings.MONGODB_DB_NAME]
        except ServerSelectionTimeoutError as e:
            print(f"\n❌ Cannot reach the MongoDB server: {e}", file=sys.stderr)
            raise RuntimeError("Database unreachable")
        except OperationFailure as e:
            print(f"\n❌ MongoDB authentication failed: {e}", file=sys.stderr)
            raise RuntimeError("Database auth failure")

    @property
    def db(self):
        if self._db is None:
            self.connect()
        return self._db

    def get_collection(self, name: str) -> Collection:
        return self.db[name]

# Singleton instance
db_connection = DatabaseConnection()
