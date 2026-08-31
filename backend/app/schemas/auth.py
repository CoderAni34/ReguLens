from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserLogin(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=4, description="User account password")


class UserRegister(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=4, description="User account password")
    full_name: Optional[str] = Field(None, description="Full name of the user")
    role: Optional[str] = Field("Compliance Officer", description="Role/Designation")


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    role: str = "Compliance Officer"
    is_active: bool = True
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
