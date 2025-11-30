import React, { useState } from "react";

const Settings = ({ user, onBack, preferences, onUpdatePreferences }) => {
  const [nick, setNick] = useState(user.nick || "");
  const [msg, setMsg] = useState("");

  const handleSave = (e) => {
    e.preventDefault();
    setMsg("Nick zapisany! (symulacja)");
  };

  const handleResetLocal = () => {
    if (window.confirm("Na pewno zresetowac lokalne dane?")) {
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Ustawienia</h2>
        <button className="px-4 py-2 rounded bg-gray-200 dark:bg-zinc-700" onClick={onBack}>
          Powrot
        </button>
      </header>

      <section className="p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow space-y-3">
        <h3 className="text-lg font-semibold">Profil</h3>
        <form onSubmit={handleSave} className="space-y-3">
          <label className="block">
            <span className="text-sm text-gray-600 dark:text-gray-300">Nick</span>
            <input
              type="text"
              className="w-full mt-1 p-2 rounded border bg-white dark:bg-zinc-700"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
            />
          </label>
          <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
            Zapisz zmiany
          </button>
          {msg && <p className="text-green-600 text-sm">{msg}</p>}
        </form>
      </section>

      <section className="p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow space-y-4">
        <h3 className="text-lg font-semibold">Personalizacja</h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">Motyw aplikacji</p>
          <div className="flex gap-4">
            {["light", "dark"].map((mode) => (
              <label key={mode} className="flex items-center gap-2 text-sm">
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
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={preferences.showWeather}
              onChange={() => handleToggle("showWeather")}
            />
            Pokazuj panel pogody
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={preferences.showQuote}
              onChange={() => handleToggle("showQuote")}
            />
            Pokazuj panel z cytatem dnia
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={preferences.autoExpandCompleted}
              onChange={() => handleToggle("autoExpandCompleted")}
            />
            Domyslnie pokazuj wykonane zadania
          </label>
        </div>
      </section>

      <section className="p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow space-y-3">
        <h3 className="text-lg font-semibold">Zarzadzanie danymi</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Zresetuj lokalne dane, aby wyczyscic cache przegladarki i ustawienia zapisane na tym urzadzeniu.
        </p>
        <button
          className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          onClick={handleResetLocal}
        >
          Resetuj lokalne dane
        </button>
      </section>
    </div>
  );
};

export default Settings;
