import React from "react";
import { FiBarChart2, FiCalendar, FiCheckCircle, FiClock, FiPlusCircle } from "react-icons/fi";

const quickLinks = [
  { title: "Dodaj zadanie", icon: FiPlusCircle, hint: "Utwórz nowe zadanie z priorytetem" },
  { title: "Dzisiejsze terminy", icon: FiClock, hint: "Sprawdź zadania na dziś" },
  { title: "Postępy", icon: FiCheckCircle, hint: "Zobacz wykonane zadania" },
  { title: "Kalendarz", icon: FiCalendar, hint: "Przejdź do widoku tygodnia" },
];

function UserDashboard({ user }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Witaj ponownie, {user?.name || "Użytkowniku"}!
        </p>
        <h1 className="text-2xl font-bold">Panel użytkownika</h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <div
              key={link.title}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-semibold">{link.title}</div>
                <Icon className="text-sky-500" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{link.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FiBarChart2 className="text-sky-500" />
            <h2 className="text-lg font-semibold">Szybki podgląd</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tu pojawią się wykresy postępu, aktywności i obciążenia czasowego. W tej chwili to
            placeholder, który pozwoli zaprojektować docelowe widgety.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Nadchodzące</h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>Warsztat projektowy — jutro, 10:00</li>
            <li>Review sprintu — piątek, 14:00</li>
            <li>Plan sprintu — poniedziałek, 9:00</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
