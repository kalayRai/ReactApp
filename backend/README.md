# CareerHelper Backend

Self-contained FastAPI backend for the CareerHelper mobile app.

## Setup

1. **Create virtual environment** (recommended):
```bash
cd backend
python -m venv venv
```

2. **Activate virtual environment**:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

## Running the Backend

**Option 1 - Direct run:**
```bash
cd backend
python main.py
```

**Option 2 - Using uvicorn:**
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will run at `http://localhost:8000`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/health` | GET | API health status |
| `/api/signup` | POST | Register new user |
| `/api/login` | POST | Login user |
| `/api/user/profile` | GET | Get current user profile |
| `/api/chat` | POST | Chat with career bot |
| `/api/generate-roadmap` | POST | Generate career roadmap |
| `/api/get-courses` | POST | Search courses |

## Updating Frontend

Edit `services/api.ts` in the CareerHelper app:
```typescript
const USE_NGROK = false;  // Changed to false
const YOUR_COMPUTER_IP = '192.168.1.7';  // Your local IP
const LOCAL_PORT = '8000';
```

Or use `adb reverse` for Android to forward requests to localhost:
```bash
adb reverse tcp:8000 tcp:8000
```

## Database

- SQLite database is created automatically at `backend/careerhelper.db`
- Database is initialized on first run