from beanie import Document
from pydantic import Field
from typing import Optional


class User(Document):
    name: str
    email: str
    role: str = "faculty"          # "admin" | "faculty" | "student"
    department: Optional[str] = None
    is_active: bool = True
    password_hash: str = ""        # plain for demo; hash in production

    class Settings:
        name = "users"


class SystemSettings(Document):
    key: str
    value: str
    description: Optional[str] = None

    class Settings:
        name = "system_settings"
