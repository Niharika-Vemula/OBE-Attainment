from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.database import init_db, close_db
from app.routers import course, exam, marks, attainment, report, chatbot, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="CO-PO-PSO Attainment API",
    description="AI-powered OBE mapping and attainment calculation backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(course.router)
app.include_router(exam.router)
app.include_router(marks.router)
app.include_router(attainment.router)
app.include_router(report.router)
app.include_router(chatbot.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"status": "ok", "message": "CO-PO-PSO Attainment API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )
