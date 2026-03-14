from fastapi import APIRouter, HTTPException
from app.models.user import User, SystemSettings
from app.schemas.user import UserCreate, UserUpdate, UserOut, SettingUpdate
from typing import List, Optional

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── User Management ───────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserOut])
async def list_users(role: Optional[str] = None):
    query = User.find_all()
    users = await query.to_list()
    if role:
        users = [u for u in users if u.role == role]
    return [_user_out(u) for u in users]


@router.post("/users", response_model=UserOut)
async def create_user(payload: UserCreate):
    existing = await User.find_one(User.email == payload.email)
    if existing:
        raise HTTPException(400, f"User with email {payload.email} already exists")
    user = User(
        name=payload.name,
        email=payload.email,
        role=payload.role,
        department=payload.department,
        password_hash=payload.password,   # store plain for demo
    )
    await user.insert()
    return _user_out(user)


@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(user_id: str):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return _user_out(user)


@router.put("/users/{user_id}", response_model=UserOut)
async def update_user(user_id: str, payload: UserUpdate):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    for field, val in payload.model_dump(exclude_none=True).items():
        if field == "password":
            user.password_hash = val
        else:
            setattr(user, field, val)
    await user.save()
    return _user_out(user)


@router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    await user.delete()
    return {"message": f"User {user.name} deleted"}


@router.patch("/users/{user_id}/toggle-active", response_model=UserOut)
async def toggle_user_active(user_id: str):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    user.is_active = not user.is_active
    await user.save()
    return _user_out(user)


# ── System Settings ───────────────────────────────────────────────────────────

@router.get("/settings")
async def get_settings():
    settings = await SystemSettings.find_all().to_list()
    return {s.key: {"value": s.value, "description": s.description} for s in settings}


@router.put("/settings/{key}")
async def upsert_setting(key: str, payload: SettingUpdate):
    setting = await SystemSettings.find_one(SystemSettings.key == key)
    if setting:
        setting.value = payload.value
        if payload.description:
            setting.description = payload.description
        await setting.save()
    else:
        setting = SystemSettings(key=key, value=payload.value, description=payload.description)
        await setting.insert()
    return {"key": key, "value": setting.value}


@router.post("/settings/seed-defaults")
async def seed_default_settings():
    defaults = [
        ("co_threshold_l1", "50", "Minimum % for CO Level 1 attainment"),
        ("co_threshold_l2", "60", "Minimum % for CO Level 2 attainment"),
        ("co_threshold_l3", "70", "Minimum % for CO Level 3 attainment"),
        ("institution_name", "My Institution", "Name of the institution"),
        ("department_name", "Computer Science", "Department name"),
        ("academic_year", "2024-25", "Current academic year"),
    ]
    created = 0
    for key, value, desc in defaults:
        existing = await SystemSettings.find_one(SystemSettings.key == key)
        if not existing:
            await SystemSettings(key=key, value=value, description=desc).insert()
            created += 1
    return {"message": f"{created} default settings created"}


# ── CO-PO Mapping Weights ─────────────────────────────────────────────────────

@router.get("/co-po-weights/{course_id}")
async def get_co_po_weights(course_id: str):
    from app.models.course import CourseOutcome, ProgramOutcome, ProgramSpecificOutcome
    cos = await CourseOutcome.find(CourseOutcome.course_id == course_id).to_list()
    pos = await ProgramOutcome.find_all().to_list()
    psos = await ProgramSpecificOutcome.find_all().to_list()

    po_map = {str(p.id): p.code for p in pos}
    pso_map = {str(p.id): p.code for p in psos}

    matrix = []
    for co in cos:
        row = {
            "co_id": str(co.id),
            "co_code": co.code,
            "description": co.description,
            "po_weights": {po_map[pid]: 3 for pid in co.po_ids if pid in po_map},
            "pso_weights": {pso_map[pid]: 3 for pid in co.pso_ids if pid in pso_map},
        }
        matrix.append(row)
    return {"cos": matrix, "pos": [p.code for p in pos], "psos": [p.code for p in psos]}


@router.put("/co-po-weights/{co_id}")
async def update_co_weights(co_id: str, payload: dict):
    from app.models.course import CourseOutcome, ProgramOutcome, ProgramSpecificOutcome
    co = await CourseOutcome.get(co_id)
    if not co:
        raise HTTPException(404, "CO not found")

    # payload: {"po_codes": ["PO1","PO2"], "pso_codes": ["PSO1"]}
    po_codes = payload.get("po_codes", [])
    pso_codes = payload.get("pso_codes", [])

    pos = await ProgramOutcome.find_all().to_list()
    psos = await ProgramSpecificOutcome.find_all().to_list()

    po_code_map = {p.code: str(p.id) for p in pos}
    pso_code_map = {p.code: str(p.id) for p in psos}

    co.po_ids = [po_code_map[c] for c in po_codes if c in po_code_map]
    co.pso_ids = [pso_code_map[c] for c in pso_codes if c in pso_code_map]
    await co.save()
    return {"message": f"{co.code} mapping updated"}


# ── Stats for admin dashboard ─────────────────────────────────────────────────

@router.get("/stats")
async def admin_stats():
    from app.models.course import Course, CourseOutcome, ProgramOutcome, ProgramSpecificOutcome
    from app.models.exam import Exam
    from app.models.student import Student

    courses = await Course.find_all().to_list()
    users = await User.find_all().to_list()
    students = await Student.find_all().to_list()
    exams = await Exam.find_all().to_list()
    cos = await CourseOutcome.find_all().to_list()
    pos = await ProgramOutcome.find_all().to_list()
    psos = await ProgramSpecificOutcome.find_all().to_list()

    return {
        "total_courses": len(courses),
        "total_users": len(users),
        "total_students": len(students),
        "total_exams": len(exams),
        "total_cos": len(cos),
        "total_pos": len(pos),
        "total_psos": len(psos),
        "faculty_count": sum(1 for u in users if u.role == "faculty"),
        "admin_count": sum(1 for u in users if u.role == "admin"),
    }


def _user_out(u: User) -> UserOut:
    return UserOut(id=str(u.id), name=u.name, email=u.email,
                   role=u.role, department=u.department, is_active=u.is_active)
