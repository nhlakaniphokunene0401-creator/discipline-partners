export type ProvinceType =
  | "Eastern Cape"
  | "Free State"
  | "Gauteng"
  | "KwaZulu-Natal"
  | "Limpopo"
  | "Mpumalanga"
  | "North West"
  | "Northern Cape"
  | "Western Cape";

export interface SASchool {
  emis: string;
  examCentreNumber: string;
  schoolName: string;
  province: ProvinceType;
  district: string;
  quintile: number;
  hasGrade10_12: boolean;
  isPrincipalRegistered?: boolean;
  proofEmisLetterUrl?: string;
}

export type UserRole = "learner" | "parent" | "staff";

export interface BaseUser {
  id: string;
  role: UserRole;
  passwordHash: string; // Plain/hashed user password
  createdAt: string;
}

export interface StaffUser extends BaseUser {
  role: "staff";
  examCentreNumber: string;
  emis: string;
  schoolName: string;
  province: ProvinceType;
  staffName: string;
  staffRole: "Principal" | "Deputy Principal" | "HOD" | "Grade Head" | "Subject Teacher" | "Admin Clerk";
  isMasterAccount: boolean;
}

export interface ParentUser extends BaseUser {
  role: "parent";
  schoolEmis: string;
  examCentreNumber: string;
  schoolName: string;
  learnerFullName: string;
  learnerAdmissionNo: string;
  parentFullName: string;
  parentPhone: string;
  parentEmail?: string;
  relationship: "Mother" | "Father" | "Guardian" | "Grandparent" | "Other";
}

export interface LearnerUser extends BaseUser {
  role: "learner";
  schoolEmis: string;
  examCentreNumber: string;
  schoolName: string;
  learnerFullName: string;
  learnerAdmissionNo: string;
  grade: "10" | "11" | "12";
}

export type AppUser = StaffUser | ParentUser | LearnerUser;

export interface LearnerRosterItem {
  id: string;
  examCentreNumber: string;
  admissionNo: string;
  fullName: string;
  grade: "10" | "11" | "12";
  classGroup: string; // e.g., "10A", "11B", "12C"
  parentPhone?: string;
  parentName?: string;
  enrolledAt: string;
}

export type AttendanceStatus = "present" | "absent" | "late";

export interface LearnerAttendanceRecord {
  status: AttendanceStatus;
  timestamp: string;
  reason?: string;
}

export interface DailyAttendance {
  date: string; // YYYY-MM-DD
  examCentreNumber: string;
  grade: "10" | "11" | "12";
  classGroup: string;
  records: Record<string, LearnerAttendanceRecord>; // learnerId -> record
  markedBy: string;
  updatedAt: string;
}

export type TaskSubmissionStatus = "submitted" | "not_submitted" | "due_soon" | "overdue";

export interface SchoolTask {
  id: string;
  examCentreNumber: string;
  grade: "10" | "11" | "12";
  subject: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  createdAt: string;
  createdBy: string;
  submissions: Record<string, "submitted" | "not_submitted">; // learnerId -> status
}

export interface SchoolAnnouncement {
  id: string;
  examCentreNumber: string;
  schoolName: string;
  title: string;
  content: string;
  targetGrade: "all" | "10" | "11" | "12";
  isUrgent: boolean;
  authorName: string;
  createdAt: string; // ISO date
  logoUrl?: string;
}

export interface SchoolResource {
  id: string;
  examCentreNumber: string;
  type: "textbook" | "pdf" | "notes" | "past_paper";
  title: string;
  subject: string;
  grade: "10" | "11" | "12";
  fileDataOrUrl: string; // Base64 data or external URL
  fileName: string;
  fileSize?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ExamTimetableItem {
  id: string;
  examCentreNumber: string;
  grade: "10" | "11" | "12";
  subject: string;
  paperName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g., "09:00"
  duration: string; // e.g., "2h 30m"
  venue: string; // e.g., "Main Hall", "Room 14"
}

export interface ClassTimetablePeriod {
  id: string;
  examCentreNumber: string;
  grade: "10" | "11" | "12";
  classGroup: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  periodNumber: number;
  timeRange: string; // e.g., "08:00 - 08:45"
  subject: string;
  teacherName: string;
  room: string;
}
