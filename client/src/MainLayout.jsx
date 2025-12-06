import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function MainLayout({ user, onLogout, theme, onToggleTheme }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} onLogout={onLogout} theme={theme} onToggleTheme={onToggleTheme} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
