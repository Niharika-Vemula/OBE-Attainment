from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.course import Course, CourseOutcome
from app.services.attainment import compute_po_pso_attainment
import io
import pandas as pd
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet

router = APIRouter(prefix="/reports", tags=["Reports"])


async def _get_report_data(course_id: str):
    course = await Course.get(course_id)
    if not course:
        raise HTTPException(404, "Course not found")
    data = await compute_po_pso_attainment(course_id)
    cos = {str(co.id): co for co in await CourseOutcome.find(CourseOutcome.course_id == course_id).to_list()}
    return course, data, cos


@router.get("/course/{course_id}/excel")
async def export_excel(course_id: str):
    course, data, cos = await _get_report_data(course_id)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        co_rows = [{"CO": cos[e["co_id"]].code if e["co_id"] in cos else e["co_id"],
                    "Description": cos[e["co_id"]].description if e["co_id"] in cos else "",
                    "Attainment %": e["attainment_pct"], "Level": e["attainment_level"]}
                   for e in data.get("co_attainment", [])]
        pd.DataFrame(co_rows).to_excel(writer, sheet_name="CO Attainment", index=False)
        pd.DataFrame([{"PO": k, "Attainment %": v} for k, v in data.get("po_attainment", {}).items()]).to_excel(writer, sheet_name="PO Attainment", index=False)
        pd.DataFrame([{"PSO": k, "Attainment %": v} for k, v in data.get("pso_attainment", {}).items()]).to_excel(writer, sheet_name="PSO Attainment", index=False)
    output.seek(0)
    return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={course.code}_attainment.xlsx"})


@router.get("/course/{course_id}/pdf")
async def export_pdf(course_id: str):
    course, data, cos = await _get_report_data(course_id)
    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = [Paragraph(f"OBE Attainment Report: {course.name} ({course.code})", styles["Title"]), Spacer(1, 12)]

    def make_table(title, headers, rows):
        if not rows:
            return
        elements.append(Paragraph(title, styles["Heading2"]))
        t = Table([headers] + rows, hAlign="LEFT")
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4472C4")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#EEF2FF")]),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 12))

    make_table("CO Attainment", ["CO", "Attainment %", "Level"],
               [[cos[e["co_id"]].code if e["co_id"] in cos else e["co_id"], f"{e['attainment_pct']}%", str(e["attainment_level"])] for e in data.get("co_attainment", [])])
    make_table("PO Attainment", ["PO", "Attainment %"], [[k, f"{v}%"] for k, v in data.get("po_attainment", {}).items()])
    make_table("PSO Attainment", ["PSO", "Attainment %"], [[k, f"{v}%"] for k, v in data.get("pso_attainment", {}).items()])
    doc.build(elements)
    output.seek(0)
    return StreamingResponse(output, media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={course.code}_attainment.pdf"})
