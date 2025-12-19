import React, { useState } from "react";
import { FiLogOut, FiSearch, FiSun, FiMoon, FiBell } from "react-icons/fi";

function Topbar({ user, onLogout, theme, onToggleTheme }) {
  const [query, setQuery] = useState("");

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj zadań, użytkowników..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            />
          </div>
        </div>
        {onToggleTheme && (
          <button
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-sky-300 dark:hover:border-sky-500"
            onClick={onToggleTheme}
            title="Przecz motyw"
            type="button"
          >
            {theme === "dark" ? <FiSun /> : <FiMoon />}
          </button>
        )}
        <button
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-sky-300 dark:hover:border-sky-500"
          type="button"
          title="Powiadomienia"
        >
          <FiBell />
        </button>
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div>
            <div className="text-sm font-semibold leading-tight">{user?.name || "Użytkownik"}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</div>
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 flex items-center gap-1 text-xs"
            type="button"
          >
            <FiLogOut /> Wyloguj
          </button>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
