from fastapi import APIRouter
from app.services.attainment import compute_co_attainment, compute_po_pso_attainment

router = APIRouter(prefix="/attainment", tags=["Attainment"])


@router.get("/exam/{exam_id}/co")
async def co_attainment_for_exam(exam_id: str):
    result = await compute_co_attainment(exam_id)
    # Return empty list instead of 404 — frontend handles "no data" state
    return result if result else []


@router.get("/course/{course_id}")
async def full_attainment_for_course(course_id: str):
    result = await compute_po_pso_attainment(course_id)
    # Return empty structure instead of 404 — frontend handles "no data" state
    return result if result else {"co_attainment": [], "po_attainment": {}, "pso_attainment": {}}
