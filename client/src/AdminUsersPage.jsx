import React from "react";
import { Navigate } from "react-router-dom";

const mockUsers = [
  { name: "Anna Nowak", email: "anna@timeflow.app", role: "user", status: "Aktywny" },
  { name: "Jan Kowalski", email: "jan@timeflow.app", role: "advanced", status: "Aktywny" },
  { name: "Katarzyna Wiśniewska", email: "kasia@timeflow.app", role: "admin", status: "Wstrzymany" },
];

function AdminUsersPage({ currentUser }) {
  if (currentUser?.role !== "admin") {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Zarządzanie użytkownikami</p>
        <h1 className="text-2xl font-bold">Panel administratora</h1>
      </div>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Użytkownicy</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Placeholder tabeli – tutaj pojawią się akcje administracyjne.
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            Widok mock
          </span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/60 text-left">
            <tr className="text-slate-600 dark:text-slate-300">
              <th className="px-4 py-3">Imię i nazwisko</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Rola</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map((user) => (
              <tr key={user.email} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">{user.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="px-3 py-1 rounded-full text-xs bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-100">
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      user.status === "Aktywny"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-100"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-100"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsersPage;
