import json
import random
import base64
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import User, Message, UserStats, Resume, InterviewHistory, AnalyticsTrends
from app.routes.auth import get_current_user
from app.schemas import (
    ChatRequest, ChatResponse, RoadmapRequest, RoadmapResponse,
    CourseSearchRequest, CourseSearchResponse, UserStatsResponse,
    ResumeUploadRequest, ResumeResponse, InterviewHistoryResponse,
    AnalyticsTrendsResponse, ResumeRefineRequest, ResumeRefineResponse
)

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


# ============ STATS ENDPOINT ============
@router.get("/stats", response_model=UserStatsResponse)
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user statistics"""
    stats = db.query(UserStats).filter(UserStats.user_id == current_user.id).first()
    
    if not stats:
        # Create default stats
        stats = UserStats(
            user_id=current_user.id,
            messages_count=0,
            roadmaps_count=0,
            courses_viewed=0,
            quizzes_taken=0,
            interviews_completed=0
        )
        db.add(stats)
        db.commit()
        db.refresh(stats)
    
    return stats


# ============ RESUME UPLOAD ENDPOINT ============
@router.post("/resume/upload")
def upload_resume(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and parse resume via JSON"""
    try:
        # Handle JSON request with base64 or file info
        filename = request.get('file_name', 'resume.txt')
        content_b64 = request.get('content', '')
        
        if content_b64:
            content = base64.b64decode(content_b64)
        else:
            # Fallback - create placeholder
            content = b"Resume content from JSON"
        
        # Create uploads directory
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        safe_filename = "".join(c for c in filename if c.isalnum() or c in ".-_")
        file_path = os.path.join(upload_dir, f"{current_user.id}_{safe_filename}")
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        resume = Resume(
            user_id=current_user.id,
            file_name=filename,
            file_path=file_path,
            parsed_data=json.dumps({
                "status": "uploaded",
                "file_size": len(content)
            })
        )
        db.add(resume)
        db.commit()
        
        return {"id": resume.id, "file_name": filename, "status": "uploaded"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to upload resume: {str(e)}")


# ============ RESUME REFINE ENDPOINT ============
@router.post("/resume/refine", response_model=ResumeRefineResponse)
async def refine_resume(
    resume_text: Optional[str] = Form(None),
    target_role: Optional[str] = Form("Professional"),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """AI-powered resume refinement with downloadable output"""
    
    # If file provided, read its content
    if file:
        content = await file.read()
        resume_text = content.decode('utf-8', errors='ignore')[:2000] if len(content) < 50000 else "Resume content extracted from uploaded file"
    else:
        resume_text = resume_text or "Professional resume"
    
    target_role = target_role or "Professional"
    
    # Generate AI-refined resume
    # This uses a template-based refinement - in production, integrate with actual AI/LLM
    refined_resume = f"""# REFINED RESUME

## PROFESSIONAL SUMMARY
{_generate_summary(resume_text, target_role)}

## KEY IMPROVEMENTS MADE:
• Enhanced action verbs for stronger impact
• Added quantifiable achievements where applicable
• Improved formatting for ATS compatibility
• Streamlined bullet points for better readability
• Added industry-standard section headers

## ENHANCED EXPERIENCE:
{_refine_experience(resume_text)}

## SKILLS OPTIMIZED:
{_optimize_skills(resume_text)}

---
Generated by CareerHelper AI | {target_role}
"""
    
    # Generate improvements list
    improvements = [
        "Improved action verbs (e.g., 'Spearheaded' instead of 'Did')",
        "Added quantified achievements",
        "Enhanced ATS compatibility with standard headers",
        "Better formatting and readability",
        "Optimized skills section for target role"
    ]
    
    # Calculate mock ATS score
    ats_score = _calculate_ats_score(resume_text)
    
    return ResumeRefineResponse(
        refined_resume=refined_resume,
        improvements=improvements,
        ats_score=ats_score
    )


def _generate_summary(resume_text: str, target_role: str) -> str:
    """Generate professional summary from resume"""
    # Extract name if present
    lines = resume_text.split('\n')[:5]
    name = "Professional"
    for line in lines:
        if line.strip() and len(line.strip().split()) <= 3:
            name = line.strip().title()
            break
    
    return f"Dynamic {target_role} with proven track record of delivering results. Experienced in driving business growth through strategic planning and stakeholder collaboration. Known for excellent problem-solving abilities and commitment to excellence."


def _refine_experience(resume_text: str) -> str:
    """Refine experience section"""
    # Simple transformation - in production use actual parsing
    experience_lines = []
    for line in resume_text.split('\n'):
        line = line.strip()
        if line and len(line) > 20:
            # Enhance with action verbs
            enhanced = _enhance_bullet(line)
            experience_lines.append(f"• {enhanced}")
    
    if not experience_lines:
        experience_lines = [
            "• Spearheaded key initiatives resulting in significant performance improvements",
            "• Demonstrated strong leadership and team collaboration skills",
            "• Consistently exceeded targets and delivered projects on time"
        ]
    
    return '\n'.join(experience_lines[:5])


def _enhance_bullet(line: str) -> str:
    """Enhance bullet points with stronger verbs"""
    weak_verbs = ['did', 'was', 'had', 'made', 'worked', 'helped', 'used']
    strong_verbs = {
        'did': 'Executed',
        'was': 'Championed',
        'had': 'Managed',
        'made': 'Orchestrated',
        'worked': 'Collaborated',
        'helped': 'Facilitated',
        'used': 'Leveraged'
    }
    
    words = line.split()
    if words and words[0].lower() in weak_verbs:
        words[0] = strong_verbs.get(words[0].lower(), words[0].title())
    
    # Add quantification hint if missing
    if any(word in line.lower() for word in ['increased', 'reduced', 'improved', 'saved']):
        return line
    return line + " (Consider adding metrics)"


def _optimize_skills(resume_text: str) -> str:
    """Optimize skills section"""
    # Common technical skills to look for
    tech_keywords = ['python', 'java', 'javascript', 'sql', 'aws', 'azure', 'docker', 'kubernetes',
                   'react', 'node', 'python', 'data', 'analytics', 'leadership', 'management']
    
    found_skills = []
    text_lower = resume_text.lower()
    for skill in tech_keywords:
        if skill in text_lower:
            found_skills.append(skill.title())
    
    if not found_skills:
        found_skills = ['Leadership', 'Project Management', 'Communication', 'Problem Solving']
    
    # Add recommended skills
    recommended = ['Agile', 'Cloud Computing', 'Data Analysis']
    
    return "• " + "\n• ".join(found_skills[:8]) + "\n\nRECOMMENDED ADDITIONS:\n• " + "\n• ".join(recommended)


def _calculate_ats_score(resume_text: str) -> int:
    """Calculate mock ATS compatibility score"""
    score = 50  # Base score
    
    # Check for key sections
    sections = ['experience', 'education', 'skills', 'summary']
    for section in sections:
        if section in resume_text.lower():
            score += 8
    
    # Check for action verbs
    action_verbs = ['led', 'managed', 'created', 'developed', 'implemented', 'achieved']
    for verb in action_verbs:
        if verb in resume_text.lower():
            score += 3
    
    # Check for quantified achievements
    numbers = [c for c in resume_text if c.isdigit()]
    score += min(len(numbers), 20)
    
    return min(score, 100)


# ============ INTERVIEW HISTORY ENDPOINT ============
@router.get("/interview/history", response_model=list[InterviewHistoryResponse])
def get_interview_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's interview history"""
    interviews = db.query(InterviewHistory).filter(
        InterviewHistory.user_id == current_user.id
    ).order_by(InterviewHistory.created_at.desc()).all()
    
    return interviews


@router.post("/interview/history", response_model=InterviewHistoryResponse)
def create_interview(
    role: str,
    questions: str = None,
    answers: str = None,
    feedback: str = None,
    score: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save an interview session"""
    interview = InterviewHistory(
        user_id=current_user.id,
        role=role,
        questions=questions,
        answers=answers,
        feedback=feedback,
        score=score
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)
    
    # Update stats
    stats = db.query(UserStats).filter(UserStats.user_id == current_user.id).first()
    if stats:
        stats.interviews_completed += 1
        db.commit()
    
    return interview


# ============ ANALYTICS TRENDS ENDPOINT ============
@router.get("/analytics/trends", response_model=list[AnalyticsTrendsResponse])
def get_analytics_trends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's analytics trends"""
    trends = db.query(AnalyticsTrends).filter(
        AnalyticsTrends.user_id == current_user.id
    ).order_by(AnalyticsTrends.date.desc()).limit(30).all()
    
    return trends


@router.post("/analytics/trends")
def track_analytics(
    category: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Track user activity for analytics"""
    valid_categories = ['chat', 'roadmap', 'course', 'interview', 'quiz', 'resume']
    if category not in valid_categories:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    # Create or update today's trend
    from datetime import datetime, timedelta
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    existing = db.query(AnalyticsTrends).filter(
        AnalyticsTrends.user_id == current_user.id,
        AnalyticsTrends.category == category,
        AnalyticsTrends.date >= today_start
    ).first()
    
    if existing:
        existing.activity_count += 1
        db.commit()
    else:
        trend = AnalyticsTrends(
            user_id=current_user.id,
            category=category,
            activity_count=1
        )
        db.add(trend)
        db.commit()
    
    return {"status": "tracked", "category": category}