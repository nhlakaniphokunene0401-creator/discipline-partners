import React, { useState, useMemo } from "react";
import { ParentUser, AttendanceStatus } from "../types";
import {
  getLearners,
  getAttendance,
  getTasks,
  getAnnouncements,
  getExamTimetable,
  getClassTimetable,
} from "../data/storage";
import { ELibraryView } from "./ELibraryView";

interface ParentViewProps {
  user: ParentUser;
  onLogout: () => void;
}

export const ParentView: React.FC<ParentViewProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "attendance" | "tasks" | "exams" | "timetable" | "announcements" | "elibrary"
  >("overview");

  const todayStr = new Date().toISOString().split("T")[0];

  // Find linked learner in the school roster
  const schoolLearners = useMemo(
    () => getLearners(user.examCentreNumber),
    [user.examCentreNumber]
  );

  const matchedLearner = useMemo(() => {
    return schoolLearners.find(
      (l) =>
        l.admissionNo.toLowerCase() === user.learnerAdmissionNo.toLowerCase() ||
        l.fullName.toLowerCase() === user.learnerFullName.toLowerCase()
    );
  }, [schoolLearners, user.learnerAdmissionNo, user.learnerFullName]);

  // Load today's attendance
  const todayAttendance = useMemo(
    () => getAttendance(user.examCentreNumber, todayStr),
    [user.examCentreNumber, todayStr]
  );

  // Determine today's status for the learner
  const todayStatus: AttendanceStatus | "not_recorded" = useMemo(() => {
    if (!matchedLearner || !todayAttendance?.records) return "not_recorded";
    return todayAttendance.records[matchedLearner.id]?.status || "not_recorded";
  }, [matchedLearner, todayAttendance]);

  // Load past 14 days attendance records
  const attendanceHistory = useMemo(() => {
    if (!matchedLearner) return [];
    const list: { date: string; status: AttendanceStatus; formatted: string }[] = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      const att = getAttendance(user.examCentreNumber, dateKey);

      if (att && att.records[matchedLearner.id]) {
        list.push({
          date: dateKey,
          status: att.records[matchedLearner.id].status,
          formatted: d.toLocaleDateString("en-ZA", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }),
        });
      }
    }
    return list;
  }, [matchedLearner, user.examCentreNumber]);

  // Compute attendance stats
  const attendanceStats = useMemo(() => {
    const total = attendanceHistory.length;
    const presentCount = attendanceHistory.filter((a) => a.status === "present").length;
    const absentCount = attendanceHistory.filter((a) => a.status === "absent").length;
    const lateCount = attendanceHistory.filter((a) => a.status === "late").length;
    const rate = total > 0 ? Math.round((presentCount / total) * 100) : 100;

    return { total, presentCount, absentCount, lateCount, rate };
  }, [attendanceHistory]);

  // Load Tasks for learner's grade
  const learnerGrade = matchedLearner?.grade || "10";
  const tasks = useMemo(() => {
    const all = getTasks(user.examCentreNumber);
    return all.filter((t) => t.grade === learnerGrade);
  }, [user.examCentreNumber, learnerGrade]);

  // Submission stats
  const taskStats = useMemo(() => {
    if (!matchedLearner || tasks.length === 0) return { total: 0, submitted: 0, overdue: 0, rate: 0 };
    let submitted = 0;
    let overdue = 0;

    tasks.forEach((t) => {
      const isSub = t.submissions?.[matchedLearner.id] === "submitted";
      if (isSub) submitted++;
      else if (new Date(t.dueDate) < new Date(todayStr)) overdue++;
    });

    const rate = tasks.length > 0 ? Math.round((submitted / tasks.length) * 100) : 100;
    return { total: tasks.length, submitted, overdue, rate };
  }, [matchedLearner, tasks, todayStr]);

  // Announcements (<90 days)
  const announcements = useMemo(
    () => getAnnouncements(user.examCentreNumber),
    [user.examCentreNumber]
  );

  // Exam Timetable
  const exams = useMemo(() => {
    const all = getExamTimetable(user.examCentreNumber);
    return all.filter((e) => e.grade === learnerGrade);
  }, [user.examCentreNumber, learnerGrade]);

  // Class Timetable
  const classTimetable = useMemo(
    () => getClassTimetable(user.examCentreNumber),
    [user.examCentreNumber]
  );

  const isBunkingToday = todayStatus === "absent";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header with Always-Visible Logout (Rule #9) */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-black text-white text-base shadow">
              DP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm md:text-base text-white truncate max-w-[200px] md:max-w-md">
                  {user.schoolName}
                </h1>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30">
                  PARENT PORTAL
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                  READ-ONLY
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Learner: <strong className="text-white">{user.learnerFullName}</strong> • Parent: {user.parentFullName} ({user.relationship})
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <span>Log Out</span>
            <span>↪</span>
          </button>
        </div>
      </header>

      {/* CRITICAL BUNKING ALERT BANNER (Rule #8 & Bunking Alert spec) */}
      {isBunkingToday && (
        <div className="bg-red-950/90 border-b-2 border-red-600 px-4 py-3 text-red-100 animate-pulse shadow-xl">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚨</span>
              <div>
                <h2 className="font-black text-sm md:text-base text-white tracking-wide">
                  CRITICAL ATTENDANCE ALERT: LEARNER MARKED ABSENT TODAY!
                </h2>
                <p className="text-xs text-red-200">
                  {user.learnerFullName} was marked ABSENT for today ({todayStr}) by school staff. Unexcused absence directly impacts FET pass rates.
                </p>
              </div>
            </div>
            <a
              href={`tel:${user.parentPhone}`}
              className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs whitespace-nowrap shadow-lg transition-transform active:scale-95"
            >
              Contact School Office
            </a>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <nav className="bg-slate-900 border-b border-slate-800 px-4">
        <div className="max-w-5xl mx-auto flex overflow-x-auto no-scrollbar gap-2 py-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "overview"
                ? "bg-amber-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>📊</span> Child Overview
          </button>

          <button
            onClick={() => setActiveTab("attendance")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "attendance"
                ? "bg-amber-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>📋</span> Daily Attendance
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "tasks"
                ? "bg-amber-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>📝</span> Tasks & Submissions
          </button>

          <button
            onClick={() => setActiveTab("exams")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "exams"
                ? "bg-amber-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>📅</span> Exam Timetable
          </button>

          <button
            onClick={() => setActiveTab("announcements")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "announcements"
                ? "bg-amber-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>📢</span> Announcements ({announcements.length})
          </button>

          <button
            onClick={() => setActiveTab("elibrary")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "elibrary"
                ? "bg-amber-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>📚</span> eLibrary & Siyavula
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full flex-1 p-4 md:p-6 space-y-6">
        {/* =========================================================
            TAB 1: CHILD OVERVIEW (Details + Today Status + Progress)
            ========================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Child & Parent Profile Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Grade {learnerGrade} Student Profile
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    FET Phase
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white">
                  {user.learnerFullName}
                </h2>
                <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Admission No: <strong className="text-slate-200 font-mono">{user.learnerAdmissionNo}</strong></span>
                  <span>School: <strong className="text-slate-200">{user.schoolName}</strong></span>
                  <span>Exam Centre: <strong className="text-slate-200 font-mono">{user.examCentreNumber}</strong></span>
                </div>
              </div>

              {/* Today's Status Badge (Red X / Green Tick) */}
              <div className="bg-slate-850 border border-slate-750 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[160px] text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                  Today's Attendance
                </span>
                {todayStatus === "present" && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 text-white font-extrabold text-sm shadow">
                    <span>✓</span> PRESENT
                  </div>
                )}
                {todayStatus === "absent" && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-600 text-white font-extrabold text-sm shadow animate-pulse">
                    <span>✕</span> ABSENT
                  </div>
                )}
                {todayStatus === "late" && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-600 text-white font-extrabold text-sm shadow">
                    <span>⏳</span> LATE
                  </div>
                )}
                {todayStatus === "not_recorded" && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs">
                    Pending Teacher Register
                  </div>
                )}
              </div>
            </div>

            {/* Progress Metrics (Attendance % + Task Submission %) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Metric 1: Attendance Rate */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Attendance Discipline
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      Class Attendance Rate
                    </h3>
                  </div>
                  <span
                    className={`text-2xl font-black ${
                      attendanceStats.rate >= 90
                        ? "text-emerald-400"
                        : attendanceStats.rate >= 75
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {attendanceStats.rate}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      attendanceStats.rate >= 90
                        ? "bg-emerald-500"
                        : attendanceStats.rate >= 75
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${attendanceStats.rate}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-slate-400 pt-1">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span>✓</span> {attendanceStats.presentCount} Days Present
                  </span>
                  <span className="text-red-400 font-semibold flex items-center gap-1">
                    <span>✕</span> {attendanceStats.absentCount} Days Absent
                  </span>
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <span>⏳</span> {attendanceStats.lateCount} Late
                  </span>
                </div>
              </div>

              {/* Metric 2: Task Submission Rate (Rule #7 No Marks) */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Academic Accountability
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      Task Submission Rate
                    </h3>
                  </div>
                  <span
                    className={`text-2xl font-black ${
                      taskStats.rate >= 80
                        ? "text-emerald-400"
                        : taskStats.rate >= 50
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {taskStats.rate}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      taskStats.rate >= 80
                        ? "bg-emerald-500"
                        : taskStats.rate >= 50
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${taskStats.rate}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-slate-400 pt-1">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span>✓</span> {taskStats.submitted} Submitted
                  </span>
                  <span className="text-red-400 font-semibold flex items-center gap-1">
                    <span>✕</span> {taskStats.overdue} Overdue
                  </span>
                  <span>Total Tasks: {taskStats.total}</span>
                </div>
              </div>
            </div>

            {/* Quick Links & Read-Only Policy */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span>🛡️</span>
                <span>
                  <strong>Strict Anti-Tampering Protocol:</strong> Parent portal is Read-Only. Marks remain confidential at school.
                </span>
              </div>
              <button
                onClick={() => setActiveTab("tasks")}
                className="text-amber-400 hover:text-amber-300 font-bold underline whitespace-nowrap"
              >
                View Subject Tasks →
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: DAILY ATTENDANCE (Red X / Green Tick List)
            ========================================================= */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>📋</span> Official Daily Class Attendance Record
                  </h3>
                  <p className="text-xs text-slate-400">
                    Logged daily by official subject educators and grade heads.
                  </p>
                </div>
                <div className="text-xs text-slate-400">
                  Rate: <strong className="text-emerald-400">{attendanceStats.rate}%</strong>
                </div>
              </div>

              {attendanceHistory.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No attendance records recorded by school staff yet. As staff takes roll call, dates will reflect here automatically.
                </div>
              ) : (
                <div className="space-y-2">
                  {attendanceHistory.map((item, idx) => {
                    const isPresent = item.status === "present";
                    const isAbsent = item.status === "absent";
                    const isLate = item.status === "late";

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                          isPresent
                            ? "bg-emerald-950/20 border-emerald-600/40 text-emerald-100"
                            : isAbsent
                            ? "bg-red-950/30 border-red-600/60 text-red-100"
                            : "bg-amber-950/20 border-amber-600/40 text-amber-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                              isPresent
                                ? "bg-emerald-600 text-white"
                                : isAbsent
                                ? "bg-red-600 text-white"
                                : "bg-amber-600 text-white"
                            }`}
                          >
                            {isPresent ? "✓" : isAbsent ? "✕" : "⏳"}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white">
                              {item.formatted}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Date: {item.date}
                            </div>
                          </div>
                        </div>

                        <div>
                          {isPresent && (
                            <span className="px-3 py-1 rounded-xl bg-emerald-600/30 text-emerald-400 border border-emerald-600/50 text-xs font-bold">
                              PRESENT IN CLASS
                            </span>
                          )}
                          {isAbsent && (
                            <span className="px-3 py-1 rounded-xl bg-red-600/30 text-red-400 border border-red-600/50 text-xs font-black animate-pulse">
                              ABSENT / BUNKING RISK
                            </span>
                          )}
                          {isLate && (
                            <span className="px-3 py-1 rounded-xl bg-amber-600/30 text-amber-400 border border-amber-600/50 text-xs font-bold">
                              ARRIVED LATE
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: TASK STATUS PER SUBJECT (NO MARKS)
            Rule #7: "Show only Submitted / Not Submitted / Due Soon / Overdue"
            ========================================================= */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>📝</span> Subject Task Submission Status
                  </h3>
                  <p className="text-xs text-slate-400">
                    Grade {learnerGrade} assignments. Marks remain at school; DP tracks submission compliance.
                  </p>
                </div>
                <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg">
                  {taskStats.submitted} of {tasks.length} Submitted
                </span>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No tasks or assignments currently posted for Grade {learnerGrade}.
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => {
                    const isSubmitted =
                      matchedLearner &&
                      task.submissions?.[matchedLearner.id] === "submitted";
                    const isPastDue = new Date(task.dueDate) < new Date(todayStr);

                    let statusLabel = "Not Submitted";
                    let statusClass = "bg-red-600 text-white";
                    let statusIcon = "✕";

                    if (isSubmitted) {
                      statusLabel = "Submitted";
                      statusClass = "bg-emerald-600 text-white";
                      statusIcon = "✓";
                    } else if (isPastDue) {
                      statusLabel = "Overdue";
                      statusClass = "bg-red-700 text-white animate-pulse";
                      statusIcon = "✕";
                    } else {
                      statusLabel = "Due Soon";
                      statusClass = "bg-amber-600 text-white";
                      statusIcon = "⏳";
                    }

                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSubmitted
                            ? "bg-emerald-950/20 border-emerald-600/40"
                            : isPastDue
                            ? "bg-red-950/25 border-red-600/60"
                            : "bg-slate-850 border-slate-750"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-400">
                              {task.subject}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Due: {task.dueDate}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-white">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-slate-300">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Visual Status Indicator: Red X vs Green Tick */}
                        <div className="flex items-center">
                          <span
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow ${statusClass}`}
                          >
                            <span>{statusIcon}</span>
                            <span>{statusLabel.toUpperCase()}</span>
                          </span>
                        </div>
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
                  <span>📅</span> Official Examination Timetable
                </h3>
                <p className="text-xs text-slate-400">
                  Published by school examination committee for Grade {learnerGrade}.
                </p>
              </div>

              {exams.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No upcoming examination dates published by the school yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Date</th>
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
            TAB 5: ANNOUNCEMENTS (<90 Days Viewed Box)
            ========================================================= */}
        {activeTab === "announcements" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📢</span> School Announcements & Newsletters
                </h3>
                <p className="text-xs text-slate-400">
                  Showing official circulars published within the last 90 days.
                </p>
              </div>
            </div>

            {announcements.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400">
                No active announcements posted by the school within the last 90 days.
              </div>
            ) : (
              announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`bg-slate-900 rounded-3xl p-5 border space-y-2 shadow-md ${
                    ann.isUrgent
                      ? "border-red-600/80 bg-red-950/20"
                      : "border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {ann.isUrgent && (
                        <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                          URGENT
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                        {ann.targetGrade === "all" ? "All Grades" : `Grade ${ann.targetGrade}`}
                      </span>
                      <h4 className="font-bold text-sm text-white">{ann.title}</h4>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {ann.content}
                  </p>

                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span>Issued by: {ann.authorName}</span>
                    <span>School: {ann.schoolName}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* =========================================================
            TAB 6: eLIBRARY
            ========================================================= */}
        {activeTab === "elibrary" && (
          <ELibraryView
            examCentreNumber={user.examCentreNumber}
            userGrade={learnerGrade}
          />
        )}
      </main>
    </div>
  );
};
