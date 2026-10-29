import React, { useState } from "react";
import { SchoolResource } from "../types";
import { getResources } from "../data/storage";

interface ELibraryViewProps {
  examCentreNumber: string;
  userGrade?: "10" | "11" | "12";
}

export const ELibraryView: React.FC<ELibraryViewProps> = ({
  examCentreNumber,
  userGrade,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<string>(
    userGrade || "All"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const resources = getResources(examCentreNumber);

  const filtered = resources.filter((res) => {
    const matchesGrade =
      selectedGrade === "All" || res.grade === selectedGrade;
    const matchesQuery =
      !searchQuery ||
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGrade && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
            Open Digital Textbooks & Curriculum Library
          </span>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>📚</span> National Curriculum & School eLibrary
          </h2>
          <p className="text-xs text-slate-400">
            Official DBE textbooks, past examination papers, and educator uploaded study guides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subject or book..."
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
          >
            <option value="All">All Grades</option>
            <option value="10">Grade 10</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
        </div>
      </div>

      {/* Official External Resource Hubs (Siyavula & DBE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Siyavula */}
        <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-700/50 rounded-3xl p-5 shadow-md flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30">
                Official DBE Digital Partner
              </span>
              <span className="text-indigo-400 text-sm font-bold">Free Access</span>
            </div>
            <h3 className="text-lg font-black text-white">
              Siyavula Mathematics & Physical Sciences
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Curriculum-aligned practice questions, instant automated marking, and complete textbooks for Grade 10, 11, and 12 learners.
            </p>
          </div>

          <div className="pt-2 border-t border-indigo-900/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              www.siyavula.com
            </span>
            <a
              href="https://www.siyavula.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <span>Open Siyavula Portal</span>
              <span>↗</span>
            </a>
          </div>
        </div>

        {/* DBE Past Papers */}
        <div className="bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-700/50 rounded-3xl p-5 shadow-md flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                DBE National Examinations
              </span>
              <span className="text-emerald-400 text-sm font-bold">Official Papers</span>
            </div>
            <h3 className="text-lg font-black text-white">
              DBE Grade 12 NSC Past Exam Papers & Memos
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Download past Matric NSC exam papers, answer memorandums, and diagnostic reports to practice exam technique.
            </p>
          </div>

          <div className="pt-2 border-t border-emerald-900/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
              education.gov.za
            </span>
            <a
              href="https://www.education.gov.za/Curriculum/Grade-12-Past-Exam-papers"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <span>Open DBE Archive</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* School Uploaded Textbooks, Notes & PDFs */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>🏫</span> School Uploaded Resources ({filtered.length})
          </h3>
          <span className="text-xs text-slate-400">
            Exam Centre: <strong className="text-white">{examCentreNumber}</strong>
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <div className="text-3xl text-slate-500">📖</div>
            <h4 className="text-sm font-bold text-white">
              No school files uploaded for this filter yet
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              School educators upload subject textbooks, lesson slides, and past trial tests for Grade 10-12 learners here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((res) => (
              <div
                key={res.id}
                className="bg-slate-850 border border-slate-750 hover:border-slate-650 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold text-[10px] uppercase">
                      {res.type}
                    </span>
                    <span className="text-[10px] font-bold text-blue-400">
                      Grade {res.grade}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white line-clamp-1">
                    {res.title}
                  </h4>
                  <div className="text-xs text-slate-400">{res.subject}</div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500">
                    Uploaded by: {res.uploadedBy}
                  </span>
                  <a
                    href={res.fileDataOrUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold text-[11px] transition-colors"
                  >
                    Open Document ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
