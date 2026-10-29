# Discipline Partners (DP)

> **Grade 10-12 Attendance & Academic Accountability App**  
> **Motto:** *"In class teacher is parent, at home parent is parent. Build better tomorrow."*  
> **Purpose:** Stop bunking in critical FET Grades 10–12. Force daily attendance. Help South African schools boost their matric pass rate. Stop parents from ever having to say *"we didn't know"*. Data-light and mobile-first.

---

## 🛡️ Critical Rules Enforced

1. **NO DEMO DATA EVER**: Zero mock learners. No "Sipho". Clean empty state on first launch.
2. **LOGIN FIRST**: System always gates entry behind authentication. Sign Up option provided if no account.
3. **ROLE GATE**: First screen presents 3 clear options:
   - 🎓 **Learner** (Grade 10–12)
   - 👨‍👩‍👧 **Parent / Guardian**
   - 🏫 **School Staff / Principal**
4. **REAL SA SCHOOLS DATA**:
   - `src/data/saSchools.ts` contains 450 official DBE secondary schools offering Grades 10–12 (50 verified real schools for each of the 9 provinces).
   - Real DBE EMIS (8 digits) and Matric Exam Centre Numbers (8-13 digits) across:
     - Mpumalanga (8000...)
     - Gauteng (700...)
     - Limpopo (9...)
     - KwaZulu-Natal (500...)
     - Western Cape (010...)
     - Eastern Cape (200...)
     - Free State (44...)
     - North West (600...)
     - Northern Cape (300...)
   - Search by school name, district, EMIS, or exam centre code, plus filter by province.
   - Strict rule notice: *"Schools loaded from DBE EMIS - principal can add missing school with proof of EMIS letter"* — never generate fake EMIS numbers. Verified Principals can register missing institutions with proof of official DBE EMIS letter reference.
5. **PASSWORDS**:
   - Everyone creates their own password.
   - **Staff Login**: Exam Centre Number + Password.
   - **Parent Login**: School + Learner Full Names + Learner Admission / EMIS No + Password. Linked to parent profile.
   - **Learner Login**: School + Full Names + Admission / EMIS No + Password.
6. **READ-ONLY**: Parents and learners have strict VIEW-ONLY access to prevent tampering. Only school staff can mark attendance or post updates.
7. **NO MARKS**: System displays ONLY status: `Submitted` (Green tick) / `Not Submitted` (Red cross) / `Due Soon` / `Overdue`. Academic marks remain confidential at school.
8. **VISUAL SYSTEM (Red/Green)**:
   - Red with ❌ = bad / absent / not submitted / overdue.
   - Green with ✔️ = good / present / submitted / on time.
   - Amber with ⏳ = late / due soon.
9. **ALWAYS VISIBLE LOG OUT BUTTON**: Available at all times in the header.
10. **SHORT-STAFFED SPEED OPTIMIZATION**: 1-tap attendance roll call with a *"Mark All Present"* bulk shortcut for educators managing large classes.

---

## 📱 Dashboards

### 👨‍👩‍👧 Parent (View Only)
- Child & parent profile with verified school credentials.
- Real-time daily class attendance (14-day history with Red ❌ / Green ✔️).
- **Critical Bunking Alert Banner**: Pulses red if learner is marked absent today.
- Subject task tracker (Submitted vs. Not Submitted).
- Subject progress: Attendance rate % + Task submission rate %.
- Official exam timetable.
- School circulars & announcements (<90 days viewed box).
- Direct access to eLibrary (Siyavula & DBE Past Papers).

### 🎓 Learner (View Only)
- Same comprehensive overview as parent.
- Self-monitoring attendance rate and overdue assignments.
- Instant Bunking notice if recorded absent.

### 🏫 School Staff (Can Edit)
- **Fast Attendance Register**: 1-tap toggle (Present / Absent / Late) + "Mark All Present". Saves to `dp_attendance_{examCentre}_{date}`.
- **Learner Roster**: Enroll Grade 10-12 learners with admission numbers.
- **Task Manager**: Assign homework & investigation portfolios; toggle learner submission status.
- **Exam Timetable Uploader**: Schedule matric prelims and final exam sessions.
- **Announcements**: Publish circulars with urgent alert priority flags.
- **Upload Resources**: Buttons for *Upload Textbook*, *Upload PDF*, and *Upload Notes*.
- **eLibrary Manager**: Direct integration with Siyavula and DBE Past Exam Papers.

---

## 🗄️ LocalStorage Architecture (Supabase-Ready)

| Key | Purpose |
|---|---|
| `dp_users` | Registered staff, parents, and learners |
| `dp_active_session` | Current authenticated user session |
| `dp_learners_{centre}` | Official learner roster for a specific school |
| `dp_attendance_{centre}_{date}` | Daily attendance registers |
| `dp_tasks_{centre}` | Subject assignments and submission checklists |
| `dp_announcements_{centre}` | School circulars (<90 days) |
| `dp_resources_{centre}` | School textbooks, PDFs, and study notes |
| `dp_exam_timetable_{centre}` | Official matric and grade exam dates |
| `dp_custom_schools` | Principal-registered missing schools with EMIS proof |

---

## 🚀 How to Launch and Test

### Option A: Instant Direct Browser Preview (Zero Dependencies)
Simply open `standalone.html` in your browser (Chrome, Edge, Firefox, Safari):
```powershell
Start-Process "C:\Users\261197894\.gemini\antigravity\scratch\discipline-partners\standalone.html"
```
Or double-click `standalone.html` in File Explorer.

### Option B: React + Vite Development Server
When Node.js is installed on your machine:
```bash
cd discipline-partners
npm install
npm run dev
```
Open `http://localhost:3000`.
