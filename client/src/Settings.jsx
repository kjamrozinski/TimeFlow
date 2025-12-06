import React, { useState } from "react";

const Settings = ({ user, onBack, preferences, onUpdatePreferences }) => {
  const [nick, setNick] = useState(user.nick || "");
  const [msg, setMsg] = useState("");

  const handleSave = (e) => {
    e.preventDefault();
    setMsg("Nick zapisany! (symulacja)");
  };

  const handleResetLocal = () => {
    if (window.confirm("Na pewno zresetować lokalne dane?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleThemeChange = (event) => {
    onUpdatePreferences("theme", event.target.value);
  };

  const handleToggle = (key) => {
    onUpdatePreferences(key, !preferences[key]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 p-6 transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between bg-white/70 dark:bg-slate-900/70 rounded-3xl px-6 py-4 shadow border border-white/60 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-bold">Ustawienia</h2>
          </div>
          <button
            className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold shadow"
            onClick={onBack}
          >
            Powrót
          </button>
        </header>

        <section className="p-5 bg-white dark:bg-slate-900 rounded-3xl shadow border border-white/60 dark:border-slate-800 space-y-3">
          <h3 className="text-lg font-semibold">Profil</h3>
          <form onSubmit={handleSave} className="space-y-3">
            <label className="block">
              <span className="text-sm text-gray-600 dark:text-gray-300">Nick</span>
              <input
                type="text"
                className="w-full mt-1 p-2 rounded border bg-white dark:bg-slate-800"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
              />
            </label>
            <button className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow">
              Zapisz zmiany
            </button>
            {msg && <p className="text-green-600 text-sm">{msg}</p>}
          </form>
        </section>

        <section className="p-5 bg-white dark:bg-slate-900 rounded-3xl shadow border border-white/60 dark:border-slate-800 space-y-4">
          <h3 className="text-lg font-semibold">Personalizacja</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-300">Motyw aplikacji</p>
            <div className="flex flex-wrap gap-4">
              {["light", "dark"].map((mode) => (
                <label
                  key={mode}
                  className={`flex items-center gap-2 text-sm px-3 py-2 rounded-2xl border ${
                    preferences.theme === mode
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/40"
                      : "border-gray-300 dark:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={mode}
                    checked={preferences.theme === mode}
                    onChange={handleThemeChange}
                  />
                  {mode === "light" ? "Tryb jasny" : "Tryb ciemny"}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {[
              { key: "showWeather", label: "Pokazuj panel pogody" },
              { key: "showQuote", label: "Pokazuj panel z cytatem dnia" },
              { key: "autoExpandCompleted", label: "Domyślnie pokazuj wykonane zadania" },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-3 p-3 rounded-2xl border border-gray-200 dark:border-slate-700"
              >
                <input
                  type="checkbox"
                  checked={preferences[item.key]}
                  onChange={() => handleToggle(item.key)}
                />
                <span className="text-sm">{item.label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="p-5 bg-white dark:bg-slate-900 rounded-3xl shadow border border-white/60 dark:border-slate-800 space-y-3">
          <h3 className="text-lg font-semibold">Zarządzanie danymi</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Zresetuj lokalne dane, aby wyczyścić cache przeglądarki i ustawienia zapisane na tym
            urządzeniu.
          </p>
          <button
            className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700"
            onClick={handleResetLocal}
          >
            Resetuj lokalne dane
          </button>
        </section>
      </div>
    </div>
  );
};

export default Settings;
