from collections import defaultdict
from app.config import settings


def get_attainment_level(percentage: float) -> int:
    if percentage >= settings.co_attainment_threshold_l3:
        return 3
    elif percentage >= settings.co_attainment_threshold_l2:
        return 2
    elif percentage >= settings.co_attainment_threshold_l1:
        return 1
    return 0


async def compute_co_attainment(exam_id: str) -> list[dict]:
    from app.models.exam import Exam, Question
    from app.models.student import StudentMark
    from app.models.course import CourseOutcome

    exam = await Exam.get(exam_id)
    if not exam:
        return []

    questions = await Question.find(Question.exam_id == exam_id).to_list()

    co_questions: dict[str, list] = defaultdict(list)
    for q in questions:
        if q.co_id:
            co_questions[q.co_id].append(q)

    results = []
    for co_id, qs in co_questions.items():
        max_per_student = sum(q.max_marks for q in qs)
        if max_per_student == 0:
            continue

        q_ids = [str(q.id) for q in qs]
        marks = await StudentMark.find(
            {"question_id": {"$in": q_ids}}
        ).to_list()

        student_totals: dict[str, float] = defaultdict(float)
        for m in marks:
            student_totals[m.student_id] += m.marks_obtained

        if not student_totals:
            continue

        avg = sum(student_totals.values()) / len(student_totals)
        pct = round((avg / max_per_student) * 100, 2)

        co = await CourseOutcome.get(co_id)
        results.append({
            "co_id": co_id,
            "co_code": co.code if co else co_id,
            "attainment_pct": pct,
            "attainment_level": get_attainment_level(pct),
        })

    return results


async def compute_po_pso_attainment(course_id: str) -> dict:
    from app.models.exam import Exam
    from app.models.course import Course, CourseOutcome, ProgramOutcome, ProgramSpecificOutcome

    course = await Course.get(course_id)
    if not course:
        return {}

    exams = await Exam.find(Exam.course_id == course_id).to_list()
    if not exams:
        return {"co_attainment": [], "po_attainment": {}, "pso_attainment": {}}

    co_attainments: dict[str, list[float]] = defaultdict(list)
    for exam in exams:
        for entry in await compute_co_attainment(str(exam.id)):
            co_attainments[entry["co_id"]].append(entry["attainment_pct"])

    co_avg: dict[str, float] = {
        co_id: round(sum(vals) / len(vals), 2)
        for co_id, vals in co_attainments.items()
    }

    cos = await CourseOutcome.find(CourseOutcome.course_id == course_id).to_list()

    po_scores: dict[str, list[float]] = defaultdict(list)
    pso_scores: dict[str, list[float]] = defaultdict(list)

    for co in cos:
        avg = co_avg.get(str(co.id))
        if avg is None:
            continue
        for po_id in co.po_ids:
            po = await ProgramOutcome.get(po_id)
            if po:
                po_scores[po.code].append(avg)
        for pso_id in co.pso_ids:
            pso = await ProgramSpecificOutcome.get(pso_id)
            if pso:
                pso_scores[pso.code].append(avg)

    co_code_map = {str(co.id): co.code for co in cos}
    return {
        "co_attainment": [
            {"co_id": co_id, "co_code": co_code_map.get(co_id, co_id), "attainment_pct": avg, "attainment_level": get_attainment_level(avg)}
            for co_id, avg in co_avg.items()
        ],
        "po_attainment": {code: round(sum(v) / len(v), 2) for code, v in po_scores.items()},
        "pso_attainment": {code: round(sum(v) / len(v), 2) for code, v in pso_scores.items()},
    }
