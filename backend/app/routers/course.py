from fastapi import APIRouter, HTTPException
from app.models.course import Course, CourseOutcome, ProgramOutcome, ProgramSpecificOutcome
from app.schemas.course import CourseCreate, CourseOut, POCreate, POOut, PSOCreate, PSOOut, GenerateCORequest, COOut, COCreate, COBulkCreate
from app.services.llm_service import generate_course_outcomes
from typing import List

router = APIRouter(prefix="/courses", tags=["Courses"])


# --- PO (static paths first) ---
@router.get("/pos/all", response_model=List[POOut])
async def list_pos():
    pos = await ProgramOutcome.find_all().to_list()
    return [POOut(id=str(p.id), code=p.code, description=p.description) for p in pos]


@router.post("/pos/", response_model=POOut)
async def create_po(payload: POCreate):
    po = ProgramOutcome(**payload.model_dump())
    await po.insert()
    return POOut(id=str(po.id), **payload.model_dump())


@router.post("/pos/bulk", response_model=List[POOut])
async def create_pos_bulk(payload: List[POCreate]):
    result = []
    for item in payload:
        po = ProgramOutcome(**item.model_dump())
        await po.insert()
        result.append(POOut(id=str(po.id), code=po.code, description=po.description))
    return result


# --- PSO (static paths first) ---
@router.get("/psos/all", response_model=List[PSOOut])
async def list_psos():
    psos = await ProgramSpecificOutcome.find_all().to_list()
    return [PSOOut(id=str(p.id), code=p.code, description=p.description) for p in psos]


@router.post("/psos/", response_model=PSOOut)
async def create_pso(payload: PSOCreate):
    pso = ProgramSpecificOutcome(**payload.model_dump())
    await pso.insert()
    return PSOOut(id=str(pso.id), **payload.model_dump())


@router.post("/psos/bulk", response_model=List[PSOOut])
async def create_psos_bulk(payload: List[PSOCreate]):
    result = []
    for item in payload:
        pso = ProgramSpecificOutcome(**item.model_dump())
        await pso.insert()
        result.append(PSOOut(id=str(pso.id), code=pso.code, description=pso.description))
    return result


# --- Course ---
@router.get("/", response_model=List[CourseOut])
async def list_courses():
    courses = await Course.find_all().to_list()
    result = []
    for c in courses:
        cos = await CourseOutcome.find(CourseOutcome.course_id == str(c.id)).to_list()
        result.append(CourseOut(
            id=str(c.id), name=c.name, code=c.code, syllabus=c.syllabus,
            credits=c.credits, instructor=c.instructor, semester=c.semester,
            outcomes=[_co_out(co) for co in cos]
        ))
    return result


@router.post("/", response_model=CourseOut)
async def create_course(payload: CourseCreate):
    course = Course(**payload.model_dump())
    await course.insert()
    return CourseOut(id=str(course.id), **payload.model_dump(), outcomes=[])


@router.get("/{course_id}", response_model=CourseOut)
async def get_course(course_id: str):
    course = await Course.get(course_id)
    if not course:
        raise HTTPException(404, "Course not found")
    cos = await CourseOutcome.find(CourseOutcome.course_id == course_id).to_list()
    return CourseOut(
        id=str(course.id), name=course.name, code=course.code, syllabus=course.syllabus,
        credits=course.credits, instructor=course.instructor, semester=course.semester,
        outcomes=[_co_out(co) for co in cos]
    )


@router.put("/{course_id}", response_model=CourseOut)
async def update_course(course_id: str, payload: CourseCreate):
    course = await Course.get(course_id)
    if not course:
        raise HTTPException(404, "Course not found")
    course.name = payload.name
    course.code = payload.code
    course.syllabus = payload.syllabus
    course.credits = payload.credits
    course.instructor = payload.instructor
    course.semester = payload.semester
    await course.save()
    cos = await CourseOutcome.find(CourseOutcome.course_id == course_id).to_list()
    return CourseOut(id=str(course.id), name=course.name, code=course.code,
                     syllabus=course.syllabus, credits=course.credits,
                     instructor=course.instructor, semester=course.semester,
                     outcomes=[_co_out(co) for co in cos])


@router.delete("/{course_id}")
async def delete_course(course_id: str):
    course = await Course.get(course_id)
    if not course:
        raise HTTPException(404, "Course not found")
    await CourseOutcome.find(CourseOutcome.course_id == course_id).delete()
    await course.delete()
    return {"message": "Course and its COs deleted"}


# --- COs ---
@router.get("/{course_id}/cos")
async def list_cos(course_id: str):
    cos = await CourseOutcome.find(CourseOutcome.course_id == course_id).to_list()
    return [_co_out(co) for co in cos]


@router.post("/{course_id}/cos", response_model=COOut)
async def create_co(course_id: str, payload: COCreate):
    co = CourseOutcome(
        course_id=course_id,
        code=payload.code,
        description=payload.description,
        bloom_level=payload.bloom_level,
        po_ids=payload.po_ids,
        pso_ids=payload.pso_ids,
    )
    await co.insert()
    return _co_out(co)


@router.post("/{course_id}/cos/bulk")
async def create_cos_bulk(course_id: str, payload: COBulkCreate):
    created = []
    for item in payload.cos:
        co = CourseOutcome(
            course_id=course_id,
            code=item.code,
            description=item.description,
            bloom_level=item.bloom_level,
            po_ids=item.po_ids,
            pso_ids=item.pso_ids,
        )
        await co.insert()
        created.append(_co_out(co))
    return {"message": f"{len(created)} COs created", "cos": created}


@router.delete("/{course_id}/cos/{co_id}")
async def delete_co(course_id: str, co_id: str):
    co = await CourseOutcome.get(co_id)
    if not co or co.course_id != course_id:
        raise HTTPException(404, "CO not found")
    await co.delete()
    return {"message": f"{co.code} deleted"}


# --- AI CO Generation ---
@router.post("/{course_id}/generate-cos")
async def generate_cos(course_id: str, payload: GenerateCORequest):
    course = await Course.get(course_id)
    if not course:
        raise HTTPException(404, "Course not found")
    if not course.syllabus:
        raise HTTPException(400, "Course has no syllabus. Update the course with syllabus text first.")

    pos = await ProgramOutcome.find({"_id": {"$in": [_to_oid(i) for i in payload.po_ids]}}).to_list()
    psos = await ProgramSpecificOutcome.find({"_id": {"$in": [_to_oid(i) for i in payload.pso_ids]}}).to_list()

    po_dicts = [{"code": p.code, "description": p.description or ""} for p in pos]
    pso_dicts = [{"code": p.code, "description": p.description or ""} for p in psos]

    generated = generate_course_outcomes(course.syllabus, po_dicts, pso_dicts)

    po_map = {p.code: str(p.id) for p in pos}
    pso_map = {p.code: str(p.id) for p in psos}

    created = []
    for item in generated:
        co = CourseOutcome(
            course_id=course_id,
            code=item["code"],
            description=item["description"],
            bloom_level=item.get("bloom_level"),
            po_ids=[po_map[c] for c in item.get("po_codes", []) if c in po_map],
            pso_ids=[pso_map[c] for c in item.get("pso_codes", []) if c in pso_map],
        )
        await co.insert()
        created.append(co)

    return {"message": f"{len(created)} COs generated", "cos": [
        {"id": str(co.id), "code": co.code, "description": co.description,
         "bloom_level": co.bloom_level, "po_ids": co.po_ids, "pso_ids": co.pso_ids}
        for co in created
    ]}


def _co_out(co: CourseOutcome) -> COOut:
    return COOut(id=str(co.id), code=co.code, description=co.description,
                 bloom_level=co.bloom_level, po_ids=co.po_ids, pso_ids=co.pso_ids)


def _to_oid(val: str):
    from bson import ObjectId
    return ObjectId(val)
