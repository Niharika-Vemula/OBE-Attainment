"""
LLM Service - Uses OpenAI if key is set, otherwise falls back to rule-based logic.
"""
import json
import re
from app.config import settings

BLOOM_LEVELS = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"]

BLOOM_KEYWORDS = {
    "Remember":   ["define", "list", "recall", "identify", "name", "state", "recognize"],
    "Understand": ["explain", "describe", "summarize", "interpret", "classify", "compare"],
    "Apply":      ["apply", "use", "implement", "demonstrate", "solve", "execute", "compute"],
    "Analyze":    ["analyze", "differentiate", "examine", "compare", "contrast", "investigate"],
    "Evaluate":   ["evaluate", "assess", "judge", "justify", "critique", "argue", "defend"],
    "Create":     ["design", "develop", "construct", "formulate", "create", "build", "produce"],
}


def _detect_bloom(text: str) -> str:
    text_lower = text.lower()
    for level in reversed(BLOOM_LEVELS):  # higher levels first
        for kw in BLOOM_KEYWORDS[level]:
            if kw in text_lower:
                return level
    return "Understand"


def _use_openai() -> bool:
    key = settings.openai_api_key
    return bool(key and key.startswith("sk-") and len(key) > 20 and key != "sk-...")


def generate_course_outcomes(syllabus: str, pos: list[dict], psos: list[dict]) -> list[dict]:
    if _use_openai():
        return _openai_generate_cos(syllabus, pos, psos)
    return _rule_based_generate_cos(syllabus, pos, psos)


def map_questions_to_cos(questions: list[dict], cos: list[dict]) -> list[dict]:
    if _use_openai():
        return _openai_map_questions(questions, cos)
    return _rule_based_map_questions(questions, cos)


def chat_response(message: str, context: str = "") -> str:
    if _use_openai():
        return _openai_chat(message, context)
    return _rule_based_chat(message, context)


# ── Rule-based implementations ──────────────────────────────────────────────

def _rule_based_generate_cos(syllabus: str, pos: list[dict], psos: list[dict]) -> list[dict]:
    # Split syllabus into distinct topics
    raw_topics = [t.strip() for t in re.split(r'[,\n;]', syllabus) if t.strip()]
    # Deduplicate while preserving order
    seen = set()
    topics = []
    for t in raw_topics:
        if t.lower() not in seen:
            seen.add(t.lower())
            topics.append(t)

    # Ensure at least 5 COs even if fewer topics
    bloom_cycle = ["Understand", "Apply", "Analyze", "Evaluate", "Create", "Apply"]
    po_codes = [p["code"] for p in pos]
    pso_codes = [p["code"] for p in psos]

    # Pad topics if fewer than 5
    base_topics = topics[:6] if len(topics) >= 5 else topics
    while len(base_topics) < 5:
        base_topics.append(f"{base_topics[len(base_topics) % max(len(topics),1)]} (Advanced)")

    cos = []
    for i, topic in enumerate(base_topics):
        level = bloom_cycle[i % len(bloom_cycle)]
        verb = BLOOM_KEYWORDS[level][0].capitalize()

        # Rotate POs so each CO gets different POs
        if po_codes:
            start = i % len(po_codes)
            po_slice = (po_codes + po_codes)[start:start + 2]
        else:
            po_slice = []

        # Rotate PSOs
        pso_slice = [pso_codes[i % len(pso_codes)]] if pso_codes else []

        cos.append({
            "code": f"CO{i+1}",
            "description": f"{verb} the concepts of {topic}",
            "bloom_level": level,
            "po_codes": po_slice,
            "pso_codes": pso_slice,
        })
    return cos


def _rule_based_map_questions(questions: list[dict], cos: list[dict]) -> list[dict]:
    mappings = []
    for i, q in enumerate(questions):
        bloom = _detect_bloom(q.get("text") or q.get("question_number") or "")
        co = cos[i % len(cos)] if cos else None
        mappings.append({
            "question_id": q["id"],
            "co_id": co["id"] if co else None,
            "bloom_level": bloom,
        })
    return mappings


def _rule_based_chat(message: str, context: str = "") -> str:
    msg = message.lower()

    # If we have course context, answer based on actual data
    if context:
        # Parse context into structured data
        lines = context.strip().split("\n")
        course_line = next((l for l in lines if l.startswith("Course:")), "")
        co_lines = [l.strip() for l in lines if l.startswith("  CO") or "CO" in l and "%" in l]
        po_lines = [l.strip() for l in lines if l.startswith("  PO") or "PO" in l and "%" in l]
        pso_lines = [l.strip() for l in lines if l.startswith("  PSO") or "PSO" in l and "%" in l]
        co_list_line = next((l for l in lines if l.startswith("Course Outcomes:")), "")
        course_name = course_line.replace("Course:", "").strip() if course_line else "this course"

        if any(w in msg for w in ["co attainment", "course outcome attainment"]) and co_lines:
            return f"CO Attainment for {course_name}:\n" + "\n".join(co_lines)

        if any(w in msg for w in ["po attainment", "program outcome attainment"]) and po_lines:
            return f"PO Attainment for {course_name}:\n" + "\n".join(po_lines)

        if any(w in msg for w in ["pso attainment", "program specific outcome"]) and pso_lines:
            return f"PSO Attainment for {course_name}:\n" + "\n".join(pso_lines)

        if any(w in msg for w in ["summary", "report", "overview", "performance", "all attainment", "show all"]):
            parts = [f"Attainment Summary for {course_name}:"]
            if co_lines:
                parts.append("\nCO Attainment:\n" + "\n".join(co_lines))
            if po_lines:
                parts.append("\nPO Attainment:\n" + "\n".join(po_lines))
            if pso_lines:
                parts.append("\nPSO Attainment:\n" + "\n".join(pso_lines))
            if len(parts) == 1:
                parts.append("\nNo attainment data yet. Upload student marks first.")
            return "\n".join(parts)

        if "co" in msg and co_lines:
            return f"CO Attainment for {course_name}:\n" + "\n".join(co_lines)

        if "po" in msg and po_lines:
            return f"PO Attainment for {course_name}:\n" + "\n".join(po_lines)

        if "pso" in msg and pso_lines:
            return f"PSO Attainment for {course_name}:\n" + "\n".join(pso_lines)

        if co_list_line:
            cos = co_list_line.replace("Course Outcomes:", "").strip()
            return f"Course Outcomes for {course_name}:\n{cos}"

        # Generic fallback with context
        return (
            f"For {course_name}, I have the following data:\n{context}\n\n"
            "Ask me about CO/PO/PSO attainment, course outcomes, or Bloom's levels."
        )

    # No context — general knowledge answers
    if any(w in msg for w in ["bloom", "taxonomy", "cognitive"]):
        return (
            "Bloom's Taxonomy has 6 cognitive levels (low to high):\n"
            "1. Remember – Recall facts (define, list, name)\n"
            "2. Understand – Explain ideas (describe, summarize)\n"
            "3. Apply – Use knowledge (solve, implement, compute)\n"
            "4. Analyze – Break down concepts (compare, differentiate)\n"
            "5. Evaluate – Make judgments (assess, justify, critique)\n"
            "6. Create – Produce new work (design, develop, build)\n\n"
            "COs should be distributed across these levels."
        )
    if any(w in msg for w in ["attainment", "level", "threshold", "calculate", "formula"]):
        return (
            "CO Attainment is calculated as:\n\n"
            "  Attainment % = (Average marks scored / Max marks) × 100\n\n"
            "Levels based on thresholds:\n"
            "  Level 1 → ≥ 50%\n"
            "  Level 2 → ≥ 60%\n"
            "  Level 3 → ≥ 70%\n\n"
            "PO/PSO attainment = average of all mapped CO attainments."
        )
    if any(w in msg for w in ["co", "course outcome"]):
        return (
            "Course Outcomes (COs) are specific, measurable statements of what students "
            "will be able to do after completing a course. Each CO should:\n"
            "• Start with an action verb from Bloom's Taxonomy\n"
            "• Be aligned with syllabus topics\n"
            "• Be mapped to relevant POs and PSOs\n"
            "• Be assessable through exam questions\n\n"
            "Tip: Select a course from the dropdown above to get CO data for a specific course."
        )
    if any(w in msg for w in ["po", "program outcome"]):
        return (
            "Program Outcomes (POs) are broad statements describing the knowledge, skills "
            "and attitudes graduates should have. NBA defines 12 standard POs (PO1–PO12) "
            "covering engineering knowledge, problem analysis, design, ethics, communication, etc.\n\n"
            "PO attainment = average attainment of all COs mapped to that PO.\n\n"
            "Tip: Select a course from the dropdown above to see PO attainment for that course."
        )
    if any(w in msg for w in ["pso", "program specific"]):
        return (
            "Program Specific Outcomes (PSOs) are outcomes specific to the program/department.\n\n"
            "PSOs complement the 12 standard POs with domain-specific skills.\n\n"
            "Tip: Select a course from the dropdown above to see PSO attainment for that course."
        )
    if any(w in msg for w in ["obe", "outcome based", "what is"]):
        return (
            "Outcome Based Education (OBE) is a student-centered approach where the curriculum "
            "is designed around clearly defined outcomes. The key components are:\n"
            "• Course Outcomes (COs) – what students learn in a course\n"
            "• Program Outcomes (POs) – what graduates can do\n"
            "• Program Specific Outcomes (PSOs) – domain-specific skills\n\n"
            "Attainment measures how well students achieved these outcomes."
        )
    if any(w in msg for w in ["hello", "hi", "hey", "help"]):
        return (
            "Hello! I'm your OBE assistant. I can help you with:\n"
            "• CO/PO/PSO attainment for a specific course\n"
            "• Bloom's Taxonomy levels\n"
            "• Attainment calculation formulas\n"
            "• OBE framework concepts\n\n"
            "Select a course from the dropdown to get course-specific answers!"
        )
    return (
        "I can answer questions about:\n"
        "• CO/PO/PSO attainment (select a course for specific data)\n"
        "• Bloom's Taxonomy\n"
        "• Attainment calculation\n"
        "• OBE framework\n\n"
        "Try: 'What is the CO attainment?' or 'Show PO attainment' after selecting a course."
    )


# ── OpenAI implementations (used only when key is valid) ────────────────────

def _openai_generate_cos(syllabus, pos, psos):
    from openai import OpenAI
    client = OpenAI(api_key=settings.openai_api_key)
    po_text = "\n".join(f"{p['code']}: {p['description']}" for p in pos)
    pso_text = "\n".join(f"{p['code']}: {p['description']}" for p in psos) if psos else "None"
    prompt = f"""You are an OBE expert. Generate 4-6 Course Outcomes for this syllabus.
Syllabus: {syllabus}
POs: {po_text}
PSOs: {pso_text}
Return JSON: {{"outcomes": [{{"code":"CO1","description":"...","bloom_level":"Apply","po_codes":["PO1"],"pso_codes":["PSO1"]}}]}}"""
    response = client.chat.completions.create(model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}], response_format={"type": "json_object"})
    data = json.loads(response.choices[0].message.content)
    return data.get("outcomes", data.get("course_outcomes", data if isinstance(data, list) else []))


def _openai_map_questions(questions, cos):
    from openai import OpenAI
    client = OpenAI(api_key=settings.openai_api_key)
    q_text = "\n".join(f"Q_ID={q['id']} | {q['question_number']}: {q.get('text','')}" for q in questions)
    co_text = "\n".join(f"CO_ID={c['id']} | {c['code']}: {c['description']}" for c in cos)
    prompt = f"""Map each question to a CO and identify Bloom's level.
Questions:\n{q_text}\nCOs:\n{co_text}
Return JSON: {{"mappings": [{{"question_id":"...","co_id":"...","bloom_level":"Apply"}}]}}"""
    response = client.chat.completions.create(model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}], response_format={"type": "json_object"})
    data = json.loads(response.choices[0].message.content)
    return data.get("mappings", data.get("question_mappings", []))


def _openai_chat(message, context):
    from openai import OpenAI
    client = OpenAI(api_key=settings.openai_api_key)
    messages = [{"role": "system", "content": "You are an OBE assistant for faculty. Be concise and helpful."}]
    if context:
        messages.append({"role": "system", "content": f"Context:\n{context}"})
    messages.append({"role": "user", "content": message})
    response = client.chat.completions.create(model="gpt-4o-mini", messages=messages)
    return response.choices[0].message.content
