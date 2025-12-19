import React, { useEffect, useState } from "react";
import { FiSave } from "react-icons/fi";

const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("timeflow_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

function ProfilePage({ user, onUpdate, onBack }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    nick: user?.nick || "",
    email: user?.email || "",
  });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.nick) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${API_URL}/api/profile/${encodeURIComponent(user.nick)}`, {
      headers: getAuthHeaders(),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Nie udało się pobrać profilu.");
        return res.json();
      })
      .then((data) => {
        setForm({
          name: data.name || "",
          nick: data.nick || user.nick,
          email: data.email || "",
          avatarUrl: data.avatarUrl || "",
          timezone: data.timezone || "",
        });
        setError("");
      })
      .catch((err) => {
        setError(err.message || "Błąd pobierania profilu.");
      })
      .finally(() => setLoading(false));
  }, [user?.nick]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user?.nick) return;
    setStatus("");
    setError("");
    fetch(`${API_URL}/api/profile/${encodeURIComponent(user.nick)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        avatarUrl: form.avatarUrl,
        timezone: form.timezone,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Nie udało się zapisać profilu.");
        return res.json();
      })
      .then((data) => {
        setForm((prev) => ({
          ...prev,
          name: data.name || "",
          email: data.email || "",
          avatarUrl: data.avatarUrl || "",
          timezone: data.timezone || "",
        }));
        onUpdate?.({
          name: data.name || "",
          email: data.email || "",
        });
        setStatus("Zapisano zmiany profilu.");
      })
      .catch((err) => {
        setError(err.message || "Błąd zapisu profilu.");
      });
  };

  if (loading) {
    return (
      <div className="space-y-4 text-slate-900 dark:text-slate-100">
        <div>
          <h1 className="text-2xl font-bold">Profil</h1>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">Ładowanie profilu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-slate-900 dark:text-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profil</h1>
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-100"
          >
            Wróć
          </button>
        )}
      </div>
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4"
      >
        <div>
          <label className="block text-sm mb-1 text-slate-700 dark:text-slate-200">
            Imię i nazwisko
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            placeholder="Jan Kowalski"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-slate-700 dark:text-slate-200">Nick</label>
          <input
            value={form.nick}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            placeholder="janek"
            disabled
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-slate-700 dark:text-slate-200">E-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            placeholder="jan.kowalski@timeflow.app"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-slate-700 dark:text-slate-200">Avatar URL</label>
          <input
            type="url"
            value={form.avatarUrl || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, avatarUrl: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-slate-700 dark:text-slate-200">
            Strefa czasowa
          </label>
          <input
            type="text"
            value={form.timezone || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            placeholder="Europe/Warsaw"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 text-white px-4 py-2 font-semibold hover:bg-sky-600"
        >
          <FiSave /> Zapisz zmiany
        </button>
        {status && <p className="text-sm text-emerald-600 dark:text-emerald-400">{status}</p>}
        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      </form>
    </div>
  );
}

export default ProfilePage;
