# Mentora 🎓

Mentora is an adaptive ecosystem and lifelong learning platform featuring AI-driven personalized learning paths, proctored assessments, and a global AI mentor.

## 🏗 System Architecture

The Mentora system is divided into three main microservices:

1. **`/frontend`** (React, Vite, TailwindCSS)
   - The user-facing application for students and admins.
   - Handles the Course Player, Intelligence Dashboard, and AI Mentor Chat.

2. **`/server`** (NestJS, PostgreSQL)
   - The core backend API and database layer.
   - Manages Users, Courses, Enrollments, Assessments, and Learning Goals.

3. **`/rag-service`** (Python, FastAPI, Google Gemini)
   - The AI processing layer.
   - Handles Generation of Personalized Lessons, Adaptive Learning Paths, and answering AI Mentor queries.

## 🚀 How to Run the System

To run the full Mentora ecosystem locally, you need to start all three services in separate terminals:

### 1. Start the Backend API (NestJS)
```bash
cd server
npm install
npm run start:dev
```

### 2. Start the AI Service (Python FastAPI)
```bash
cd rag-service
source venv/bin/activate  # Or your respective virtual environment
python main.py
```

### 3. Start the Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

