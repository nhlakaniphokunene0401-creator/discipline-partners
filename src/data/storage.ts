import {
  AppUser,
  StaffUser,
  ParentUser,
  LearnerUser,
  LearnerRosterItem,
  DailyAttendance,
  SchoolTask,
  SchoolAnnouncement,
  SchoolResource,
  ExamTimetableItem,
  ClassTimetablePeriod,
  AttendanceStatus,
} from "../types";

// LocalStorage Keys
export const STORAGE_KEYS = {
  USERS: "dp_users",
  ACTIVE_SESSION: "dp_active_session",
  LEARNERS_PREFIX: "dp_learners_", // dp_learners_{centre}
  ATTENDANCE_PREFIX: "dp_attendance_", // dp_attendance_{centre}_{date}
  TASKS_PREFIX: "dp_tasks_", // dp_tasks_{centre}
  ANNOUNCEMENTS_PREFIX: "dp_announcements_", // dp_announcements_{centre}
  RESOURCES_PREFIX: "dp_resources_", // dp_resources_{centre}
  EXAM_TIMETABLE_PREFIX: "dp_exam_timetable_", // dp_exam_timetable_{centre}
  CLASS_TIMETABLE_PREFIX: "dp_class_timetable_", // dp_class_timetable_{centre}
};

/* ============================================================
   USER AUTHENTICATION & SESSION MANAGEMENT
   NO DEMO DATA - Starts completely empty!
   ============================================================ */

export function getAllUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUser(user: AppUser): { success: boolean; message: string } {
  try {
    const users = getAllUsers();

    if (user.role === "staff") {
      const staffUser = user as StaffUser;
      const existing = users.find(
        (u) =>
          u.role === "staff" &&
          (u as StaffUser).examCentreNumber === staffUser.examCentreNumber &&
          (u as StaffUser).staffName.toLowerCase() === staffUser.staffName.toLowerCase()
      );
      if (existing) {
        return {
          success: false,
          message: "A staff account with this name and Exam Centre Number already exists.",
        };
      }
    } else if (user.role === "parent") {
      const parentUser = user as ParentUser;
      const existing = users.find(
        (u) =>
          u.role === "parent" &&
          (u as ParentUser).examCentreNumber === parentUser.examCentreNumber &&
          (u as ParentUser).learnerAdmissionNo.toLowerCase() ===
            parentUser.learnerAdmissionNo.toLowerCase() &&
          (u as ParentUser).parentPhone === parentUser.parentPhone
      );
      if (existing) {
        return {
          success: false,
          message:
            "A parent account for this learner admission number and contact is already registered.",
        };
      }
    } else if (user.role === "learner") {
      const learnerUser = user as LearnerUser;
      const existing = users.find(
        (u) =>
          u.role === "learner" &&
          (u as LearnerUser).examCentreNumber === learnerUser.examCentreNumber &&
          (u as LearnerUser).learnerAdmissionNo.toLowerCase() ===
            learnerUser.learnerAdmissionNo.toLowerCase()
      );
      if (existing) {
        return {
          success: false,
          message:
            "A learner account for this admission number at this school already exists.",
        };
      }
    }

    users.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { success: true, message: "Account registered successfully!" };
  } catch (err) {
    return { success: false, message: "Failed to save user account." };
  }
}

export function getCurrentSession(): AppUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentSession(user: AppUser): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(user));
}

export function clearCurrentSession(): void {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
}

// Staff Login: Exam Centre Number + Password
export function authenticateStaff(
  examCentreNumber: string,
  password: string
): { success: boolean; user?: StaffUser; message: string } {
  const users = getAllUsers();
  const cleanCentre = examCentreNumber.trim();
  const cleanPass = password.trim();

  const match = users.find(
    (u) =>
      u.role === "staff" &&
      (u as StaffUser).examCentreNumber === cleanCentre &&
      u.passwordHash === cleanPass
  ) as StaffUser | undefined;

  if (!match) {
    return {
      success: false,
      message:
        "Invalid Exam Centre Number or Password. If you are registering a new school centre, please Sign Up first.",
    };
  }

  return { success: true, user: match, message: "Login successful!" };
}

// Parent Login: School Exam Centre + Learner Full Name + Learner Admission/EMIS + Password
export function authenticateParent(
  examCentreNumber: string,
  learnerFullName: string,
  learnerAdmissionNo: string,
  password: string
): { success: boolean; user?: ParentUser; message: string } {
  const users = getAllUsers();
  const cleanCentre = examCentreNumber.trim();
  const cleanName = learnerFullName.trim().toLowerCase();
  const cleanAdm = learnerAdmissionNo.trim().toLowerCase();
  const cleanPass = password.trim();

  const match = users.find((u) => {
    if (u.role !== "parent") return false;
    const p = u as ParentUser;
    return (
      p.examCentreNumber === cleanCentre &&
      p.learnerAdmissionNo.toLowerCase() === cleanAdm &&
      p.learnerFullName.toLowerCase() === cleanName &&
      p.passwordHash === cleanPass
    );
  }) as ParentUser | undefined;

  if (!match) {
    return {
      success: false,
      message:
        "Parent credentials not found. Please verify the School, Learner Name, Admission/EMIS No, and Password, or Sign Up.",
    };
  }

  return { success: true, user: match, message: "Welcome back, Parent/Guardian!" };
}

// Learner Login: School Exam Centre + Full Name + Admission/EMIS + Password
export function authenticateLearner(
  examCentreNumber: string,
  learnerFullName: string,
  learnerAdmissionNo: string,
  password: string
): { success: boolean; user?: LearnerUser; message: string } {
  const users = getAllUsers();
  const cleanCentre = examCentreNumber.trim();
  const cleanName = learnerFullName.trim().toLowerCase();
  const cleanAdm = learnerAdmissionNo.trim().toLowerCase();
  const cleanPass = password.trim();

  const match = users.find((u) => {
    if (u.role !== "learner") return false;
    const l = u as LearnerUser;
    return (
      l.examCentreNumber === cleanCentre &&
      l.learnerAdmissionNo.toLowerCase() === cleanAdm &&
      l.learnerFullName.toLowerCase() === cleanName &&
      l.passwordHash === cleanPass
    );
  }) as LearnerUser | undefined;

  if (!match) {
    return {
      success: false,
      message:
        "Learner account not found. Please verify your School, Full Name, Admission/EMIS No, and Password, or Sign Up.",
    };
  }

  return { success: true, user: match, message: "Welcome, Learner!" };
}

/* ============================================================
   LEARNER ROSTER MANAGEMENT (Staff registers Grade 10-12 learners)
   Empty at start!
   ============================================================ */

export function getLearners(examCentreNumber: string): LearnerRosterItem[] {
  try {
    const raw = localStorage.getItem(
      `${STORAGE_KEYS.LEARNERS_PREFIX}${examCentreNumber}`
    );
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLearner(
  learner: LearnerRosterItem
): { success: boolean; message: string } {
  try {
    const key = `${STORAGE_KEYS.LEARNERS_PREFIX}${learner.examCentreNumber}`;
    const list = getLearners(learner.examCentreNumber);
    const existing = list.find(
      (l) => l.admissionNo.toLowerCase() === learner.admissionNo.toLowerCase()
    );

    if (existing) {
      return {
        success: false,
        message: `Learner with Admission No ${learner.admissionNo} already exists in this school.`,
      };
    }

    list.push(learner);
    localStorage.setItem(key, JSON.stringify(list));
    return { success: true, message: "Learner added to school roster!" };
  } catch (err) {
    return { success: false, message: "Failed to save learner record." };
  }
}

export function deleteLearner(
  examCentreNumber: string,
  learnerId: string
): void {
  const key = `${STORAGE_KEYS.LEARNERS_PREFIX}${examCentreNumber}`;
  const list = getLearners(examCentreNumber).filter((l) => l.id !== learnerId);
  localStorage.setItem(key, JSON.stringify(list));
}

/* ============================================================
   DAILY ATTENDANCE SYSTEM (Staff records 1-tap register)
   Key: dp_attendance_{centre}_{date}
   ============================================================ */

export function getAttendance(
  examCentreNumber: string,
  date: string
): DailyAttendance | null {
  try {
    const key = `${STORAGE_KEYS.ATTENDANCE_PREFIX}${examCentreNumber}_${date}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAttendance(attendance: DailyAttendance): void {
  const key = `${STORAGE_KEYS.ATTENDANCE_PREFIX}${attendance.examCentreNumber}_${attendance.date}`;
  localStorage.setItem(key, JSON.stringify(attendance));
}

export function getLearnerAttendanceHistory(
  examCentreNumber: string,
  learnerId: string,
  daysBack: number = 30
): { date: string; status: AttendanceStatus; reason?: string }[] {
  const history: { date: string; status: AttendanceStatus; reason?: string }[] =
    [];
  const today = new Date();

  for (let i = 0; i < daysBack; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    const att = getAttendance(examCentreNumber, dateStr);
    if (att && att.records[learnerId]) {
      history.push({
        date: dateStr,
        status: att.records[learnerId].status,
        reason: att.records[learnerId].reason,
      });
    }
  }

  return history;
}

/* ============================================================
   TASKS & ASSIGNMENTS (Status only: Submitted / Not Submitted)
   Key: dp_tasks_{centre}
   ============================================================ */

export function getTasks(examCentreNumber: string): SchoolTask[] {
  try {
    const key = `${STORAGE_KEYS.TASKS_PREFIX}${examCentreNumber}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTask(task: SchoolTask): void {
  const key = `${STORAGE_KEYS.TASKS_PREFIX}${task.examCentreNumber}`;
  const list = getTasks(task.examCentreNumber);
  const existingIndex = list.findIndex((t) => t.id === task.id);
  if (existingIndex >= 0) {
    list[existingIndex] = task;
  } else {
    list.unshift(task);
  }
  localStorage.setItem(key, JSON.stringify(list));
}

export function toggleLearnerSubmission(
  examCentreNumber: string,
  taskId: string,
  learnerId: string,
  status: "submitted" | "not_submitted"
): void {
  const tasks = getTasks(examCentreNumber);
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    if (!task.submissions) task.submissions = {};
    task.submissions[learnerId] = status;
    saveTask(task);
  }
}

/* ============================================================
   ANNOUNCEMENTS & NEWSLETTERS (<90 days viewed box)
   Key: dp_announcements_{centre}
   ============================================================ */

export function getAnnouncements(
  examCentreNumber: string
): SchoolAnnouncement[] {
  try {
    const key = `${STORAGE_KEYS.ANNOUNCEMENTS_PREFIX}${examCentreNumber}`;
    const raw = localStorage.getItem(key);
    const list: SchoolAnnouncement[] = raw ? JSON.parse(raw) : [];

    // Filter < 90 days as required by spec!
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    return list.filter((item) => new Date(item.createdAt) >= ninetyDaysAgo);
  } catch {
    return [];
  }
}

export function saveAnnouncement(announcement: SchoolAnnouncement): void {
  const key = `${STORAGE_KEYS.ANNOUNCEMENTS_PREFIX}${announcement.examCentreNumber}`;
  const list = getAnnouncements(announcement.examCentreNumber);
  list.unshift(announcement);
  localStorage.setItem(key, JSON.stringify(list));
}

/* ============================================================
   SCHOOL RESOURCES & eLIBRARY UPLOADS
   Key: dp_resources_{centre}
   Buttons: 'Upload Textbook' / 'Upload PDF' / 'Upload Notes'
   ============================================================ */

export function getResources(examCentreNumber: string): SchoolResource[] {
  try {
    const key = `${STORAGE_KEYS.RESOURCES_PREFIX}${examCentreNumber}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveResource(resource: SchoolResource): void {
  const key = `${STORAGE_KEYS.RESOURCES_PREFIX}${resource.examCentreNumber}`;
  const list = getResources(resource.examCentreNumber);
  list.unshift(resource);
  localStorage.setItem(key, JSON.stringify(list));
}

/* ============================================================
   EXAM & CLASS TIMETABLES
   ============================================================ */

export function getExamTimetable(
  examCentreNumber: string
): ExamTimetableItem[] {
  try {
    const key = `${STORAGE_KEYS.EXAM_TIMETABLE_PREFIX}${examCentreNumber}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveExamTimetable(
  examCentreNumber: string,
  items: ExamTimetableItem[]
): void {
  const key = `${STORAGE_KEYS.EXAM_TIMETABLE_PREFIX}${examCentreNumber}`;
  localStorage.setItem(key, JSON.stringify(items));
}

export function getClassTimetable(
  examCentreNumber: string
): ClassTimetablePeriod[] {
  try {
    const key = `${STORAGE_KEYS.CLASS_TIMETABLE_PREFIX}${examCentreNumber}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveClassTimetable(
  examCentreNumber: string,
  periods: ClassTimetablePeriod[]
): void {
  const key = `${STORAGE_KEYS.CLASS_TIMETABLE_PREFIX}${examCentreNumber}`;
  localStorage.setItem(key, JSON.stringify(periods));
}
