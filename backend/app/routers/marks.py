from fastapi import APIRouter, HTTPException, UploadFile, File
from app.models.student import Student, StudentMark
from app.models.exam import Question
from app.schemas.student import StudentCreate, StudentOut, StudentMarksUpload
import pandas as pd
import io

router = APIRouter(prefix="/marks", tags=["Marks"])


@router.get("/students/", response_model=list[StudentOut])
async def list_students():
    students = await Student.find_all().to_list()
    return [StudentOut(id=str(s.id), roll_number=s.roll_number, name=s.name) for s in students]


@router.get("/exam/{exam_id}")
async def get_marks_for_exam(exam_id: str):
    from app.models.exam import Question
    marks = await StudentMark.find(StudentMark.exam_id == exam_id).to_list()
    questions = await Question.find(Question.exam_id == exam_id).to_list()
    q_map = {str(q.id): q.question_number for q in questions}

    student_data: dict = {}
    for m in marks:
        sid = m.student_id
        if sid not in student_data:
            student = await Student.get(sid)
            student_data[sid] = {
                "student_id": sid,
                "roll_number": student.roll_number if student else sid,
                "name": student.name if student else "",
                "marks": {}
            }
        student_data[sid]["marks"][q_map.get(m.question_id, m.question_id)] = m.marks_obtained

    return list(student_data.values())


@router.post("/students/", response_model=StudentOut)
async def create_student(payload: StudentCreate):
    existing = await Student.find_one(Student.roll_number == payload.roll_number)
    if existing:
        return StudentOut(id=str(existing.id), **payload.model_dump())
    student = Student(**payload.model_dump())
    await student.insert()
    return StudentOut(id=str(student.id), **payload.model_dump())


@router.post("/upload")
async def upload_marks(payload: StudentMarksUpload):
    saved = set()
    for entry in payload.entries:
        student = await Student.find_one(Student.roll_number == entry["roll_number"])
        if not student:
            student = Student(roll_number=entry["roll_number"],
                              name=entry.get("name", entry["roll_number"]))
            await student.insert()

        question = await Question.get(entry["question_id"])
        if not question:
            continue

        mark = await StudentMark.find_one(
            StudentMark.student_id == str(student.id),
            StudentMark.question_id == entry["question_id"],
            StudentMark.exam_id == payload.exam_id,
        )
        if mark:
            mark.marks_obtained = entry["marks_obtained"]
            await mark.save()
        else:
            await StudentMark(
                student_id=str(student.id),
                exam_id=payload.exam_id,
                question_id=entry["question_id"],
                marks_obtained=entry["marks_obtained"],
            ).insert()
        saved.add(entry["roll_number"])

    return {"message": f"Marks saved for {len(saved)} students"}


@router.post("/upload-excel/{exam_id}")
async def upload_marks_excel(exam_id: str, file: UploadFile = File(...)):
    """
    Excel columns: roll_number, name, Q1, Q2, Q3, ...
    Question column headers must match question_number in DB.
    """
    contents = await file.read()
    df = pd.read_excel(io.BytesIO(contents))

    questions = await Question.find(Question.exam_id == exam_id).to_list()
    q_map = {q.question_number: q for q in questions}

    saved = 0
    for _, row in df.iterrows():
        roll = str(row["roll_number"])
        student = await Student.find_one(Student.roll_number == roll)
        if not student:
            student = Student(roll_number=roll, name=str(row.get("name", roll)))
            await student.insert()

        for q_num, question in q_map.items():
            if q_num not in df.columns:
                continue
            val = row.get(q_num, 0)
            marks_val = float(val) if pd.notna(val) else 0.0

            mark = await StudentMark.find_one(
                StudentMark.student_id == str(student.id),
                StudentMark.question_id == str(question.id),
                StudentMark.exam_id == exam_id,
            )
            if mark:
                mark.marks_obtained = marks_val
                await mark.save()
            else:
                await StudentMark(
                    student_id=str(student.id),
                    exam_id=exam_id,
                    question_id=str(question.id),
                    marks_obtained=marks_val,
                ).insert()
        saved += 1

    return {"message": f"Marks uploaded for {saved} students"}
