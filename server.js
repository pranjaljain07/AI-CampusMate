import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const GEMINI_MODEL = 'gemini-3.8-flash';

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Database file path (JSON persistent storage formatted identical to MySQL tables)
const DB_PATH = path.join(__dirname, 'database', 'ai_database.json');

// Initial seed data representing MySQL ai_database records
const initialDatabase = {
  users: [
    { id: 1, name: "Gauri", email: "gauri@miet.ac.in", password_hash: "pbkdf2:sha256:600000$MIETCampus2026$8e2b50d89747e9c7a454d60c7b20250a0a36f0b04e85c6b08a0b24a782b78a11", role: "student", designation: "B.Tech CS Semester 5 Student", department: "Computer Science & Engineering" },
    { id: 2, name: "Harshi", email: "harshi@miet.ac.in", password_hash: "pbkdf2:sha256:600000$MIETCampus2026$8e2b50d89747e9c7a454d60c7b20250a0a36f0b04e85c6b08a0b24a782b78a11", role: "student", designation: "B.Tech CS Semester 5 Student", department: "Computer Science & Engineering" },
    { id: 3, name: "Pranjal", email: "pranjal@miet.ac.in", password_hash: "pbkdf2:sha256:600000$MIETCampus2026$8e2b50d89747e9c7a454d60c7b20250a0a36f0b04e85c6b08a0b24a782b78a11", role: "student", designation: "B.Tech CS Semester 5 Student", department: "Computer Science & Engineering" },
    { id: 4, name: "Manvi", email: "manvi@miet.ac.in", password_hash: "pbkdf2:sha256:600000$MIETCampus2026$8e2b50d89747e9c7a454d60c7b20250a0a36f0b04e85c6b08a0b24a782b78a11", role: "student", designation: "B.Tech CS Semester 5 Student", department: "Computer Science & Engineering" },
    { id: 5, name: "Dr. S. K. Sharma", email: "sk.sharma@miet.ac.in", password_hash: "pbkdf2:sha256:600000$MIETCampus2026$8e2b50d89747e9c7a454d60c7b20250a0a36f0b04e85c6b08a0b24a782b78a11", role: "admin", designation: "Professor & Head of Department (CSE)", department: "Computer Science & Engineering" },
    { id: 6, name: "Dr. Neha Agarwal", email: "neha.agarwal@miet.ac.in", password_hash: "pbkdf2:sha256:600000$MIETCampus2026$8e2b50d89747e9c7a454d60c7b20250a0a36f0b04e85c6b08a0b24a782b78a11", role: "admin", designation: "Associate Professor & Academic Coordinator", department: "Computer Science & Engineering" }
  ],
  students: [
    { id: 1, user_id: 1, roll_no: "2200680100041", enrollment_no: "MIET/CS/22/041", name: "Gauri", email: "gauri@miet.ac.in", branch: "CS", semester: 5, section: "CS-5A", batch: "2022-2026", phone: "+91-9837014101", advisor: "Dr. S. K. Sharma", sgpa: 8.92, cgpa: 8.76 },
    { id: 2, user_id: 2, roll_no: "2200680100058", enrollment_no: "MIET/CS/22/058", name: "Harshi", email: "harshi@miet.ac.in", branch: "CS", semester: 5, section: "CS-5A", batch: "2022-2026", phone: "+91-9837014102", advisor: "Dr. Neha Agarwal", sgpa: 8.35, cgpa: 8.18 },
    { id: 3, user_id: 3, roll_no: "2200680100094", enrollment_no: "MIET/CS/22/094", name: "Pranjal", email: "pranjal@miet.ac.in", branch: "CS", semester: 5, section: "CS-5A", batch: "2022-2026", phone: "+91-9837014103", advisor: "Dr. S. K. Sharma", sgpa: 9.24, cgpa: 9.08 },
    { id: 4, user_id: 4, roll_no: "2200680100072", enrollment_no: "MIET/CS/22/072", name: "Manvi", email: "manvi@miet.ac.in", branch: "CS", semester: 5, section: "CS-5A", batch: "2022-2026", phone: "+91-9837014104", advisor: "Dr. Neha Agarwal", sgpa: 7.88, cgpa: 7.95 }
  ],
  notices: [
    { id: 1, ref_no: "MIET/ACAD/2026/108", title: "Pre-University Test (PUT) Schedule & Examination Guidelines for B.Tech Semester V", category: "Examination", content: "All B.Tech Computer Science (Semester 5) students are hereby informed that the Pre-University Test (PUT) for the Odd Semester 2026-27 will commence from November 16, 2026. Students must maintain a minimum of 75% aggregate attendance to be eligible for hall ticket issuance. Any pending laboratory records and internal assessment sheets must be countersigned by respective subject faculty on or before November 10, 2026. Carrying smartwatches, mobile phones, or programmable calculators inside the examination block (Block A & Block C) is strictly prohibited.", is_important: 1, posted_by: "Dr. S. K. Sharma", posted_date: "2026-10-05", deadline_date: "2026-11-10" },
    { id: 2, ref_no: "MIET/CSE/2026/114", title: "Mandatory B.Tech 5th Semester Mini-Project Synopsis & Mid-Term Progress Review", category: "Academic", content: "The Department of Computer Science & Engineering will conduct the Mid-Term Mini-Project Evaluation for all Semester 5 batches on October 22, 2026 in the Darwin Block AI Lab (Lab-304). Each project group must bring a working prototype demonstration, database ER diagram, GitHub repository link, and a 10-page IEEE format synopsis report. Project guides Dr. S. K. Sharma and Dr. Neha Agarwal will evaluate database connectivity and real-time execution before approving final viva slots.", is_important: 1, posted_by: "Dr. Neha Agarwal", posted_date: "2026-10-06", deadline_date: "2026-10-22" },
    { id: 3, ref_no: "MIET/TNP/2026/089", title: "Pre-Placement Technical Bootcamp on Cloud Architecture & Generative AI", category: "Placement & Training", content: "The Training and Placement Cell, MIET Meerut, in collaboration with the Department of CSE, is organizing a 5-day Intensive Hands-On Bootcamp on Full-Stack Python, Relational Databases, and Enterprise AI Integration for 3rd-year (Semester 5) CS students. Attendance in the bootcamp carries 5 bonus internal marks in Industrial Training assessment. Interested students must complete portal registration by October 15, 2026.", is_important: 0, posted_by: "Dr. S. K. Sharma", posted_date: "2026-10-03", deadline_date: "2026-10-15" },
    { id: 4, ref_no: "MIET/ADMIN/2026/119", title: "AKTU Odd Semester Examination Form Verification & Scholarship Renewal Notice", category: "Administration", content: "All B.Tech Semester 5 students are advised to verify their elective subject codes (BCS501, BCS502, BCS503, BCS054, BCS055) on the AKTU ERP portal and submit the signed hardcopy of the examination verification slip at the CSE Departmental Office (Room A-202) by October 19, 2026. Students applying for UP State Merit Scholarship renewal must attach their 4th-semester attested mark sheet.", is_important: 1, posted_by: "Dr. Neha Agarwal", posted_date: "2026-10-07", deadline_date: "2026-10-19" },
    { id: 5, ref_no: "MIET/LIB/2026/064", title: "Extended Central Library & Digital Reference Hours During Sessional Exams", category: "Library", content: "To facilitate academic preparation for upcoming sessional tests and project submissions, the MIET Central Library and IEEE/Springer Digital Reference Section will remain open from 08:00 AM to 09:30 PM on all working days and Saturdays until November 30, 2026.", is_important: 0, posted_by: "Dr. S. K. Sharma", posted_date: "2026-10-01", deadline_date: "2026-11-30" }
  ],
  assignments: [
    { id: 1, subject_code: "BCS501", subject: "Database Management Systems", title: "Relational Schema Normalization (3NF/BCNF) & SQL Transaction Concurrency Control", description: "Design a complete normalized relational database schema for an enterprise university portal. Write SQL DDL/DML scripts demonstrating foreign key constraints, indexing, ACID transaction isolation levels, and deadlock prevention queries.", deadline: "2026-10-14", max_marks: 20, faculty: "Dr. Neha Agarwal", branch: "CS", semester: 5, status: "Pending" },
    { id: 2, subject_code: "BCS502", subject: "Compiler Design", title: "LL(1) Predictive Parser & Lexical Analyzer Implementation in Python/C", description: "Construct a lexical analyzer for arithmetic and conditional expressions, eliminate left recursion from the given context-free grammar, compute FIRST and FOLLOW sets, and generate the LL(1) parsing table.", deadline: "2026-10-18", max_marks: 20, faculty: "Dr. S. K. Sharma", branch: "CS", semester: 5, status: "Pending" },
    { id: 3, subject_code: "BCS503", subject: "Design and Analysis of Algorithms", title: "Dynamic Programming & Graph Shortest-Path Complexity Benchmark", description: "Implement Dijkstra, Bellman-Ford, and Floyd-Warshall algorithms on weighted directed graphs. Compare empirical execution times and asymptotic space-time complexities with a detailed analytical report.", deadline: "2026-10-21", max_marks: 20, faculty: "Prof. Vikramaditya Verma", branch: "CS", semester: 5, status: "Pending" },
    { id: 4, subject_code: "BCS054", subject: "Artificial Intelligence & Machine Learning", title: "Heuristic Search (A* Algorithm) & Contextual RAG Agent Architecture", description: "Implement A* search with admissible heuristics for pathfinding and write a technical case study on Grounded Retrieval-Augmented Generation using relational SQL context and Gemini LLM API.", deadline: "2026-10-25", max_marks: 25, faculty: "Dr. S. K. Sharma", branch: "CS", semester: 5, status: "Pending" },
    { id: 5, subject_code: "BCS055", subject: "Computer Networks", title: "TCP Congestion Control Simulation & Subnetting Topology Design", description: "Configure an enterprise multi-department VLAN and CIDR subnetting plan for 4 campus blocks. Analyze TCP Tahoe vs Reno congestion window traces using packet capture logs.", deadline: "2026-10-28", max_marks: 15, faculty: "Prof. Ankit Bansal", branch: "CS", semester: 5, status: "Pending" }
  ],
  timetable: [
    { id: 1, day_of_week: "Monday", subject_code: "BCS501", subject: "Database Management Systems", faculty: "Dr. Neha Agarwal", start_time: "09:00", end_time: "10:00", time_slot: "09:00 AM - 10:00 AM", classroom: "Room A-301", lecture_type: "Lecture", branch: "CS", semester: 5 },
    { id: 2, day_of_week: "Monday", subject_code: "BCS502", subject: "Compiler Design", faculty: "Dr. S. K. Sharma", start_time: "10:00", end_time: "11:00", time_slot: "10:00 AM - 11:00 AM", classroom: "Room A-301", lecture_type: "Lecture", branch: "CS", semester: 5 },
    { id: 3, day_of_week: "Monday", subject_code: "BCS503", subject: "Design and Analysis of Algorithms", faculty: "Prof. Vikramaditya Verma", start_time: "11:15", end_time: "12:15", time_slot: "11:15 AM - 12:15 PM", classroom: "Room A-302", lecture_type: "Lecture", branch: "CS", semester: 5 },
    { id: 4, day_of_week: "Monday", subject_code: "BCS551", subject: "DBMS Lab", faculty: "Dr. Neha Agarwal", start_time: "14:00", end_time: "16:00", time_slot: "02:00 PM - 04:00 PM", classroom: "Lab C-102 (DBMS Lab)", lecture_type: "Lab", branch: "CS", semester: 5 },
    { id: 5, day_of_week: "Tuesday", subject_code: "BCS054", subject: "Artificial Intelligence & Machine Learning", faculty: "Dr. S. K. Sharma", start_time: "09:00", end_time: "10:00", time_slot: "09:00 AM - 10:00 AM", classroom: "Room A-301", lecture_type: "Lecture", branch: "CS", semester: 5 },
    { id: 6, day_of_week: "Tuesday", subject_code: "BCS055", subject: "Computer Networks", faculty: "Prof. Ankit Bansal", start_time: "10:00", end_time: "11:00", time_slot: "10:00 AM - 11:00 AM", classroom: "Room A-301", lecture_type: "Lecture", branch: "CS", semester: 5 },
    { id: 7, day_of_week: "Tuesday", subject_code: "BCS501", subject: "Database Management Systems", faculty: "Dr. Neha Agarwal", start_time: "11:15", end_time: "12:15", time_slot: "11:15 AM - 12:15 PM", classroom: "Room A-301", lecture_type: "Lecture", branch: "CS", semester: 5 },
    { id: 8, day_of_week: "Tuesday", subject_code: "BCS552", subject: "Compiler Design Lab", faculty: "Dr. S. K. Sharma", start_time: "14:00", end_time: "16:00", time_slot: "02:00 PM - 04:00 PM", classroom: "Lab C-204 (Systems Lab)", lecture_type: "Lab", branch: "CS", semester: 5 },
    { id: 9, day_of_week: "Wednesday", subject_code: "BCS503", subject: "Design and Analysis of Algorithms", faculty: "Prof. Vikramaditya Verma", start_time: "09:00", end_time: "10:00", time_slot: "09:00 AM - 10:00 AM", classroom: "Room A-301", lecture_type: "Lecture", branch: "CS", semester: 5 },
    { id: 10, day_of_week: "Wednesday", subject_code: "BCS502", subject: "Compiler Design", faculty: "Dr. S. K. Sharma", start_time: "10:00", end_time: "11:00", time_slot: "10:00 AM - 11:00 AM", classroom: "Room A-301", lecture_type: "Lecture", branch: "CS", semester: 5 },
    { id: 11, day_of_week: "Wednesday", subject_code: "BCS054", subject: "Artificial Intelligence & Machine Learning", faculty: "Dr. S. K. Sharma", start_time: "11:15", end_time: "12:15", time_slot: "11:15 AM - 12:15 PM", classroom: "Room A-304", lecture_type: "Lecture", branch: "CS", semester: 5 },
    { id: 12, day_of_week: "Wednesday", subject_code: "BCS553", subject: "Algorithms & AI Lab", faculty: "Dr. S. K. Sharma", start_time: "14:00", end_time: "16:00", time_slot: "02:00 PM - 04:00 PM", classroom: "Lab A-304 (Darwin AI Lab)", lecture_type: "Lab", branch: "CS", semester: 5 },
    { id: 13, day_of_week: "Thursday", subject_code: "BCS055", subject: "Computer Networks", faculty: "Prof. Ankit Bansal", start_time: "09:00", end_time: "10:00", time_slot: "09:00 AM - 10:00 AM", classroom: "Room A-301", lecture_type: "Lecture", branch: "CS", semester: 5 },
    { id: 14, day_of_week: "Thursday", subject_code: "BCS501", subject: "Database Management Systems", faculty: "Dr. Neha Agarwal", start_time: "10:00", end_time: "11:00", time_slot: "10:00 AM - 11:00 AM", classroom: "Room A-301", lecture_type: "Lecture", branch: "CS", semester: 5 },
    { id: 15, day_of_week: "Thursday", subject_code: "BCS503", subject: "Design and Analysis of Algorithms", faculty: "Prof. Vikramaditya Verma", start_time: "11:15", end_time: "12:15", time_slot: "11:15 AM - 12:15 PM", classroom: "Room A-302", lecture_type: "Tutorial", branch: "CS", semester: 5 },
    { id: 16, day_of_week: "Thursday", subject_code: "BCS054", subject: "Artificial Intelligence & Machine Learning", faculty: "Dr. S. K. Sharma", start_time: "14:00", end_time: "15:00", time_slot: "02:00 PM - 03:00 PM", classroom: "Room A-301", lecture_type: "Lecture", branch: "CS", semester: 5 },
    { id: 17, day_of_week: "Friday", subject_code: "BCS502", subject: "Compiler Design", faculty: "Dr. S. K. Sharma", start_time: "09:00", end_time: "10:00", time_slot: "09:00 AM - 10:00 AM", classroom: "Room A-301", lecture_type: "Lecture", branch: "CS", semester: 5 },
    { id: 18, day_of_week: "Friday", subject_code: "BCS055", subject: "Computer Networks", faculty: "Prof. Ankit Bansal", start_time: "10:00", end_time: "11:00", time_slot: "10:00 AM - 11:00 AM", classroom: "Room A-301", lecture_type: "Lecture", branch: "CS", semester: 5 },
    { id: 19, day_of_week: "Friday", subject_code: "BCS501", subject: "Database Management Systems", faculty: "Dr. Neha Agarwal", start_time: "11:15", end_time: "12:15", time_slot: "11:15 AM - 12:15 PM", classroom: "Room A-301", lecture_type: "Tutorial", branch: "CS", semester: 5 },
    { id: 20, day_of_week: "Friday", subject_code: "BCS554", subject: "Mini Project & Seminar", faculty: "Dr. Neha Agarwal", start_time: "14:00", end_time: "16:00", time_slot: "02:00 PM - 04:00 PM", classroom: "Lab A-304 (Darwin AI Lab)", lecture_type: "Lab", branch: "CS", semester: 5 },
    { id: 21, day_of_week: "Saturday", subject_code: "BCS054", subject: "Artificial Intelligence & Machine Learning", faculty: "Dr. S. K. Sharma", start_time: "09:30", end_time: "10:30", time_slot: "09:30 AM - 10:30 AM", classroom: "Room A-301", lecture_type: "Tutorial", branch: "CS", semester: 5 },
    { id: 22, day_of_week: "Saturday", subject_code: "BCS055", subject: "Computer Networks", faculty: "Prof. Ankit Bansal", start_time: "10:30", end_time: "11:30", time_slot: "10:30 AM - 11:30 AM", classroom: "Room A-301", lecture_type: "Tutorial", branch: "CS", semester: 5 }
  ],
  attendance: [
    // Student 1: Gauri
    { id: 1, student_id: 1, subject_code: "BCS501", subject: "Database Management Systems", faculty: "Dr. Neha Agarwal", attended_classes: 38, total_classes: 42 },
    { id: 2, student_id: 1, subject_code: "BCS502", subject: "Compiler Design", faculty: "Dr. S. K. Sharma", attended_classes: 35, total_classes: 40 },
    { id: 3, student_id: 1, subject_code: "BCS503", subject: "Design and Analysis of Algorithms", faculty: "Prof. Vikramaditya Verma", attended_classes: 34, total_classes: 38 },
    { id: 4, student_id: 1, subject_code: "BCS054", subject: "Artificial Intelligence & Machine Learning", faculty: "Dr. S. K. Sharma", attended_classes: 33, total_classes: 36 },
    { id: 5, student_id: 1, subject_code: "BCS055", subject: "Computer Networks", faculty: "Prof. Ankit Bansal", attended_classes: 25, total_classes: 35 },
    { id: 6, student_id: 1, subject_code: "BCS551", subject: "DBMS & AI Integrated Lab", faculty: "Dr. Neha Agarwal", attended_classes: 18, total_classes: 20 },
    // Student 2: Harshi
    { id: 7, student_id: 2, subject_code: "BCS501", subject: "Database Management Systems", faculty: "Dr. Neha Agarwal", attended_classes: 35, total_classes: 42 },
    { id: 8, student_id: 2, subject_code: "BCS502", subject: "Compiler Design", faculty: "Dr. S. K. Sharma", attended_classes: 27, total_classes: 40 },
    { id: 9, student_id: 2, subject_code: "BCS503", subject: "Design and Analysis of Algorithms", faculty: "Prof. Vikramaditya Verma", attended_classes: 27, total_classes: 38 },
    { id: 10, student_id: 2, subject_code: "BCS054", subject: "Artificial Intelligence & Machine Learning", faculty: "Dr. S. K. Sharma", attended_classes: 31, total_classes: 36 },
    { id: 11, student_id: 2, subject_code: "BCS055", subject: "Computer Networks", faculty: "Prof. Ankit Bansal", attended_classes: 30, total_classes: 35 },
    { id: 12, student_id: 2, subject_code: "BCS551", subject: "DBMS & AI Integrated Lab", faculty: "Dr. Neha Agarwal", attended_classes: 17, total_classes: 20 },
    // Student 3: Pranjal
    { id: 13, student_id: 3, subject_code: "BCS501", subject: "Database Management Systems", faculty: "Dr. Neha Agarwal", attended_classes: 40, total_classes: 42 },
    { id: 14, student_id: 3, subject_code: "BCS502", subject: "Compiler Design", faculty: "Dr. S. K. Sharma", attended_classes: 37, total_classes: 40 },
    { id: 15, student_id: 3, subject_code: "BCS503", subject: "Design and Analysis of Algorithms", faculty: "Prof. Vikramaditya Verma", attended_classes: 36, total_classes: 38 },
    { id: 16, student_id: 3, subject_code: "BCS054", subject: "Artificial Intelligence & Machine Learning", faculty: "Dr. S. K. Sharma", attended_classes: 35, total_classes: 36 },
    { id: 17, student_id: 3, subject_code: "BCS055", subject: "Computer Networks", faculty: "Prof. Ankit Bansal", attended_classes: 31, total_classes: 35 },
    { id: 18, student_id: 3, subject_code: "BCS551", subject: "DBMS & AI Integrated Lab", faculty: "Dr. Neha Agarwal", attended_classes: 19, total_classes: 20 },
    // Student 4: Manvi
    { id: 19, student_id: 4, subject_code: "BCS501", subject: "Database Management Systems", faculty: "Dr. Neha Agarwal", attended_classes: 28, total_classes: 42 },
    { id: 20, student_id: 4, subject_code: "BCS502", subject: "Compiler Design", faculty: "Dr. S. K. Sharma", attended_classes: 31, total_classes: 40 },
    { id: 21, student_id: 4, subject_code: "BCS503", subject: "Design and Analysis of Algorithms", faculty: "Prof. Vikramaditya Verma", attended_classes: 30, total_classes: 38 },
    { id: 22, student_id: 4, subject_code: "BCS054", subject: "Artificial Intelligence & Machine Learning", faculty: "Dr. S. K. Sharma", attended_classes: 25, total_classes: 36 },
    { id: 23, student_id: 4, subject_code: "BCS055", subject: "Computer Networks", faculty: "Prof. Ankit Bansal", attended_classes: 29, total_classes: 35 },
    { id: 24, student_id: 4, subject_code: "BCS551", subject: "DBMS & AI Integrated Lab", faculty: "Dr. Neha Agarwal", attended_classes: 18, total_classes: 20 }
  ],
  exams: [
    { id: 1, exam_type: "Pre-University Test (PUT)", subject_code: "BCS501", subject: "Database Management Systems", exam_date: "2026-11-16", exam_time: "09:30 AM - 12:30 PM", room: "Block A - Hall 101", max_marks: 100, branch: "CS", semester: 5, syllabus_notes: "Units 1 to 5: ER Modeling, SQL, Normalization (BCNF/4NF), Transaction Processing & Concurrency Control" },
    { id: 2, exam_type: "Pre-University Test (PUT)", subject_code: "BCS502", subject: "Compiler Design", exam_date: "2026-11-18", exam_time: "09:30 AM - 12:30 PM", room: "Block A - Hall 101", max_marks: 100, branch: "CS", semester: 5, syllabus_notes: "Units 1 to 5: Lexical Analysis, LL/LR Parsing, Syntax Directed Translation, Three-Address Code & Optimization" },
    { id: 3, exam_type: "Pre-University Test (PUT)", subject_code: "BCS503", subject: "Design and Analysis of Algorithms", exam_date: "2026-11-20", exam_time: "09:30 AM - 12:30 PM", room: "Block A - Hall 102", max_marks: 100, branch: "CS", semester: 5, syllabus_notes: "Units 1 to 5: Divide & Conquer, Greedy, Dynamic Programming, Backtracking, NP-Completeness" },
    { id: 4, exam_type: "Pre-University Test (PUT)", subject_code: "BCS054", subject: "Artificial Intelligence & Machine Learning", exam_date: "2026-11-23", exam_time: "09:30 AM - 12:30 PM", room: "Block C - Hall 201", max_marks: 100, branch: "CS", semester: 5, syllabus_notes: "Units 1 to 5: Informed Search, First-Order Logic, Bayesian Networks, Supervised Learning & Neural Nets" },
    { id: 5, exam_type: "Pre-University Test (PUT)", subject_code: "BCS055", subject: "Computer Networks", exam_date: "2026-11-25", exam_time: "09:30 AM - 12:30 PM", room: "Block C - Hall 201", max_marks: 100, branch: "CS", semester: 5, syllabus_notes: "Units 1 to 5: OSI/TCP-IP Stack, Data Link Framing, IPv4/IPv6 Routing, TCP/UDP & Network Security" }
  ],
  results: [
    // Gauri
    { id: 1, student_id: 1, subject_code: "BCS501", subject: "Database Management Systems", credits: 4, internal_marks: 28, max_internal: 30, external_marks: 62, max_external: 70, grade: "A+", grade_points: 10, semester: 5 },
    { id: 2, student_id: 1, subject_code: "BCS502", subject: "Compiler Design", credits: 4, internal_marks: 26, max_internal: 30, external_marks: 58, max_external: 70, grade: "A", grade_points: 9, semester: 5 },
    { id: 3, student_id: 1, subject_code: "BCS503", subject: "Design and Analysis of Algorithms", credits: 4, internal_marks: 27, max_internal: 30, external_marks: 59, max_external: 70, grade: "A", grade_points: 9, semester: 5 },
    { id: 4, student_id: 1, subject_code: "BCS054", subject: "Artificial Intelligence & Machine Learning", credits: 3, internal_marks: 28, max_internal: 30, external_marks: 63, max_external: 70, grade: "A+", grade_points: 10, semester: 5 },
    { id: 5, student_id: 1, subject_code: "BCS055", subject: "Computer Networks", credits: 3, internal_marks: 23, max_internal: 30, external_marks: 51, max_external: 70, grade: "B+", grade_points: 8, semester: 5 },
    { id: 6, student_id: 1, subject_code: "BCS551", subject: "DBMS & AI Integrated Lab", credits: 2, internal_marks: 29, max_internal: 30, external_marks: 64, max_external: 70, grade: "A+", grade_points: 10, semester: 5 },
    // Harshi
    { id: 7, student_id: 2, subject_code: "BCS501", subject: "Database Management Systems", credits: 4, internal_marks: 26, max_internal: 30, external_marks: 57, max_external: 70, grade: "A", grade_points: 9, semester: 5 },
    { id: 8, student_id: 2, subject_code: "BCS502", subject: "Compiler Design", credits: 4, internal_marks: 22, max_internal: 30, external_marks: 49, max_external: 70, grade: "B+", grade_points: 8, semester: 5 },
    { id: 9, student_id: 2, subject_code: "BCS503", subject: "Design and Analysis of Algorithms", credits: 4, internal_marks: 23, max_internal: 30, external_marks: 52, max_external: 70, grade: "B+", grade_points: 8, semester: 5 },
    { id: 10, student_id: 2, subject_code: "BCS054", subject: "Artificial Intelligence & Machine Learning", credits: 3, internal_marks: 27, max_internal: 30, external_marks: 58, max_external: 70, grade: "A", grade_points: 9, semester: 5 },
    { id: 11, student_id: 2, subject_code: "BCS055", subject: "Computer Networks", credits: 3, internal_marks: 26, max_internal: 30, external_marks: 56, max_external: 70, grade: "A", grade_points: 9, semester: 5 },
    { id: 12, student_id: 2, subject_code: "BCS551", subject: "DBMS & AI Integrated Lab", credits: 2, internal_marks: 27, max_internal: 30, external_marks: 61, max_external: 70, grade: "A", grade_points: 9, semester: 5 },
    // Pranjal
    { id: 13, student_id: 3, subject_code: "BCS501", subject: "Database Management Systems", credits: 4, internal_marks: 29, max_internal: 30, external_marks: 65, max_external: 70, grade: "A+", grade_points: 10, semester: 5 },
    { id: 14, student_id: 3, subject_code: "BCS502", subject: "Compiler Design", credits: 4, internal_marks: 28, max_internal: 30, external_marks: 61, max_external: 70, grade: "A", grade_points: 9, semester: 5 },
    { id: 15, student_id: 3, subject_code: "BCS503", subject: "Design and Analysis of Algorithms", credits: 4, internal_marks: 29, max_internal: 30, external_marks: 63, max_external: 70, grade: "A+", grade_points: 10, semester: 5 },
    { id: 16, student_id: 3, subject_code: "BCS054", subject: "Artificial Intelligence & Machine Learning", credits: 3, internal_marks: 29, max_internal: 30, external_marks: 66, max_external: 70, grade: "A+", grade_points: 10, semester: 5 },
    { id: 17, student_id: 3, subject_code: "BCS055", subject: "Computer Networks", credits: 3, internal_marks: 26, max_internal: 30, external_marks: 57, max_external: 70, grade: "A", grade_points: 9, semester: 5 },
    { id: 18, student_id: 3, subject_code: "BCS551", subject: "DBMS & AI Integrated Lab", credits: 2, internal_marks: 30, max_internal: 30, external_marks: 66, max_external: 70, grade: "A+", grade_points: 10, semester: 5 },
    // Manvi
    { id: 19, student_id: 4, subject_code: "BCS501", subject: "Database Management Systems", credits: 4, internal_marks: 22, max_internal: 30, external_marks: 48, max_external: 70, grade: "B", grade_points: 7, semester: 5 },
    { id: 20, student_id: 4, subject_code: "BCS502", subject: "Compiler Design", credits: 4, internal_marks: 24, max_internal: 30, external_marks: 54, max_external: 70, grade: "B+", grade_points: 8, semester: 5 },
    { id: 21, student_id: 4, subject_code: "BCS503", subject: "Design and Analysis of Algorithms", credits: 4, internal_marks: 25, max_internal: 30, external_marks: 55, max_external: 70, grade: "A", grade_points: 9, semester: 5 },
    { id: 22, student_id: 4, subject_code: "BCS054", subject: "Artificial Intelligence & Machine Learning", credits: 3, internal_marks: 21, max_internal: 30, external_marks: 49, max_external: 70, grade: "B", grade_points: 7, semester: 5 },
    { id: 23, student_id: 4, subject_code: "BCS055", subject: "Computer Networks", credits: 3, internal_marks: 26, max_internal: 30, external_marks: 58, max_external: 70, grade: "A", grade_points: 9, semester: 5 },
    { id: 24, student_id: 4, subject_code: "BCS551", subject: "DBMS & AI Integrated Lab", credits: 2, internal_marks: 27, max_internal: 30, external_marks: 60, max_external: 70, grade: "A", grade_points: 9, semester: 5 }
  ],
  events: [
    { id: 1, title: "MIET HackFest 2026 – 24-Hour National AI & Sustainability Hackathon", category: "Hackathon", event_date: "2026-10-24", event_time: "09:00 AM Onwards", venue: "MIET Main Auditorium & Darwin Block Labs", organizer: "Department of CSE & MIET Incubation Forum", description: "Flagship 24-hour inter-college hackathon focusing on Generative AI, Smart Campus Automation, FinTech, and Healthcare. Cash prizes worth Rs. 75,000 and direct internship interviews for top 5 teams.", registration_status: "Open" },
    { id: 2, title: "Expert Colloquium: Large Language Models & Enterprise RAG Systems", category: "Technical Seminar", event_date: "2026-10-17", event_time: "11:00 AM - 01:30 PM", venue: "Seminar Hall-2, Block A", organizer: "CSI Student Chapter, MIET", description: "Distinguished lecture and live coding demonstration on grounding Google Gemini models with relational SQL databases for zero-hallucination academic and enterprise assistants.", registration_status: "Open" },
    { id: 3, title: "Kolahal 2026 – Annual Cultural & Literary Conclave Auditions", category: "Cultural", event_date: "2026-11-04", event_time: "02:30 PM - 05:00 PM", venue: "Open Air Theatre (OAT), MIET Campus", organizer: "MIET Cultural Committee", description: "Preliminary selections for technical debate, battle of bands, street theatre, and coding quiz ahead of the annual Kolahal festival.", registration_status: "Registration Closing Soon" },
    { id: 4, title: "AKTU Zonal Inter-Engineering Sports Meet – Trials & Selection", category: "Sports", event_date: "2026-10-30", event_time: "03:30 PM - 05:30 PM", venue: "MIET Main Sports Ground", organizer: "MIET Sports Council", description: "Selection trials for Basketball, Badminton, Table Tennis, and Chess teams representing Meerut Institute of Engineering and Technology at the AKTU Zonal Championship.", registration_status: "Open" }
  ]
};

function loadDatabase() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }
  saveDatabase(initialDatabase);
  return JSON.parse(JSON.stringify(initialDatabase));
}

function saveDatabase(db) {
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

let db = loadDatabase();

// In-memory session tracking
const SESSIONS = new Map();
const REVOKED_SESSIONS = new Set();

function revokeSession(sid) {
  if (!sid) return;
  const cleanSid = String(sid).trim();
  REVOKED_SESSIONS.add(cleanSid);
  SESSIONS.delete(cleanSid);
}

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }
  return list;
}

function getSession(req, parsedUrl = null) {
  let sid = null;

  // 1. Check Authorization header: Bearer <sid>
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    sid = authHeader.substring(7).trim();
  }

  // 2. Check X-Session-ID header
  if (!sid && req.headers['x-session-id']) {
    sid = String(req.headers['x-session-id']).trim();
  }

  // 3. Check query string ?sid=...
  if (!sid && parsedUrl) {
    sid = parsedUrl.searchParams.get('sid');
  } else if (!sid && req.url) {
    try {
      const u = new URL(req.url, 'http://localhost');
      sid = u.searchParams.get('sid');
    } catch (e) {}
  }

  // 4. Check cookies
  if (!sid) {
    const cookies = parseCookies(req);
    sid = cookies.campusmate_sid;
  }

  if (sid) {
    const cleanSid = String(sid).trim();
    if (REVOKED_SESSIONS.has(cleanSid)) {
      return null;
    }
    if (SESSIONS.has(cleanSid)) {
      return { ...SESSIONS.get(cleanSid), sid: cleanSid };
    }
  }
  return null;
}

function findUserByIdentifier(identifier) {
  if (!identifier) return null;
  const raw = String(identifier).trim().toLowerCase();

  // 1. Direct email match
  let user = db.users.find(u => u.email.toLowerCase() === raw);
  if (user) return user;

  // 2. Direct name match
  user = db.users.find(u => u.name.toLowerCase() === raw);
  if (user) return user;

  // 3. Username before @
  user = db.users.find(u => u.email.toLowerCase().split('@')[0] === raw);
  if (user) return user;

  // 4. Student roll number or enrollment number
  const student = db.students.find(s => 
    s.roll_no === raw || 
    (s.enrollment_no && s.enrollment_no.toLowerCase() === raw)
  );
  if (student) {
    return db.users.find(u => u.id === student.user_id) || null;
  }

  // 5. Common aliases and partial matches
  if (raw.includes('pranjal')) {
    return db.users.find(u => u.name.toLowerCase() === 'pranjal') || null;
  }
  if (raw.includes('gauri')) {
    return db.users.find(u => u.name.toLowerCase() === 'gauri') || null;
  }
  if (raw.includes('harshi')) {
    return db.users.find(u => u.name.toLowerCase() === 'harshi') || null;
  }
  if (raw.includes('manvi')) {
    return db.users.find(u => u.name.toLowerCase() === 'manvi') || null;
  }
  if (raw.includes('sharma') || raw === 'admin') {
    return db.users.find(u => u.id === 5) || null;
  }
  if (raw.includes('neha')) {
    return db.users.find(u => u.id === 6) || null;
  }

  return null;
}

function isPasswordValid(password, user) {
  if (!password) return false;
  const p = String(password).trim();
  // Standard passwords
  if (['miet123', 'miet@123', 'MIET123', 'Miet123', 'password', 'admin', 'admin123', '123456'].includes(p)) {
    return true;
  }
  // User name
  if (user && p.toLowerCase() === user.name.toLowerCase().split(' ')[0]) {
    return true;
  }
  // Student roll number
  if (user && user.role === 'student') {
    const student = db.students.find(s => s.user_id === user.id);
    if (student && p === student.roll_no) return true;
  }
  return false;
}

function sendJson(res, data, status = 200, setCookie = null) {
  const payload = JSON.stringify(data);
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-ID',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
  if (setCookie) {
    headers['Set-Cookie'] = setCookie;
  }
  res.writeHead(status, headers);
  res.end(payload);
}

function sendHtmlFile(res, filename, isHead = false, noCache = false) {
  const filePath = path.join(__dirname, 'templates', filename);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File not found');
    return;
  }
  const content = fs.readFileSync(filePath);
  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': content.length,
  };
  if (noCache) {
    headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
    headers['Pragma'] = 'no-cache';
    headers['Expires'] = '0';
  }
  res.writeHead(200, headers);
  if (isHead) {
    res.end();
  } else {
    res.end(content);
  }
}

function redirect(res, location) {
  res.writeHead(302, { 
    Location: location,
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.end();
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
  });
}

function getStudentBundle(studentId) {
  const student = db.students.find(s => s.id === studentId);
  if (!student) return null;

  const attendance = db.attendance
    .filter(a => a.student_id === studentId)
    .map(a => {
      const pct = a.total_classes > 0 ? (a.attended_classes * 100) / a.total_classes : 0;
      return {
        ...a,
        percentage: Number(pct.toFixed(2))
      };
    });

  const totalAttended = attendance.reduce((acc, a) => acc + a.attended_classes, 0);
  const totalConducted = attendance.reduce((acc, a) => acc + a.total_classes, 0);
  const overallAttendance = totalConducted > 0 ? Number(((totalAttended * 100) / totalConducted).toFixed(2)) : 0;
  const lowWarnings = attendance.filter(a => a.percentage < 75);

  const results = db.results
    .filter(r => r.student_id === studentId)
    .map(r => ({
      ...r,
      total_marks: r.internal_marks + r.external_marks
    }));

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()];
  const currentDay = todayName === 'Sunday' ? 'Monday' : todayName;

  const timetable = db.timetable;
  const todayTimetable = timetable.filter(t => t.day_of_week === currentDay);

  return {
    student,
    overall_attendance: overallAttendance,
    total_attended: totalAttended,
    total_conducted: totalConducted,
    low_attendance_warnings: lowWarnings,
    attendance,
    results,
    current_day: currentDay,
    today_timetable: todayTimetable,
    timetable,
    assignments: db.assignments,
    exams: db.exams,
    notices: db.notices,
    events: db.events
  };
}

async function callGemini(prompt, systemInstruction, jsonMode = false) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    return null;
  }
  try {
    const config = {
      systemInstruction,
      temperature: 0.3,
    };
    if (jsonMode) {
      config.responseMimeType = 'application/json';
    }
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config,
    });
    return response.text;
  } catch (err) {
    console.error('Gemini API call error:', err);
    return null;
  }
}

// Fallback logic grounded directly on the database records
function fallbackCampusMateAnswer(msg, ctx) {
  const q = msg.toLowerCase();
  const st = ctx.student || {};
  const low = ctx.low_attendance_warnings || [];

  if (q.includes('low') && q.includes('attendance')) {
    if (low.length === 0) {
      return `Great news, **${st.name}**! Your attendance is above the 75% threshold in all subjects. Overall: **${ctx.overall_attendance}%**.`;
    }
    const list = low.map(a => `- **${a.subject} (${a.subject_code})**: ${a.attended_classes}/${a.total_classes} (${a.percentage}%) - Faculty: ${a.faculty}`).join('\n');
    return `Hello **${st.name}**, your records in the database indicate the following subject(s) are below the mandatory **75% threshold**:\n\n${list}\n\nPlease attend upcoming lectures regularly.`;
  }

  if (q.includes('attendance')) {
    const list = ctx.attendance.map(a => `- **${a.subject} (${a.subject_code})**: ${a.attended_classes}/${a.total_classes} (**${a.percentage}%**)`).join('\n');
    return `Here is your attendance record, **${st.name}** (Overall: **${ctx.overall_attendance}%**):\n\n${list}`;
  }

  if (q.includes('timetable') || q.includes('class') || q.includes('today')) {
    const classes = ctx.today_timetable.length > 0 ? ctx.today_timetable : ctx.timetable.slice(0, 4);
    const list = classes.map(c => `- **${c.time_slot}**: ${c.subject} (${c.subject_code}) in **${c.classroom}** with ${c.faculty}`).join('\n');
    return `Schedule for **${ctx.current_day}** for **${st.name}**:\n\n${list}`;
  }

  if (q.includes('assignment') || q.includes('pending')) {
    const list = ctx.assignments.map(a => `- **${a.subject}**: *${a.title}* - Deadline: **${a.deadline}** (Max: ${a.max_marks})`).join('\n');
    return `Pending assignments for CS Semester 5:\n\n${list}`;
  }

  if (q.includes('exam') || q.includes('put')) {
    const list = ctx.exams.map(e => `- **${e.exam_date} (${e.exam_time})**: ${e.subject} (${e.subject_code}) in Room **${e.room}**`).join('\n');
    return `Upcoming Examination Schedule (CS Sem 5):\n\n${list}`;
  }

  if (q.includes('sgpa') || q.includes('cgpa') || q.includes('result') || q.includes('mark')) {
    const list = ctx.results.map(r => `- **${r.subject} (${r.subject_code})**: Internal ${r.internal_marks}/${r.max_internal} + External ${r.external_marks}/${r.max_external} = **${r.total_marks}/100** (Grade: **${r.grade}**)`).join('\n');
    return `Academic Results for **${st.name}**:\n- Current SGPA: **${st.sgpa}**\n- Cumulative CGPA: **${st.cgpa}**\n\n**Subject Breakdown:**\n${list}`;
  }

  if (q.includes('notice') || q.includes('circular')) {
    const list = ctx.notices.map(n => `- **[${n.ref_no}] ${n.title}** (Posted: ${n.posted_date}, Deadline: ${n.deadline_date || 'N/A'})`).join('\n');
    return `Official College Circulars:\n\n${list}`;
  }

  if (q.includes('event')) {
    const list = ctx.events.map(ev => `- **${ev.title}** (${ev.category}) on **${ev.event_date}** at ${ev.venue}`).join('\n');
    return `Upcoming Campus Events at MIET:\n\n${list}`;
  }

  return `Hello **${st.name}**! I am AI CampusMate connected to your academic profile:\n- Roll No: ${st.roll_no} | Section: ${st.section}\n- Aggregate Attendance: **${ctx.overall_attendance}%**\n- SGPA: **${st.sgpa}** | CGPA: **${st.cgpa}**\n\nAsk me about today's timetable, attendance, low attendance warnings, pending assignments, or exam dates!`;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  const session = getSession(req, parsedUrl);

  // Preflight CORS handler
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-ID',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    });
    return res.end();
  }

  // Serve static assets
  if (pathname.startsWith('/static/')) {
    const filePath = path.join(__dirname, pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mimeTypes = {
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  // Page Routes
  if (method === 'GET' || method === 'HEAD') {
    const isHead = method === 'HEAD';
    if (pathname === '/') {
      if (session) {
        return redirect(res, `${session.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}?sid=${encodeURIComponent(session.sid)}`);
      }
      return sendHtmlFile(res, 'login.html', isHead, true);
    }

    if (pathname === '/login') {
      if (session) {
        return redirect(res, `${session.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}?sid=${encodeURIComponent(session.sid)}`);
      }
      return sendHtmlFile(res, 'login.html', isHead, true);
    }

    if (pathname === '/logout') {
      const cookies = parseCookies(req);
      if (cookies.campusmate_sid) revokeSession(cookies.campusmate_sid);
      if (session && session.sid) revokeSession(session.sid);
      const querySid = parsedUrl.searchParams.get('sid');
      if (querySid) revokeSession(querySid);

      res.setHeader('Set-Cookie', [
        'campusmate_sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=None; Secure; Partitioned',
        'campusmate_sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax',
        'campusmate_sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
      ]);
      return redirect(res, '/login');
    }

    if (pathname === '/student/dashboard') {
      if (!session) {
        return redirect(res, '/login');
      }
      if (session.role === 'admin') {
        return redirect(res, `/admin/dashboard?sid=${encodeURIComponent(session.sid)}`);
      }
      return sendHtmlFile(res, 'student_dashboard.html', isHead, true);
    }

    if (pathname === '/admin/dashboard') {
      if (!session) {
        return redirect(res, '/login');
      }
      if (session.role === 'student') {
        return redirect(res, `/student/dashboard?sid=${encodeURIComponent(session.sid)}`);
      }
      return sendHtmlFile(res, 'admin_dashboard.html', isHead, true);
    }

    // API: Current authenticated session
    if (pathname === '/api/auth/me') {
      if (!session) return sendJson(res, { authenticated: false }, 401);
      return sendJson(res, { authenticated: true, user: session });
    }

    // API: Student Dashboard Data
    if (pathname === '/api/student/dashboard') {
      if (!session || session.role !== 'student') {
        return sendJson(res, { error: 'Authentication required' }, 401);
      }
      const bundle = getStudentBundle(session.student_id);
      if (!bundle) return sendJson(res, { error: 'Student record not found' }, 404);
      return sendJson(res, bundle);
    }

    // API: Admin Overview Data
    if (pathname === '/api/admin/overview') {
      if (!session || session.role !== 'admin') {
        return sendJson(res, { error: 'Administrator authentication required' }, 403);
      }
      const students = db.students.map(s => {
        const atts = db.attendance.filter(a => a.student_id === s.id);
        const sumAtt = atts.reduce((acc, a) => acc + a.attended_classes, 0);
        const sumTot = atts.reduce((acc, a) => acc + a.total_classes, 0);
        const overall = sumTot > 0 ? Number(((sumAtt * 100) / sumTot).toFixed(2)) : 0;
        return {
          ...s,
          overall_attendance: overall
        };
      });

      const attendance = db.attendance.map(a => {
        const st = db.students.find(s => s.id === a.student_id);
        const pct = a.total_classes > 0 ? (a.attended_classes * 100) / a.total_classes : 0;
        return {
          ...a,
          student_name: st ? st.name : '',
          roll_no: st ? st.roll_no : '',
          percentage: Number(pct.toFixed(2))
        };
      });

      const results = db.results.map(r => {
        const st = db.students.find(s => s.id === r.student_id);
        return {
          ...r,
          student_name: st ? st.name : '',
          roll_no: st ? st.roll_no : '',
          total_marks: r.internal_marks + r.external_marks
        };
      });

      return sendJson(res, {
        admin: {
          name: session.name,
          email: session.email,
          designation: session.designation
        },
        students,
        attendance,
        results,
        notices: db.notices,
        assignments: db.assignments,
        timetable: db.timetable,
        exams: db.exams,
        events: db.events
      });
    }
  }

  // POST Handlers
  if (method === 'POST') {
    const data = await readBody(req);

    if (pathname === '/api/auth/login') {
      const identifier = (data.email || data.username || data.identifier || '').trim();
      const password = (data.password || '').trim();

      const user = findUserByIdentifier(identifier);
      if (!user) {
        return sendJson(res, { 
          error: `Account not found for "${identifier}". Use institutional email (e.g. pranjal@miet.ac.in), name (Pranjal), or Roll No (2200680100094), or click any profile button below.` 
        }, 401);
      }

      if (!isPasswordValid(password, user)) {
        return sendJson(res, { 
          error: `Incorrect password for ${user.name}. Default demo password is "miet123".` 
        }, 401);
      }

      const sid = 'sid_' + user.id + '_' + Date.now();
      const sessionObj = {
        user_id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
      };

      if (user.role === 'student') {
        const student = db.students.find(s => s.user_id === user.id);
        if (student) {
          sessionObj.student_id = student.id;
          sessionObj.roll_no = student.roll_no;
        }
      }

      SESSIONS.set(sid, sessionObj);
      const redirectUrl = user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
      const cookie = `campusmate_sid=${sid}; Path=/; HttpOnly; SameSite=None; Secure; Partitioned`;
      return sendJson(res, { 
        success: true, 
        user: sessionObj, 
        sid: sid, 
        redirect: redirectUrl 
      }, 200, cookie);
    }

    if (pathname === '/logout' || pathname === '/api/auth/logout') {
      const cookies = parseCookies(req);
      if (cookies.campusmate_sid) {
        revokeSession(cookies.campusmate_sid);
      }
      if (session && session.sid) {
        revokeSession(session.sid);
      }
      if (data && data.sid) {
        revokeSession(data.sid);
      }
      const querySid = parsedUrl.searchParams.get('sid');
      if (querySid) {
        revokeSession(querySid);
      }
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        revokeSession(authHeader.substring(7).trim());
      }
      if (req.headers['x-session-id']) {
        revokeSession(String(req.headers['x-session-id']).trim());
      }

      const expiredCookies = [
        'campusmate_sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=None; Secure; Partitioned',
        'campusmate_sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax',
        'campusmate_sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
      ];
      return sendJson(res, { 
        success: true, 
        message: 'Logged out successfully',
        redirect: '/login' 
      }, 200, expiredCookies);
    }

    if (pathname === '/api/ai/chat') {
      if (!session) return sendJson(res, { error: 'Authentication required' }, 401);
      const msg = (data.message || '').trim();
      const studentId = session.student_id || Number(data.student_id || 1);
      const bundle = getStudentBundle(studentId);

      const sysInstruction =
        "You are AI CampusMate, the official Intelligent College Assistant for MIET " +
        "(Meerut Institute of Engineering and Technology), Department of CSE. " +
        "Answer accurately using ONLY the live college records provided below. " +
        "Highlight any subject with attendance below the mandatory 75% AKTU threshold. " +
        "Format cleanly with bullet points and bold headers.";
      const prompt = `=== LIVE COLLEGE DATABASE RECORDS ===\n${JSON.stringify(bundle, null, 2)}\n\n=== USER QUESTION ===\n${msg}`;

      let reply = await callGemini(prompt, sysInstruction);
      if (!reply) {
        reply = fallbackCampusMateAnswer(msg, bundle);
      }
      return sendJson(res, { reply, student_name: bundle?.student?.name });
    }

    if (pathname === '/api/ai/summarize-notice') {
      if (!session) return sendJson(res, { error: 'Authentication required' }, 401);
      const noticeId = data.notice_id;
      const notice = db.notices.find(n => n.id === Number(noticeId));
      if (!notice) return sendJson(res, { error: 'Notice not found' }, 404);

      const sysInstruction =
        "You are the AI Notice & Circular Summarizer for MIET. " +
        "Analyze the circular and output a JSON object with: summary (string), " +
        "important_points (array of strings), deadlines (array of strings), " +
        "important_dates (array of strings), action_items (array of strings).";
      const prompt = JSON.stringify(notice, null, 2);

      let rawSummary = await callGemini(prompt, sysInstruction, true);
      let summaryObj = null;
      if (rawSummary) {
        try {
          summaryObj = JSON.parse(rawSummary.trim());
        } catch (e) {}
      }

      if (!summaryObj) {
        summaryObj = {
          summary: `${notice.title} issued by ${notice.posted_by}.`,
          important_points: [
            notice.content.slice(0, 150) + '...',
            `Category: ${notice.category} | Ref: ${notice.ref_no}`,
            'Mandatory compliance for B.Tech CS Semester 5 students.'
          ],
          deadlines: [notice.deadline_date ? `Deadline: ${notice.deadline_date}` : 'Refer to departmental circular'],
          important_dates: [`Posted Date: ${notice.posted_date}`],
          action_items: [
            'Review complete circular guidelines.',
            'Submit required verification/documents before the deadline.',
            'Consult CSE departmental office for clarifications.'
          ]
        };
      }

      return sendJson(res, { notice_id: noticeId, summary: summaryObj });
    }

    // Admin POST routes
    if (pathname === '/api/admin/notices') {
      if (!session || session.role !== 'admin') return sendJson(res, { error: 'Forbidden' }, 403);
      const newId = (db.notices.length > 0 ? Math.max(...db.notices.map(n => n.id)) : 0) + 1;
      const item = {
        id: newId,
        ref_no: data.ref_no || `MIET/ACAD/2026/${newId + 100}`,
        title: data.title || '',
        category: data.category || 'Academic',
        content: data.content || '',
        is_important: data.is_important ? 1 : 0,
        posted_by: session.name || 'Dr. S. K. Sharma',
        posted_date: new Date().toISOString().split('T')[0],
        deadline_date: data.deadline_date || null
      };
      db.notices.unshift(item);
      saveDatabase(db);
      return sendJson(res, { success: true, id: newId });
    }

    if (pathname === '/api/admin/assignments') {
      if (!session || session.role !== 'admin') return sendJson(res, { error: 'Forbidden' }, 403);
      const newId = (db.assignments.length > 0 ? Math.max(...db.assignments.map(a => a.id)) : 0) + 1;
      const item = {
        id: newId,
        subject_code: data.subject_code || 'BCS501',
        subject: data.subject || '',
        title: data.title || '',
        description: data.description || '',
        deadline: data.deadline || new Date().toISOString().split('T')[0],
        max_marks: Number(data.max_marks || 20),
        faculty: session.name || 'Dr. S. K. Sharma',
        branch: 'CS',
        semester: 5,
        status: 'Pending'
      };
      db.assignments.unshift(item);
      saveDatabase(db);
      return sendJson(res, { success: true, id: newId });
    }

    if (pathname === '/api/admin/timetable') {
      if (!session || session.role !== 'admin') return sendJson(res, { error: 'Forbidden' }, 403);
      const newId = (db.timetable.length > 0 ? Math.max(...db.timetable.map(t => t.id)) : 0) + 1;
      const item = {
        id: newId,
        day_of_week: data.day_of_week || 'Monday',
        subject_code: data.subject_code || 'BCS501',
        subject: data.subject || '',
        faculty: data.faculty || session.name,
        start_time: '09:00',
        end_time: '10:00',
        time_slot: data.time_slot || '09:00 AM - 10:00 AM',
        classroom: data.classroom || 'Room A-301',
        lecture_type: data.lecture_type || 'Lecture',
        branch: 'CS',
        semester: 5
      };
      db.timetable.push(item);
      saveDatabase(db);
      return sendJson(res, { success: true, id: newId });
    }

    if (pathname === '/api/admin/events') {
      if (!session || session.role !== 'admin') return sendJson(res, { error: 'Forbidden' }, 403);
      const newId = (db.events.length > 0 ? Math.max(...db.events.map(e => e.id)) : 0) + 1;
      const item = {
        id: newId,
        title: data.title || '',
        category: data.category || 'Technical',
        event_date: data.event_date || new Date().toISOString().split('T')[0],
        event_time: data.event_time || '10:00 AM Onwards',
        venue: data.venue || 'MIET Auditorium',
        organizer: data.organizer || 'Department of CSE',
        description: data.description || '',
        registration_status: 'Open'
      };
      db.events.unshift(item);
      saveDatabase(db);
      return sendJson(res, { success: true, id: newId });
    }
  }

  // PUT Handlers
  if (method === 'PUT') {
    const data = await readBody(req);
    if (!session || session.role !== 'admin') return sendJson(res, { error: 'Forbidden' }, 403);

    if (pathname === '/api/admin/attendance') {
      const studentId = Number(data.student_id);
      const code = data.subject_code;
      const action = data.action;
      const rec = db.attendance.find(a => a.student_id === studentId && a.subject_code === code);
      if (!rec) return sendJson(res, { error: 'Record not found' }, 404);

      if (action === 'increment_present') {
        rec.attended_classes += 1;
        rec.total_classes += 1;
      } else if (action === 'increment_absent') {
        rec.total_classes += 1;
      } else if (action === 'decrement_present') {
        rec.attended_classes = Math.max(0, rec.attended_classes - 1);
      } else {
        rec.attended_classes = Math.max(0, Number(data.attended_classes ?? rec.attended_classes));
        rec.total_classes = Math.max(rec.attended_classes, Number(data.total_classes ?? rec.total_classes));
      }
      saveDatabase(db);
      const pct = rec.total_classes > 0 ? Number(((rec.attended_classes * 100) / rec.total_classes).toFixed(2)) : 0;
      return sendJson(res, { success: true, percentage: pct });
    }

    if (pathname === '/api/admin/results') {
      const studentId = Number(data.student_id);
      const code = data.subject_code;
      const rec = db.results.find(r => r.student_id === studentId && r.subject_code === code);
      if (!rec) return sendJson(res, { error: 'Record not found' }, 404);

      rec.internal_marks = Math.max(0, Math.min(30, Number(data.internal_marks ?? rec.internal_marks)));
      rec.external_marks = Math.max(0, Math.min(70, Number(data.external_marks ?? rec.external_marks)));
      const tot = rec.internal_marks + rec.external_marks;

      let grade = 'A';
      let pts = 9;
      if (tot >= 90) { grade = 'A+'; pts = 10; }
      else if (tot >= 80) { grade = 'A'; pts = 9; }
      else if (tot >= 70) { grade = 'B+'; pts = 8; }
      else if (tot >= 60) { grade = 'B'; pts = 7; }
      else if (tot >= 50) { grade = 'C'; pts = 6; }
      else { grade = 'D'; pts = 5; }

      rec.grade = grade;
      rec.grade_points = pts;

      const studentResults = db.results.filter(r => r.student_id === studentId);
      const totCredits = studentResults.reduce((acc, r) => acc + r.credits, 0) || 1;
      const weighted = studentResults.reduce((acc, r) => acc + (r.credits * r.grade_points), 0);
      const newSgpa = Number((weighted / totCredits).toFixed(2));

      const st = db.students.find(s => s.id === studentId);
      if (st) {
        st.sgpa = newSgpa;
        st.cgpa = Number(((st.cgpa * 4 + newSgpa) / 5).toFixed(2));
      }
      saveDatabase(db);
      return sendJson(res, { success: true, sgpa: newSgpa, cgpa: st?.cgpa });
    }

    if (pathname.startsWith('/api/admin/notices/')) {
      const id = Number(pathname.split('/').pop());
      const item = db.notices.find(n => n.id === id);
      if (!item) return sendJson(res, { error: 'Notice not found' }, 404);
      item.ref_no = data.ref_no ?? item.ref_no;
      item.title = data.title ?? item.title;
      item.category = data.category ?? item.category;
      item.content = data.content ?? item.content;
      item.is_important = data.is_important ? 1 : 0;
      item.deadline_date = data.deadline_date ?? item.deadline_date;
      saveDatabase(db);
      return sendJson(res, { success: true });
    }

    if (pathname.startsWith('/api/admin/assignments/')) {
      const id = Number(pathname.split('/').pop());
      const item = db.assignments.find(a => a.id === id);
      if (!item) return sendJson(res, { error: 'Assignment not found' }, 404);
      item.subject_code = data.subject_code ?? item.subject_code;
      item.subject = data.subject ?? item.subject;
      item.title = data.title ?? item.title;
      item.description = data.description ?? item.description;
      item.deadline = data.deadline ?? item.deadline;
      item.max_marks = Number(data.max_marks ?? item.max_marks);
      saveDatabase(db);
      return sendJson(res, { success: true });
    }

    if (pathname.startsWith('/api/admin/timetable/')) {
      const id = Number(pathname.split('/').pop());
      const item = db.timetable.find(t => t.id === id);
      if (!item) return sendJson(res, { error: 'Slot not found' }, 404);
      item.day_of_week = data.day_of_week ?? item.day_of_week;
      item.lecture_type = data.lecture_type ?? item.lecture_type;
      item.subject_code = data.subject_code ?? item.subject_code;
      item.subject = data.subject ?? item.subject;
      item.faculty = data.faculty ?? item.faculty;
      item.time_slot = data.time_slot ?? item.time_slot;
      item.classroom = data.classroom ?? item.classroom;
      saveDatabase(db);
      return sendJson(res, { success: true });
    }

    if (pathname.startsWith('/api/admin/events/')) {
      const id = Number(pathname.split('/').pop());
      const item = db.events.find(e => e.id === id);
      if (!item) return sendJson(res, { error: 'Event not found' }, 404);
      item.title = data.title ?? item.title;
      item.category = data.category ?? item.category;
      item.event_date = data.event_date ?? item.event_date;
      item.event_time = data.event_time ?? item.event_time;
      item.venue = data.venue ?? item.venue;
      item.organizer = data.organizer ?? item.organizer;
      item.description = data.description ?? item.description;
      saveDatabase(db);
      return sendJson(res, { success: true });
    }
  }

  // DELETE Handlers
  if (method === 'DELETE') {
    if (!session || session.role !== 'admin') return sendJson(res, { error: 'Forbidden' }, 403);
    const id = Number(pathname.split('/').pop());

    if (pathname.startsWith('/api/admin/notices/')) {
      db.notices = db.notices.filter(n => n.id !== id);
      saveDatabase(db);
      return sendJson(res, { success: true });
    }
    if (pathname.startsWith('/api/admin/assignments/')) {
      db.assignments = db.assignments.filter(a => a.id !== id);
      saveDatabase(db);
      return sendJson(res, { success: true });
    }
    if (pathname.startsWith('/api/admin/timetable/')) {
      db.timetable = db.timetable.filter(t => t.id !== id);
      saveDatabase(db);
      return sendJson(res, { success: true });
    }
    if (pathname.startsWith('/api/admin/events/')) {
      db.events = db.events.filter(e => e.id !== id);
      saveDatabase(db);
      return sendJson(res, { success: true });
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`AI CampusMate production server running on http://0.0.0.0:${PORT}`);
});
