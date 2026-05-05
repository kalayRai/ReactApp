import json
import random
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Message
from app.routes.auth import get_current_user
from app.schemas import ChatRequest, ChatResponse, RoadmapRequest, RoadmapResponse, CourseSearchRequest, CourseSearchResponse

router = APIRouter(prefix="/api", tags=["features"])

# Career advice responses
CAREER_ADVICE = [
    "Great question! When considering a career change, it's important to first assess your current skills and how they transfer to your desired field.",
    "Networking is crucial in today's job market. I'd recommend attending industry meetups and connecting with professionals in your target field.",
    "Don't underestimate the power of personal projects. Building a portfolio can demonstrate your abilities better than any resume.",
    "Continuous learning is key. Consider taking online courses or certifications to bridge any skill gaps.",
    "Every expert was once a beginner. Start small, be consistent, and you'll make progress.",
    "Your soft skills are just as important as technical skills. Communication and teamwork can set you apart.",
    "Consider freelancing or contracting to gain experience in a new field before making a full commitment.",
    "Ask for mentorships or informational interviews to learn from those already in your desired career."
]

@router.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Save user message
    user_message = Message(
        user_id=current_user.id,
        text=request.message,
        sender="user"
    )
    db.add(user_message)
    db.commit()
    
    # Generate response (simple AI simulation)
    reply = random.choice(CAREER_ADVICE)
    
    # Save bot response
    bot_message = Message(
        user_id=current_user.id,
        text=reply,
        sender="bot"
    )
    db.add(bot_message)
    db.commit()
    
    return ChatResponse(reply=reply)

# Sample roadmap data
ROADMAP_TEMPLATES = {
    ("software engineer", "beginner"): [
        {"title": "Learn Programming Basics", "duration": "2 weeks", "resources": ["freeCodeCamp", "Codecademy"]},
        {"title": "Build Your First Project", "duration": "3 weeks", "resources": ["Personal Portfolio", "Todo App"]},
        {"title": "Learn Data Structures", "duration": "4 weeks", "resources": ["LeetCode", "HackerRank"]},
        {"title": "Understand Databases", "duration": "2 weeks", "resources": ["SQL Tutorial", "PostgreSQL Basics"]},
        {"title": "Learn Web Frameworks", "duration": "4 weeks", "resources": ["React", "Node.js"]}
    ],
    ("software engineer", "intermediate"): [
        {"title": "System Design Fundamentals", "duration": "3 weeks", "resources": ["System Design Interview", "DDIA Book"]},
        {"title": "Advanced Algorithms", "duration": "4 weeks", "resources": ["CLRS", "LeetCode Hard"]},
        {"title": "Microservices Architecture", "duration": "3 weeks", "resources": ["Docker", "Kubernetes"]},
        {"title": "CI/CD Pipelines", "duration": "2 weeks", "resources": ["GitHub Actions", "Jenkins"]},
        {"title": "Cloud Services", "duration": "3 weeks", "resources": ["AWS Solutions Architect"]}
    ],
    ("data scientist", "beginner"): [
        {"title": "Learn Python Fundamentals", "duration": "2 weeks", "resources": ["Python.org", "Automate the Boring Stuff"]},
        {"title": "Learn Statistics", "duration": "3 weeks", "resources": ["Khan Academy Stats", "StatQuest"]},
        {"title": "Learn Pandas & NumPy", "duration": "3 weeks", "resources": ["Pandas Documentation", "Kaggle Courses"]},
        {"title": "Data Visualization", "duration": "2 weeks", "resources": ["Matplotlib", "Tableau"]},
        {"title": "Intro to Machine Learning", "duration": "4 weeks", "resources": ["Scikit-learn", "Fast.ai"]}
    ],
}

@router.post("/generate-roadmap", response_model=RoadmapResponse)
def generate_roadmap(
    request: RoadmapRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    career = request.career.lower()
    level = request.level.lower()
    
    # Try to find exact match, otherwise use template
    roadmap_data = ROADMAP_TEMPLATES.get((career, level))
    
    if not roadmap_data:
        # Generic fallback roadmap
        roadmap_data = [
            {"title": f"Learn {career.title()} Fundamentals", "duration": "4 weeks", "resources": ["Online Courses", "Books"]},
            {"title": "Build Practical Projects", "duration": "6 weeks", "resources": ["Personal Projects", "Open Source"]},
            {"title": "Create Portfolio", "duration": "2 weeks", "resources": ["GitHub", "Personal Website"]},
            {"title": "Network & Apply", "duration": "Ongoing", "resources": ["LinkedIn", "Job Boards"]}
        ]
    
    # Save roadmap to database
    from app.models import Roadmap
    roadmap = Roadmap(
        user_id=current_user.id,
        career=request.career,
        level=request.level,
        roadmap_data=json.dumps(roadmap_data)
    )
    db.add(roadmap)
    db.commit()
    
    return RoadmapResponse(
        career=request.career,
        level=request.level,
        roadmap=roadmap_data
    )

# Sample courses (in production, integrate with real API like Udemy Coursera)
COURSE_DATABASE = [
    {"id": "udemy-1", "title": "The Complete 2024 Web Development Bootcamp", "url": "https://www.udemy.com/course/the-complete-web-development-bootcamp/", "provider": "Udemy"},
    {"id": "udemy-2", "title": "Python for Data Science and Machine Learning", "url": "https://www.udemy.com/course/python-for-data-science-and-machine-learning/", "provider": "Udemy"},
    {"id": "coursera-1", "title": "IBM Data Science Professional Certificate", "url": "https://www.coursera.org/professional-certificates/ibm-data-science", "provider": "Coursera"},
    {"id": "coursera-2", "title": "Full Stack Web Development Specialization", "url": "https://www.coursera.org/specializations/full-stack-web-development", "provider": "Coursera"},
    {"id": "edx-1", "title": "CS50's Introduction to Computer Science", "url": "https://cs50.harvard.edu/x/", "provider": "edX"},
    {"id": "edx-2", "title": "Professional Certificate in Data Science", "url": "https://www.edx.org/professional-certificate/harvardx-data-science", "provider": "edX"},
]

@router.post("/get-courses", response_model=CourseSearchResponse)
def search_courses(
    request: CourseSearchRequest,
    current_user: User = Depends(get_current_user)
):
    query = request.query.lower()
    
    # Simple search (in production, use real API)
    results = [
        course for course in COURSE_DATABASE
        if query in course["title"].lower() or query in course["provider"].lower()
    ]
    
    # If no results, return default courses
    if not results:
        results = COURSE_DATABASE[:3]
    
    return CourseSearchResponse(results=results)