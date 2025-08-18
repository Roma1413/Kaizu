from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# --- HABITS ---
class HabitBase(BaseModel):
    name: str
    done: Optional[bool] = False

class HabitCreate(HabitBase):
    pass

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    done: Optional[bool] = None  # client can mark habit as done/undone

class HabitOut(HabitBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True  # for Pydantic v2

# --- USERS ---
class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- FRIENDS ---
class FriendRequestCreate(BaseModel):
    target_email: str

class FriendOut(BaseModel):
    id: int
    user_id: int
    friend_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- MESSAGES ---
class MessageCreate(BaseModel):
    receiver_id: int
    content: str

class MessageOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True