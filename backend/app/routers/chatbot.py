from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.config import settings
from app.models.course import Course, CourseOutcome, ProgramOutcome, ProgramSpecificOutcome
from app.models.exam import Exam, Question
from app.services.attainment import compute_po_pso_attainment
from app.services.llm_service import chat_response

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


class ChatMessage(BaseModel):
    message: str
    course_id: Optional[str] = None
    exam_id: Optional[str] = None


@router.post("/chat")
async def chat(payload: ChatMessage):
    context = await _build_context(payload.course_id, payload.exam_id)
    reply = chat_response(payload.message, context)
    return {"reply": reply}


@router.get("/summary/{course_id}")
async def course_summary(course_id: str):
    course = await Course.get(course_id)
    if not course:
        raise HTTPException(404, "Course not found")

    data = await compute_po_pso_attainment(course_id)
    cos = await CourseOutcome.find(CourseOutcome.course_id == course_id).to_list()
    co_map = {str(co.id): co.code for co in cos}

    co_lines = "\n".join(
        f"  {co_map.get(e['co_id'], e.get('co_code', e['co_id']))}: {e['attainment_pct']}% (Level {e['attainment_level']})"
        for e in data.get("co_attainment", [])
    )
    po_lines = "\n".join(f"  {k}: {v}%" for k, v in data.get("po_attainment", {}).items())
    pso_lines = "\n".join(f"  {k}: {v}%" for k, v in data.get("pso_attainment", {}).items())

    context = f"""Course: {course.name} ({course.code})
CO Attainment:
{co_lines or '  No data yet'}
PO Attainment:
{po_lines or '  No data yet'}
PSO Attainment:
{pso_lines or '  No data yet'}"""

    summary_text = chat_response(
        f"Summarize this attainment report and highlight strengths and areas needing improvement:\n{context}",
        context
    )
    return {"course": course.name, "summary": summary_text, "data": data}


async def _build_context(course_id: Optional[str], exam_id: Optional[str]) -> str:
    parts = []

    if course_id:
        course = await Course.get(course_id)
        if course:
            parts.append(f"Course: {course.name} ({course.code})")
            if course.syllabus:
                parts.append(f"Syllabus: {course.syllabus[:200]}")

            # COs with descriptions
            cos = await CourseOutcome.find(CourseOutcome.course_id == course_id).to_list()
            if cos:
                co_strs = ", ".join(f"{co.code}[{co.bloom_level}]" for co in cos)
                parts.append(f"Course Outcomes: {co_strs}")

            # Actual attainment data
            try:
                data = await compute_po_pso_attainment(course_id)
                co_map = {str(co.id): co.code for co in cos}

                if data.get("co_attainment"):
                    co_lines = "\n".join(
                        f"  {co_map.get(e['co_id'], e.get('co_code', e['co_id']))}: {e['attainment_pct']}% (Level {e['attainment_level']})"
                        for e in data["co_attainment"]
                    )
                    parts.append(f"CO Attainment:\n{co_lines}")

                if data.get("po_attainment"):
                    po_lines = "\n".join(f"  {k}: {v}%" for k, v in data["po_attainment"].items())
                    parts.append(f"PO Attainment:\n{po_lines}")

                if data.get("pso_attainment"):
                    pso_lines = "\n".join(f"  {k}: {v}%" for k, v in data["pso_attainment"].items())
                    parts.append(f"PSO Attainment:\n{pso_lines}")
            except Exception:
                parts.append("Attainment: No data yet (upload marks to calculate)")

    if exam_id:
        exam = await Exam.get(exam_id)
        if exam:
            qs = await Question.find(Question.exam_id == exam_id).to_list()
            parts.append(f"Exam: {exam.name} ({exam.exam_type})")
            parts.append("Questions: " + ", ".join(f"{q.question_number}({q.max_marks}m)" for q in qs))

    return "\n".join(parts)
