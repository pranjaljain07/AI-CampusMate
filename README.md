# AI CampusMate – Intelligent College Assistant (MIET)

**B.Tech Computer Science & Engineering Academic Project**  
**Institute:** Meerut Institute of Engineering and Technology (MIET)

---

## 1. Project Overview

**AI CampusMate** is a full-stack intelligent college assistant for B.Tech students and faculty administrators at MIET. Students can access personalized academic data (attendance, SGPA/CGPA results, today's timetable, pending assignments, examination schedule, official circulars, and campus events) and ask natural-language questions to an AI assistant powered by the **Google Gemini API** grounded on **MySQL (`ai_database`)**.

---

## 2. Technology Stack & Academic Mapping

- **Frontend Structure:** HTML5 (`templates/*.html`)
- **Frontend Styling:** CSS3 (`static/css/style.css`)
- **Frontend Logic:** Vanilla JavaScript (`static/js/*.js`)
- **Backend Language:** Python 3
- **Backend Framework:** Flask (`app.py`)
- **Database:** MySQL (`ai_database` via `database/schema.sql` and `database/seed.sql`)
- **AI Engine:** Google Gemini API (`services/gemini_service.py`)

---

## 3. Pre-Configured Demo Accounts (CS · Semester 5 & Admins)



### Students (CS · Semester 5)
- **Gauri:** `gauri@miet.ac.in` (Roll: `2200680100041`)
- **Harshi:** `harshi@miet.ac.in` (Roll: `2200680100058`)
- **Pranjal:** `pranjal@miet.ac.in` (Roll: `2200680100094`)
- **Manvi:** `manvi@miet.ac.in` (Roll: `2200680100072`)

### Administrators / Faculty
- **Dr. S. K. Sharma:** `sk.sharma@miet.ac.in` (HOD CSE)
- **Dr. Neha Agarwal:** `neha.agarwal@miet.ac.in` (Academic Coordinator)

---

## 4. Windows Setup Guide (VS Code)

1. **Install Python & MySQL:**
   - Install Python 3.10+ (ensure "Add Python to PATH" is checked).
   - Ensure MySQL service is running on `localhost:3306`.

2. **Open in VS Code & Create Virtual Environment:**
   ```powershell
   python -m venv venv
   venv\Scripts\activate
   ```

3. **Install Requirements:**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Initialize MySQL Database (`ai_database`):**
   ```powershell
   mysql -u root -p < database/schema.sql
   mysql -u root -p < database/seed.sql
   ```

5. **Configure `.env` File:**
   ```powershell
   copy .env.example .env
   ```
   Provide your `DB_PASSWORD` and `GEMINI_API_KEY`.

6. **Start Application:**
   ```powershell
   python app.py
   ```
   Open `http://127.0.0.1:5000` in your web browser.
