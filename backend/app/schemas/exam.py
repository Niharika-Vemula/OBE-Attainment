from pydantic import BaseModel
from typing import List, Optional


class QuestionCreate(BaseModel):
    question_number: str
    text: Optional[str] = None
    max_marks: float

class QuestionOut(BaseModel):
    id: str
    question_number: str
    text: Optional[str] = None
    max_marks: float
    bloom_level: Optional[str] = None
    co_id: Optional[str] = None


class ExamCreate(BaseModel):
    course_id: str
    exam_type: str
    name: str
    questions: List[QuestionCreate]

class ExamOut(BaseModel):
    id: str
    course_id: str
    exam_type: str
    name: str
    total_marks: float
    questions: List[QuestionOut] = []


class MapQuestionsRequest(BaseModel):
    exam_id: str
    manual_mapping: Optional[List[dict]] = None  # [{"question_id": "...", "co_id": "..."}]
