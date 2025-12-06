import React, { useState } from "react";
import { FiSave } from "react-icons/fi";

function ProfilePage({ user, onUpdate }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    nick: user?.nick || "",
    email: user?.email || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate?.(form);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Twoje dane</p>
        <h1 className="text-2xl font-bold">Profil</h1>
      </div>
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4"
      >
        <div>
          <label className="block text-sm mb-1">Imię i nazwisko</label>
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
            placeholder="Jan Kowalski"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Nick</label>
          <input
            value={form.nick}
            onChange={(e) => setForm((prev) => ({ ...prev, nick: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
            placeholder="janek"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">E-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
            placeholder="jan.kowalski@timeflow.app"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 text-white px-4 py-2 font-semibold hover:bg-sky-600"
        >
          <FiSave /> Zapisz zmiany
        </button>
      </form>
    </div>
  );
}

export default ProfilePage;
