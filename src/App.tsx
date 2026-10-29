import React, { useState, useEffect } from "react";
import { AppUser } from "./types";
import { getCurrentSession, clearCurrentSession } from "./data/storage";
import { LoginView } from "./components/LoginView";
import { StaffView } from "./components/StaffView";
import { ParentView } from "./components/ParentView";
import { LearnerView } from "./components/LearnerView";

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Check if an existing logged-in session exists
    const session = getCurrentSession();
    if (session) {
      setCurrentUser(session);
    }
    setIsInitializing(false);
  }, []);

  const handleLogout = () => {
    clearCurrentSession();
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">
        Loading Discipline Partners...
      </div>
    );
  }

  // Critical Rule #2: LOGIN FIRST ALWAYS
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Role Gate Routing
  if (currentUser.role === "staff") {
    return <StaffView user={currentUser} onLogout={handleLogout} />;
  }

  if (currentUser.role === "parent") {
    return <ParentView user={currentUser} onLogout={handleLogout} />;
  }

  if (currentUser.role === "learner") {
    return <LearnerView user={currentUser} onLogout={handleLogout} />;
  }

  return <LoginView onLoginSuccess={handleLoginSuccess} />;
};

export default App;
