-- =============================================================================
-- AI CampusMate – Intelligent College Assistant (MIET)
-- Database Seed Data (MySQL)
-- Students: ONLY Gauri, Harshi, Pranjal, Manvi (Branch: CS, Semester: 5)
-- Admins: Dr. S. K. Sharma, Dr. Neha Agarwal
-- Password for all accounts: miet123
-- =============================================================================

USE ai_database;

-- 1. SEED USERS
INSERT INTO users (id, name, email, password_hash, role, designation, department) VALUES
(1, 'Gauri', 'gauri@miet.ac.in', 'pbkdf2:sha256:600000$MIETCampus2026$8e2b50d89747e9c7a454d60c7b20250a0a36f0b04e85c6b08a0b24a782b78a11', 'student', 'B.Tech CS Semester 5 Student', 'Computer Science & Engineering'),
(2, 'Harshi', 'harshi@miet.ac.in', 'pbkdf2:sha256:600000$MIETCampus2026$8e2b50d89747e9c7a454d60c7b20250a0a36f0b04e85c6b08a0b24a782b78a11', 'student', 'B.Tech CS Semester 5 Student', 'Computer Science & Engineering'),
(3, 'Pranjal', 'pranjal@miet.ac.in', 'pbkdf2:sha256:600000$MIETCampus2026$8e2b50d89747e9c7a454d60c7b20250a0a36f0b04e85c6b08a0b24a782b78a11', 'student', 'B.Tech CS Semester 5 Student', 'Computer Science & Engineering'),
(4, 'Manvi', 'manvi@miet.ac.in', 'pbkdf2:sha256:600000$MIETCampus2026$8e2b50d89747e9c7a454d60c7b20250a0a36f0b04e85c6b08a0b24a782b78a11', 'student', 'B.Tech CS Semester 5 Student', 'Computer Science & Engineering'),
(5, 'Dr. S. K. Sharma', 'sk.sharma@miet.ac.in', 'pbkdf2:sha256:600000$MIETCampus2026$8e2b50d89747e9c7a454d60c7b20250a0a36f0b04e85c6b08a0b24a782b78a11', 'admin', 'Professor & Head of Department (CSE)', 'Computer Science & Engineering'),
(6, 'Dr. Neha Agarwal', 'neha.agarwal@miet.ac.in', 'pbkdf2:sha256:600000$MIETCampus2026$8e2b50d89747e9c7a454d60c7b20250a0a36f0b04e85c6b08a0b24a782b78a11', 'admin', 'Associate Professor & Academic Coordinator', 'Computer Science & Engineering');

-- 2. SEED STUDENTS
INSERT INTO students (id, user_id, roll_no, enrollment_no, name, email, branch, semester, section, batch, phone, advisor, sgpa, cgpa) VALUES
(1, 1, '2200680100041', 'MIET/CS/22/041', 'Gauri', 'gauri@miet.ac.in', 'CS', 5, 'CS-5A', '2022-2026', '+91-9837014101', 'Dr. S. K. Sharma', 8.92, 8.76),
(2, 2, '2200680100058', 'MIET/CS/22/058', 'Harshi', 'harshi@miet.ac.in', 'CS', 5, 'CS-5A', '2022-2026', '+91-9837014102', 'Dr. Neha Agarwal', 8.35, 8.18),
(3, 3, '2200680100094', 'MIET/CS/22/094', 'Pranjal', 'pranjal@miet.ac.in', 'CS', 5, 'CS-5A', '2022-2026', '+91-9837014103', 'Dr. S. K. Sharma', 9.24, 9.08),
(4, 4, '2200680100072', 'MIET/CS/22/072', 'Manvi', 'manvi@miet.ac.in', 'CS', 5, 'CS-5A', '2022-2026', '+91-9837014104', 'Dr. Neha Agarwal', 7.88, 7.95);

-- 3. SEED NOTICES
INSERT INTO notices (id, ref_no, title, category, content, is_important, posted_by, posted_date, deadline_date) VALUES
(1, 'MIET/ACAD/2026/108', 'Pre-University Test (PUT) Schedule & Examination Guidelines for B.Tech Semester V', 'Examination', 'All B.Tech Computer Science (Semester 5) students are hereby informed that the Pre-University Test (PUT) for the Odd Semester 2026-27 will commence from November 16, 2026. Students must maintain a minimum of 75% aggregate attendance to be eligible for hall ticket issuance. Any pending laboratory records and internal assessment sheets must be countersigned by respective subject faculty on or before November 10, 2026. Carrying smartwatches, mobile phones, or programmable calculators inside the examination block (Block A & Block C) is strictly prohibited.', 1, 'Dr. S. K. Sharma', '2026-10-05', '2026-11-10'),
(2, 'MIET/CSE/2026/114', 'Mandatory B.Tech 5th Semester Mini-Project Synopsis & Mid-Term Progress Review', 'Academic', 'The Department of Computer Science & Engineering will conduct the Mid-Term Mini-Project Evaluation for all Semester 5 batches on October 22, 2026 in the Darwin Block AI Lab (Lab-304). Each project group must bring a working prototype demonstration, database ER diagram, GitHub repository link, and a 10-page IEEE format synopsis report. Project guides Dr. S. K. Sharma and Dr. Neha Agarwal will evaluate database connectivity and real-time execution before approving final viva slots.', 1, 'Dr. Neha Agarwal', '2026-10-06', '2026-10-22'),
(3, 'MIET/TNP/2026/089', 'Pre-Placement Technical Bootcamp on Cloud Architecture & Generative AI', 'Placement & Training', 'The Training and Placement Cell, MIET Meerut, in collaboration with the Department of CSE, is organizing a 5-day Intensive Hands-On Bootcamp on Full-Stack Python, Relational Databases, and Enterprise AI Integration for 3rd-year (Semester 5) CS students. Attendance in the bootcamp carries 5 bonus internal marks in Industrial Training assessment. Interested students must complete portal registration by October 15, 2026.', 0, 'Dr. S. K. Sharma', '2026-10-03', '2026-10-15'),
(4, 'MIET/ADMIN/2026/119', 'AKTU Odd Semester Examination Form Verification & Scholarship Renewal Notice', 'Administration', 'All B.Tech Semester 5 students are advised to verify their elective subject codes (BCS501, BCS502, BCS503, BCS054, BCS055) on the AKTU ERP portal and submit the signed hardcopy of the examination verification slip at the CSE Departmental Office (Room A-202) by October 19, 2026. Students applying for UP State Merit Scholarship renewal must attach their 4th-semester attested mark sheet.', 1, 'Dr. Neha Agarwal', '2026-10-07', '2026-10-19'),
(5, 'MIET/LIB/2026/064', 'Extended Central Library & Digital Reference Hours During Sessional Exams', 'Library', 'To facilitate academic preparation for upcoming sessional tests and project submissions, the MIET Central Library and IEEE/Springer Digital Reference Section will remain open from 08:00 AM to 09:30 PM on all working days and Saturdays until November 30, 2026.', 0, 'Dr. S. K. Sharma', '2026-10-01', '2026-11-30');

-- 4. SEED ASSIGNMENTS
INSERT INTO assignments (id, subject_code, subject, title, description, deadline, max_marks, faculty, branch, semester, status) VALUES
(1, 'BCS501', 'Database Management Systems', 'Relational Schema Normalization (3NF/BCNF) & SQL Transaction Concurrency Control', 'Design a complete normalized relational database schema for an enterprise university portal. Write SQL DDL/DML scripts demonstrating foreign key constraints, indexing, ACID transaction isolation levels, and deadlock prevention queries.', '2026-10-14', 20, 'Dr. Neha Agarwal', 'CS', 5, 'Pending'),
(2, 'BCS502', 'Compiler Design', 'LL(1) Predictive Parser & Lexical Analyzer Implementation in Python/C', 'Construct a lexical analyzer for arithmetic and conditional expressions, eliminate left recursion from the given context-free grammar, compute FIRST and FOLLOW sets, and generate the LL(1) parsing table.', '2026-10-18', 20, 'Dr. S. K. Sharma', 'CS', 5, 'Pending'),
(3, 'BCS503', 'Design and Analysis of Algorithms', 'Dynamic Programming & Graph Shortest-Path Complexity Benchmark', 'Implement Dijkstra, Bellman-Ford, and Floyd-Warshall algorithms on weighted directed graphs. Compare empirical execution times and asymptotic space-time complexities with a detailed analytical report.', '2026-10-21', 20, 'Prof. Vikramaditya Verma', 'CS', 5, 'Pending'),
(4, 'BCS054', 'Artificial Intelligence & Machine Learning', 'Heuristic Search (A* Algorithm) & Contextual RAG Agent Architecture', 'Implement A* search with admissible heuristics for pathfinding and write a technical case study on Grounded Retrieval-Augmented Generation using relational SQL context and Gemini LLM API.', '2026-10-25', 25, 'Dr. S. K. Sharma', 'CS', 5, 'Pending'),
(5, 'BCS055', 'Computer Networks', 'TCP Congestion Control Simulation & Subnetting Topology Design', 'Configure an enterprise multi-department VLAN and CIDR subnetting plan for 4 campus blocks. Analyze TCP Tahoe vs Reno congestion window traces using packet capture logs.', '2026-10-28', 15, 'Prof. Ankit Bansal', 'CS', 5, 'Pending');

-- 5. SEED TIMETABLE
INSERT INTO timetable (id, day_of_week, subject_code, subject, faculty, start_time, end_time, time_slot, classroom, lecture_type, branch, semester) VALUES
(1, 'Monday', 'BCS501', 'Database Management Systems', 'Dr. Neha Agarwal', '09:00', '10:00', '09:00 AM - 10:00 AM', 'Room A-301', 'Lecture', 'CS', 5),
(2, 'Monday', 'BCS502', 'Compiler Design', 'Dr. S. K. Sharma', '10:00', '11:00', '10:00 AM - 11:00 AM', 'Room A-301', 'Lecture', 'CS', 5),
(3, 'Monday', 'BCS503', 'Design and Analysis of Algorithms', 'Prof. Vikramaditya Verma', '11:15', '12:15', '11:15 AM - 12:15 PM', 'Room A-302', 'Lecture', 'CS', 5),
(4, 'Monday', 'BCS551', 'DBMS Lab', 'Dr. Neha Agarwal', '14:00', '16:00', '02:00 PM - 04:00 PM', 'Lab C-102 (DBMS Lab)', 'Lab', 'CS', 5),
(5, 'Tuesday', 'BCS054', 'Artificial Intelligence & Machine Learning', 'Dr. S. K. Sharma', '09:00', '10:00', '09:00 AM - 10:00 AM', 'Room A-301', 'Lecture', 'CS', 5),
(6, 'Tuesday', 'BCS055', 'Computer Networks', 'Prof. Ankit Bansal', '10:00', '11:00', '10:00 AM - 11:00 AM', 'Room A-301', 'Lecture', 'CS', 5),
(7, 'Tuesday', 'BCS501', 'Database Management Systems', 'Dr. Neha Agarwal', '11:15', '12:15', '11:15 AM - 12:15 PM', 'Room A-301', 'Lecture', 'CS', 5),
(8, 'Tuesday', 'BCS552', 'Compiler Design Lab', 'Dr. S. K. Sharma', '14:00', '16:00', '02:00 PM - 04:00 PM', 'Lab C-204 (Systems Lab)', 'Lab', 'CS', 5),
(9, 'Wednesday', 'BCS503', 'Design and Analysis of Algorithms', 'Prof. Vikramaditya Verma', '09:00', '10:00', '09:00 AM - 10:00 AM', 'Room A-301', 'Lecture', 'CS', 5),
(10, 'Wednesday', 'BCS502', 'Compiler Design', 'Dr. S. K. Sharma', '10:00', '11:00', '10:00 AM - 11:00 AM', 'Room A-301', 'Lecture', 'CS', 5),
(11, 'Wednesday', 'BCS054', 'Artificial Intelligence & Machine Learning', 'Dr. S. K. Sharma', '11:15', '12:15', '11:15 AM - 12:15 PM', 'Room A-304', 'Lecture', 'CS', 5),
(12, 'Wednesday', 'BCS553', 'Algorithms & AI Lab', 'Dr. S. K. Sharma', '14:00', '16:00', '02:00 PM - 04:00 PM', 'Lab A-304 (Darwin AI Lab)', 'Lab', 'CS', 5),
(13, 'Thursday', 'BCS055', 'Computer Networks', 'Prof. Ankit Bansal', '09:00', '10:00', '09:00 AM - 10:00 AM', 'Room A-301', 'Lecture', 'CS', 5),
(14, 'Thursday', 'BCS501', 'Database Management Systems', 'Dr. Neha Agarwal', '10:00', '11:00', '10:00 AM - 11:00 AM', 'Room A-301', 'Lecture', 'CS', 5),
(15, 'Thursday', 'BCS503', 'Design and Analysis of Algorithms', 'Prof. Vikramaditya Verma', '11:15', '12:15', '11:15 AM - 12:15 PM', 'Room A-302', 'Tutorial', 'CS', 5),
(16, 'Thursday', 'BCS054', 'Artificial Intelligence & Machine Learning', 'Dr. S. K. Sharma', '14:00', '15:00', '02:00 PM - 03:00 PM', 'Room A-301', 'Lecture', 'CS', 5),
(17, 'Friday', 'BCS502', 'Compiler Design', 'Dr. S. K. Sharma', '09:00', '10:00', '09:00 AM - 10:00 AM', 'Room A-301', 'Lecture', 'CS', 5),
(18, 'Friday', 'BCS055', 'Computer Networks', 'Prof. Ankit Bansal', '10:00', '11:00', '10:00 AM - 11:00 AM', 'Room A-301', 'Lecture', 'CS', 5),
(19, 'Friday', 'BCS501', 'Database Management Systems', 'Dr. Neha Agarwal', '11:15', '12:15', '11:15 AM - 12:15 PM', 'Room A-301', 'Tutorial', 'CS', 5),
(20, 'Friday', 'BCS554', 'Mini Project & Seminar', 'Dr. Neha Agarwal', '14:00', '16:00', '02:00 PM - 04:00 PM', 'Lab A-304 (Darwin AI Lab)', 'Lab', 'CS', 5),
(21, 'Saturday', 'BCS054', 'Artificial Intelligence & Machine Learning', 'Dr. S. K. Sharma', '09:30', '10:30', '09:30 AM - 10:30 AM', 'Room A-301', 'Tutorial', 'CS', 5),
(22, 'Saturday', 'BCS055', 'Computer Networks', 'Prof. Ankit Bansal', '10:30', '11:30', '10:30 AM - 11:30 AM', 'Room A-301', 'Tutorial', 'CS', 5);

-- 6. SEED ATTENDANCE
-- Student 1: Gauri
INSERT INTO attendance (student_id, subject_code, subject, faculty, attended_classes, total_classes) VALUES
(1, 'BCS501', 'Database Management Systems', 'Dr. Neha Agarwal', 38, 42),
(1, 'BCS502', 'Compiler Design', 'Dr. S. K. Sharma', 35, 40),
(1, 'BCS503', 'Design and Analysis of Algorithms', 'Prof. Vikramaditya Verma', 34, 38),
(1, 'BCS054', 'Artificial Intelligence & Machine Learning', 'Dr. S. K. Sharma', 33, 36),
(1, 'BCS055', 'Computer Networks', 'Prof. Ankit Bansal', 25, 35),
(1, 'BCS551', 'DBMS & AI Integrated Lab', 'Dr. Neha Agarwal', 18, 20);

-- Student 2: Harshi
INSERT INTO attendance (student_id, subject_code, subject, faculty, attended_classes, total_classes) VALUES
(2, 'BCS501', 'Database Management Systems', 'Dr. Neha Agarwal', 35, 42),
(2, 'BCS502', 'Compiler Design', 'Dr. S. K. Sharma', 27, 40),
(2, 'BCS503', 'Design and Analysis of Algorithms', 'Prof. Vikramaditya Verma', 27, 38),
(2, 'BCS054', 'Artificial Intelligence & Machine Learning', 'Dr. S. K. Sharma', 31, 36),
(2, 'BCS055', 'Computer Networks', 'Prof. Ankit Bansal', 30, 35),
(2, 'BCS551', 'DBMS & AI Integrated Lab', 'Dr. Neha Agarwal', 17, 20);

-- Student 3: Pranjal
INSERT INTO attendance (student_id, subject_code, subject, faculty, attended_classes, total_classes) VALUES
(3, 'BCS501', 'Database Management Systems', 'Dr. Neha Agarwal', 40, 42),
(3, 'BCS502', 'Compiler Design', 'Dr. S. K. Sharma', 37, 40),
(3, 'BCS503', 'Design and Analysis of Algorithms', 'Prof. Vikramaditya Verma', 36, 38),
(3, 'BCS054', 'Artificial Intelligence & Machine Learning', 'Dr. S. K. Sharma', 35, 36),
(3, 'BCS055', 'Computer Networks', 'Prof. Ankit Bansal', 31, 35),
(3, 'BCS551', 'DBMS & AI Integrated Lab', 'Dr. Neha Agarwal', 19, 20);

-- Student 4: Manvi
INSERT INTO attendance (student_id, subject_code, subject, faculty, attended_classes, total_classes) VALUES
(4, 'BCS501', 'Database Management Systems', 'Dr. Neha Agarwal', 28, 42),
(4, 'BCS502', 'Compiler Design', 'Dr. S. K. Sharma', 31, 40),
(4, 'BCS503', 'Design and Analysis of Algorithms', 'Prof. Vikramaditya Verma', 30, 38),
(4, 'BCS054', 'Artificial Intelligence & Machine Learning', 'Dr. S. K. Sharma', 25, 36),
(4, 'BCS055', 'Computer Networks', 'Prof. Ankit Bansal', 29, 35),
(4, 'BCS551', 'DBMS & AI Integrated Lab', 'Dr. Neha Agarwal', 18, 20);

-- 7. SEED EXAMS
INSERT INTO exams (id, exam_type, subject_code, subject, exam_date, exam_time, room, max_marks, branch, semester, syllabus_notes) VALUES
(1, 'Pre-University Test (PUT)', 'BCS501', 'Database Management Systems', '2026-11-16', '09:30 AM - 12:30 PM', 'Block A - Hall 101', 100, 'CS', 5, 'Units 1 to 5: ER Modeling, SQL, Normalization (BCNF/4NF), Transaction Processing & Concurrency Control'),
(2, 'Pre-University Test (PUT)', 'BCS502', 'Compiler Design', '2026-11-18', '09:30 AM - 12:30 PM', 'Block A - Hall 101', 100, 'CS', 5, 'Units 1 to 5: Lexical Analysis, LL/LR Parsing, Syntax Directed Translation, Three-Address Code & Optimization'),
(3, 'Pre-University Test (PUT)', 'BCS503', 'Design and Analysis of Algorithms', '2026-11-20', '09:30 AM - 12:30 PM', 'Block A - Hall 102', 100, 'CS', 5, 'Units 1 to 5: Divide & Conquer, Greedy, Dynamic Programming, Backtracking, NP-Completeness'),
(4, 'Pre-University Test (PUT)', 'BCS054', 'Artificial Intelligence & Machine Learning', '2026-11-23', '09:30 AM - 12:30 PM', 'Block C - Hall 201', 100, 'CS', 5, 'Units 1 to 5: Informed Search, First-Order Logic, Bayesian Networks, Supervised Learning & Neural Nets'),
(5, 'Pre-University Test (PUT)', 'BCS055', 'Computer Networks', '2026-11-25', '09:30 AM - 12:30 PM', 'Block C - Hall 201', 100, 'CS', 5, 'Units 1 to 5: OSI/TCP-IP Stack, Data Link Framing, IPv4/IPv6 Routing, TCP/UDP & Network Security');

-- 8. SEED RESULTS
-- Gauri
INSERT INTO results (student_id, subject_code, subject, credits, internal_marks, max_internal, external_marks, max_external, grade, grade_points, semester) VALUES
(1, 'BCS501', 'Database Management Systems', 4, 28, 30, 62, 70, 'A+', 10, 5),
(1, 'BCS502', 'Compiler Design', 4, 26, 30, 58, 70, 'A', 9, 5),
(1, 'BCS503', 'Design and Analysis of Algorithms', 4, 27, 30, 59, 70, 'A', 9, 5),
(1, 'BCS054', 'Artificial Intelligence & Machine Learning', 3, 28, 30, 63, 70, 'A+', 10, 5),
(1, 'BCS055', 'Computer Networks', 3, 23, 30, 51, 70, 'B+', 8, 5),
(1, 'BCS551', 'DBMS & AI Integrated Lab', 2, 29, 30, 64, 70, 'A+', 10, 5);

-- Harshi
INSERT INTO results (student_id, subject_code, subject, credits, internal_marks, max_internal, external_marks, max_external, grade, grade_points, semester) VALUES
(2, 'BCS501', 'Database Management Systems', 4, 26, 30, 57, 70, 'A', 9, 5),
(2, 'BCS502', 'Compiler Design', 4, 22, 30, 49, 70, 'B+', 8, 5),
(2, 'BCS503', 'Design and Analysis of Algorithms', 4, 23, 30, 52, 70, 'B+', 8, 5),
(2, 'BCS054', 'Artificial Intelligence & Machine Learning', 3, 27, 30, 58, 70, 'A', 9, 5),
(2, 'BCS055', 'Computer Networks', 3, 26, 30, 56, 70, 'A', 9, 5),
(2, 'BCS551', 'DBMS & AI Integrated Lab', 2, 27, 30, 61, 70, 'A', 9, 5);

-- Pranjal
INSERT INTO results (student_id, subject_code, subject, credits, internal_marks, max_internal, external_marks, max_external, grade, grade_points, semester) VALUES
(3, 'BCS501', 'Database Management Systems', 4, 29, 30, 65, 70, 'A+', 10, 5),
(3, 'BCS502', 'Compiler Design', 4, 28, 30, 61, 70, 'A', 9, 5),
(3, 'BCS503', 'Design and Analysis of Algorithms', 4, 29, 30, 63, 70, 'A+', 10, 5),
(3, 'BCS054', 'Artificial Intelligence & Machine Learning', 3, 29, 30, 66, 70, 'A+', 10, 5),
(3, 'BCS055', 'Computer Networks', 3, 26, 30, 57, 70, 'A', 9, 5),
(3, 'BCS551', 'DBMS & AI Integrated Lab', 2, 30, 30, 66, 70, 'A+', 10, 5);

-- Manvi
INSERT INTO results (student_id, subject_code, subject, credits, internal_marks, max_internal, external_marks, max_external, grade, grade_points, semester) VALUES
(4, 'BCS501', 'Database Management Systems', 4, 22, 30, 48, 70, 'B', 7, 5),
(4, 'BCS502', 'Compiler Design', 4, 24, 30, 54, 70, 'B+', 8, 5),
(4, 'BCS503', 'Design and Analysis of Algorithms', 4, 25, 30, 55, 70, 'A', 9, 5),
(4, 'BCS054', 'Artificial Intelligence & Machine Learning', 3, 21, 30, 49, 70, 'B', 7, 5),
(4, 'BCS055', 'Computer Networks', 3, 26, 30, 58, 70, 'A', 9, 5),
(4, 'BCS551', 'DBMS & AI Integrated Lab', 2, 27, 30, 60, 70, 'A', 9, 5);

-- 9. SEED EVENTS
INSERT INTO events (id, title, category, event_date, event_time, venue, organizer, description, registration_status) VALUES
(1, 'MIET HackFest 2026 – 24-Hour National AI & Sustainability Hackathon', 'Hackathon', '2026-10-24', '09:00 AM Onwards', 'MIET Main Auditorium & Darwin Block Labs', 'Department of CSE & MIET Incubation Forum', 'Flagship 24-hour inter-college hackathon focusing on Generative AI, Smart Campus Automation, FinTech, and Healthcare. Cash prizes worth Rs. 75,000 and direct internship interviews for top 5 teams.', 'Open'),
(2, 'Expert Colloquium: Large Language Models & Enterprise RAG Systems', 'Technical Seminar', '2026-10-17', '11:00 AM - 01:30 PM', 'Seminar Hall-2, Block A', 'CSI Student Chapter, MIET', 'Distinguished lecture and live coding demonstration on grounding Google Gemini models with relational SQL databases for zero-hallucination academic and enterprise assistants.', 'Open'),
(3, 'Kolahal 2026 – Annual Cultural & Literary Conclave Auditions', 'Cultural', '2026-11-04', '02:30 PM - 05:00 PM', 'Open Air Theatre (OAT), MIET Campus', 'MIET Cultural Committee', 'Preliminary selections for technical debate, battle of bands, street theatre, and coding quiz ahead of the annual Kolahal festival.', 'Registration Closing Soon'),
(4, 'AKTU Zonal Inter-Engineering Sports Meet – Trials & Selection', 'Sports', '2026-10-30', '03:30 PM - 05:30 PM', 'MIET Main Sports Ground', 'MIET Sports Council', 'Selection trials for Basketball, Badminton, Table Tennis, and Chess teams representing Meerut Institute of Engineering and Technology at the AKTU Zonal Championship.', 'Open');
