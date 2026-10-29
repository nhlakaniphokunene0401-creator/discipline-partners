import React, { useState, useMemo } from "react";
import { LearnerUser, AttendanceStatus } from "../types";
import {
  getLearners,
  getAttendance,
  getTasks,
  getAnnouncements,
  getExamTimetable,
  getClassTimetable,
} from "../data/storage";
import { ELibraryView } from "./ELibraryView";

interface LearnerViewProps {
  user: LearnerUser;
  onLogout: () => void;
}

export const LearnerView: React.FC<LearnerViewProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "attendance" | "tasks" | "exams" | "timetable" | "announcements" | "elibrary"
  >("overview");

  const todayStr = new Date().toISOString().split("T")[0];

  // Match learner record in roster
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

  // Today's attendance
  const todayAttendance = useMemo(
    () => getAttendance(user.examCentreNumber, todayStr),
    [user.examCentreNumber, todayStr]
  );

  const todayStatus: AttendanceStatus | "not_recorded" = useMemo(() => {
    if (!matchedLearner || !todayAttendance?.records) return "not_recorded";
    return todayAttendance.records[matchedLearner.id]?.status || "not_recorded";
  }, [matchedLearner, todayAttendance]);

  // Past 14 days attendance records
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

  // Stats
  const attendanceStats = useMemo(() => {
    const total = attendanceHistory.length;
    const presentCount = attendanceHistory.filter((a) => a.status === "present").length;
    const absentCount = attendanceHistory.filter((a) => a.status === "absent").length;
    const lateCount = attendanceHistory.filter((a) => a.status === "late").length;
    const rate = total > 0 ? Math.round((presentCount / total) * 100) : 100;

    return { total, presentCount, absentCount, lateCount, rate };
  }, [attendanceHistory]);

  // Tasks for Grade 10-12
  const learnerGrade = user.grade || matchedLearner?.grade || "10";
  const tasks = useMemo(() => {
    const all = getTasks(user.examCentreNumber);
    return all.filter((t) => t.grade === learnerGrade);
  }, [user.examCentreNumber, learnerGrade]);

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

  // Exams
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
      {/* Top Header with Always-Visible Logout */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-black text-white text-base shadow">
              DP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm md:text-base text-white truncate max-w-[200px] md:max-w-md">
                  {user.schoolName}
                </h1>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded border border-blue-500/30">
                  LEARNER PORTAL
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                  READ-ONLY
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Learner: <strong className="text-white">{user.learnerFullName}</strong> • Grade {user.grade} (FET Phase)
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

      {/* BUNKING ALERT BANNER FOR LEARNER */}
      {isBunkingToday && (
        <div className="bg-red-950/90 border-b-2 border-red-600 px-4 py-3 text-red-100 animate-pulse shadow-xl">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <h2 className="font-black text-sm md:text-base text-white tracking-wide">
                BUNKING NOTICE: YOU WERE RECORDED ABSENT TODAY!
              </h2>
              <p className="text-xs text-red-200">
                School educators marked you absent today ({todayStr}). Your parents and guardians have been notified. Please report to the administrative office immediately.
              </p>
            </div>
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
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>📊</span> My Dashboard
          </button>

          <button
            onClick={() => setActiveTab("attendance")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "attendance"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>📋</span> Class Attendance
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "tasks"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>📝</span> My Tasks
          </button>

          <button
            onClick={() => setActiveTab("exams")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "exams"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>📅</span> Exam Timetable
          </button>

          <button
            onClick={() => setActiveTab("announcements")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "announcements"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>📢</span> Announcements ({announcements.length})
          </button>

          <button
            onClick={() => setActiveTab("elibrary")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "elibrary"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>📚</span> eLibrary & Siyavula
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto w-full flex-1 p-4 md:p-6 space-y-6">
        {/* =========================================================
            TAB 1: LEARNER OVERVIEW
            ========================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Grade {user.grade} Learner Profile
                </span>
                <h2 className="text-2xl font-black text-white">
                  {user.learnerFullName}
                </h2>
                <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Admission No: <strong className="text-slate-200 font-mono">{user.learnerAdmissionNo}</strong></span>
                  <span>School: <strong className="text-slate-200">{user.schoolName}</strong></span>
                  <span>Exam Centre: <strong className="text-slate-200 font-mono">{user.examCentreNumber}</strong></span>
                </div>
              </div>

              {/* Today's Status Badge */}
              <div className="bg-slate-850 border border-slate-750 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[160px] text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                  Today's Status
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

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <span className="text-emerald-400 font-semibold">
                    ✓ {attendanceStats.presentCount} Days Present
                  </span>
                  <span className="text-red-400 font-semibold">
                    ✕ {attendanceStats.absentCount} Days Absent
                  </span>
                  <span className="text-amber-400 font-semibold">
                    ⏳ {attendanceStats.lateCount} Late
                  </span>
                </div>
              </div>

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
                  <span className="text-emerald-400 font-semibold">
                    ✓ {taskStats.submitted} Submitted
                  </span>
                  <span className="text-red-400 font-semibold">
                    ✕ {taskStats.overdue} Overdue
                  </span>
                  <span>Total Tasks: {taskStats.total}</span>
                </div>
              </div>
            </div>

            {/* Read-Only Notice */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>
                🔒 <strong>Read-Only Student Access:</strong> To guarantee integrity, only registered educators can verify attendance and mark assignments as submitted.
              </span>
              <button
                onClick={() => setActiveTab("tasks")}
                className="text-blue-400 hover:text-blue-300 font-bold underline whitespace-nowrap ml-4"
              >
                View Tasks →
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: CLASS ATTENDANCE (Red X / Green Tick)
            ========================================================= */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>📋</span> Attendance History
                  </h3>
                  <p className="text-xs text-slate-400">
                    Your attendance record for the past 14 school days.
                  </p>
                </div>
                <span className="text-xs bg-slate-800 text-emerald-400 font-bold px-3 py-1 rounded-xl">
                  {attendanceStats.rate}% Overall
                </span>
              </div>

              {attendanceHistory.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No attendance records recorded by your teachers yet.
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
                              PRESENT
                            </span>
                          )}
                          {isAbsent && (
                            <span className="px-3 py-1 rounded-xl bg-red-600/30 text-red-400 border border-red-600/50 text-xs font-black animate-pulse">
                              ABSENT
                            </span>
                          )}
                          {isLate && (
                            <span className="px-3 py-1 rounded-xl bg-amber-600/30 text-amber-400 border border-amber-600/50 text-xs font-bold">
                              LATE
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
            TAB 3: TASKS (NO MARKS)
            ========================================================= */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>📝</span> Subject Tasks & Submissions
                  </h3>
                  <p className="text-xs text-slate-400">
                    Grade {learnerGrade} subject tasks. Marks are held at school; submission status is monitored by DP.
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
            TAB 4: EXAM TIMETABLE
            ========================================================= */}
        {activeTab === "exams" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📅</span> Examination Timetable
                </h3>
                <p className="text-xs text-slate-400">
                  Official exam dates and venues for Grade {learnerGrade}.
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
            TAB 5: ANNOUNCEMENTS (<90 Days)
            ========================================================= */}
        {activeTab === "announcements" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📢</span> School Announcements
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
                        <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase">
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
