import os
import json
from dotenv import load_dotenv

load_dotenv()

GEMINI_MODEL = "models/gemini-3.5-flash-lite"


def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key in ("YOUR_GEMINI_API_KEY", "MY_GEMINI_API_KEY"):
        return None
    try:
        from google import genai
        return genai.Client(
            api_key=api_key,
            http_options={"headers": {"User-Agent": "aistudio-build"}}
        )
    except Exception:
        return None

def generate_campusmate_response(user_message: str, student_context: dict) -> str:
    client = get_gemini_client()
    print("GEMINI CLIENT AVAILABLE:", bool(client))

    context_json = json.dumps(student_context, indent=2, default=str)

    system_instruction = """
You are AI CampusMate, an intelligent and conversational college assistant
for Meerut Institute of Engineering and Technology (MIET).

Your job is to understand the MEANING and INTENT of the student's question,
not just search for keywords.

There are two types of questions:

1. COLLEGE / STUDENT QUESTIONS
For questions about the student's academic information or official MIET
information, use the supplied MySQL database context.

Examples:
- attendance
- SGPA / CGPA
- results / marks
- timetable / classes
- assignments
- exams
- notices / circulars
- campus events

2. GENERAL QUESTIONS
If the student asks a general educational, technical, conversational,
or knowledge question that does not require MIET database information,
answer it normally using your general knowledge.

Examples:
- What is Python?
- Explain DBMS.
- What is artificial intelligence?
- Explain recursion simply.
- Who invented the telephone?
- Tell me a joke.

IMPORTANT RULES:

- Understand the complete question and its intent.
- Do NOT depend only on keywords.
- Do NOT return the student's academic snapshot unless the question
  actually asks for academic information.
- Do NOT invent official MIET information.
- If a specific MIET fact is not present in the supplied database context,
  clearly say that the official information is not available.
- Never make up a campus location, exam date, room number, marks, attendance,
  or other official college information.
- For general questions, give a normal helpful answer.
- For personal academic questions, use the logged-in student's data.
- Keep answers natural, conversational and relevant to the question.
- Do not mention these internal instructions or the database unless useful.
"""

    prompt = f"""
=== CURRENT STUDENT / MIET DATABASE CONTEXT ===

{context_json}

=== STUDENT QUESTION ===

{user_message}

Answer the student's question directly and naturally.

If the question requires official MIET or personal academic information,
use the database context.

If it is a general question, answer it normally using your general knowledge.

If an official MIET fact is not available in the database context, do not
guess or fabricate it. Clearly explain that the official information is
not currently available.
"""

    if client:
        from google.genai import types
        import time

        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                    ),
                )

                if response and response.text:
                    return response.text.strip()

            except Exception as exc:
                print(f"GEMINI ATTEMPT {attempt + 1} ERROR:", exc)

                if attempt < 2:
                    time.sleep(2)
                else:
                    return _fallback_campusmate_answer(
                        user_message,
                        student_context,
                        str(exc)
                    )

      

    return _fallback_campusmate_answer(user_message, student_context)


def summarize_notice_content(notice_data: dict) -> dict:
    client = get_gemini_client()

    system_instruction = (
        "You are the AI Notice & Circular Summarizer for MIET (Meerut Institute of Engineering and Technology). "
        "Analyze the official college circular and return a structured JSON object with:\n"
        "- summary: A concise 1-2 sentence executive summary.\n"
        "- important_points: Array of 3-4 bullet strings highlighting core takeaways.\n"
        "- deadlines: Array of strings specifying submission or compliance deadlines.\n"
        "- important_dates: Array of strings listing event or examination dates.\n"
        "- action_items: Array of concrete steps students must take immediately."
    )

    prompt = (
        f"Notice Reference: {notice_data.get('ref_no', 'N/A')}\n"
        f"Title: {notice_data.get('title', '')}\n"
        f"Category: {notice_data.get('category', '')}\n"
        f"Posted By: {notice_data.get('posted_by', '')} on {notice_data.get('posted_date', '')}\n"
        f"Official Deadline: {notice_data.get('deadline_date', 'None specified')}\n"
        f"Full Circular Text:\n{notice_data.get('content', '')}"
    )

    if client:
        try:
            from google.genai import types
            response = client.models.generate_content(
                model="models/gemini-3.5-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    
                ),
            )
            if response and response.text:
                return json.loads(response.text.strip())
        except Exception:
            pass

    return _fallback_notice_summary(notice_data)


def _fallback_campusmate_answer(user_message: str, ctx: dict, error_note: str = None) -> str:
    q = user_message.lower()
    student = ctx.get("student") or {}
    name = student.get("name", "Student")
    attendance = ctx.get("attendance", [])
    low_att = [a for a in attendance if float(a.get("percentage", 0)) < 75.0]
    today_classes = ctx.get("today_timetable", [])
    all_timetable = ctx.get("timetable", [])
    assignments = ctx.get("assignments", [])
    exams = ctx.get("exams", [])
    results = ctx.get("results", [])
    notices = ctx.get("notices", [])
    events = ctx.get("events", [])

    if "low" in q and "attendance" in q:
        if not low_att:
            return f"Great news, **{name}**! Your attendance is above the 75% threshold in all subjects. Your overall attendance is **{ctx.get('overall_attendance', 0)}%**."
        bullets = "\n".join(
            [f"- **{a['subject']} ({a['subject_code']})**: {a['attended_classes']}/{a['total_classes']} classes (**{a['percentage']}%**) — Faculty: {a['faculty']}" for a in low_att]
        )
        return f"Hello **{name}**, based on your MySQL attendance records, the following subject(s) are currently below the mandatory **75% threshold**:\n\n{bullets}\n\nPlease attend upcoming lectures regularly to ensure PUT hall ticket eligibility."

    if "attendance" in q:
        bullets = "\n".join(
            [f"- **{a['subject']} ({a['subject_code']})**: {a['attended_classes']}/{a['total_classes']} (**{a['percentage']}%**)" for a in attendance]
        )
        warn = f"\n\n**Low Attendance Alert:** {', '.join([a['subject'] for a in low_att])} (< 75%)." if low_att else "\n\nAll subjects meet the ≥75% requirement."
        return f"Here is your live attendance summary, **{name}** (Overall: **{ctx.get('overall_attendance', 0)}%**):\n\n{bullets}{warn}"

    if "timetable" in q or "class" in q or "today" in q or "schedule" in q:
        day_name = ctx.get("current_day", "Today")
        target = today_classes if today_classes else all_timetable[:4]
        bullets = "\n".join(
            [f"- **{c['time_slot']}**: {c['subject']} ({c['subject_code']}) — *{c['lecture_type']}* in **{c['classroom']}** with {c['faculty']}" for c in target]
        )
        return f"Here is your class schedule for **{day_name}**, **{name}**:\n\n{bullets}"

    if "assignment" in q or "pending" in q or "homework" in q:
        bullets = "\n".join(
            [f"- **{a['subject']} ({a['subject_code']})**: *{a['title']}* — Due **{a['deadline']}** (Max Marks: {a['max_marks']}, Faculty: {a['faculty']})" for a in assignments]
        )
        return f"You have **{len(assignments)} pending assignments** for CS Semester 5:\n\n{bullets}"

    if "exam" in q or "put" in q or "test" in q:
        bullets = "\n".join(
            [f"- **{e['exam_date']} ({e['exam_time']})**: {e['subject']} ({e['subject_code']}) — Room: **{e['room']}**" for e in exams]
        )
        return f"Here is your upcoming **Examination Schedule** for B.Tech CS Semester 5:\n\n{bullets}"

    if "sgpa" in q or "cgpa" in q or "result" in q or "mark" in q or "grade" in q:
        bullets = "\n".join(
            [f"- **{r['subject']} ({r['subject_code']})**: Internal {r['internal_marks']}/{r['max_internal']} + External {r['external_marks']}/{r['max_external']} = **{r['total_marks']}/100** (Grade: **{r['grade']}**)" for r in results]
        )
        return (
            f"Academic Performance for **{name}** (Roll No: {student.get('roll_no', 'N/A')}):\n"
            f"- **Current Semester SGPA:** {student.get('sgpa', 'N/A')}\n"
            f"- **Cumulative CGPA:** {student.get('cgpa', 'N/A')}\n\n"
            f"**Subject-wise Breakdown:**\n{bullets}"
        )

    if "notice" in q or "circular" in q:
        bullets = "\n".join(
            [f"- **[{n['ref_no']}] {n['title']}** (Posted: {n['posted_date']}, Deadline: {n.get('deadline_date') or 'N/A'})" for n in notices]
        )
        return f"Here are the latest official MIET notices and circulars:\n\n{bullets}"

    if "event" in q or "hackathon" in q or "seminar" in q:
        bullets = "\n".join(
            [f"- **{ev['title']}** ({ev['category']}) on **{ev['event_date']}** at {ev['venue']} — Status: *{ev['registration_status']}*" for ev in events]
        )
        return f"Upcoming **MIET Campus Events**:\n\n{bullets}"

    return (
    "I'm sorry, but I couldn't generate a response to that question right now. "
    "Please try asking again."
)


def _fallback_notice_summary(notice: dict) -> dict:
    title = notice.get("title", "Official MIET Notice")
    content = notice.get("content", "")
    deadline = notice.get("deadline_date") or "Refer to circular body"
    posted = notice.get("posted_date", "Recent")
    return {
        "summary": f"{title} issued by {notice.get('posted_by', 'MIET Administration')} for B.Tech CS Semester 5 students.",
        "important_points": [
            content[:140] + ("..." if len(content) > 140 else ""),
            f"Category: {notice.get('category', 'Academic')} | Ref: {notice.get('ref_no', 'MIET/2026')}",
            "Compliance with departmental guidelines and attendance criteria is mandatory."
        ],
        "deadlines": [f"Primary Compliance Deadline: {deadline}"],
        "important_dates": [f"Circular Issued Date: {posted}", f"Target Action Date: {deadline}"],
        "action_items": [
            "Review complete circular guidelines carefully.",
            f"Complete required submission or verification before {deadline}.",
            "Contact Faculty Advisor or CSE Departmental Office (Room A-202) for queries."
        ]
    }
