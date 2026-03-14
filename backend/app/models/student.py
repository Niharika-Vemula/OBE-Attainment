from beanie import Document
from typing import Optional


class Student(Document):
    roll_number: str
    name: str

    class Settings:
        name = "students"


class StudentMark(Document):
    student_id: str
    exam_id: str
    question_id: str
    marks_obtained: float = 0

    class Settings:
        name = "student_marks"
