from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config import settings

client: AsyncIOMotorClient | None = None


async def init_db():
    global client
    client = AsyncIOMotorClient(settings.mongodb_uri)

    try:
        await client.admin.command("ping")
        print("✅ MongoDB connected successfully")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")

    from app.models.course import Course, ProgramOutcome, ProgramSpecificOutcome, CourseOutcome
    from app.models.exam import Exam, Question
    from app.models.student import Student, StudentMark
    from app.models.user import User, SystemSettings

    await init_beanie(
        database=client[settings.mongodb_db],
        document_models=[
            Course, ProgramOutcome, ProgramSpecificOutcome, CourseOutcome,
            Exam, Question, Student, StudentMark,
            User, SystemSettings,
        ],
    )


async def close_db():
    if client:
        client.close()
        print("🔌 MongoDB connection closed")
