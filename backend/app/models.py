from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    messages = relationship("Message", back_populates="user", cascade="all, delete-orphan")
    roadmaps = relationship("Roadmap", back_populates="user", cascade="all, delete-orphan")
    stats = relationship("UserStats", back_populates="user", cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    interviews = relationship("InterviewHistory", back_populates="user", cascade="all, delete-orphan")
    analytics = relationship("AnalyticsTrends", back_populates="user", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    sender = Column(String, nullable=False)  # 'user' or 'bot'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="messages")

class Roadmap(Base):
    __tablename__ = "roadmaps"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    career = Column(String, nullable=False)
    level = Column(String, nullable=False)
    roadmap_data = Column(Text, nullable=False)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="roadmaps")

class SavedCourse(Base):
    __tablename__ = "saved_courses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(String, nullable=False)
    course_title = Column(String, nullable=False)
    course_url = Column(String, nullable=True)
    provider = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# User Statistics
class UserStats(Base):
    __tablename__ = "user_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    messages_count = Column(Integer, default=0)
    roadmaps_count = Column(Integer, default=0)
    courses_viewed = Column(Integer, default=0)
    quizzes_taken = Column(Integer, default=0)
    interviews_completed = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")

# Resume
class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    parsed_data = Column(Text, nullable=True)  # JSON string of parsed resume
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")

# Interview History
class InterviewHistory(Base):
    __tablename__ = "interview_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)
    questions = Column(Text, nullable=True)  # JSON array of questions
    answers = Column(Text, nullable=True)  # JSON array of answers
    feedback = Column(Text, nullable=True)
    score = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")

# Analytics Trends
class AnalyticsTrends(Base):
    __tablename__ = "analytics_trends"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String, nullable=False)  # 'chat', 'roadmap', 'course', 'interview'
    activity_count = Column(Integer, default=1)
    date = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")