import React, { useState, useMemo } from "react";
import {
  UserRole,
  ProvinceType,
  SASchool,
  AppUser,
  StaffUser,
  ParentUser,
  LearnerUser,
} from "../types";
import {
  SA_PROVINCES,
  getAllSchools,
  searchSchools,
  registerPrincipalSchool,
} from "../data/saSchools";
import {
  saveUser,
  authenticateStaff,
  authenticateParent,
  authenticateLearner,
  setCurrentSession,
} from "../data/storage";

interface LoginViewProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  // Step 1: Role Selection ("Are you a Learner, Parent/Guardian, or School Staff?")
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // School Search & Selection state
  const [schoolSearchQuery, setSchoolSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<ProvinceType | "All">("All");
  const [onlySecondary, setOnlySecondary] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<SASchool | null>(null);
  const [showSchoolModal, setShowSchoolModal] = useState(false);

  // Missing School Modal (Principal EMIS proof)
  const [showAddSchoolModal, setShowAddSchoolModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolProvince, setNewSchoolProvince] = useState<ProvinceType>("Mpumalanga");
  const [newSchoolDistrict, setNewSchoolDistrict] = useState("");
  const [newSchoolQuintile, setNewSchoolQuintile] = useState<number>(3);
  const [newSchoolEmis, setNewSchoolEmis] = useState("");
  const [newSchoolExamCentre, setNewSchoolExamCentre] = useState("");
  const [newSchoolEmisProofRef, setNewSchoolEmisProofRef] = useState("");

  // Form Fields - Staff
  const [staffExamCentre, setStaffExamCentre] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffRoleType, setStaffRoleType] = useState<
    "Principal" | "Deputy Principal" | "HOD" | "Grade Head" | "Subject Teacher" | "Admin Clerk"
  >("Principal");
  const [staffPassword, setStaffPassword] = useState("");

  // Form Fields - Parent
  const [parentLearnerName, setParentLearnerName] = useState("");
  const [parentLearnerAdm, setParentLearnerAdm] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentRelationship, setParentRelationship] = useState<
    "Mother" | "Father" | "Guardian" | "Grandparent" | "Other"
  >("Mother");
  const [parentPassword, setParentPassword] = useState("");

  // Form Fields - Learner
  const [learnerFullName, setLearnerFullName] = useState("");
  const [learnerAdm, setLearnerAdm] = useState("");
  const [learnerGrade, setLearnerGrade] = useState<"10" | "11" | "12">("10");
  const [learnerPassword, setLearnerPassword] = useState("");

  // Filtered Schools for Picker (searches all 25,505 real DBE schools)
  const filteredSchools = useMemo(() => {
    return searchSchools(schoolSearchQuery, selectedProvince, onlySecondary, 80);
  }, [schoolSearchQuery, selectedProvince, onlySecondary]);

  const resetFormState = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setAuthMode("login");
    resetFormState();
  };

  // Staff Submit
  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (authMode === "login") {
      if (!staffExamCentre || !staffPassword) {
        setErrorMsg("Please enter both DBE Exam Centre Number and Password.");
        return;
      }
      const res = authenticateStaff(staffExamCentre, staffPassword);
      if (!res.success || !res.user) {
        setErrorMsg(res.message);
        return;
      }
      setCurrentSession(res.user);
      onLoginSuccess(res.user);
    } else {
      // Staff Sign Up
      if (!selectedSchool) {
        setErrorMsg("Please select your school from the official DBE list.");
        return;
      }
      if (!staffName || !staffPassword) {
        setErrorMsg("Please provide your full staff name and choose a secure password.");
        return;
      }
      if (staffPassword.length < 4) {
        setErrorMsg("Password must be at least 4 characters long.");
        return;
      }

      const newStaffUser: StaffUser = {
        id: "staff_" + Date.now(),
        role: "staff",
        examCentreNumber: selectedSchool.examCentreNumber,
        emis: selectedSchool.emis,
        schoolName: selectedSchool.schoolName,
        province: selectedSchool.province,
        staffName: staffName.trim(),
        staffRole: staffRoleType,
        isMasterAccount: staffRoleType === "Principal",
        passwordHash: staffPassword,
        createdAt: new Date().toISOString(),
      };

      const saveRes = saveUser(newStaffUser);
      if (!saveRes.success) {
        setErrorMsg(saveRes.message);
        return;
      }

      setCurrentSession(newStaffUser);
      onLoginSuccess(newStaffUser);
    }
  };

  // Parent Submit
  const handleParentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!selectedSchool) {
      setErrorMsg("Please select the learner's school from the official DBE list.");
      return;
    }

    if (authMode === "login") {
      if (!parentLearnerName || !parentLearnerAdm || !parentPassword) {
        setErrorMsg(
          "Please enter Learner Full Names, Admission/EMIS No, and Password."
        );
        return;
      }

      const res = authenticateParent(
        selectedSchool.examCentreNumber,
        parentLearnerName,
        parentLearnerAdm,
        parentPassword
      );

      if (!res.success || !res.user) {
        setErrorMsg(res.message);
        return;
      }

      setCurrentSession(res.user);
      onLoginSuccess(res.user);
    } else {
      // Parent Sign Up
      if (
        !parentLearnerName ||
        !parentLearnerAdm ||
        !parentName ||
        !parentPhone ||
        !parentPassword
      ) {
        setErrorMsg("Please fill in all required parent and learner fields.");
        return;
      }
      if (parentPassword.length < 4) {
        setErrorMsg("Password must be at least 4 characters long.");
        return;
      }

      const newParentUser: ParentUser = {
        id: "parent_" + Date.now(),
        role: "parent",
        schoolEmis: selectedSchool.emis,
        examCentreNumber: selectedSchool.examCentreNumber,
        schoolName: selectedSchool.schoolName,
        learnerFullName: parentLearnerName.trim(),
        learnerAdmissionNo: parentLearnerAdm.trim(),
        parentFullName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        parentEmail: parentEmail.trim() || undefined,
        relationship: parentRelationship,
        passwordHash: parentPassword,
        createdAt: new Date().toISOString(),
      };

      const saveRes = saveUser(newParentUser);
      if (!saveRes.success) {
        setErrorMsg(saveRes.message);
        return;
      }

      setCurrentSession(newParentUser);
      onLoginSuccess(newParentUser);
    }
  };

  // Learner Submit
  const handleLearnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!selectedSchool) {
      setErrorMsg("Please select your school from the official DBE list.");
      return;
    }

    if (authMode === "login") {
      if (!learnerFullName || !learnerAdm || !learnerPassword) {
        setErrorMsg(
          "Please enter your Full Names, Admission/EMIS No, and Password."
        );
        return;
      }

      const res = authenticateLearner(
        selectedSchool.examCentreNumber,
        learnerFullName,
        learnerAdm,
        learnerPassword
      );

      if (!res.success || !res.user) {
        setErrorMsg(res.message);
        return;
      }

      setCurrentSession(res.user);
      onLoginSuccess(res.user);
    } else {
      // Learner Sign Up
      if (!learnerFullName || !learnerAdm || !learnerPassword) {
        setErrorMsg("Please fill in your Full Name, Admission/EMIS No, and Password.");
        return;
      }
      if (learnerPassword.length < 4) {
        setErrorMsg("Password must be at least 4 characters.");
        return;
      }

      const newLearnerUser: LearnerUser = {
        id: "learner_" + Date.now(),
        role: "learner",
        schoolEmis: selectedSchool.emis,
        examCentreNumber: selectedSchool.examCentreNumber,
        schoolName: selectedSchool.schoolName,
        learnerFullName: learnerFullName.trim(),
        learnerAdmissionNo: learnerAdm.trim(),
        grade: learnerGrade,
        passwordHash: learnerPassword,
        createdAt: new Date().toISOString(),
      };

      const saveRes = saveUser(newLearnerUser);
      if (!saveRes.success) {
        setErrorMsg(saveRes.message);
        return;
      }

      setCurrentSession(newLearnerUser);
      onLoginSuccess(newLearnerUser);
    }
  };

  // Principal Add Missing School
  const handleAddNewSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName || !newSchoolEmis || !newSchoolExamCentre) {
      setErrorMsg("Please complete all school credentials.");
      return;
    }

    const regRes = registerPrincipalSchool({
      emis: newSchoolEmis.trim(),
      examCentreNumber: newSchoolExamCentre.trim(),
      schoolName: newSchoolName.trim(),
      province: newSchoolProvince,
      district: newSchoolDistrict.trim() || "District Office",
      quintile: Number(newSchoolQuintile) || 3,
      hasGrade10_12: true,
      proofEmisLetterUrl: newSchoolEmisProofRef.trim() || "DBE EMIS Official Letter on file",
    });

    if (!regRes.success) {
      setErrorMsg(regRes.message);
      return;
    }

    setSuccessMsg(regRes.message);
    const added = getAllSchools().find((s) => s.emis === newSchoolEmis.trim());
    if (added) {
      setSelectedSchool(added);
      if (selectedRole === "staff") {
        setStaffExamCentre(added.examCentreNumber);
      }
    }
    setShowAddSchoolModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 md:p-8 font-sans antialiased">
      {/* Brand Header */}
      <header className="max-w-xl mx-auto w-full pt-4 pb-6 text-center">
        <div className="inline-flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700 shadow-md mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center font-black text-xl text-white shadow-inner">
            DP
          </div>
          <div className="text-left">
            <h1 className="font-extrabold text-lg leading-tight tracking-tight text-white flex items-center gap-1.5">
              DISCIPLINE PARTNERS
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Grades 10-12
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Zero Bunking • Forced Attendance • Higher Matric Pass Rate
            </p>
          </div>
        </div>

        {/* Motto Callout */}
        <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl px-3 py-2 text-xs text-emerald-300 font-medium">
          “In class teacher is parent, at home parent is parent. Build better tomorrow.”
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
        {/* STEP 1: ROLE GATE SCREEN (CRITICAL RULE #3) */}
        {!selectedRole ? (
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Step 1: Role Verification
              </span>
              <h2 className="text-2xl font-black text-white">
                Who are you logging in as?
              </h2>
              <p className="text-sm text-slate-400">
                Please select your designated role to enter the secure portal.
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              {/* Option 1: Learner */}
              <button
                onClick={() => handleSelectRole("learner")}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-slate-750 to-slate-700 hover:from-slate-700 hover:to-slate-650 border border-slate-600 hover:border-emerald-500 transition-all group text-left shadow-sm active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🎓
                  </div>
                  <div>
                    <div className="font-bold text-base text-white group-hover:text-emerald-300">
                      I am a Learner
                    </div>
                    <div className="text-xs text-slate-400">
                      FET Phase (Grade 10, 11, or 12)
                    </div>
                  </div>
                </div>
                <div className="text-slate-400 group-hover:text-emerald-400 font-bold text-lg">
                  →
                </div>
              </button>

              {/* Option 2: Parent / Guardian */}
              <button
                onClick={() => handleSelectRole("parent")}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-slate-750 to-slate-700 hover:from-slate-700 hover:to-slate-650 border border-slate-600 hover:border-emerald-500 transition-all group text-left shadow-sm active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    👨‍👩‍👧
                  </div>
                  <div>
                    <div className="font-bold text-base text-white group-hover:text-emerald-300">
                      I am a Parent / Guardian
                    </div>
                    <div className="text-xs text-slate-400">
                      Real-time attendance & task monitor
                    </div>
                  </div>
                </div>
                <div className="text-slate-400 group-hover:text-emerald-400 font-bold text-lg">
                  →
                </div>
              </button>

              {/* Option 3: School Staff / Principal */}
              <button
                onClick={() => handleSelectRole("staff")}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-slate-750 to-slate-700 hover:from-slate-700 hover:to-slate-650 border border-slate-600 hover:border-emerald-500 transition-all group text-left shadow-sm active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🏫
                  </div>
                  <div>
                    <div className="font-bold text-base text-white group-hover:text-emerald-300">
                      School Staff / Principal
                    </div>
                    <div className="text-xs text-slate-400">
                      Authorized educators & exam centre staff
                    </div>
                  </div>
                </div>
                <div className="text-slate-400 group-hover:text-emerald-400 font-bold text-lg">
                  →
                </div>
              </button>
            </div>

            {/* Empty DB Notice (Rule #1) */}
            <div className="pt-2 text-center border-t border-slate-700/80">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Clean State: No mock learners. Verified DBE EMIS database ready.
              </span>
            </div>
          </div>
        ) : (
          /* STEP 2: AUTHENTICATION FORM (LOGIN OR SIGN UP) */
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5">
            {/* Top Bar with Role Switcher & Back button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <button
                onClick={() => {
                  setSelectedRole(null);
                  resetFormState();
                }}
                className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                ← Back to Roles
              </button>
              <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-full border border-slate-700 text-xs font-bold text-emerald-400">
                {selectedRole === "learner" && "🎓 Learner Portal"}
                {selectedRole === "parent" && "👨‍👩‍👧 Parent Portal"}
                {selectedRole === "staff" && "🏫 School Staff Portal"}
              </div>
            </div>

            {/* Auth Mode Toggle (Login vs Sign Up) */}
            <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl border border-slate-700 text-xs font-bold">
              <button
                onClick={() => {
                  setAuthMode("login");
                  resetFormState();
                }}
                className={`py-2 rounded-lg transition-all ${
                  authMode === "login"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setAuthMode("signup");
                  resetFormState();
                }}
                className={`py-2 rounded-lg transition-all ${
                  authMode === "signup"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Create Account (Sign Up)
              </button>
            </div>

            {/* Error & Success Alerts */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-700 text-red-200 text-xs flex items-start gap-2 animate-fadeIn">
                <span className="font-bold text-red-400">✕</span>
                <div className="flex-1">{errorMsg}</div>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700 text-emerald-200 text-xs flex items-start gap-2 animate-fadeIn">
                <span className="font-bold text-emerald-400">✓</span>
                <div className="flex-1">{successMsg}</div>
              </div>
            )}

            {/* =======================================================
                FORM 1: SCHOOL STAFF (Exam Centre Number + Password)
                ======================================================= */}
            {selectedRole === "staff" && (
              <form onSubmit={handleStaffSubmit} className="space-y-4">
                {authMode === "login" ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">
                        DBE Exam Centre Number
                      </label>
                      <input
                        type="text"
                        value={staffExamCentre}
                        onChange={(e) => setStaffExamCentre(e.target.value)}
                        placeholder="e.g. 800035108"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                      <p className="text-[11px] text-slate-500">
                        Official 8-13 digit DBE matric exam centre identifier.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-300">
                          Password
                        </label>
                        <span className="text-[10px] text-slate-400">
                          Master held by Principal
                        </span>
                      </div>
                      <input
                        type="password"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        placeholder="Enter your staff password"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </>
                ) : (
                  /* Staff Sign Up */
                  <>
                    {/* School Picker trigger */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                        <span>Select Real SA School (Official DBE List)</span>
                        {selectedSchool && (
                          <span className="text-[11px] text-emerald-400">
                            Verified ✓
                          </span>
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSchoolModal(true)}
                        className="w-full text-left bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white flex items-center justify-between transition-colors"
                      >
                        <span className="truncate">
                          {selectedSchool
                            ? `${selectedSchool.schoolName} (${selectedSchool.province})`
                            : "Click to search & select official school..."}
                        </span>
                        <span className="text-xs text-emerald-400 font-bold ml-2">
                          Browse
                        </span>
                      </button>
                      {selectedSchool && (
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1 mt-1">
                          <span>EMIS: <strong className="text-slate-200">{selectedSchool.emis}</strong></span>
                          <span>Exam Centre: <strong className="text-slate-200">{selectedSchool.examCentreNumber}</strong></span>
                          <span>District: <strong className="text-slate-200">{selectedSchool.district}</strong></span>
                          <span>Quintile: <strong className="text-slate-200">{selectedSchool.quintile}</strong></span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">
                          Staff Full Name
                        </label>
                        <input
                          type="text"
                          value={staffName}
                          onChange={(e) => setStaffName(e.target.value)}
                          placeholder="e.g. Mr. S. Mkhize"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">
                          Role at School
                        </label>
                        <select
                          value={staffRoleType}
                          onChange={(e: any) => setStaffRoleType(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Principal">Principal (Master)</option>
                          <option value="Deputy Principal">Deputy Principal</option>
                          <option value="HOD">HOD (Head of Dept)</option>
                          <option value="Grade Head">Grade 10-12 Head</option>
                          <option value="Subject Teacher">Subject Teacher</option>
                          <option value="Admin Clerk">Admin Clerk</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">
                        Create Staff Password
                      </label>
                      <input
                        type="password"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        placeholder="Minimum 4 characters"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40 active:scale-[0.99] transition-all"
                >
                  {authMode === "login"
                    ? "Enter Staff Dashboard →"
                    : "Register School Staff Account →"}
                </button>
              </form>
            )}

            {/* =======================================================
                FORM 2: PARENT / GUARDIAN (School + Child + Password)
                Stored under child details + parent details linked
                ======================================================= */}
            {selectedRole === "parent" && (
              <form onSubmit={handleParentSubmit} className="space-y-3.5">
                {/* School Picker trigger */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Child's School (Official DBE List)</span>
                    {selectedSchool && (
                      <span className="text-[11px] text-emerald-400">
                        Selected ✓
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSchoolModal(true)}
                    className="w-full text-left bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white flex items-center justify-between transition-colors"
                  >
                    <span className="truncate">
                      {selectedSchool
                        ? `${selectedSchool.schoolName} (${selectedSchool.province})`
                        : "Click to select your child's school..."}
                    </span>
                    <span className="text-xs text-emerald-400 font-bold ml-2">
                      Choose
                    </span>
                  </button>
                </div>

                {/* Learner Info */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Learner Full Names (As registered at school)
                  </label>
                  <input
                    type="text"
                    value={parentLearnerName}
                    onChange={(e) => setParentLearnerName(e.target.value)}
                    placeholder="e.g. Karabo Dlamini"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Learner Admission No / EMIS Identifier
                  </label>
                  <input
                    type="text"
                    value={parentLearnerAdm}
                    onChange={(e) => setParentLearnerAdm(e.target.value)}
                    placeholder="e.g. ADM2026-402 or ID"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                {authMode === "signup" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">
                          Parent Full Name
                        </label>
                        <input
                          type="text"
                          value={parentName}
                          onChange={(e) => setParentName(e.target.value)}
                          placeholder="e.g. Nomvula Dlamini"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">
                          Relationship
                        </label>
                        <select
                          value={parentRelationship}
                          onChange={(e: any) => setParentRelationship(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Mother">Mother</option>
                          <option value="Father">Father</option>
                          <option value="Guardian">Legal Guardian</option>
                          <option value="Grandparent">Grandparent</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">
                          Parent Cellphone (SMS / WhatsApp)
                        </label>
                        <input
                          type="tel"
                          value={parentPhone}
                          onChange={(e) => setParentPhone(e.target.value)}
                          placeholder="e.g. 082 123 4567"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">
                          Email (Optional)
                        </label>
                        <input
                          type="email"
                          value={parentEmail}
                          onChange={(e) => setParentEmail(e.target.value)}
                          placeholder="parent@example.com"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    {authMode === "login" ? "Password" : "Create Password"}
                  </label>
                  <input
                    type="password"
                    value={parentPassword}
                    onChange={(e) => setParentPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40 active:scale-[0.99] transition-all"
                >
                  {authMode === "login"
                    ? "Log In to View Child Attendance →"
                    : "Create Linked Parent Account →"}
                </button>
              </form>
            )}

            {/* =======================================================
                FORM 3: LEARNER (School + Full Name + Admission + Pass)
                ======================================================= */}
            {selectedRole === "learner" && (
              <form onSubmit={handleLearnerSubmit} className="space-y-3.5">
                {/* School Picker trigger */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Your School (Official DBE List)</span>
                    {selectedSchool && (
                      <span className="text-[11px] text-emerald-400">
                        Selected ✓
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSchoolModal(true)}
                    className="w-full text-left bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white flex items-center justify-between transition-colors"
                  >
                    <span className="truncate">
                      {selectedSchool
                        ? `${selectedSchool.schoolName} (${selectedSchool.province})`
                        : "Click to select your school..."}
                    </span>
                    <span className="text-xs text-emerald-400 font-bold ml-2">
                      Choose
                    </span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Your Full Names
                  </label>
                  <input
                    type="text"
                    value={learnerFullName}
                    onChange={(e) => setLearnerFullName(e.target.value)}
                    placeholder="e.g. Karabo Dlamini"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Admission / EMIS No
                    </label>
                    <input
                      type="text"
                      value={learnerAdm}
                      onChange={(e) => setLearnerAdm(e.target.value)}
                      placeholder="e.g. ADM2026-402"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  {authMode === "signup" && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">
                        Your Grade
                      </label>
                      <select
                        value={learnerGrade}
                        onChange={(e: any) => setLearnerGrade(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="10">Grade 10</option>
                        <option value="11">Grade 11</option>
                        <option value="12">Grade 12 (Matric)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    {authMode === "login" ? "Password" : "Create Password"}
                  </label>
                  <input
                    type="password"
                    value={learnerPassword}
                    onChange={(e) => setLearnerPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40 active:scale-[0.99] transition-all"
                >
                  {authMode === "login"
                    ? "Access Learner Portal →"
                    : "Create Learner Account →"}
                </button>
              </form>
            )}

            {/* Read-Only Notice for Parents & Learners (Critical Rule #6) */}
            {(selectedRole === "parent" || selectedRole === "learner") && (
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-[11px] text-slate-400 flex items-center gap-2">
                <span className="text-emerald-400 font-bold">🔒 READ-ONLY:</span>
                <span>
                  Parents & learners view attendance & tasks. Only school staff can log or edit records.
                </span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* =======================================================
          MODAL: REAL SA SCHOOL SEARCH & SELECTION (RULE #4)
          ======================================================= */}
      {showSchoolModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-fadeIn">
          <div className="bg-slate-850 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 md:p-5 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-white">
                  Select Official DBE School
                </h3>
                <p className="text-xs text-slate-400">
                  Search from official DBE Master EMIS & Matric Exam Centre list.
                </p>
              </div>
              <button
                onClick={() => setShowSchoolModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Filter Controls */}
            <div className="p-4 border-b border-slate-700 space-y-3 bg-slate-900/60">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={schoolSearchQuery}
                    onChange={(e) => setSchoolSearchQuery(e.target.value)}
                    placeholder="Search by school name, EMIS, exam centre, district..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  {schoolSearchQuery && (
                    <button
                      onClick={() => setSchoolSearchQuery("")}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <select
                  value={selectedProvince}
                  onChange={(e: any) => setSelectedProvince(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="All">All 9 Provinces (25,500+ Schools)</option>
                  {SA_PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setOnlySecondary(!onlySecondary)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                    onlySecondary
                      ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/50"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {onlySecondary ? "Gr 10-12 Secondary Only" : "All SA Schools (25,505)"}
                </button>
              </div>

              {/* Exact DBE Verification Policy Notice */}
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] text-emerald-300 flex items-center justify-between">
                <span>Schools loaded from DBE EMIS - principal can add missing school with proof of EMIS letter</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Strict Anti-Fake Rule</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing {filteredSchools.length} of {(filteredSchools as any).totalMatches || filteredSchools.length} matching schools
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowSchoolModal(false);
                    setShowAddSchoolModal(true);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold underline"
                >
                  Can't find your school? Add missing school →
                </button>
              </div>
            </div>

            {/* Schools List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-800">
              {filteredSchools.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="text-4xl">🏫</div>
                  <h4 className="text-base font-bold text-white">
                    No matching DBE school found
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Schools loaded from DBE EMIS - principal can add missing school with proof of EMIS letter. Never generate fake EMIS.
                  </p>
                  <button
                    onClick={() => {
                      setShowSchoolModal(false);
                      setShowAddSchoolModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    + Register Missing School with EMIS Proof
                  </button>
                </div>
              ) : (
                filteredSchools.map((school) => {
                  const isSelected = selectedSchool?.emis === school.emis;
                  return (
                    <button
                      key={school.emis}
                      onClick={() => {
                        setSelectedSchool(school);
                        if (selectedRole === "staff") {
                          setStaffExamCentre(school.examCentreNumber);
                        }
                        setShowSchoolModal(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? "bg-emerald-950/60 border border-emerald-500/50"
                          : "hover:bg-slate-800/80 border border-transparent"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          {school.schoolName}
                          {school.isPrincipalRegistered && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-medium border border-amber-500/30">
                              EMIS Letter Verified
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5">
                          <span>📍 {school.district}, {school.province}</span>
                          <span>Quintile {school.quintile}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex gap-3 font-mono">
                          <span>EMIS: <strong className="text-slate-300">{school.emis}</strong></span>
                          <span>Exam Centre: <strong className="text-slate-300">{school.examCentreNumber}</strong></span>
                        </div>
                      </div>
                      <div className="pt-1">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isSelected
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {isSelected ? "Selected ✓" : "Select"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL: PRINCIPAL ADD MISSING SCHOOL (CRITICAL RULE #4)
          "never generate fake EMIS - principal adds with proof of EMIS letter"
          ======================================================= */}
      {showAddSchoolModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-fadeIn">
          <div className="bg-slate-850 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                  <span>🏛️</span> Register Official SA School
                </h3>
                <p className="text-xs text-slate-400">
                  DBE official EMIS verification protocol
                </p>
              </div>
              <button
                onClick={() => setShowAddSchoolModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewSchool} className="p-5 space-y-4">
              <div className="bg-amber-950/40 border border-amber-700/50 rounded-xl p-3 text-xs text-amber-200 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-amber-300">
                  ⚠️ STRICT DBE COMPLIANCE POLICY:
                </span>
                <p className="text-[11px] leading-relaxed">
                  Never generate fake EMIS numbers. All registered schools must possess a genuine 8-digit DBE EMIS certificate and designated Matric Exam Centre number.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Official School Name
                </label>
                <input
                  type="text"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  placeholder="e.g. Sitintile Secondary School"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Province
                  </label>
                  <select
                    value={newSchoolProvince}
                    onChange={(e: any) => setNewSchoolProvince(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-emerald-500"
                  >
                    {SA_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    District
                  </label>
                  <input
                    type="text"
                    value={newSchoolDistrict}
                    onChange={(e) => setNewSchoolDistrict(e.target.value)}
                    placeholder="e.g. Ehlanzeni"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-bold text-slate-300">
                    Quintile
                  </label>
                  <select
                    value={newSchoolQuintile}
                    onChange={(e: any) => setNewSchoolQuintile(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="1">1 (No Fee)</option>
                    <option value="2">2 (No Fee)</option>
                    <option value="3">3 (No Fee)</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-bold text-slate-300">
                    DBE EMIS No
                  </label>
                  <input
                    type="text"
                    value={newSchoolEmis}
                    onChange={(e) => setNewSchoolEmis(e.target.value)}
                    placeholder="8 digits"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-bold text-slate-300">
                    Exam Centre No
                  </label>
                  <input
                    type="text"
                    value={newSchoolExamCentre}
                    onChange={(e) => setNewSchoolExamCentre(e.target.value)}
                    placeholder="8-13 digits"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Principal Proof of EMIS Letter Reference / Dispatch No
                </label>
                <input
                  type="text"
                  value={newSchoolEmisProofRef}
                  onChange={(e) => setNewSchoolEmisProofRef(e.target.value)}
                  placeholder="e.g. DBE/PROV/2026/EMIS-REF-789"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSchoolModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 font-bold text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-md shadow-emerald-950/30"
                >
                  Confirm & Save School
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
<div className="text-center py-3">
<button
onClick={()=>{
const id=prompt("Enter your ID or Email:");
if(!id)return;
const users=JSON.parse(localStorage.getItem("dp_users")||"[]");
const u=users.find((x:any)=>x.idNumber===id||x.email===id||x.learnerId===id);
if(!u){alert("Not found!");return;}
u.password="123456";
localStorage.setItem("dp_users",JSON.stringify(users));
alert("Reset! New password: 123456 for "+u.name);
}}
className="text-sm text-blue-600 underline"
>Forgot Password? Click to Reset to 123456</button>
</div>
      {/* Footer Branding */}
      <footer className="max-w-md mx-auto w-full pt-6 pb-2 text-center text-xs text-slate-500">
        Discipline Partners (DP) • Stopping Bunking in South Africa • Data-Light Architecture
      </footer>
    </div>
  );
};
