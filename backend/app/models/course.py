from beanie import Document, Link
from pydantic import Field
from typing import Optional, List
from bson import ObjectId


class ProgramOutcome(Document):
    code: str                        # e.g. PO1
    description: Optional[str] = None

    class Settings:
        name = "program_outcomes"


class ProgramSpecificOutcome(Document):
    code: str                        # e.g. PSO1
    description: Optional[str] = None

    class Settings:
        name = "program_specific_outcomes"


class Course(Document):
    name: str
    code: str
    syllabus: Optional[str] = None
    credits: Optional[int] = None
    instructor: Optional[str] = None
    semester: Optional[str] = None

    class Settings:
        name = "courses"


class CourseOutcome(Document):
    course_id: str                   # ref to Course id
    code: str                        # e.g. CO1
    description: str
    bloom_level: Optional[str] = None
    po_ids: List[str] = Field(default_factory=list)   # list of PO ids
    pso_ids: List[str] = Field(default_factory=list)  # list of PSO ids

    class Settings:
        name = "course_outcomes"
