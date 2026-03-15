# OBE Attainment System — CO · PO · PSO Tracker

A full-stack web application for Outcome-Based Education (OBE) attainment tracking, built for academic institutions to measure Course Outcomes (CO), Program Outcomes (PO), and Program Specific Outcomes (PSO).

## Live Demo

- Frontend: https://obe-attainment.vercel.app
- Backend API: https://obe-attainment.onrender.com

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | MongoDB Atlas (Motor + Beanie ODM) |
| Auth | JWT-based role authentication |
| Deployment | Vercel (frontend) + Render (backend) |
| AI Chatbot | Rule-based + OpenAI fallback |

## Features

- **CO Attainment** — Calculate attainment levels per Course Outcome from exam marks
- **PO/PSO Mapping** — Map COs to Program Outcomes and PSOs with weightage
- **Attainment Reports** — Visual bar charts for CO, PO, PSO attainment
- **Student Marks** — Upload and manage student marks per exam
- **AI Chatbot** — Ask questions about attainment data in natural language
- **Dual Role System** — Faculty and Admin with separate themed dashboards
- **PDF/Excel Reports** — Export attainment reports

## Roles

| Role | Credentials | Access |
|------|------------|--------|
| Admin | admin / admin123 | Full access + Admin Panel |
| Faculty | faculty / faculty123 | Courses, Exams, Marks, Attainment |

## Local Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB Atlas account (or local MongoDB)

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your MongoDB URL
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

## Environment Variables

### Backend `.env`
```
MONGODB_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/obe_db
SECRET_KEY=your-secret-key
OPENAI_API_KEY=sk-... (optional)
```

### Frontend `.env.production`
```
VITE_API_URL=https://obe-attainment.onrender.com
```

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry
│   │   ├── database.py      # MongoDB connection
│   │   ├── models/          # Beanie ODM models
│   │   ├── routers/         # API route handlers
│   │   ├── schemas/         # Pydantic schemas
│   │   └── services/        # Business logic
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # React page components
│   │   ├── components/      # Shared UI components
│   │   ├── api/             # API client
│   │   ├── context/         # Auth context
│   │   └── styles/          # Theme CSS files
│   └── package.json
└── README.md
```

## Attainment Calculation

CO Attainment Level is calculated as:

- Level 3 (High): ≥ 70% students scored ≥ threshold
- Level 2 (Medium): ≥ 60% students scored ≥ threshold  
- Level 1 (Low): ≥ 50% students scored ≥ threshold
- Level 0: Below threshold

PO/PSO attainment is computed as weighted average of mapped CO attainments.

## Mobile Support

The application is responsive and works on:
- Desktop (1280px+)
- Laptop (1024px+)
- Tablet (768px+)
- Mobile (480px+) — sidebar collapses to horizontal nav

## License

MIT License — built for academic and hackathon use.
