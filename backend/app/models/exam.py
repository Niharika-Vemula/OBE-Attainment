from beanie import Document
from pydantic import Field
from typing import Optional


class Exam(Document):
    course_id: str
    exam_type: str          # T1/T2/T3/T4/T5/Summative
    name: str
    total_marks: float = 0

    class Settings:
        name = "exams"


class Question(Document):
    exam_id: str
    co_id: Optional[str] = None
    question_number: str    # Q1, Q2 ...
    text: Optional[str] = None
    max_marks: float
    bloom_level: Optional[str] = None

    class Settings:
        name = "questions"
