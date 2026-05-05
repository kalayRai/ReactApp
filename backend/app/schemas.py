from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# User schemas
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Auth token schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Chat schemas
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

# Roadmap schemas
class RoadmapRequest(BaseModel):
    career: str
    level: str

class RoadmapResponse(BaseModel):
    career: str
    level: str
    roadmap: list

# Course schemas
class CourseSearchRequest(BaseModel):
    query: str

class CourseResult(BaseModel):
    id: str
    title: str
    url: str
    provider: Optional[str] = None

class CourseSearchResponse(BaseModel):
    results: list[CourseResult]