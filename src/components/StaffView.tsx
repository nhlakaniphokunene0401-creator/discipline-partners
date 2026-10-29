import React, { useState, useEffect } from "react";
import {
  StaffUser,
  LearnerRosterItem,
  DailyAttendance,
  AttendanceStatus,
  SchoolTask,
  SchoolAnnouncement,
  SchoolResource,
  ExamTimetableItem,
} from "../types";
import {
  getLearners,
  saveLearner,
  deleteLearner,
  getAttendance,
  saveAttendance,
  getTasks,
  saveTask,
  toggleLearnerSubmission,
  getAnnouncements,
  saveAnnouncement,
  getResources,
  saveResource,
  getExamTimetable,
  saveExamTimetable,
} from "../data/storage";

interface StaffViewProps {
  user: StaffUser;
  onLogout: () => void;
}

export const StaffView: React.FC<StaffViewProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<
    "attendance" | "roster" | "tasks" | "exams" | "announcements" | "resources"
  >("attendance");

  // School learners roster
  const [learners, setLearners] = useState<LearnerRosterItem[]>([]);

  // Attendance tab state
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedGrade, setSelectedGrade] = useState<"10" | "11" | "12">("10");
  const [selectedClassGroup, setSelectedClassGroup] = useState<string>("All");
  const [currentAttendance, setCurrentAttendance] = useState<DailyAttendance | null>(
    null
  );
  const [attendanceSaveNotice, setAttendanceSaveNotice] = useState<string>("");

  // Roster enrollment form
  const [newLearnerName, setNewLearnerName] = useState("");
  const [newLearnerAdm, setNewLearnerAdm] = useState("");
  const [newLearnerGrade, setNewLearnerGrade] = useState<"10" | "11" | "12">("10");
  const [newLearnerClass, setNewLearnerClass] = useState("10A");
  const [newLearnerParentPhone, setNewLearnerParentPhone] = useState("");
  const [rosterMsg, setRosterMsg] = useState("");

  // Task / Assignment state
  const [tasks, setTasks] = useState<SchoolTask[]>([]);
  const [taskSubject, setTaskSubject] = useState("Mathematics");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
  );
  const [taskGrade, setTaskGrade] = useState<"10" | "11" | "12">("10");
  const [taskDesc, setTaskDesc] = useState("");
  const [selectedTaskIdForSubmissions, setSelectedTaskIdForSubmissions] =
    useState<string | null>(null);

  // Exam Timetable state
  const [exams, setExams] = useState<ExamTimetableItem[]>([]);
  const [examSubject, setExamSubject] = useState("Physical Sciences");
  const [examPaper, setExamPaper] = useState("Paper 1 (Physics)");
  const [examDate, setExamDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
  );
  const [examStartTime, setExamStartTime] = useState("09:00");
  const [examDuration, setExamDuration] = useState("3 Hours");
  const [examVenue, setExamVenue] = useState("School Hall");
  const [examGrade, setExamGrade] = useState<"10" | "11" | "12">("12");

  // Announcements state
  const [announcements, setAnnouncements] = useState<SchoolAnnouncement[]>([]);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annGrade, setAnnGrade] = useState<"all" | "10" | "11" | "12">("all");
  const [annUrgent, setAnnUrgent] = useState(false);
  const [annLogoUrl, setAnnLogoUrl] = useState("");

  // Resources state
  const [resources, setResources] = useState<SchoolResource[]>([]);
  const [uploadType, setUploadType] = useState<"textbook" | "pdf" | "notes">("textbook");
  const [resTitle, setResTitle] = useState("");
  const [resSubject, setResSubject] = useState("Mathematics");
  const [resGrade, setResGrade] = useState<"10" | "11" | "12">("12");
  const [resUrl, setResUrl] = useState("");

  // Load all initial data for this school's Exam Centre
  const reloadData = () => {
    const list = getLearners(user.examCentreNumber);
    setLearners(list);
    setTasks(getTasks(user.examCentreNumber));
    setExams(getExamTimetable(user.examCentreNumber));
    setAnnouncements(getAnnouncements(user.examCentreNumber));
    setResources(getResources(user.examCentreNumber));

    // Load attendance for current selected date
    const att = getAttendance(user.examCentreNumber, selectedDate);
    setCurrentAttendance(att);
  };

  useEffect(() => {
    reloadData();
  }, [user.examCentreNumber, selectedDate]);

  // Filter learners for attendance
  const filteredLearners = learners.filter((l) => {
    if (l.grade !== selectedGrade) return false;
    if (selectedClassGroup !== "All" && l.classGroup !== selectedClassGroup)
      return false;
    return true;
  });

  // Unique class groups for current grade
  const classGroups = Array.from(
    new Set(
      learners
        .filter((l) => l.grade === selectedGrade)
        .map((l) => l.classGroup)
    )
  );

  // Fast 1-Tap Attendance Toggle: Present (Green) -> Absent (Red) -> Late (Amber) -> Present
  const toggleAttendanceStatus = (learnerId: string) => {
    const records = { ...(currentAttendance?.records || {}) };
    const current = records[learnerId]?.status || "present";
    let next: AttendanceStatus = "present";

    if (current === "present") next = "absent";
    else if (current === "absent") next = "late";
    else next = "present";

    records[learnerId] = {
      status: next,
      timestamp: new Date().toISOString(),
    };

    const updated: DailyAttendance = {
      date: selectedDate,
      examCentreNumber: user.examCentreNumber,
      grade: selectedGrade,
      classGroup: selectedClassGroup,
      records,
      markedBy: `${user.staffName} (${user.staffRole})`,
      updatedAt: new Date().toISOString(),
    };

    saveAttendance(updated);
    setCurrentAttendance(updated);
    setAttendanceSaveNotice("Attendance updated instantly.");
    setTimeout(() => setAttendanceSaveNotice(""), 2000);
  };

  // Fast Action: Mark All Present
  const handleMarkAllPresent = () => {
    const records = { ...(currentAttendance?.records || {}) };
    filteredLearners.forEach((l) => {
      records[l.id] = {
        status: "present",
        timestamp: new Date().toISOString(),
      };
    });

    const updated: DailyAttendance = {
      date: selectedDate,
      examCentreNumber: user.examCentreNumber,
      grade: selectedGrade,
      classGroup: selectedClassGroup,
      records,
      markedBy: `${user.staffName} (${user.staffRole})`,
      updatedAt: new Date().toISOString(),
    };

    saveAttendance(updated);
    setCurrentAttendance(updated);
    setAttendanceSaveNotice(`Marked all ${filteredLearners.length} learners present!`);
    setTimeout(() => setAttendanceSaveNotice(""), 2500);
  };

  // Add Learner to Roster
  const handleAddLearner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLearnerName || !newLearnerAdm) return;

    const res = saveLearner({
      id: "lrn_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      examCentreNumber: user.examCentreNumber,
      fullName: newLearnerName.trim(),
      admissionNo: newLearnerAdm.trim(),
      grade: newLearnerGrade,
      classGroup: newLearnerClass.trim().toUpperCase(),
      parentPhone: newLearnerParentPhone.trim() || undefined,
      enrolledAt: new Date().toISOString(),
    });

    if (!res.success) {
      setRosterMsg(`Error: ${res.message}`);
      return;
    }

    setRosterMsg(`Learner ${newLearnerName} successfully added to school roster.`);
    setNewLearnerName("");
    setNewLearnerAdm("");
    setNewLearnerParentPhone("");
    reloadData();
    setTimeout(() => setRosterMsg(""), 3000);
  };

  // Remove learner
  const handleDeleteLearner = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove learner "${name}" from the roster?`)) {
      deleteLearner(user.examCentreNumber, id);
      reloadData();
    }
  };

  // Add Task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskSubject) return;

    const newTask: SchoolTask = {
      id: "task_" + Date.now(),
      examCentreNumber: user.examCentreNumber,
      grade: taskGrade,
      subject: taskSubject.trim(),
      title: taskTitle.trim(),
      dueDate: taskDueDate,
      description: taskDesc.trim() || undefined,
      createdAt: new Date().toISOString(),
      createdBy: `${user.staffName} (${user.staffRole})`,
      submissions: {},
    };

    saveTask(newTask);
    setTaskTitle("");
    setTaskDesc("");
    reloadData();
  };

  // Add Exam Entry
  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    const newExam: ExamTimetableItem = {
      id: "exam_" + Date.now(),
      examCentreNumber: user.examCentreNumber,
      grade: examGrade,
      subject: examSubject.trim(),
      paperName: examPaper.trim(),
      date: examDate,
      startTime: examStartTime,
      duration: examDuration,
      venue: examVenue.trim() || "Main Exam Hall",
    };

    const currentList = getExamTimetable(user.examCentreNumber);
    saveExamTimetable(user.examCentreNumber, [...currentList, newExam]);
    setExamPaper("");
    reloadData();
  };

  // Add Announcement
  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    const newAnn: SchoolAnnouncement = {
      id: "ann_" + Date.now(),
      examCentreNumber: user.examCentreNumber,
      schoolName: user.schoolName,
      title: annTitle.trim(),
      content: annContent.trim(),
      targetGrade: annGrade,
      isUrgent: annUrgent,
      authorName: `${user.staffName} (${user.staffRole})`,
      createdAt: new Date().toISOString(),
      logoUrl: annLogoUrl.trim() || undefined,
    };

    saveAnnouncement(newAnn);
    setAnnTitle("");
    setAnnContent("");
    setAnnUrgent(false);
    reloadData();
  };

  // Add Resource
  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle || !resUrl) return;

    const newRes: SchoolResource = {
      id: "res_" + Date.now(),
      examCentreNumber: user.examCentreNumber,
      type: uploadType,
      title: resTitle.trim(),
      subject: resSubject.trim(),
      grade: resGrade,
      fileDataOrUrl: resUrl.trim(),
      fileName: `${resTitle.trim()}.${uploadType === "textbook" ? "epub/pdf" : "pdf"}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.staffName,
    };

    saveResource(newRes);
    setResTitle("");
    setResUrl("");
    reloadData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar with Always-Visible Logout */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Brand & School Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-black text-white text-base shadow">
              DP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm md:text-base text-white truncate max-w-[220px] md:max-w-md">
                  {user.schoolName}
                </h1>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                  STAFF PORTAL
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>Centre No: <strong className="text-slate-300 font-mono">{user.examCentreNumber}</strong></span>
                <span>•</span>
                <span>Logged in as: <strong className="text-emerald-400">{user.staffName}</strong> ({user.staffRole})</span>
              </div>
            </div>
          </div>

          {/* Logout Button (Rule #9) */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <span>Log Out</span>
            <span>↪</span>
          </button>
        </div>
      </header>

      {/* Staff Action Tab Strip */}
      <nav className="bg-slate-900 border-b border-slate-800 px-4">
        <div className="max-w-6xl mx-auto flex overflow-x-auto no-scrollbar gap-2 py-2">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === "attendance"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>📋</span> Daily Attendance
          </button>

          <button
            onClick={() => setActiveTab("roster")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === "roster"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>👥</span> Learner Roster ({learners.length})
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === "tasks"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>📝</span> Tasks & Submissions
          </button>

          <button
            onClick={() => setActiveTab("exams")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === "exams"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>📅</span> Exam Timetable
          </button>

          <button
            onClick={() => setActiveTab("announcements")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === "announcements"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>📢</span> Announcements
          </button>

          <button
            onClick={() => setActiveTab("resources")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === "resources"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>📚</span> eLibrary & Resources
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full flex-1 p-4 md:p-6">
        {/* =========================================================
            TAB 1: FAST DAILY ATTENDANCE REGISTER (1-Tap per Learner)
            Short-staffed optimized: Instant Red/Green, Mark All Present
            ========================================================= */}
        {activeTab === "attendance" && (
          <div className="space-y-4">
            {/* Top Control Bar: Date + Grade + Quick Action */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Register Date
                  </span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Grade
                  </span>
                  <select
                    value={selectedGrade}
                    onChange={(e: any) => setSelectedGrade(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="10">Grade 10</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12 (Matric)</option>
                  </select>
                </div>

                {classGroups.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Class
                    </span>
                    <select
                      value={selectedClassGroup}
                      onChange={(e) => setSelectedClassGroup(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="All">All Classes</option>
                      {classGroups.map((cg) => (
                        <option key={cg} value={cg}>
                          {cg}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Fast 1-Tap Action for Short-Staffed Teachers */}
              <div className="flex items-center gap-3">
                {attendanceSaveNotice && (
                  <span className="text-xs text-emerald-400 font-semibold animate-pulse">
                    ✓ {attendanceSaveNotice}
                  </span>
                )}
                {filteredLearners.length > 0 && (
                  <button
                    onClick={handleMarkAllPresent}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <span>⚡ Mark All Present</span>
                  </button>
                )}
              </div>
            </div>

            {/* Attendance Quick Legend & Counter */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
              <div className="flex items-center gap-4 text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  Present (Tap to toggle)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  Absent (Triggers bunking alert)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  Late
                </span>
              </div>
              <div className="text-slate-400">
                Total in Grade {selectedGrade}:{" "}
                <strong className="text-white">{filteredLearners.length}</strong> learners
              </div>
            </div>

            {/* Learner Attendance List (Rule #1 Empty DB handling) */}
            {filteredLearners.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center text-3xl">
                  👥
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    No Grade {selectedGrade} Learners Enrolled Yet
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    Critical Rule: No mock learners exist. As school staff, you can enroll your Grade 10-12 class roster in the Roster tab to start marking daily attendance.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("roster")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Go to Learner Roster to Add Learners →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredLearners.map((learner) => {
                  const record = currentAttendance?.records?.[learner.id];
                  const status: AttendanceStatus = record?.status || "absent";
                  const isPresent = status === "present";
                  const isAbsent = status === "absent";
                  const isLate = status === "late";

                  return (
                    <div
                      key={learner.id}
                      onClick={() => toggleAttendanceStatus(learner.id)}
                      className={`cursor-pointer select-none p-3.5 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-3 ${
                        isPresent
                          ? "bg-emerald-950/30 border-emerald-600/60 hover:border-emerald-500"
                          : isAbsent
                          ? "bg-red-950/40 border-red-600/70 hover:border-red-500"
                          : "bg-amber-950/30 border-amber-600/60 hover:border-amber-500"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-white">
                          {learner.fullName}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>Class: <strong className="text-slate-300">{learner.classGroup}</strong></span>
                          <span>•</span>
                          <span>Adm: <strong className="text-slate-300 font-mono">{learner.admissionNo}</strong></span>
                        </div>
                      </div>

                      {/* Visual Indicator: Red with X vs Green with tick */}
                      <div className="flex items-center">
                        {isPresent && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-950">
                            <span>✓</span>
                            <span>PRESENT</span>
                          </div>
                        )}
                        {isAbsent && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md shadow-red-950 animate-pulse">
                            <span>✕</span>
                            <span>ABSENT</span>
                          </div>
                        )}
                        {isLate && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-950">
                            <span>⏳</span>
                            <span>LATE</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 2: LEARNER ROSTER MANAGEMENT
            Add Grade 10-12 Learners with Admission Numbers
            ========================================================= */}
        {activeTab === "roster" && (
          <div className="space-y-6">
            {/* Enrollment Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>➕</span> Enroll New Learner (Grade 10, 11, or 12)
                </h3>
                <p className="text-xs text-slate-400">
                  Enrolling learners allows parents and learners to sign in with their Admission Number and allows teachers to mark attendance.
                </p>
              </div>

              {rosterMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-600 text-emerald-200 text-xs">
                  {rosterMsg}
                </div>
              )}

              <form onSubmit={handleAddLearner} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Learner Full Names
                    </label>
                    <input
                      type="text"
                      value={newLearnerName}
                      onChange={(e) => setNewLearnerName(e.target.value)}
                      placeholder="e.g. Karabo Dlamini"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Admission No / EMIS Identifier
                    </label>
                    <input
                      type="text"
                      value={newLearnerAdm}
                      onChange={(e) => setNewLearnerAdm(e.target.value)}
                      placeholder="e.g. ADM-2026-042"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">
                        Grade
                      </label>
                      <select
                        value={newLearnerGrade}
                        onChange={(e: any) => setNewLearnerGrade(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="10">Grade 10</option>
                        <option value="11">Grade 11</option>
                        <option value="12">Grade 12</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">
                        Class Group
                      </label>
                      <input
                        type="text"
                        value={newLearnerClass}
                        onChange={(e) => setNewLearnerClass(e.target.value)}
                        placeholder="e.g. 10A"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Parent / Guardian Phone (For bunking alerts)
                    </label>
                    <input
                      type="tel"
                      value={newLearnerParentPhone}
                      onChange={(e) => setNewLearnerParentPhone(e.target.value)}
                      placeholder="e.g. 082 123 4567"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-[0.99]"
                    >
                      + Save Learner to Roster
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Roster Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">
                  Enrolled Learners ({learners.length})
                </h3>
                <span className="text-xs text-slate-400">
                  School Exam Centre: <strong className="text-white">{user.examCentreNumber}</strong>
                </span>
              </div>

              {learners.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No learners enrolled yet. Use the form above to enroll your class.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Admission No</th>
                        <th className="py-2.5 px-3">Full Name</th>
                        <th className="py-2.5 px-3">Grade</th>
                        <th className="py-2.5 px-3">Class</th>
                        <th className="py-2.5 px-3">Parent Contact</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {learners.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                            {l.admissionNo}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-white">
                            {l.fullName}
                          </td>
                          <td className="py-2.5 px-3 font-bold">Grade {l.grade}</td>
                          <td className="py-2.5 px-3">{l.classGroup}</td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {l.parentPhone || "Not linked"}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleDeleteLearner(l.id, l.fullName)}
                              className="text-red-400 hover:text-red-300 font-bold text-[11px]"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: TASKS & ASSIGNMENTS (Status Only: Submitted / Not Submitted)
            Rule #7: "NO MARKS: Show only Submitted / Not Submitted"
            ========================================================= */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            {/* Create Task Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📝</span> Assign New Subject Task / Homework
                </h3>
                <p className="text-xs text-slate-400">
                  Critical Rule #7: Marks remain at school. Parents & learners only see status (Submitted / Not Submitted / Overdue).
                </p>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Grade
                    </label>
                    <select
                      value={taskGrade}
                      onChange={(e: any) => setTaskGrade(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                    >
                      <option value="10">Grade 10</option>
                      <option value="11">Grade 11</option>
                      <option value="12">Grade 12</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={taskSubject}
                      onChange={(e) => setTaskSubject(e.target.value)}
                      placeholder="e.g. Mathematics, Physical Sciences"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-300">
                      Task Title / Assignment Name
                    </label>
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="e.g. Term 4 Calculus Investigation Assignment"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Instructions / Notes
                    </label>
                    <input
                      type="text"
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      placeholder="e.g. Hand in hard copy on Friday morning before 08:00"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-[0.99]"
                >
                  + Post Task for Learners
                </button>
              </form>
            </div>

            {/* Tasks List */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <h3 className="text-base font-bold text-white">
                Active School Tasks ({tasks.length})
              </h3>

              {tasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No tasks assigned yet. Create a task above to track learner submissions.
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => {
                    const gradeLearners = learners.filter(
                      (l) => l.grade === task.grade
                    );
                    const submittedCount = Object.values(
                      task.submissions || {}
                    ).filter((s) => s === "submitted").length;

                    return (
                      <div
                        key={task.id}
                        className="bg-slate-850 border border-slate-750 rounded-2xl p-4 space-y-3"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                                Grade {task.grade}
                              </span>
                              <span className="text-xs font-bold text-emerald-400">
                                {task.subject}
                              </span>
                            </div>
                            <h4 className="font-bold text-white text-sm mt-0.5">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-xs text-slate-400">
                                {task.description}
                              </p>
                            )}
                          </div>

                          <div className="text-right flex md:flex-col items-center md:items-end justify-between gap-1">
                            <span className="text-xs text-slate-400 font-mono">
                              Due: <strong>{task.dueDate}</strong>
                            </span>
                            <span className="text-xs font-bold text-emerald-400">
                              {submittedCount} of {gradeLearners.length} Submitted
                            </span>
                          </div>
                        </div>

                        {/* Submission Checklist Trigger */}
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                          <button
                            onClick={() =>
                              setSelectedTaskIdForSubmissions(
                                selectedTaskIdForSubmissions === task.id
                                  ? null
                                  : task.id
                              )
                            }
                            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                          >
                            <span>
                              {selectedTaskIdForSubmissions === task.id
                                ? "Hide Submission Register ▲"
                                : "Open Learner Submission Register ▼"}
                            </span>
                          </button>
                        </div>

                        {/* Expandable Submission Toggler per Learner */}
                        {selectedTaskIdForSubmissions === task.id && (
                          <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2 mt-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                              Tap to mark Submitted (Green ✔️) or Not Submitted (Red ❌)
                            </span>
                            {gradeLearners.length === 0 ? (
                              <p className="text-xs text-slate-400">
                                No Grade {task.grade} learners enrolled yet to mark submissions.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {gradeLearners.map((lrn) => {
                                  const isSubmitted =
                                    task.submissions?.[lrn.id] === "submitted";
                                  return (
                                    <button
                                      key={lrn.id}
                                      onClick={() => {
                                        toggleLearnerSubmission(
                                          user.examCentreNumber,
                                          task.id,
                                          lrn.id,
                                          isSubmitted ? "not_submitted" : "submitted"
                                        );
                                        reloadData();
                                      }}
                                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                                        isSubmitted
                                          ? "bg-emerald-950/40 border-emerald-600/70 text-white"
                                          : "bg-red-950/30 border-red-700/60 text-slate-200"
                                      }`}
                                    >
                                      <div>
                                        <div className="font-bold">
                                          {lrn.fullName}
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                          {lrn.classGroup} • {lrn.admissionNo}
                                        </div>
                                      </div>
                                      <div className="text-xs font-bold">
                                        {isSubmitted ? (
                                          <span className="text-emerald-400 flex items-center gap-1">
                                            <span>✓</span> Submitted
                                          </span>
                                        ) : (
                                          <span className="text-red-400 flex items-center gap-1">
                                            <span>✕</span> Not Submitted
                                          </span>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 4: EXAM TIMETABLE (Uploaded by School)
            ========================================================= */}
        {activeTab === "exams" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📅</span> Upload Official Examination Timetable
                </h3>
                <p className="text-xs text-slate-400">
                  Published for Grade 10-12 learners and parents to view exam dates, session times, and venues.
                </p>
              </div>

              <form onSubmit={handleAddExam} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Grade
                    </label>
                    <select
                      value={examGrade}
                      onChange={(e: any) => setExamGrade(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                    >
                      <option value="12">Grade 12 (NSC Final / Prelim)</option>
                      <option value="11">Grade 11 Final Exams</option>
                      <option value="10">Grade 10 Final Exams</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={examSubject}
                      onChange={(e) => setExamSubject(e.target.value)}
                      placeholder="e.g. Mathematics"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Paper Name / Session
                    </label>
                    <input
                      type="text"
                      value={examPaper}
                      onChange={(e) => setExamPaper(e.target.value)}
                      placeholder="e.g. Paper 1 (Algebra)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Date
                    </label>
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={examStartTime}
                      onChange={(e) => setExamStartTime(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={examDuration}
                      onChange={(e) => setExamDuration(e.target.value)}
                      placeholder="e.g. 3 Hours"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Venue
                    </label>
                    <input
                      type="text"
                      value={examVenue}
                      onChange={(e) => setExamVenue(e.target.value)}
                      placeholder="e.g. Main Hall"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-[0.99]"
                >
                  + Add to Exam Schedule
                </button>
              </form>
            </div>

            {/* Exam Items */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <h3 className="text-base font-bold text-white">
                Scheduled Examination Sessions ({exams.length})
              </h3>
              {exams.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No exams posted yet. Use the form above to publish your timetable.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Grade</th>
                        <th className="py-2.5 px-3">Subject & Paper</th>
                        <th className="py-2.5 px-3">Time & Duration</th>
                        <th className="py-2.5 px-3">Venue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {exams.map((ex) => (
                        <tr key={ex.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono font-bold text-white">
                            {ex.date}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-blue-400">
                            Grade {ex.grade}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-emerald-400">
                              {ex.subject}
                            </div>
                            <div className="text-slate-300">{ex.paperName}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {ex.startTime} ({ex.duration})
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">{ex.venue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 5: ANNOUNCEMENTS WITH SCHOOL LOGO (<90 days viewed box)
            ========================================================= */}
        {activeTab === "announcements" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📢</span> Post School Announcement / Newsletter
                </h3>
                <p className="text-xs text-slate-400">
                  Critical Rule: Announcements are stored for {"<90"} days in viewed box for parents and learners.
                </p>
              </div>

              <form onSubmit={handleAddAnnouncement} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-300">
                      Announcement Title
                    </label>
                    <input
                      type="text"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="e.g. Mandatory Grade 12 Saturday Intervention Camp"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Target Audience
                    </label>
                    <select
                      value={annGrade}
                      onChange={(e: any) => setAnnGrade(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                    >
                      <option value="all">All Grades (10, 11 & 12)</option>
                      <option value="12">Grade 12 Only</option>
                      <option value="11">Grade 11 Only</option>
                      <option value="10">Grade 10 Only</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Content / Message
                  </label>
                  <textarea
                    rows={3}
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    placeholder="Write announcement details..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      School Logo URL / Header Badge (Optional)
                    </label>
                    <input
                      type="url"
                      value={annLogoUrl}
                      onChange={(e) => setAnnLogoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="pt-4 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="urgentCheck"
                      checked={annUrgent}
                      onChange={(e) => setAnnUrgent(e.target.checked)}
                      className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                    />
                    <label
                      htmlFor="urgentCheck"
                      className="text-xs font-bold text-red-400 select-none cursor-pointer"
                    >
                      Mark as URGENT (Highlights in Red for parents)
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-[0.99]"
                >
                  Publish Announcement
                </button>
              </form>
            </div>

            {/* List */}
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center text-xs text-slate-400">
                  No announcements published within the last 90 days.
                </div>
              ) : (
                announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className={`bg-slate-900 rounded-3xl p-5 border space-y-2 ${
                      ann.isUrgent
                        ? "border-red-600/80 bg-red-950/20"
                        : "border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {ann.isUrgent && (
                          <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase">
                            URGENT
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                          {ann.targetGrade === "all" ? "All Grades" : `Grade ${ann.targetGrade}`}
                        </span>
                        <h4 className="font-bold text-sm text-white">
                          {ann.title}
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(ann.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {ann.content}
                    </p>

                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 flex items-center justify-between">
                      <span>Posted by: {ann.authorName}</span>
                      <span>School: {ann.schoolName}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 6: eLIBRARY & RESOURCES UPLOADS
            Buttons: 'Upload Textbook' / 'Upload PDF' / 'Upload Notes'
            Links: Siyavula & DBE Past Papers
            ========================================================= */}
        {activeTab === "resources" && (
          <div className="space-y-6">
            {/* National Curricula Portal Links (DBE & Siyavula) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="https://www.siyavula.com"
                target="_blank"
                rel="noreferrer"
                className="bg-gradient-to-br from-blue-950/60 to-slate-900 border border-blue-700/50 hover:border-blue-500 rounded-3xl p-5 block transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                      Official DBE Open Partner
                    </span>
                    <h4 className="text-base font-extrabold text-white group-hover:text-blue-300">
                      Siyavula Open Practice
                    </h4>
                    <p className="text-xs text-slate-400">
                      Free Grade 10-12 Mathematics & Physical Sciences practice engine with step-by-step solutions.
                    </p>
                  </div>
                  <span className="text-blue-400 text-xl font-bold group-hover:translate-x-1 transition-transform">
                    ↗
                  </span>
                </div>
                <div className="mt-3 text-[11px] text-blue-300 font-mono">
                  https://www.siyavula.com
                </div>
              </a>

              <a
                href="https://www.education.gov.za/Curriculum/Grade-12-Past-Exam-papers"
                target="_blank"
                rel="noreferrer"
                className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-700/50 hover:border-emerald-500 rounded-3xl p-5 block transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Department of Basic Education
                    </span>
                    <h4 className="text-base font-extrabold text-white group-hover:text-emerald-300">
                      DBE Grade 12 Past Exam Papers & Memos
                    </h4>
                    <p className="text-xs text-slate-400">
                      Official National Senior Certificate (NSC) past question papers and marking guidelines.
                    </p>
                  </div>
                  <span className="text-emerald-400 text-xl font-bold group-hover:translate-x-1 transition-transform">
                    ↗
                  </span>
                </div>
                <div className="mt-3 text-[11px] text-emerald-300 font-mono">
                  education.gov.za/.../Past-Exam-papers
                </div>
              </a>
            </div>

            {/* School Upload Buttons: 'Upload Textbook' / 'Upload PDF' / 'Upload Notes' */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📤</span> Upload Study Resource to School eLibrary
                </h3>
                <p className="text-xs text-slate-400">
                  Provide textbooks, past papers, or revision notes directly accessible by parents and learners.
                </p>
              </div>

              {/* Upload Type Selector Buttons as specified */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setUploadType("textbook")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    uploadType === "textbook"
                      ? "bg-emerald-600 text-white shadow"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  📖 Upload Textbook
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType("pdf")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    uploadType === "pdf"
                      ? "bg-emerald-600 text-white shadow"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  📄 Upload PDF
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType("notes")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    uploadType === "notes"
                      ? "bg-emerald-600 text-white shadow"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  📝 Upload Notes
                </button>
              </div>

              <form onSubmit={handleAddResource} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Resource Title
                    </label>
                    <input
                      type="text"
                      value={resTitle}
                      onChange={(e) => setResTitle(e.target.value)}
                      placeholder="e.g. Siyavula Mathematics Gr12 Textbook"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={resSubject}
                      onChange={(e) => setResSubject(e.target.value)}
                      placeholder="e.g. Physical Sciences"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Target Grade
                    </label>
                    <select
                      value={resGrade}
                      onChange={(e: any) => setResGrade(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                    >
                      <option value="12">Grade 12</option>
                      <option value="11">Grade 11</option>
                      <option value="10">Grade 10</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Resource Link / Cloud Storage Document URL
                  </label>
                  <input
                    type="url"
                    value={resUrl}
                    onChange={(e) => setResUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <p className="text-[11px] text-slate-500">
                    Fast data-light link to PDF, Google Drive, or DBE study guide file.
                  </p>
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-[0.99]"
                >
                  Save to School Library
                </button>
              </form>
            </div>

            {/* School Uploads List */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <h3 className="text-base font-bold text-white">
                School Uploaded Resources ({resources.length})
              </h3>
              {resources.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No resources uploaded yet. Add textbooks and notes above.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {resources.map((res) => (
                    <div
                      key={res.id}
                      className="bg-slate-850 border border-slate-750 rounded-2xl p-4 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                            {res.type}
                          </span>
                          <span className="text-[10px] text-blue-400 font-bold">
                            Grade {res.grade}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-sm">{res.title}</h4>
                        <div className="text-xs text-slate-400">{res.subject}</div>
                      </div>
                      <a
                        href={res.fileDataOrUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white text-xs font-bold transition-all"
                      >
                        Open ↗
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
