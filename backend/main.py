from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routes import auth, features

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(features.router)

# Startup event
@app.on_event("startup")
def startup_event():
    init_db()
    print("Database initialized")

# Root endpoint
@app.get("/")
def root():
    return {"message": "CareerHelper API is running!", "status": "ok"}

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)