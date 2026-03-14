from fastapi import APIRouter, HTTPException
from app.models.exam import Exam, Question
from app.models.course import CourseOutcome
from app.schemas.exam import ExamCreate, ExamOut, QuestionOut, MapQuestionsRequest
from app.services.llm_service import map_questions_to_cos
from typing import List

router = APIRouter(prefix="/exams", tags=["Exams"])


# ── Static routes FIRST (before /{exam_id}) ──────────────────────────────────

@router.get("/course/{course_id}", response_model=List[ExamOut])
async def list_exams(course_id: str):
    exams = await Exam.find(Exam.course_id == course_id).to_list()
    result = []
    for e in exams:
        qs = await Question.find(Question.exam_id == str(e.id)).to_list()
        result.append(_exam_out(e, qs))
    return result


@router.post("/map-questions")
async def map_questions(payload: MapQuestionsRequest):
    exam = await Exam.get(payload.exam_id)
    if not exam:
        raise HTTPException(404, "Exam not found")

    questions = await Question.find(Question.exam_id == payload.exam_id).to_list()

    if payload.manual_mapping:
        q_map = {str(q.id): q for q in questions}
        for entry in payload.manual_mapping:
            q = q_map.get(entry["question_id"])
            if q:
                q.co_id = entry.get("co_id")
                q.bloom_level = entry.get("bloom_level")
                await q.save()
        return {"message": "Manual mapping applied"}

    # AI mapping
    cos = await CourseOutcome.find(CourseOutcome.course_id == exam.course_id).to_list()
    if not cos:
        raise HTTPException(400, "No COs defined for this course. Generate COs first.")

    q_dicts = [{"id": str(q.id), "question_number": q.question_number,
                "text": q.text, "max_marks": q.max_marks} for q in questions]
    co_dicts = [{"id": str(c.id), "code": c.code, "description": c.description} for c in cos]

    mappings = map_questions_to_cos(q_dicts, co_dicts)

    q_map = {str(q.id): q for q in questions}
    for m in mappings:
        q = q_map.get(m["question_id"])
        if q:
            q.co_id = m.get("co_id")
            q.bloom_level = m.get("bloom_level")
            await q.save()

    return {"message": f"{len(mappings)} questions mapped", "mappings": mappings}


# ── Dynamic routes AFTER static ───────────────────────────────────────────────

@router.post("/", response_model=ExamOut)
async def create_exam(payload: ExamCreate):
    total = sum(q.max_marks for q in payload.questions)
    exam = Exam(course_id=payload.course_id, exam_type=payload.exam_type,
                name=payload.name, total_marks=total)
    await exam.insert()
    for q in payload.questions:
        await Question(exam_id=str(exam.id), **q.model_dump()).insert()
    questions = await Question.find(Question.exam_id == str(exam.id)).to_list()
    return _exam_out(exam, questions)


@router.get("/{exam_id}", response_model=ExamOut)
async def get_exam(exam_id: str):
    exam = await Exam.get(exam_id)
    if not exam:
        raise HTTPException(404, "Exam not found")
    questions = await Question.find(Question.exam_id == exam_id).to_list()
    return _exam_out(exam, questions)


@router.delete("/{exam_id}")
async def delete_exam(exam_id: str):
    exam = await Exam.get(exam_id)
    if not exam:
        raise HTTPException(404, "Exam not found")
    await Question.find(Question.exam_id == exam_id).delete()
    await exam.delete()
    return {"message": "Exam and its questions deleted"}


def _exam_out(exam: Exam, questions: list) -> ExamOut:
    return ExamOut(
        id=str(exam.id), course_id=exam.course_id, exam_type=exam.exam_type,
        name=exam.name, total_marks=exam.total_marks,
        questions=[QuestionOut(
            id=str(q.id), question_number=q.question_number,
            text=q.text, max_marks=q.max_marks,
            bloom_level=q.bloom_level, co_id=q.co_id
        ) for q in questions]
    )
