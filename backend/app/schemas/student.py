from pydantic import BaseModel
from typing import List


class StudentCreate(BaseModel):
    roll_number: str
    name: str

class StudentOut(BaseModel):
    id: str
    roll_number: str
    name: str


class StudentMarksUpload(BaseModel):
    exam_id: str
    entries: List[dict]  # [{"roll_number": "S1", "question_id": "...", "marks_obtained": 8}]
