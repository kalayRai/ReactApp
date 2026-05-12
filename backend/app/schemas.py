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

# Stats schemas
class UserStatsResponse(BaseModel):
    id: int
    user_id: int
    messages_count: int
    roadmaps_count: int
    courses_viewed: int
    quizzes_taken: int
    interviews_completed: int
    last_updated: datetime
    
    class Config:
        from_attributes = True

# Resume schemas
class ResumeUploadRequest(BaseModel):
    file_name: str
    file_content: str  # Base64 encoded

class ResumeResponse(BaseModel):
    id: int
    file_name: str
    parsed_data: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ResumeRefineRequest(BaseModel):
    resume_text: str
    target_role: Optional[str] = None

class ResumeRefineResponse(BaseModel):
    refined_resume: str
    improvements: list[str]
    ats_score: int

# Interview History schemas
class InterviewHistoryResponse(BaseModel):
    id: int
    role: str
    questions: Optional[str] = None
    answers: Optional[str] = None
    feedback: Optional[str] = None
    score: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Analytics Trends schemas
class AnalyticsTrendsResponse(BaseModel):
    id: int
    category: str
    activity_count: int
    date: datetime
    
    class Config:
        from_attributes = True

# Onboarding schemas
class OnboardingProfile(BaseModel):
    name: Optional[str] = None
    age: Optional[str] = None
    location: Optional[str] = None
    education: Optional[str] = None
    current_role: Optional[str] = None
    years_exp: Optional[str] = None
    skills: Optional[list[str]] = None
    values: Optional[list[str]] = None
    goals: Optional[str] = None
    salary_floor: Optional[str] = None
    work_type: Optional[str] = None

class OnboardingSaveRequest(BaseModel):
    profile: OnboardingProfile
    enriched_profile: Optional[dict] = None
    career_matches: Optional[list[dict]] = None
    roadmap: Optional[dict] = None
    jobs: Optional[list[dict]] = None
    pipeline_complete: bool = False

class OnboardingResponse(BaseModel):
    id: int
    user_id: int
    profile: Optional[OnboardingProfile] = None
    enriched_profile: Optional[dict] = None
    career_matches: Optional[list[dict]] = None
    roadmap: Optional[dict] = None
    jobs: Optional[list[dict]] = None
    pipeline_complete: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True