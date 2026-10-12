import os
import json
import sqlite3
import urllib.request
import urllib.error
from datetime import datetime
from http.server import HTTPServer, SimpleHTTPRequestHandler
from http.cookies import SimpleCookie
from urllib.parse import urlparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "database", "ai_database_live.sqlite")
GEMINI_MODEL = "gemini-3.8-flash"

SESSIONS = {}


def init_live_database():
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if cur.fetchone():
        conn.close()
        return

    cur.executescript(
        """
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'student',
            designation TEXT,
            department TEXT DEFAULT 'Computer Science & Engineering'
        );

        CREATE TABLE students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            roll_no TEXT NOT NULL UNIQUE,
            enrollment_no TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            branch TEXT NOT NULL DEFAULT 'CS',
            semester INTEGER NOT NULL DEFAULT 5,
            section TEXT NOT NULL DEFAULT 'CS-5A',
            batch TEXT NOT NULL DEFAULT '2022-2026',
            phone TEXT NOT NULL,
            advisor TEXT NOT NULL DEFAULT 'Dr. S. K. Sharma',
            sgpa REAL NOT NULL DEFAULT 0.00,
            cgpa REAL NOT NULL DEFAULT 0.00
        );

        CREATE TABLE notices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ref_no TEXT NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'Academic',
            content TEXT NOT NULL,
            is_important INTEGER NOT NULL DEFAULT 0,
            posted_by TEXT NOT NULL DEFAULT 'Dr. S. K. Sharma',
            posted_date TEXT NOT NULL,
            deadline_date TEXT
        );

        CREATE TABLE assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_code TEXT NOT NULL,
            subject TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            deadline TEXT NOT NULL,
            max_marks INTEGER NOT NULL DEFAULT 20,
            faculty TEXT NOT NULL,
            branch TEXT NOT NULL DEFAULT 'CS',
            semester INTEGER NOT NULL DEFAULT 5,
            status TEXT NOT NULL DEFAULT 'Pending'
        );

        CREATE TABLE timetable (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            day_of_week TEXT NOT NULL,
            subject_code TEXT NOT NULL,
            subject TEXT NOT NULL,
            faculty TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            time_slot TEXT NOT NULL,
            classroom TEXT NOT NULL,
            lecture_type TEXT NOT NULL DEFAULT 'Lecture',
            branch TEXT NOT NULL DEFAULT 'CS',
            semester INTEGER NOT NULL DEFAULT 5
        );

        CREATE TABLE attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            subject_code TEXT NOT NULL,
            subject TEXT NOT NULL,
            faculty TEXT NOT NULL,
            attended_classes INTEGER NOT NULL DEFAULT 0,
            total_classes INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE exams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exam_type TEXT NOT NULL DEFAULT 'Pre-University Test (PUT)',
            subject_code TEXT NOT NULL,
            subject TEXT NOT NULL,
            exam_date TEXT NOT NULL,
            exam_time TEXT NOT NULL,
            room TEXT NOT NULL,
            max_marks INTEGER NOT NULL DEFAULT 100,
            branch TEXT NOT NULL DEFAULT 'CS',
            semester INTEGER NOT NULL DEFAULT 5,
            syllabus_notes TEXT
        );

        CREATE TABLE results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            subject_code TEXT NOT NULL,
            subject TEXT NOT NULL,
            credits INTEGER NOT NULL DEFAULT 4,
            internal_marks INTEGER NOT NULL DEFAULT 0,
            max_internal INTEGER NOT NULL DEFAULT 30,
            external_marks INTEGER NOT NULL DEFAULT 0,
            max_external INTEGER NOT NULL DEFAULT 70,
            grade TEXT NOT NULL DEFAULT 'A',
            grade_points INTEGER NOT NULL DEFAULT 9,
            semester INTEGER NOT NULL DEFAULT 5
        );

        CREATE TABLE events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'Technical',
            event_date TEXT NOT NULL,
            event_time TEXT NOT NULL,
            venue TEXT NOT NULL,
            organizer TEXT NOT NULL,
            description TEXT NOT NULL,
            registration_status TEXT NOT NULL DEFAULT 'Open'
        );
        """
    )

    users_seed = [
        (1, "Gauri", "gauri@miet.ac.in", "miet123", "student", "B.Tech CS Semester 5 Student", "Computer Science & Engineering"),
        (2, "Harshi", "harshi@miet.ac.in", "miet123", "student", "B.Tech CS Semester 5 Student", "Computer Science & Engineering"),
        (3, "Pranjal", "pranjal@miet.ac.in", "miet123", "student", "B.Tech CS Semester 5 Student", "Computer Science & Engineering"),
        (4, "Manvi", "manvi@miet.ac.in", "miet123", "student", "B.Tech CS Semester 5 Student", "Computer Science & Engineering"),
        (5, "Dr. S. K. Sharma", "sk.sharma@miet.ac.in", "miet123", "admin", "Professor & Head of Department (CSE)", "Computer Science & Engineering"),
        (6, "Dr. Neha Agarwal", "neha.agarwal@miet.ac.in", "miet123", "admin", "Associate Professor & Academic Coordinator", "Computer Science & Engineering"),
    ]
    cur.executemany("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)", users_seed)

    students_seed = [
        (1, 1, "2200680100041", "MIET/CS/22/041", "Gauri", "gauri@miet.ac.in", "CS", 5, "CS-5A", "2022-2026", "+91-9837014101", "Dr. S. K. Sharma", 8.92, 8.76),
        (2, 2, "2200680100058", "MIET/CS/22/058", "Harshi", "harshi@miet.ac.in", "CS", 5, "CS-5A", "2022-2026", "+91-9837014102", "Dr. Neha Agarwal", 8.35, 8.18),
        (3, 3, "2200680100094", "MIET/CS/22/094", "Pranjal", "pranjal@miet.ac.in", "CS", 5, "CS-5A", "2022-2026", "+91-9837014103", "Dr. S. K. Sharma", 9.24, 9.08),
        (4, 4, "2200680100072", "MIET/CS/22/072", "Manvi", "manvi@miet.ac.in", "CS", 5, "CS-5A", "2022-2026", "+91-9837014104", "Dr. Neha Agarwal", 7.88, 7.95),
    ]
    cur.executemany("INSERT INTO students VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", students_seed)

    notices_seed = [
        (1, "MIET/ACAD/2026/108", "Pre-University Test (PUT) Schedule & Examination Guidelines for B.Tech Semester V", "Examination", "All B.Tech Computer Science (Semester 5) students are hereby informed that the Pre-University Test (PUT) for the Odd Semester 2026-27 will commence from November 16, 2026. Students must maintain a minimum of 75% aggregate attendance to be eligible for hall ticket issuance. Any pending laboratory records and internal assessment sheets must be countersigned by respective subject faculty on or before November 10, 2026. Carrying smartwatches, mobile phones, or programmable calculators inside the examination block (Block A & Block C) is strictly prohibited.", 1, "Dr. S. K. Sharma", "2026-10-05", "2026-11-10"),
        (2, "MIET/CSE/2026/114", "Mandatory B.Tech 5th Semester Mini-Project Synopsis & Mid-Term Progress Review", "Academic", "The Department of Computer Science & Engineering will conduct the Mid-Term Mini-Project Evaluation for all Semester 5 batches on October 22, 2026 in the Darwin Block AI Lab (Lab-304). Each project group must bring a working prototype demonstration, database ER diagram, GitHub repository link, and a 10-page IEEE format synopsis report. Project guides Dr. S. K. Sharma and Dr. Neha Agarwal will evaluate database connectivity and real-time execution before approving final viva slots.", 1, "Dr. Neha Agarwal", "2026-10-06", "2026-10-22"),
        (3, "MIET/TNP/2026/089", "Pre-Placement Technical Bootcamp on Cloud Architecture & Generative AI", "Placement & Training", "The Training and Placement Cell, MIET Meerut, in collaboration with the Department of CSE, is organizing a 5-day Intensive Hands-On Bootcamp on Full-Stack Python, Relational Databases, and Enterprise AI Integration for 3rd-year (Semester 5) CS students. Attendance in the bootcamp carries 5 bonus internal marks in Industrial Training assessment. Interested students must complete portal registration by October 15, 2026.", 0, "Dr. S. K. Sharma", "2026-10-03", "2026-10-15"),
        (4, "MIET/ADMIN/2026/119", "AKTU Odd Semester Examination Form Verification & Scholarship Renewal Notice", "Administration", "All B.Tech Semester 5 students are advised to verify their elective subject codes (BCS501, BCS502, BCS503, BCS054, BCS055) on the AKTU ERP portal and submit the signed hardcopy of the examination verification slip at the CSE Departmental Office (Room A-202) by October 19, 2026. Students applying for UP State Merit Scholarship renewal must attach their 4th-semester attested mark sheet.", 1, "Dr. Neha Agarwal", "2026-10-07", "2026-10-19"),
        (5, "MIET/LIB/2026/064", "Extended Central Library & Digital Reference Hours During Sessional Exams", "Library", "To facilitate academic preparation for upcoming sessional tests and project submissions, the MIET Central Library and IEEE/Springer Digital Reference Section will remain open from 08:00 AM to 09:30 PM on all working days and Saturdays until November 30, 2026.", 0, "Dr. S. K. Sharma", "2026-10-01", "2026-11-30"),
    ]
    cur.executemany("INSERT INTO notices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", notices_seed)

    assignments_seed = [
        (1, "BCS501", "Database Management Systems", "Relational Schema Normalization (3NF/BCNF) & SQL Transaction Concurrency Control", "Design a complete normalized relational database schema for an enterprise university portal. Write SQL DDL/DML scripts demonstrating foreign key constraints, indexing, ACID transaction isolation levels, and deadlock prevention queries.", "2026-10-14", 20, "Dr. Neha Agarwal", "CS", 5, "Pending"),
        (2, "BCS502", "Compiler Design", "LL(1) Predictive Parser & Lexical Analyzer Implementation in Python/C", "Construct a lexical analyzer for arithmetic and conditional expressions, eliminate left recursion from the given context-free grammar, compute FIRST and FOLLOW sets, and generate the LL(1) parsing table.", "2026-10-18", 20, "Dr. S. K. Sharma", "CS", 5, "Pending"),
        (3, "BCS503", "Design and Analysis of Algorithms", "Dynamic Programming & Graph Shortest-Path Complexity Benchmark", "Implement Dijkstra, Bellman-Ford, and Floyd-Warshall algorithms on weighted directed graphs. Compare empirical execution times and asymptotic space-time complexities with a detailed analytical report.", "2026-10-21", 20, "Prof. Vikramaditya Verma", "CS", 5, "Pending"),
        (4, "BCS054", "Artificial Intelligence & Machine Learning", "Heuristic Search (A* Algorithm) & Contextual RAG Agent Architecture", "Implement A* search with admissible heuristics for pathfinding and write a technical case study on Grounded Retrieval-Augmented Generation using relational SQL context and Gemini LLM API.", "2026-10-25", 25, "Dr. S. K. Sharma", "CS", 5, "Pending"),
        (5, "BCS055", "Computer Networks", "TCP Congestion Control Simulation & Subnetting Topology Design", "Configure an enterprise multi-department VLAN and CIDR subnetting plan for 4 campus blocks. Analyze TCP Tahoe vs Reno congestion window traces using packet capture logs.", "2026-10-28", 15, "Prof. Ankit Bansal", "CS", 5, "Pending"),
    ]
    cur.executemany("INSERT INTO assignments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", assignments_seed)

    timetable_seed = [
        (1, "Monday", "BCS501", "Database Management Systems", "Dr. Neha Agarwal", "09:00", "10:00", "09:00 AM - 10:00 AM", "Room A-301", "Lecture", "CS", 5),
        (2, "Monday", "BCS502", "Compiler Design", "Dr. S. K. Sharma", "10:00", "11:00", "10:00 AM - 11:00 AM", "Room A-301", "Lecture", "CS", 5),
        (3, "Monday", "BCS503", "Design and Analysis of Algorithms", "Prof. Vikramaditya Verma", "11:15", "12:15", "11:15 AM - 12:15 PM", "Room A-302", "Lecture", "CS", 5),
        (4, "Monday", "BCS551", "DBMS Lab", "Dr. Neha Agarwal", "14:00", "16:00", "02:00 PM - 04:00 PM", "Lab C-102 (DBMS Lab)", "Lab", "CS", 5),
        (5, "Tuesday", "BCS054", "Artificial Intelligence & Machine Learning", "Dr. S. K. Sharma", "09:00", "10:00", "09:00 AM - 10:00 AM", "Room A-301", "Lecture", "CS", 5),
        (6, "Tuesday", "BCS055", "Computer Networks", "Prof. Ankit Bansal", "10:00", "11:00", "10:00 AM - 11:00 AM", "Room A-301", "Lecture", "CS", 5),
        (7, "Tuesday", "BCS501", "Database Management Systems", "Dr. Neha Agarwal", "11:15", "12:15", "11:15 AM - 12:15 PM", "Room A-301", "Lecture", "CS", 5),
        (8, "Tuesday", "BCS552", "Compiler Design Lab", "Dr. S. K. Sharma", "14:00", "16:00", "02:00 PM - 04:00 PM", "Lab C-204 (Systems Lab)", "Lab", "CS", 5),
        (9, "Wednesday", "BCS503", "Design and Analysis of Algorithms", "Prof. Vikramaditya Verma", "09:00", "10:00", "09:00 AM - 10:00 AM", "Room A-301", "Lecture", "CS", 5),
        (10, "Wednesday", "BCS502", "Compiler Design", "Dr. S. K. Sharma", "10:00", "11:00", "10:00 AM - 11:00 AM", "Room A-301", "Lecture", "CS", 5),
        (11, "Wednesday", "BCS054", "Artificial Intelligence & Machine Learning", "Dr. S. K. Sharma", "11:15", "12:15", "11:15 AM - 12:15 PM", "Room A-304", "Lecture", "CS", 5),
        (12, "Wednesday", "BCS553", "Algorithms & AI Lab", "Dr. S. K. Sharma", "14:00", "16:00", "02:00 PM - 04:00 PM", "Lab A-304 (Darwin AI Lab)", "Lab", "CS", 5),
        (13, "Thursday", "BCS055", "Computer Networks", "Prof. Ankit Bansal", "09:00", "10:00", "09:00 AM - 10:00 AM", "Room A-301", "Lecture", "CS", 5),
        (14, "Thursday", "BCS501", "Database Management Systems", "Dr. Neha Agarwal", "10:00", "11:00", "10:00 AM - 11:00 AM", "Room A-301", "Lecture", "CS", 5),
        (15, "Thursday", "BCS503", "Design and Analysis of Algorithms", "Prof. Vikramaditya Verma", "11:15", "12:15", "11:15 AM - 12:15 PM", "Room A-302", "Tutorial", "CS", 5),
        (16, "Thursday", "BCS054", "Artificial Intelligence & Machine Learning", "Dr. S. K. Sharma", "14:00", "15:00", "02:00 PM - 03:00 PM", "Room A-301", "Lecture", "CS", 5),
        (17, "Friday", "BCS502", "Compiler Design", "Dr. S. K. Sharma", "09:00", "10:00", "09:00 AM - 10:00 AM", "Room A-301", "Lecture", "CS", 5),
        (18, "Friday", "BCS055", "Computer Networks", "Prof. Ankit Bansal", "10:00", "11:00", "10:00 AM - 11:00 AM", "Room A-301", "Lecture", "CS", 5),
        (19, "Friday", "BCS501", "Database Management Systems", "Dr. Neha Agarwal", "11:15", "12:15", "11:15 AM - 12:15 PM", "Room A-301", "Tutorial", "CS", 5),
        (20, "Friday", "BCS554", "Mini Project & Seminar", "Dr. Neha Agarwal", "14:00", "16:00", "02:00 PM - 04:00 PM", "Lab A-304 (Darwin AI Lab)", "Lab", "CS", 5),
        (21, "Saturday", "BCS054", "Artificial Intelligence & Machine Learning", "Dr. S. K. Sharma", "09:30", "10:30", "09:30 AM - 10:30 AM", "Room A-301", "Tutorial", "CS", 5),
        (22, "Saturday", "BCS055", "Computer Networks", "Prof. Ankit Bansal", "10:30", "11:30", "10:30 AM - 11:30 AM", "Room A-301", "Tutorial", "CS", 5),
    ]
    cur.executemany("INSERT INTO timetable VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", timetable_seed)

    attendance_seed = [
        (1, "BCS501", "Database Management Systems", "Dr. Neha Agarwal", 38, 42),
        (1, "BCS502", "Compiler Design", "Dr. S. K. Sharma", 35, 40),
        (1, "BCS503", "Design and Analysis of Algorithms", "Prof. Vikramaditya Verma", 34, 38),
        (1, "BCS054", "Artificial Intelligence & Machine Learning", "Dr. S. K. Sharma", 33, 36),
        (1, "BCS055", "Computer Networks", "Prof. Ankit Bansal", 25, 35),
        (1, "BCS551", "DBMS & AI Integrated Lab", "Dr. Neha Agarwal", 18, 20),
        (2, "BCS501", "Database Management Systems", "Dr. Neha Agarwal", 35, 42),
        (2, "BCS502", "Compiler Design", "Dr. S. K. Sharma", 27, 40),
        (2, "BCS503", "Design and Analysis of Algorithms", "Prof. Vikramaditya Verma", 27, 38),
        (2, "BCS054", "Artificial Intelligence & Machine Learning", "Dr. S. K. Sharma", 31, 36),
        (2, "BCS055", "Computer Networks", "Prof. Ankit Bansal", 30, 35),
        (2, "BCS551", "DBMS & AI Integrated Lab", "Dr. Neha Agarwal", 17, 20),
        (3, "BCS501", "Database Management Systems", "Dr. Neha Agarwal", 40, 42),
        (3, "BCS502", "Compiler Design", "Dr. S. K. Sharma", 37, 40),
        (3, "BCS503", "Design and Analysis of Algorithms", "Prof. Vikramaditya Verma", 36, 38),
        (3, "BCS054", "Artificial Intelligence & Machine Learning", "Dr. S. K. Sharma", 35, 36),
        (3, "BCS055", "Computer Networks", "Prof. Ankit Bansal", 31, 35),
        (3, "BCS551", "DBMS & AI Integrated Lab", "Dr. Neha Agarwal", 19, 20),
        (4, "BCS501", "Database Management Systems", "Dr. Neha Agarwal", 28, 42),
        (4, "BCS502", "Compiler Design", "Dr. S. K. Sharma", 31, 40),
        (4, "BCS503", "Design and Analysis of Algorithms", "Prof. Vikramaditya Verma", 30, 38),
        (4, "BCS054", "Artificial Intelligence & Machine Learning", "Dr. S. K. Sharma", 25, 36),
        (4, "BCS055", "Computer Networks", "Prof. Ankit Bansal", 29, 35),
        (4, "BCS551", "DBMS & AI Integrated Lab", "Dr. Neha Agarwal", 18, 20),
    ]
    cur.executemany(
        "INSERT INTO attendance (student_id, subject_code, subject, faculty, attended_classes, total_classes) VALUES (?, ?, ?, ?, ?, ?)",
        attendance_seed,
    )

    exams_seed = [
        (1, "Pre-University Test (PUT)", "BCS501", "Database Management Systems", "2026-11-16", "09:30 AM - 12:30 PM", "Block A - Hall 101", 100, "CS", 5, "Units 1 to 5: ER Modeling, SQL, Normalization (BCNF/4NF), Transaction Processing & Concurrency Control"),
        (2, "Pre-University Test (PUT)", "BCS502", "Compiler Design", "2026-11-18", "09:30 AM - 12:30 PM", "Block A - Hall 101", 100, "CS", 5, "Units 1 to 5: Lexical Analysis, LL/LR Parsing, Syntax Directed Translation, Three-Address Code & Optimization"),
        (3, "Pre-University Test (PUT)", "BCS503", "Design and Analysis of Algorithms", "2026-11-20", "09:30 AM - 12:30 PM", "Block A - Hall 102", 100, "CS", 5, "Units 1 to 5: Divide & Conquer, Greedy, Dynamic Programming, Backtracking, NP-Completeness"),
        (4, "Pre-University Test (PUT)", "BCS054", "Artificial Intelligence & Machine Learning", "2026-11-23", "09:30 AM - 12:30 PM", "Block C - Hall 201", 100, "CS", 5, "Units 1 to 5: Informed Search, First-Order Logic, Bayesian Networks, Supervised Learning & Neural Nets"),
        (5, "Pre-University Test (PUT)", "BCS055", "Computer Networks", "2026-11-25", "09:30 AM - 12:30 PM", "Block C - Hall 201", 100, "CS", 5, "Units 1 to 5: OSI/TCP-IP Stack, Data Link Framing, IPv4/IPv6 Routing, TCP/UDP & Network Security"),
    ]
    cur.executemany("INSERT INTO exams VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", exams_seed)

    results_seed = [
        (1, "BCS501", "Database Management Systems", 4, 28, 30, 62, 70, "A+", 10, 5),
        (1, "BCS502", "Compiler Design", 4, 26, 30, 58, 70, "A", 9, 5),
        (1, "BCS503", "Design and Analysis of Algorithms", 4, 27, 30, 59, 70, "A", 9, 5),
        (1, "BCS054", "Artificial Intelligence & Machine Learning", 3, 28, 30, 63, 70, "A+", 10, 5),
        (1, "BCS055", "Computer Networks", 3, 23, 30, 51, 70, "B+", 8, 5),
        (1, "BCS551", "DBMS & AI Integrated Lab", 2, 29, 30, 64, 70, "A+", 10, 5),
        (2, "BCS501", "Database Management Systems", 4, 26, 30, 57, 70, "A", 9, 5),
        (2, "BCS502", "Compiler Design", 4, 22, 30, 49, 70, "B+", 8, 5),
        (2, "BCS503", "Design and Analysis of Algorithms", 4, 23, 30, 52, 70, "B+", 8, 5),
        (2, "BCS054", "Artificial Intelligence & Machine Learning", 3, 27, 30, 58, 70, "A", 9, 5),
        (2, "BCS055", "Computer Networks", 3, 26, 30, 56, 70, "A", 9, 5),
        (2, "BCS551", "DBMS & AI Integrated Lab", 2, 27, 30, 61, 70, "A", 9, 5),
        (3, "BCS501", "Database Management Systems", 4, 29, 30, 65, 70, "A+", 10, 5),
        (3, "BCS502", "Compiler Design", 4, 28, 30, 61, 70, "A", 9, 5),
        (3, "BCS503", "Design and Analysis of Algorithms", 4, 29, 30, 63, 70, "A+", 10, 5),
        (3, "BCS054", "Artificial Intelligence & Machine Learning", 3, 29, 30, 66, 70, "A+", 10, 5),
        (3, "BCS055", "Computer Networks", 3, 26, 30, 57, 70, "A", 9, 5),
        (3, "BCS551", "DBMS & AI Integrated Lab", 2, 30, 30, 66, 70, "A+", 10, 5),
        (4, "BCS501", "Database Management Systems", 4, 22, 30, 48, 70, "B", 7, 5),
        (4, "BCS502", "Compiler Design", 4, 24, 30, 54, 70, "B+", 8, 5),
        (4, "BCS503", "Design and Analysis of Algorithms", 4, 25, 30, 55, 70, "A", 9, 5),
        (4, "BCS054", "Artificial Intelligence & Machine Learning", 3, 21, 30, 49, 70, "B", 7, 5),
        (4, "BCS055", "Computer Networks", 3, 26, 30, 58, 70, "A", 9, 5),
        (4, "BCS551", "DBMS & AI Integrated Lab", 2, 27, 30, 60, 70, "A", 9, 5),
    ]
    cur.executemany(
        "INSERT INTO results (student_id, subject_code, subject, credits, internal_marks, max_internal, external_marks, max_external, grade, grade_points, semester) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        results_seed,
    )

    events_seed = [
        (1, "MIET HackFest 2026 – 24-Hour National AI & Sustainability Hackathon", "Hackathon", "2026-10-24", "09:00 AM Onwards", "MIET Main Auditorium & Darwin Block Labs", "Department of CSE & MIET Incubation Forum", "Flagship 24-hour inter-college hackathon focusing on Generative AI, Smart Campus Automation, FinTech, and Healthcare. Cash prizes worth Rs. 75,000 and direct internship interviews for top 5 teams.", "Open"),
        (2, "Expert Colloquium: Large Language Models & Enterprise RAG Systems", "Technical Seminar", "2026-10-17", "11:00 AM - 01:30 PM", "Seminar Hall-2, Block A", "CSI Student Chapter, MIET", "Distinguished lecture and live coding demonstration on grounding Google Gemini models with relational SQL databases for zero-hallucination academic and enterprise assistants.", "Open"),
        (3, "Kolahal 2026 – Annual Cultural & Literary Conclave Auditions", "Cultural", "2026-11-04", "02:30 PM - 05:00 PM", "Open Air Theatre (OAT), MIET Campus", "MIET Cultural Committee", "Preliminary selections for technical debate, battle of bands, street theatre, and coding quiz ahead of the annual Kolahal festival.", "Registration Closing Soon"),
        (4, "AKTU Zonal Inter-Engineering Sports Meet – Trials & Selection", "Sports", "2026-10-30", "03:30 PM - 05:30 PM", "MIET Main Sports Ground", "MIET Sports Council", "Selection trials for Basketball, Badminton, Table Tennis, and Chess teams representing Meerut Institute of Engineering and Technology at the AKTU Zonal Championship.", "Open"),
    ]
    cur.executemany("INSERT INTO events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", events_seed)

    conn.commit()
    conn.close()


def call_gemini_rest_api(prompt: str, system_instruction: str, json_mode: bool = False):
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key or api_key in ("YOUR_GEMINI_API_KEY", "MY_GEMINI_API_KEY"):
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={api_key}"
    gen_config = {"temperature": 0.25}
    if json_mode:
        gen_config["responseMimeType"] = "application/json"

    payload = {
        "system_instruction": {"parts": [{"text": system_instruction}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": gen_config,
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "User-Agent": "aistudio-build",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            candidates = body.get("candidates") or []
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts and "text" in parts[0]:
                    return parts[0]["text"]
    except Exception:
        return None
    return None


def fetch_student_bundle_sqlite(conn, student_id: int) -> dict:
    cur = conn.cursor()
    cur.execute("SELECT * FROM students WHERE id = ?", (student_id,))
    st_row = cur.fetchone()
    if not st_row:
        return {}
    student = dict(st_row)

    cur.execute(
        """
        SELECT id, student_id, subject_code, subject, faculty, attended_classes, total_classes,
               ROUND(CASE WHEN total_classes > 0 THEN (attended_classes * 100.0) / total_classes ELSE 0 END, 2) AS percentage
        FROM attendance
        WHERE student_id = ?
        ORDER BY subject_code ASC
        """,
        (student_id,),
    )
    attendance = [dict(r) for r in cur.fetchall()]
    total_att = sum(r["attended_classes"] for r in attendance)
    total_cond = sum(r["total_classes"] for r in attendance)
    overall_att = round((total_att * 100.0 / total_cond), 2) if total_cond > 0 else 0.0
    low_warnings = [r for r in attendance if r["percentage"] < 75.0]

    cur.execute(
        """
        SELECT id, student_id, subject_code, subject, credits, internal_marks, max_internal,
               external_marks, max_external, (internal_marks + external_marks) AS total_marks,
               grade, grade_points, semester
        FROM results
        WHERE student_id = ?
        ORDER BY subject_code ASC
        """,
        (student_id,),
    )
    results = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM timetable ORDER BY id ASC")
    timetable = [dict(r) for r in cur.fetchall()]
    current_day = datetime.now().strftime("%A")
    if current_day == "Sunday":
        current_day = "Monday"
    today_tt = [t for t in timetable if t["day_of_week"] == current_day]

    cur.execute("SELECT * FROM assignments ORDER BY deadline ASC")
    assignments = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM exams ORDER BY exam_date ASC")
    exams = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM notices ORDER BY is_important DESC, posted_date DESC, id DESC")
    notices = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM events ORDER BY event_date ASC")
    events = [dict(r) for r in cur.fetchall()]

    return {
        "student": student,
        "overall_attendance": overall_att,
        "total_attended": total_att,
        "total_conducted": total_cond,
        "low_attendance_warnings": low_warnings,
        "attendance": attendance,
        "results": results,
        "current_day": current_day,
        "today_timetable": today_tt,
        "timetable": timetable,
        "assignments": assignments,
        "exams": exams,
        "notices": notices,
        "events": events,
    }


def generate_ai_chat_answer(message: str, ctx: dict) -> str:
    sys_inst = (
        "You are AI CampusMate, the Intelligent College Assistant for MIET (Meerut Institute of Engineering and Technology). "
        "Answer the student's question accurately using ONLY the live relational database records provided below. "
        "Highlight any subject with attendance below 75%. Use clean bullet points and bold formatting."
    )
    prompt = f"Database Records:\n{json.dumps(ctx, indent=2)}\n\nQuestion: {message}"
    ai_text = call_gemini_rest_api(prompt, sys_inst, json_mode=False)
    if ai_text:
        return ai_text

    from services.gemini_service import _fallback_campusmate_answer
    return _fallback_campusmate_answer(message, ctx)


def generate_ai_notice_summary(notice: dict) -> dict:
    sys_inst = (
        "Summarize the official MIET college notice into JSON with keys: "
        "summary (string), important_points (array of strings), deadlines (array of strings), "
        "important_dates (array of strings), action_items (array of strings)."
    )
    prompt = json.dumps(notice, indent=2)
    ai_json = call_gemini_rest_api(prompt, sys_inst, json_mode=True)
    if ai_json:
        try:
            return json.loads(ai_json)
        except Exception:
            pass
    from services.gemini_service import _fallback_notice_summary
    return _fallback_notice_summary(notice)


class CampusMateRequestHandler(SimpleHTTPRequestHandler):
    def get_session(self):
        cookie_header = self.headers.get("Cookie", "")
        cookie = SimpleCookie()
        cookie.load(cookie_header)
        if "campusmate_sid" in cookie:
            sid = cookie["campusmate_sid"].value
            return SESSIONS.get(sid)
        return None

    def send_json(self, payload: dict, status: int = 200, set_cookie_sid: str = None):
        raw = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        if set_cookie_sid is not None:
            self.send_header("Set-Cookie", f"campusmate_sid={set_cookie_sid}; Path=/; HttpOnly; SameSite=Lax")
        self.end_headers()
        self.wfile.write(raw)

    def send_html_file(self, filename: str):
        filepath = os.path.join(BASE_DIR, "templates", filename)
        with open(filepath, "rb") as f:
            content = f.read()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def redirect_to(self, location: str):
        self.send_response(302)
        self.send_header("Location", location)
        self.end_headers()

    def read_json_body(self) -> dict:
        length = int(self.headers.get("Content-Length", 0))
        if length <= 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        try:
            return json.loads(raw)
        except Exception:
            return {}

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        sess = self.get_session()

        if path == "/":
            if sess:
                return self.redirect_to("/admin/dashboard" if sess.get("role") == "admin" else "/student/dashboard")
            return self.redirect_to("/login")

        if path == "/login":
            if sess:
                return self.redirect_to("/admin/dashboard" if sess.get("role") == "admin" else "/student/dashboard")
            return self.send_html_file("login.html")

        if path == "/student/dashboard":
            if not sess:
                return self.redirect_to("/login")
            if sess.get("role") != "student":
                return self.redirect_to("/admin/dashboard")
            return self.send_html_file("student_dashboard.html")

        if path == "/admin/dashboard":
            if not sess:
                return self.redirect_to("/login")
            if sess.get("role") != "admin":
                return self.redirect_to("/student/dashboard")
            return self.send_html_file("admin_dashboard.html")

        if path == "/api/auth/me":
            if not sess:
                return self.send_json({"authenticated": False}, 401)
            return self.send_json({"authenticated": True, "user": sess})

        if path == "/api/student/dashboard":
            if not sess or sess.get("role") != "student":
                return self.send_json({"error": "Student authentication required."}, 401)
            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            try:
                bundle = fetch_student_bundle_sqlite(conn, int(sess["student_id"]))
                return self.send_json(bundle)
            finally:
                conn.close()

        if path == "/api/admin/overview":
            if not sess or sess.get("role") != "admin":
                return self.send_json({"error": "Administrator authentication required."}, 403)
            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            try:
                cur.execute("SELECT * FROM students ORDER BY id ASC")
                students = [dict(r) for r in cur.fetchall()]

                cur.execute(
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
                attendance = [dict(r) for r in cur.fetchall()]

                for st in students:
                    st_att = [a for a in attendance if a["student_id"] == st["id"]]
                    att_s = sum(a["attended_classes"] for a in st_att)
                    tot_s = sum(a["total_classes"] for a in st_att)
                    st["overall_attendance"] = round((att_s * 100.0 / tot_s), 2) if tot_s > 0 else 0.0

                cur.execute(
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
                results = [dict(r) for r in cur.fetchall()]

                cur.execute("SELECT * FROM notices ORDER BY is_important DESC, posted_date DESC, id DESC")
                notices = [dict(r) for r in cur.fetchall()]

                cur.execute("SELECT * FROM assignments ORDER BY deadline ASC, id DESC")
                assignments = [dict(r) for r in cur.fetchall()]

                cur.execute("SELECT * FROM timetable ORDER BY id ASC")
                timetable = [dict(r) for r in cur.fetchall()]

                cur.execute("SELECT * FROM exams ORDER BY exam_date ASC")
                exams = [dict(r) for r in cur.fetchall()]

                cur.execute("SELECT * FROM events ORDER BY event_date ASC, id DESC")
                events = [dict(r) for r in cur.fetchall()]

                return self.send_json(
                    {
                        "admin": {
                            "name": sess.get("name"),
                            "email": sess.get("email"),
                            "designation": sess.get("designation"),
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
            finally:
                conn.close()

        if path.startswith("/static/"):
            return super().do_GET()

        return self.redirect_to("/login")

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        data = self.read_json_body()
        sess = self.get_session()

        if path == "/api/auth/login":
            email = (data.get("email") or "").strip().lower()
            password = data.get("password") or ""
            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            try:
                cur.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email,))
                user = cur.fetchone()
                if not user or password != "miet123":
                    return self.send_json({"error": "Invalid MIET institutional email or password."}, 401)

                sid = f"sid_{user['id']}_{int(datetime.now().timestamp() * 1000)}"
                session_obj = {
                    "user_id": user["id"],
                    "name": user["name"],
                    "email": user["email"],
                    "role": user["role"],
                    "designation": user["designation"],
                }
                if user["role"] == "student":
                    cur.execute("SELECT id, roll_no FROM students WHERE user_id = ?", (user["id"],))
                    st = cur.fetchone()
                    if st:
                        session_obj["student_id"] = st["id"]
                        session_obj["roll_no"] = st["roll_no"]

                SESSIONS[sid] = session_obj
                redirect_url = "/admin/dashboard" if user["role"] == "admin" else "/student/dashboard"
                return self.send_json({"success": True, "user": session_obj, "redirect": redirect_url}, 200, set_cookie_sid=sid)
            finally:
                conn.close()

        if path == "/api/auth/logout":
            return self.send_json({"success": True, "redirect": "/login"}, 200, set_cookie_sid="deleted")

        if path == "/api/ai/chat":
            if not sess:
                return self.send_json({"error": "Authentication required."}, 401)
            msg = (data.get("message") or "").strip()
            student_id = int(sess.get("student_id") or data.get("student_id") or 1)
            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            try:
                bundle = fetch_student_bundle_sqlite(conn, student_id)
                reply = generate_ai_chat_answer(msg, bundle)
                return self.send_json({"reply": reply})
            finally:
                conn.close()

        if path == "/api/ai/summarize-notice":
            if not sess:
                return self.send_json({"error": "Authentication required."}, 401)
            notice_id = data.get("notice_id")
            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            try:
                cur.execute("SELECT * FROM notices WHERE id = ?", (notice_id,))
                row = cur.fetchone()
                if not row:
                    return self.send_json({"error": "Notice not found."}, 404)
                summary = generate_ai_notice_summary(dict(row))
                return self.send_json({"notice_id": notice_id, "summary": summary})
            finally:
                conn.close()

        if not sess or sess.get("role") != "admin":
            return self.send_json({"error": "Administrator privileges required."}, 403)

        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        try:
            if path == "/api/admin/notices":
                cur.execute(
                    "INSERT INTO notices (ref_no, title, category, content, is_important, posted_by, posted_date, deadline_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (
                        data.get("ref_no", "MIET/ACAD/2026"),
                        data.get("title", ""),
                        data.get("category", "Academic"),
                        data.get("content", ""),
                        1 if data.get("is_important") else 0,
                        sess.get("name", "Dr. S. K. Sharma"),
                        datetime.now().strftime("%Y-%m-%d"),
                        data.get("deadline_date"),
                    ),
                )
                conn.commit()
                return self.send_json({"success": True, "id": cur.lastrowid})

            if path == "/api/admin/assignments":
                cur.execute(
                    "INSERT INTO assignments (subject_code, subject, title, description, deadline, max_marks, faculty, branch, semester, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'CS', 5, 'Pending')",
                    (
                        data.get("subject_code", "BCS501"),
                        data.get("subject", ""),
                        data.get("title", ""),
                        data.get("description", ""),
                        data.get("deadline", datetime.now().strftime("%Y-%m-%d")),
                        int(data.get("max_marks", 20)),
                        sess.get("name", "Dr. S. K. Sharma"),
                    ),
                )
                conn.commit()
                return self.send_json({"success": True, "id": cur.lastrowid})

            if path == "/api/admin/timetable":
                cur.execute(
                    "INSERT INTO timetable (day_of_week, subject_code, subject, faculty, start_time, end_time, time_slot, classroom, lecture_type, branch, semester) VALUES (?, ?, ?, ?, '09:00', '10:00', ?, ?, ?, 'CS', 5)",
                    (
                        data.get("day_of_week", "Monday"),
                        data.get("subject_code", "BCS501"),
                        data.get("subject", ""),
                        data.get("faculty", sess.get("name", "Dr. S. K. Sharma")),
                        data.get("time_slot", "09:00 AM - 10:00 AM"),
                        data.get("classroom", "Room A-301"),
                        data.get("lecture_type", "Lecture"),
                    ),
                )
                conn.commit()
                return self.send_json({"success": True, "id": cur.lastrowid})

            if path == "/api/admin/events":
                cur.execute(
                    "INSERT INTO events (title, category, event_date, event_time, venue, organizer, description, registration_status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Open')",
                    (
                        data.get("title", ""),
                        data.get("category", "Technical"),
                        data.get("event_date", datetime.now().strftime("%Y-%m-%d")),
                        data.get("event_time", "10:00 AM"),
                        data.get("venue", "MIET Auditorium"),
                        data.get("organizer", "Department of CSE"),
                        data.get("description", ""),
                    ),
                )
                conn.commit()
                return self.send_json({"success": True, "id": cur.lastrowid})
        finally:
            conn.close()

        return self.send_json({"error": "Not found"}, 404)

    def do_PUT(self):
        parsed = urlparse(self.path)
        path = parsed.path
        data = self.read_json_body()
        sess = self.get_session()
        if not sess or sess.get("role") != "admin":
            return self.send_json({"error": "Administrator privileges required."}, 403)

        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        try:
            if path == "/api/admin/attendance":
                student_id = int(data.get("student_id", 0))
                subject_code = data.get("subject_code", "")
                action = data.get("action")
                cur.execute(
                    "SELECT id, attended_classes, total_classes FROM attendance WHERE student_id = ? AND subject_code = ?",
                    (student_id, subject_code),
                )
                rec = cur.fetchone()
                if not rec:
                    return self.send_json({"error": "Attendance record not found"}, 404)
                att = int(rec["attended_classes"])
                tot = int(rec["total_classes"])
                if action == "increment_present":
                    att += 1
                    tot += 1
                elif action == "increment_absent":
                    tot += 1
                elif action == "decrement_present":
                    att = max(0, att - 1)
                else:
                    att = max(0, int(data.get("attended_classes", att)))
                    tot = max(att, int(data.get("total_classes", tot)))
                cur.execute("UPDATE attendance SET attended_classes = ?, total_classes = ? WHERE id = ?", (att, tot, rec["id"]))
                conn.commit()
                return self.send_json({"success": True})

            if path == "/api/admin/results":
                student_id = int(data.get("student_id", 0))
                subject_code = data.get("subject_code", "")
                internal_m = max(0, min(30, int(data.get("internal_marks", 0))))
                external_m = max(0, min(70, int(data.get("external_marks", 0))))
                tot = internal_m + external_m
                if tot >= 90:
                    grade, pts = "A+", 10
                elif tot >= 80:
                    grade, pts = "A", 9
                elif tot >= 70:
                    grade, pts = "B+", 8
                elif tot >= 60:
                    grade, pts = "B", 7
                else:
                    grade, pts = "C", 6

                cur.execute(
                    "UPDATE results SET internal_marks = ?, external_marks = ?, grade = ?, grade_points = ? WHERE student_id = ? AND subject_code = ?",
                    (internal_m, external_m, grade, pts, student_id, subject_code),
                )
                cur.execute("SELECT credits, grade_points FROM results WHERE student_id = ?", (student_id,))
                rows = cur.fetchall()
                tot_cred = sum(r["credits"] for r in rows) or 1
                new_sgpa = round(sum(r["credits"] * r["grade_points"] for r in rows) / tot_cred, 2)
                cur.execute("SELECT cgpa FROM students WHERE id = ?", (student_id,))
                st_r = cur.fetchone()
                old_cgpa = float(st_r["cgpa"]) if st_r else new_sgpa
                new_cgpa = round((old_cgpa * 4 + new_sgpa) / 5, 2)
                cur.execute("UPDATE students SET sgpa = ?, cgpa = ? WHERE id = ?", (new_sgpa, new_cgpa, student_id))
                conn.commit()
                return self.send_json({"success": True, "sgpa": new_sgpa, "cgpa": new_cgpa})

            if path.startswith("/api/admin/notices/"):
                nid = int(path.split("/")[-1])
                cur.execute(
                    "UPDATE notices SET ref_no = ?, title = ?, category = ?, content = ?, is_important = ?, deadline_date = ? WHERE id = ?",
                    (
                        data.get("ref_no"),
                        data.get("title"),
                        data.get("category"),
                        data.get("content"),
                        1 if data.get("is_important") else 0,
                        data.get("deadline_date"),
                        nid,
                    ),
                )
                conn.commit()
                return self.send_json({"success": True})

            if path.startswith("/api/admin/assignments/"):
                aid = int(path.split("/")[-1])
                cur.execute(
                    "UPDATE assignments SET subject_code = ?, subject = ?, title = ?, description = ?, deadline = ?, max_marks = ? WHERE id = ?",
                    (
                        data.get("subject_code"),
                        data.get("subject"),
                        data.get("title"),
                        data.get("description"),
                        data.get("deadline"),
                        int(data.get("max_marks", 20)),
                        aid,
                    ),
                )
                conn.commit()
                return self.send_json({"success": True})

            if path.startswith("/api/admin/timetable/"):
                tid = int(path.split("/")[-1])
                cur.execute(
                    "UPDATE timetable SET day_of_week = ?, lecture_type = ?, subject_code = ?, subject = ?, faculty = ?, time_slot = ?, classroom = ? WHERE id = ?",
                    (
                        data.get("day_of_week"),
                        data.get("lecture_type"),
                        data.get("subject_code"),
                        data.get("subject"),
                        data.get("faculty"),
                        data.get("time_slot"),
                        data.get("classroom"),
                        tid,
                    ),
                )
                conn.commit()
                return self.send_json({"success": True})

            if path.startswith("/api/admin/events/"):
                eid = int(path.split("/")[-1])
                cur.execute(
                    "UPDATE events SET title = ?, category = ?, event_date = ?, event_time = ?, venue = ?, organizer = ?, description = ? WHERE id = ?",
                    (
                        data.get("title"),
                        data.get("category"),
                        data.get("event_date"),
                        data.get("event_time"),
                        data.get("venue"),
                        data.get("organizer"),
                        data.get("description"),
                        eid,
                    ),
                )
                conn.commit()
                return self.send_json({"success": True})
        finally:
            conn.close()

        return self.send_json({"error": "Not found"}, 404)

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path
        sess = self.get_session()
        if not sess or sess.get("role") != "admin":
            return self.send_json({"error": "Administrator privileges required."}, 403)

        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        try:
            for prefix, table in [
                ("/api/admin/notices/", "notices"),
                ("/api/admin/assignments/", "assignments"),
                ("/api/admin/timetable/", "timetable"),
                ("/api/admin/events/", "events"),
            ]:
                if path.startswith(prefix):
                    item_id = int(path.split("/")[-1])
                    cur.execute(f"DELETE FROM {table} WHERE id = ?", (item_id,))
                    conn.commit()
                    return self.send_json({"success": True})
        finally:
            conn.close()

        return self.send_json({"error": "Not found"}, 404)


if __name__ == "__main__":
    init_live_database()
    port = int(os.environ.get("PORT", 3000))
    server = HTTPServer(("0.0.0.0", port), CampusMateRequestHandler)
    print(f"AI CampusMate (MIET) Python Server running on http://0.0.0.0:{port}")
    server.serve_forever()
