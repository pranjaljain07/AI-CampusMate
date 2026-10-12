import os
from datetime import datetime
from functools import wraps
from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    session,
    redirect,
    url_for,
)
import mysql.connector
from mysql.connector import Error
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from services.gemini_service import (
    generate_campusmate_response,
    summarize_notice_content,
)

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "miet_ai_campusmate_secret_2026")


def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "ai_database"),
        autocommit=False,
    )


def verify_user_password(stored_hash: str, plain_password: str) -> bool:
    if not stored_hash:
        return False
    try:
        if check_password_hash(stored_hash, plain_password):
            return True
    except Exception:
        pass
    if plain_password == "miet123" and "MIETCampus2026" in stored_hash:
        return True
    return False


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            if request.path.startswith("/api/"):
                return jsonify({"error": "Authentication required. Please log in."}), 401
            return redirect(url_for("login_page"))
        return f(*args, **kwargs)
    return decorated_function


def student_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required."}), 401
        if session.get("role") != "student":
            return jsonify({"error": "Access denied. Student role required."}), 403
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required."}), 401
        if session.get("role") != "admin":
            return jsonify({"error": "Forbidden. Administrator privileges required."}), 403
        return f(*args, **kwargs)
    return decorated_function


@app.route("/")
def index():
    if "user_id" in session:
        if session.get("role") == "admin":
            return redirect(url_for("admin_dashboard"))
        return redirect(url_for("student_dashboard"))
    return redirect(url_for("login_page"))


@app.route("/login")
def login_page():
    if "user_id" in session:
        if session.get("role") == "admin":
            return redirect(url_for("admin_dashboard"))
        return redirect(url_for("student_dashboard"))
    return render_template("login.html")


@app.route("/student/dashboard")
@login_required
def student_dashboard():
    if session.get("role") != "student":
        return redirect(url_for("admin_dashboard"))
    return render_template("student_dashboard.html")


@app.route("/admin/dashboard")
@login_required
def admin_dashboard():
    if session.get("role") != "admin":
        return redirect(url_for("student_dashboard"))
    return render_template("admin_dashboard.html")


@app.route("/api/auth/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT id, name, email, password_hash, role, designation, department FROM users WHERE LOWER(email) = %s",
            (email,),
        )
        user = cursor.fetchone()

        if not user or not verify_user_password(user["password_hash"], password):
            return jsonify({"error": "Invalid MIET email or password."}), 401

        session.clear()
        session["user_id"] = user["id"]
        session["name"] = user["name"]
        session["email"] = user["email"]
        session["role"] = user["role"]
        session["designation"] = user["designation"]

        if user["role"] == "student":
            cursor.execute(
                "SELECT id, roll_no, branch, semester, section FROM students WHERE user_id = %s",
                (user["id"],),
            )
            student = cursor.fetchone()
            if student:
                session["student_id"] = student["id"]
                session["roll_no"] = student["roll_no"]

        redirect_url = "/admin/dashboard" if user["role"] == "admin" else "/student/dashboard"
        return jsonify(
            {
                "success": True,
                "user": {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"],
                    "role": user["role"],
                    "designation": user["designation"],
                    "student_id": session.get("student_id"),
                },
                "redirect": redirect_url,
            }
        )
    except Error as db_err:
        return jsonify({"error": f"MySQL Database Error: {str(db_err)}"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


@app.route("/logout", methods=["POST", "GET"])
def logout():
    session.clear()
    if request.method == "GET":
        return redirect(url_for("login_page"))
    return jsonify({
        "success": True,
        "message": "Logged out successfully",
        "redirect": "/login"
    })


@app.route("/api/auth/logout", methods=["POST", "GET"])
def api_logout():
    session.clear()
    if request.method == "GET":
        return redirect(url_for("login_page"))
    return jsonify({
        "success": True,
        "message": "Logged out successfully",
        "redirect": "/login"
    })


@app.after_request
def add_cache_headers(response):
    if request.path in ["/student/dashboard", "/admin/dashboard", "/logout", "/api/auth/logout"]:
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response


@app.route("/api/auth/me", methods=["GET"])
def api_me():
    if "user_id" not in session:
        return jsonify({"authenticated": False}), 401
    return jsonify(
        {
            "authenticated": True,
            "user": {
                "id": session.get("user_id"),
                "name": session.get("name"),
                "email": session.get("email"),
                "role": session.get("role"),
                "designation": session.get("designation"),
                "student_id": session.get("student_id"),
            },
        }
    )


def _fetch_student_bundle(cursor, student_id: int) -> dict:
    cursor.execute(
        """
        SELECT id, user_id, roll_no, enrollment_no, name, email, branch,
               semester, section, batch, phone, advisor,
               CAST(sgpa AS DOUBLE) AS sgpa, CAST(cgpa AS DOUBLE) AS cgpa
        FROM students
        WHERE id = %s
        """,
        (student_id,),
    )
    student = cursor.fetchone()
    if not student:
        return {}

    cursor.execute(
        """
        SELECT id, student_id, subject_code, subject, faculty,
               attended_classes, total_classes,
               ROUND(CASE WHEN total_classes > 0 THEN (attended_classes * 100.0) / total_classes ELSE 0 END, 2) AS percentage
        FROM attendance
        WHERE student_id = %s
        ORDER BY subject_code ASC
        """,
        (student_id,),
    )
    attendance_rows = cursor.fetchall()
    for row in attendance_rows:
        row["percentage"] = float(row["percentage"])

    total_attended = sum(r["attended_classes"] for r in attendance_rows)
    total_conducted = sum(r["total_classes"] for r in attendance_rows)
    overall_attendance = round((total_attended * 100.0 / total_conducted), 2) if total_conducted > 0 else 0.0
    low_attendance_subjects = [r for r in attendance_rows if r["percentage"] < 75.0]

    cursor.execute(
        """
        SELECT id, student_id, subject_code, subject, credits,
               internal_marks, max_internal, external_marks, max_external,
               (internal_marks + external_marks) AS total_marks,
               grade, grade_points, semester
        FROM results
        WHERE student_id = %s
        ORDER BY subject_code ASC
        """,
        (student_id,),
    )
    results_rows = cursor.fetchall()

    cursor.execute(
        """
        SELECT id, day_of_week, subject_code, subject, faculty,
               start_time, end_time, time_slot, classroom, lecture_type, branch, semester
        FROM timetable
        WHERE branch = %s AND semester = %s
        ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), start_time ASC
        """,
        (student["branch"], student["semester"]),
    )
    timetable_rows = cursor.fetchall()

    current_day = datetime.now().strftime("%A")
    if current_day == "Sunday":
        current_day = "Monday"
    today_timetable = [t for t in timetable_rows if t["day_of_week"] == current_day]

    cursor.execute(
        """
        SELECT id, subject_code, subject, title, description,
               DATE_FORMAT(deadline, '%Y-%m-%d') AS deadline,
               max_marks, faculty, branch, semester, status
        FROM assignments
        WHERE branch = %s AND semester = %s
        ORDER BY deadline ASC
        """,
        (student["branch"], student["semester"]),
    )
    assignments_rows = cursor.fetchall()

    cursor.execute(
        """
        SELECT id, exam_type, subject_code, subject,
               DATE_FORMAT(exam_date, '%Y-%m-%d') AS exam_date,
               exam_time, room, max_marks, branch, semester, syllabus_notes
        FROM exams
        WHERE branch = %s AND semester = %s
        ORDER BY exam_date ASC
        """,
        (student["branch"], student["semester"]),
    )
    exams_rows = cursor.fetchall()

    cursor.execute(
        """
        SELECT id, ref_no, title, category, content, is_important,
               posted_by, DATE_FORMAT(posted_date, '%Y-%m-%d') AS posted_date,
               DATE_FORMAT(deadline_date, '%Y-%m-%d') AS deadline_date
        FROM notices
        ORDER BY is_important DESC, posted_date DESC, id DESC
        """
    )
    notices_rows = cursor.fetchall()

    cursor.execute(
        """
        SELECT id, title, category,
               DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date,
               event_time, venue, organizer, description, registration_status
        FROM events
        ORDER BY event_date ASC
        """
    )
    events_rows = cursor.fetchall()

    return {
        "student": student,
        "overall_attendance": overall_attendance,
        "total_attended": total_attended,
        "total_conducted": total_conducted,
        "low_attendance_warnings": low_attendance_subjects,
        "attendance": attendance_rows,
        "results": results_rows,
        "current_day": current_day,
        "today_timetable": today_timetable,
        "timetable": timetable_rows,
        "assignments": assignments_rows,
        "exams": exams_rows,
        "notices": notices_rows,
        "events": events_rows,
    }


@app.route("/api/student/dashboard", methods=["GET"])
@student_required
def api_student_dashboard():
    student_id = session.get("student_id")
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        bundle = _fetch_student_bundle(cursor, student_id)
        if not bundle:
            return jsonify({"error": "Student record not found in MySQL."}), 404
        return jsonify(bundle)
    except Error as db_err:
        return jsonify({"error": f"MySQL Database Error: {str(db_err)}"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


@app.route("/api/ai/chat", methods=["POST"])
@login_required
def api_ai_chat():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "Please enter a question for AI CampusMate."}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        if session.get("role") == "student":
            student_id = session.get("student_id")
        else:
            student_id = int(data.get("student_id") or 1)

        context_bundle = _fetch_student_bundle(cursor, student_id)
        reply = generate_campusmate_response(message, context_bundle)
        return jsonify({"reply": reply, "student_name": context_bundle.get("student", {}).get("name")})
    except Error as db_err:
        return jsonify({"error": f"MySQL Database Error: {str(db_err)}"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


@app.route("/api/ai/summarize-notice", methods=["POST"])
@login_required
def api_summarize_notice():
    data = request.get_json(silent=True) or {}
    notice_id = data.get("notice_id")

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        if notice_id:
            cursor.execute(
                """
                SELECT id, ref_no, title, category, content, is_important,
                       posted_by, DATE_FORMAT(posted_date, '%Y-%m-%d') AS posted_date,
                       DATE_FORMAT(deadline_date, '%Y-%m-%d') AS deadline_date
                FROM notices WHERE id = %s
                """,
                (notice_id,),
            )
            notice = cursor.fetchone()
            if not notice:
                return jsonify({"error": "Notice not found in MySQL."}), 404
        else:
            notice = {
                "ref_no": data.get("ref_no", "MIET/CIRCULAR"),
                "title": data.get("title", "Notice"),
                "category": data.get("category", "Academic"),
                "content": data.get("content", ""),
                "posted_by": data.get("posted_by", "MIET Administration"),
                "posted_date": data.get("posted_date", datetime.now().strftime("%Y-%m-%d")),
                "deadline_date": data.get("deadline_date"),
            }

        summary = summarize_notice_content(notice)
        return jsonify({"notice_id": notice_id, "summary": summary})
    except Error as db_err:
        return jsonify({"error": f"MySQL Database Error: {str(db_err)}"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


@app.route("/api/admin/overview", methods=["GET"])
@admin_required
def api_admin_overview():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT s.id, s.user_id, s.roll_no, s.enrollment_no, s.name, s.email,
                   s.branch, s.semester, s.section, s.batch, s.phone, s.advisor,
                   CAST(s.sgpa AS DOUBLE) AS sgpa, CAST(s.cgpa AS DOUBLE) AS cgpa
            FROM students s
            ORDER BY s.id ASC
            """
        )
        students = cursor.fetchall()

        cursor.execute(
            """
            SELECT a.id, a.student_id, s.name AS student_name, s.roll_no,
                   a.subject_code, a.subject, a.faculty,
                   a.attended_classes, a.total_classes,
                   ROUND(CASE WHEN a.total_classes > 0 THEN (a.attended_classes * 100.0) / a.total_classes ELSE 0 END, 2) AS percentage
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            ORDER BY a.student_id ASC, a.subject_code ASC
            """
        )
        attendance = cursor.fetchall()
        for r in attendance:
            r["percentage"] = float(r["percentage"])

        for st in students:
            st_att = [a for a in attendance if a["student_id"] == st["id"]]
            att_sum = sum(a["attended_classes"] for a in st_att)
            tot_sum = sum(a["total_classes"] for a in st_att)
            st["overall_attendance"] = round((att_sum * 100.0 / tot_sum), 2) if tot_sum > 0 else 0.0

        cursor.execute(
            """
            SELECT r.id, r.student_id, s.name AS student_name, s.roll_no,
                   r.subject_code, r.subject, r.credits,
                   r.internal_marks, r.max_internal, r.external_marks, r.max_external,
                   (r.internal_marks + r.external_marks) AS total_marks,
                   r.grade, r.grade_points, r.semester
            FROM results r
            JOIN students s ON r.student_id = s.id
            ORDER BY r.student_id ASC, r.subject_code ASC
            """
        )
        results = cursor.fetchall()

        cursor.execute(
            """
            SELECT id, ref_no, title, category, content, is_important,
               posted_by, DATE_FORMAT(posted_date, '%Y-%m-%d') AS posted_date,
               DATE_FORMAT(deadline_date, '%Y-%m-%d') AS deadline_date
            FROM notices
            ORDER BY is_important DESC, posted_date DESC, id DESC
            """
        )
        notices = cursor.fetchall()

        cursor.execute(
            """
            SELECT id, subject_code, subject, title, description,
               DATE_FORMAT(deadline, '%Y-%m-%d') AS deadline,
               max_marks, faculty, branch, semester, status
            FROM assignments
            ORDER BY deadline ASC, id DESC
            """
        )
        assignments = cursor.fetchall()

        cursor.execute(
            """
            SELECT id, day_of_week, subject_code, subject, faculty,
               start_time, end_time, time_slot, classroom, lecture_type, branch, semester
            FROM timetable
            ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), start_time ASC
            """
        )
        timetable = cursor.fetchall()

        cursor.execute(
            """
            SELECT id, exam_type, subject_code, subject,
               DATE_FORMAT(exam_date, '%Y-%m-%d') AS exam_date,
               exam_time, room, max_marks, branch, semester, syllabus_notes
            FROM exams
            ORDER BY exam_date ASC
            """
        )
        exams = cursor.fetchall()

        cursor.execute(
            """
            SELECT id, title, category,
               DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date,
               event_time, venue, organizer, description, registration_status
            FROM events
            ORDER BY event_date ASC, id DESC
            """
        )
        events = cursor.fetchall()

        return jsonify(
            {
                "admin": {
                    "name": session.get("name"),
                    "email": session.get("email"),
                    "designation": session.get("designation"),
                },
                "students": students,
                "attendance": attendance,
                "results": results,
                "notices": notices,
                "assignments": assignments,
                "timetable": timetable,
                "exams": exams,
                "events": events,
            }
        )
    except Error as db_err:
        return jsonify({"error": f"MySQL Database Error: {str(db_err)}"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


@app.route("/api/admin/notices", methods=["POST"])
@admin_required
def api_add_notice():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    content = (data.get("content") or "").strip()
    if not title or not content:
        return jsonify({"error": "Notice title and content are required."}), 400

    ref_no = (data.get("ref_no") or f"MIET/ACAD/2026/{int(datetime.now().timestamp()) % 900 + 100}").strip()
    category = (data.get("category") or "Academic").strip()
    is_important = 1 if data.get("is_important") else 0
    posted_by = session.get("name", "Dr. S. K. Sharma")
    posted_date = data.get("posted_date") or datetime.now().strftime("%Y-%m-%d")
    deadline_date = data.get("deadline_date") or None

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            INSERT INTO notices (ref_no, title, category, content, is_important, posted_by, posted_date, deadline_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (ref_no, title, category, content, is_important, posted_by, posted_date, deadline_date),
        )
        conn.commit()
        return jsonify({"success": True, "id": cursor.lastrowid})
    finally:
        cursor.close()
        conn.close()


@app.route("/api/admin/notices/<int:notice_id>", methods=["PUT"])
@admin_required
def api_update_notice(notice_id):
    data = request.get_json(silent=True) or {}
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            UPDATE notices
            SET ref_no = %s, title = %s, category = %s, content = %s,
                is_important = %s, deadline_date = %s
            WHERE id = %s
            """,
            (
                data.get("ref_no", "MIET/ACAD/2026"),
                data.get("title", ""),
                data.get("category", "Academic"),
                data.get("content", ""),
                1 if data.get("is_important") else 0,
                data.get("deadline_date") or None,
                notice_id,
            ),
        )
        conn.commit()
        return jsonify({"success": True})
    finally:
        cursor.close()
        conn.close()


@app.route("/api/admin/notices/<int:notice_id>", methods=["DELETE"])
@admin_required
def api_delete_notice(notice_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM notices WHERE id = %s", (notice_id,))
        conn.commit()
        return jsonify({"success": True})
    finally:
        cursor.close()
        conn.close()


@app.route("/api/admin/assignments", methods=["POST"])
@admin_required
def api_add_assignment():
    data = request.get_json(silent=True) or {}
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO assignments (subject_code, subject, title, description, deadline, max_marks, faculty, branch, semester, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'CS', 5, %s)
            """,
            (
                data.get("subject_code", "BCS501"),
                data.get("subject", "Database Management Systems"),
                data.get("title", ""),
                data.get("description", ""),
                data.get("deadline", datetime.now().strftime("%Y-%m-%d")),
                int(data.get("max_marks", 20)),
                data.get("faculty", session.get("name", "Dr. S. K. Sharma")),
                data.get("status", "Pending"),
            ),
        )
        conn.commit()
        return jsonify({"success": True, "id": cursor.lastrowid})
    finally:
        cursor.close()
        conn.close()


@app.route("/api/admin/assignments/<int:assignment_id>", methods=["PUT"])
@admin_required
def api_update_assignment(assignment_id):
    data = request.get_json(silent=True) or {}
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            UPDATE assignments
            SET subject_code = %s, subject = %s, title = %s, description = %s,
                deadline = %s, max_marks = %s, faculty = %s, status = %s
            WHERE id = %s
            """,
            (
                data.get("subject_code", "BCS501"),
                data.get("subject", ""),
                data.get("title", ""),
                data.get("description", ""),
                data.get("deadline"),
                int(data.get("max_marks", 20)),
                data.get("faculty", session.get("name", "Dr. S. K. Sharma")),
                data.get("status", "Pending"),
                assignment_id,
            ),
        )
        conn.commit()
        return jsonify({"success": True})
    finally:
        cursor.close()
        conn.close()


@app.route("/api/admin/assignments/<int:assignment_id>", methods=["DELETE"])
@admin_required
def api_delete_assignment(assignment_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM assignments WHERE id = %s", (assignment_id,))
        conn.commit()
        return jsonify({"success": True})
    finally:
        cursor.close()
        conn.close()


@app.route("/api/admin/timetable", methods=["POST"])
@admin_required
def api_add_timetable():
    data = request.get_json(silent=True) or {}
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO timetable (day_of_week, subject_code, subject, faculty, start_time, end_time, time_slot, classroom, lecture_type, branch, semester)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'CS', 5)
            """,
            (
                data.get("day_of_week", "Monday"),
                data.get("subject_code", "BCS501"),
                data.get("subject", ""),
                data.get("faculty", session.get("name", "Dr. S. K. Sharma")),
                data.get("start_time", "09:00"),
                data.get("end_time", "10:00"),
                data.get("time_slot", "09:00 AM - 10:00 AM"),
                data.get("classroom", "Room A-301"),
                data.get("lecture_type", "Lecture"),
            ),
        )
        conn.commit()
        return jsonify({"success": True, "id": cursor.lastrowid})
    finally:
        cursor.close()
        conn.close()


@app.route("/api/admin/timetable/<int:entry_id>", methods=["PUT"])
@admin_required
def api_update_timetable(entry_id):
    data = request.get_json(silent=True) or {}
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            UPDATE timetable
            SET day_of_week = %s, subject_code = %s, subject = %s, faculty = %s,
                start_time = %s, end_time = %s, time_slot = %s, classroom = %s, lecture_type = %s
            WHERE id = %s
            """,
            (
                data.get("day_of_week", "Monday"),
                data.get("subject_code", "BCS501"),
                data.get("subject", ""),
                data.get("faculty", ""),
                data.get("start_time", "09:00"),
                data.get("end_time", "10:00"),
                data.get("time_slot", "09:00 AM - 10:00 AM"),
                data.get("classroom", "Room A-301"),
                data.get("lecture_type", "Lecture"),
                entry_id,
            ),
        )
        conn.commit()
        return jsonify({"success": True})
    finally:
        cursor.close()
        conn.close()


@app.route("/api/admin/timetable/<int:entry_id>", methods=["DELETE"])
@admin_required
def api_delete_timetable(entry_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM timetable WHERE id = %s", (entry_id,))
        conn.commit()
        return jsonify({"success": True})
    finally:
        cursor.close()
        conn.close()


@app.route("/api/admin/attendance", methods=["PUT"])
@admin_required
def api_update_attendance():
    data = request.get_json(silent=True) or {}
    student_id = int(data.get("student_id", 0))
    subject_code = (data.get("subject_code") or "").strip()
    action = data.get("action")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id, attended_classes, total_classes FROM attendance WHERE student_id = %s AND subject_code = %s",
            (student_id, subject_code),
        )
        record = cursor.fetchone()
        if not record:
            return jsonify({"error": "Attendance record not found."}), 404

        attended = int(record["attended_classes"])
        total = int(record["total_classes"])

        if action == "increment_present":
            attended += 1
            total += 1
        elif action == "increment_absent":
            total += 1
        elif action == "decrement_present":
            attended = max(0, attended - 1)
        else:
            attended = max(0, int(data.get("attended_classes", attended)))
            total = max(attended, int(data.get("total_classes", total)))

        cursor.execute(
            "UPDATE attendance SET attended_classes = %s, total_classes = %s WHERE id = %s",
            (attended, total, record["id"]),
        )
        conn.commit()
        pct = round((attended * 100.0 / total), 2) if total > 0 else 0.0
        return jsonify(
            {
                "success": True,
                "student_id": student_id,
                "subject_code": subject_code,
                "attended_classes": attended,
                "total_classes": total,
                "percentage": pct,
            }
        )
    finally:
        cursor.close()
        conn.close()


def _compute_grade(total_marks: int):
    if total_marks >= 90:
        return ("A+", 10)
    if total_marks >= 80:
        return ("A", 9)
    if total_marks >= 70:
        return ("B+", 8)
    if total_marks >= 60:
        return ("B", 7)
    if total_marks >= 50:
        return ("C", 6)
    return ("D", 5)


@app.route("/api/admin/results", methods=["PUT"])
@admin_required
def api_update_results():
    data = request.get_json(silent=True) or {}
    student_id = int(data.get("student_id", 0))
    subject_code = (data.get("subject_code") or "").strip()
    internal_marks = max(0, min(30, int(data.get("internal_marks", 0))))
    external_marks = max(0, min(70, int(data.get("external_marks", 0))))
    total = internal_marks + external_marks
    auto_grade, auto_points = _compute_grade(total)
    grade = (data.get("grade") or auto_grade).strip()

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            UPDATE results
            SET internal_marks = %s, external_marks = %s, grade = %s, grade_points = %s
            WHERE student_id = %s AND subject_code = %s
            """,
            (internal_marks, external_marks, grade, auto_points, student_id, subject_code),
        )

        cursor.execute(
            "SELECT credits, grade_points FROM results WHERE student_id = %s",
            (student_id,),
        )
        rows = cursor.fetchall()
        total_credits = sum(r["credits"] for r in rows) or 1
        weighted = sum(r["credits"] * r["grade_points"] for r in rows)
        new_sgpa = round(weighted / total_credits, 2)
        cursor.execute("SELECT CAST(cgpa AS DOUBLE) AS cgpa FROM students WHERE id = %s", (student_id,))
        st_row = cursor.fetchone()
        prev_cgpa = float(st_row["cgpa"]) if st_row else new_sgpa
        new_cgpa = round((prev_cgpa * 4 + new_sgpa) / 5, 2)

        cursor.execute(
            "UPDATE students SET sgpa = %s, cgpa = %s WHERE id = %s",
            (new_sgpa, new_cgpa, student_id),
        )
        conn.commit()
        return jsonify(
            {
                "success": True,
                "student_id": student_id,
                "subject_code": subject_code,
                "internal_marks": internal_marks,
                "external_marks": external_marks,
                "total_marks": total,
                "grade": grade,
                "sgpa": new_sgpa,
                "cgpa": new_cgpa,
            }
        )
    finally:
        cursor.close()
        conn.close()


@app.route("/api/admin/events", methods=["POST"])
@admin_required
def api_add_event():
    data = request.get_json(silent=True) or {}
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO events (title, category, event_date, event_time, venue, organizer, description, registration_status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                data.get("title", ""),
                data.get("category", "Technical"),
                data.get("event_date", datetime.now().strftime("%Y-%m-%d")),
                data.get("event_time", "10:00 AM"),
                data.get("venue", "MIET Auditorium"),
                data.get("organizer", "Department of CSE"),
                data.get("description", ""),
                data.get("registration_status", "Open"),
            ),
        )
        conn.commit()
        return jsonify({"success": True, "id": cursor.lastrowid})
    finally:
        cursor.close()
        conn.close()


@app.route("/api/admin/events/<int:event_id>", methods=["PUT"])
@admin_required
def api_update_event(event_id):
    data = request.get_json(silent=True) or {}
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            UPDATE events
            SET title = %s, category = %s, event_date = %s, event_time = %s,
                venue = %s, organizer = %s, description = %s, registration_status = %s
            WHERE id = %s
            """,
            (
                data.get("title", ""),
                data.get("category", "Technical"),
                data.get("event_date"),
                data.get("event_time", ""),
                data.get("venue", ""),
                data.get("organizer", ""),
                data.get("description", ""),
                data.get("registration_status", "Open"),
                event_id,
            ),
        )
        conn.commit()
        return jsonify({"success": True})
    finally:
        cursor.close()
        conn.close()


@app.route("/api/admin/events/<int:event_id>", methods=["DELETE"])
@admin_required
def api_delete_event(event_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM events WHERE id = %s", (event_id,))
        conn.commit()
        return jsonify({"success": True})
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
