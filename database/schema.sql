-- =============================================================================
-- AI CampusMate – Intelligent College Assistant (MIET)
-- Database Schema (MySQL)
-- Database Name: ai_database
-- =============================================================================

CREATE DATABASE IF NOT EXISTS ai_database
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ai_database;

DROP TABLE IF EXISTS results;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS exams;
DROP TABLE IF EXISTS timetable;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS notices;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS users;

-- 1. USERS TABLE
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
    designation VARCHAR(120) DEFAULT NULL,
    department VARCHAR(80) DEFAULT 'Computer Science & Engineering',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. STUDENTS TABLE
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    roll_no VARCHAR(30) NOT NULL UNIQUE,
    enrollment_no VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    branch VARCHAR(50) NOT NULL DEFAULT 'CS',
    semester INT NOT NULL DEFAULT 5,
    section VARCHAR(10) NOT NULL DEFAULT 'CS-5A',
    batch VARCHAR(20) NOT NULL DEFAULT '2022-2026',
    phone VARCHAR(20) NOT NULL,
    advisor VARCHAR(100) NOT NULL DEFAULT 'Dr. S. K. Sharma',
    sgpa DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    cgpa DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. NOTICES TABLE
CREATE TABLE notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ref_no VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(60) NOT NULL DEFAULT 'Academic',
    content TEXT NOT NULL,
    is_important TINYINT(1) NOT NULL DEFAULT 0,
    posted_by VARCHAR(100) NOT NULL DEFAULT 'Dr. S. K. Sharma',
    posted_date DATE NOT NULL,
    deadline_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. ASSIGNMENTS TABLE
CREATE TABLE assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_code VARCHAR(20) NOT NULL,
    subject VARCHAR(120) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    deadline DATE NOT NULL,
    max_marks INT NOT NULL DEFAULT 20,
    faculty VARCHAR(100) NOT NULL,
    branch VARCHAR(50) NOT NULL DEFAULT 'CS',
    semester INT NOT NULL DEFAULT 5,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. TIMETABLE TABLE
CREATE TABLE timetable (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
    subject_code VARCHAR(20) NOT NULL,
    subject VARCHAR(120) NOT NULL,
    faculty VARCHAR(100) NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    classroom VARCHAR(50) NOT NULL,
    lecture_type ENUM('Lecture', 'Lab', 'Tutorial') NOT NULL DEFAULT 'Lecture',
    branch VARCHAR(50) NOT NULL DEFAULT 'CS',
    semester INT NOT NULL DEFAULT 5
) ENGINE=InnoDB;

-- 6. ATTENDANCE TABLE
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_code VARCHAR(20) NOT NULL,
    subject VARCHAR(120) NOT NULL,
    faculty VARCHAR(100) NOT NULL,
    attended_classes INT NOT NULL DEFAULT 0,
    total_classes INT NOT NULL DEFAULT 0,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN total_classes > 0 THEN ROUND((attended_classes * 100.0) / total_classes, 2) ELSE 0.00 END
    ) STORED,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_student_subject (student_id, subject_code),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. EXAMS TABLE
CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_type VARCHAR(80) NOT NULL DEFAULT 'PUT / End Semester Exam',
    subject_code VARCHAR(20) NOT NULL,
    subject VARCHAR(120) NOT NULL,
    exam_date DATE NOT NULL,
    exam_time VARCHAR(50) NOT NULL,
    room VARCHAR(60) NOT NULL,
    max_marks INT NOT NULL DEFAULT 100,
    branch VARCHAR(50) NOT NULL DEFAULT 'CS',
    semester INT NOT NULL DEFAULT 5,
    syllabus_notes VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB;

-- 8. RESULTS TABLE
CREATE TABLE results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_code VARCHAR(20) NOT NULL,
    subject VARCHAR(120) NOT NULL,
    credits INT NOT NULL DEFAULT 4,
    internal_marks INT NOT NULL DEFAULT 0,
    max_internal INT NOT NULL DEFAULT 30,
    external_marks INT NOT NULL DEFAULT 0,
    max_external INT NOT NULL DEFAULT 70,
    total_marks INT GENERATED ALWAYS AS (internal_marks + external_marks) STORED,
    grade VARCHAR(5) NOT NULL DEFAULT 'A',
    grade_points INT NOT NULL DEFAULT 9,
    semester INT NOT NULL DEFAULT 5,
    UNIQUE KEY uq_result_student_subject (student_id, subject_code),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. EVENTS TABLE
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(60) NOT NULL DEFAULT 'Technical',
    event_date DATE NOT NULL,
    event_time VARCHAR(50) NOT NULL,
    venue VARCHAR(120) NOT NULL,
    organizer VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    registration_status VARCHAR(40) NOT NULL DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
