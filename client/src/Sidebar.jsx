import React from "react";
import { FiActivity, FiHome, FiSettings, FiShield, FiUsers } from "react-icons/fi";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/app/dashboard", label: "Panel", icon: FiHome, roles: ["user", "advanced", "admin"] },
  { to: "/app/profile", label: "Profil", icon: FiSettings, roles: ["user", "advanced", "admin"] },
  { to: "/app/admin/users", label: "Użytkownicy", icon: FiUsers, roles: ["admin"] },
];

function Sidebar({ user }) {
  const role = user?.role || "user";

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col">
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">TimeFlow</div>
        <div className="text-xl font-extrabold">Panel</div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <FiShield /> Rola: {role}
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links
          .filter((link) => link.roles.includes(role))
          .map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${
                    isActive
                      ? "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-100"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/70"
                  }`
                }
              >
                <Icon />
                {link.label}
              </NavLink>
            );
          })}
      </nav>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <FiActivity /> Wersja: v1.0.0-preview
      </div>
    </aside>
  );
}

export default Sidebar;
