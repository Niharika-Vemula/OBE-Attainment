from pydantic import BaseModel
from typing import Optional


class UserCreate(BaseModel):
    name: str
    email: str
    role: str = "faculty"
    department: Optional[str] = None
    password: str = "password123"


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    department: Optional[str] = None
    is_active: bool


class SettingUpdate(BaseModel):
    value: str
    description: Optional[str] = None
