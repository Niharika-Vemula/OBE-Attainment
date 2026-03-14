from pydantic import BaseModel
from typing import List, Optional


class POBase(BaseModel):
    code: str
    description: Optional[str] = None

class POCreate(POBase): pass
class POOut(POBase):
    id: str
    class Config: from_attributes = True


class PSOBase(BaseModel):
    code: str
    description: Optional[str] = None

class PSOCreate(PSOBase): pass
class PSOOut(PSOBase):
    id: str
    class Config: from_attributes = True


class COOut(BaseModel):
    id: str
    code: str
    description: str
    bloom_level: Optional[str] = None
    po_ids: List[str] = []
    pso_ids: List[str] = []


class CourseCreate(BaseModel):
    name: str
    code: str
    syllabus: Optional[str] = None
    credits: Optional[int] = None
    instructor: Optional[str] = None
    semester: Optional[str] = None

class CourseOut(BaseModel):
    id: str
    name: str
    code: str
    syllabus: Optional[str] = None
    credits: Optional[int] = None
    instructor: Optional[str] = None
    semester: Optional[str] = None
    outcomes: List[COOut] = []


class COCreate(BaseModel):
    code: str
    description: str
    bloom_level: Optional[str] = None
    po_ids: List[str] = []
    pso_ids: List[str] = []

class COBulkCreate(BaseModel):
    cos: List[COCreate]

class GenerateCORequest(BaseModel):
    course_id: str
    po_ids: List[str]
    pso_ids: List[str] = []
