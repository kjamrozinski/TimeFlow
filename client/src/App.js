import React, { useState, useEffect, useMemo } from "react";
import Login from "./Login";
import Register from "./Register";
import ResetPassword from "./ResetPassword";
import Weather from "./Weather";
import TaskList from "./TaskList";
import Settings from "./Settings";
import Archive from "./Archive";
import Quote from "./Quote";
import DailySummary from "./DailySummary";
import { FiCloud } from "react-icons/fi";

const API_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:5000';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login"); // login/register/reset/dashboard/settings/archive
  const [tasks, setTasks] = useState([]);
  const [archive, setArchive] = useState([]);
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);

  const defaultPreferences = {
    theme: "light",
    showWeather: true,
    showQuote: true,
    autoExpandCompleted: false,
  };

  const [preferences, setPreferences] = useState(() => {
    try {
      const stored = localStorage.getItem("timeflow_preferences");
      return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences;
    } catch (err) {
      return defaultPreferences;
    }
  });
  const [showCompletedPanel, setShowCompletedPanel] = useState(
    !!preferences.autoExpandCompleted
  );

  useEffect(() => {
    localStorage.setItem("timeflow_preferences", JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    const applyTheme = (theme) => {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };
    applyTheme(preferences.theme);
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setPreferences((prev) => {
        if ((isDark ? "dark" : "light") === prev.theme) return prev;
        return { ...prev, theme: isDark ? "dark" : "light" };
      });
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    });
    return () => observer.disconnect();
  }, [preferences.theme]);

  useEffect(() => {
    setPreferences((prev) => {
      if (prev.autoExpandCompleted === showCompletedPanel) {
        return prev;
      }
      return { ...prev, autoExpandCompleted: showCompletedPanel };
    });
  }, [showCompletedPanel]);

  const updatePreference = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    if (key === "autoExpandCompleted") {
      setShowCompletedPanel(!!value);
    }
  };

  // Sprawdzaj lokalizację co 10 minut
  useEffect(() => {
    const fetchLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
            });
          },
          () => {
            setLocation({ city: "Wrocław" }); // fallback
          }
        );
      }
    };
    fetchLocation();
    const timer = setInterval(fetchLocation, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Pobieraj pogodę, gdy lokalizacja się zmieni
  useEffect(() => {
    if (!location) return;
    const { lat, lon } = location;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,surface_pressure,apparent_temperature,precipitation&timezone=auto`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!data.current_weather) {
          setWeather(null);
          return;
        }
        const current = data.current_weather;
        let humidity = null;
        let pressure = null;
        let feelsLike = null;
        let precipitation = null;
        if (data.hourly?.time?.length) {
          const idx = data.hourly.time.indexOf(current.time);
          const fallbackIdx = idx !== -1 ? idx : 0;
          if (data.hourly.relativehumidity_2m) {
            humidity = data.hourly.relativehumidity_2m[fallbackIdx];
          }
          if (data.hourly.surface_pressure) {
            pressure = data.hourly.surface_pressure[fallbackIdx];
          }
          if (data.hourly.apparent_temperature) {
            feelsLike = data.hourly.apparent_temperature[fallbackIdx];
          }
          if (data.hourly.precipitation) {
            precipitation = data.hourly.precipitation[fallbackIdx];
          }
        }
        setWeather({
          ...current,
          humidity,
          pressure,
          feelsLike,
          precipitation,
          fetchedAt: new Date().toISOString()
        });
      })
      .catch(() => setWeather(null));
  }, [location]);

  // Obsługa zalogowania/rejestracji/resetu (symulacja backendu)
  const handleLogin = async ({ nick, password }) => {
  try {
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Nieprawidłowy login lub hasło');
    }

    const data = await res.json();
    setUser({ nick: data.nick });
    setView('dashboard');
  } catch (err) {
    alert(err.message);
  }
};


  const handleRegister = async ({ nick, password }) => {
  try {
    const res = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Nie udało się założyć konta');
    }

    const data = await res.json();
    setUser({ nick: data.nick });
    setView('dashboard');
  } catch (err) {
    alert(err.message);
  }
};



  const handleResetPassword = async (email) => {
    try {
      await fetch(`${API_URL}/api/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch (err) {
      console.error('Reset password error:', err);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('login');
    setTasks([]);
    setArchive([]);
    setShowCompletedPanel(false);
  };

  // itd... rozwiń według potrzeb

  const handleRestoreTask = (taskId) => {
    setArchive(prevArchive => {
      const taskToRestore = prevArchive.find(task => task.id === taskId);
      if (!taskToRestore) {
        return prevArchive;
      }
      setTasks(prevTasks => [...prevTasks, taskToRestore]);
      return prevArchive.filter(task => task.id !== taskId);
    });
  };

  const handleRemoveFromArchive = (taskId) => {
    setArchive(prevArchive => prevArchive.filter(task => task.id !== taskId));
  };

  const handleRestoreAll = () => {
    setArchive(prevArchive => {
      if (prevArchive.length === 0) {
        return prevArchive;
      }
      setTasks(prevTasks => [...prevTasks, ...prevArchive]);
      return [];
    });
  };

  const handleClearArchive = () => {
    setArchive([]);
  };

  const quickStats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const active = tasks.filter(task => !task.completed).length;
    const overdue = tasks.filter(
      task => !task.completed && task.deadline && new Date(task.deadline) < today
    ).length;
    const completed = tasks.filter(task => task.completed).length;
    return { active, overdue, completed };
  }, [tasks]);

  const isDarkTheme = preferences.theme === "dark";

  if (!user) {
    if (view === "login")
      return <Login onLogin={handleLogin} onSwitch={() => setView("register")} onReset={() => setView("reset")} />;
    if (view === "register")
      return <Register onRegister={handleRegister} onSwitch={() => setView("login")} />;
    if (view === "reset")
      return <ResetPassword onReset={handleResetPassword} onSwitch={() => setView("login")} />;
  }

  if (view === "settings")
    return (
      <Settings
        user={user}
        onBack={() => setView("dashboard")}
        preferences={preferences}
        onUpdatePreferences={updatePreference}
      />
    );
  if (view === "archive") {
    return (
      <Archive
        archive={archive}
        onBack={() => setView("dashboard")}
        onRestore={handleRestoreTask}
        onRestoreAll={handleRestoreAll}
        onDelete={handleRemoveFromArchive}
        onClear={handleClearArchive}
      />
    );
  }

  const withBasePath = (relativePath) => {
    const candidate =
      (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) ||
      process.env.PUBLIC_URL ||
      "/";
    if (!candidate || candidate === "/") {
      return relativePath;
    }
    return `${candidate.replace(/\/$/, "")}${relativePath}`;
  };

  const appIconSmall = withBasePath("/icons/icon-192.png");
  const appIconLarge = withBasePath("/icons/icon-512.png");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <header className="relative overflow-hidden border-b border-white/40 dark:border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-200/50 via-purple-200/40 to-pink-200/40 dark:from-blue-900/40 dark:via-purple-900/40 dark:to-pink-900/40 blur-3xl opacity-80 pointer-events-none" />
        <div className="relative z-10 px-4 py-8 flex flex-col items-center gap-4">
          <div className="hero-title flex items-center justify-center gap-4">
            <img
              src={appIconLarge}
              alt="Ikona TimeFlow"
              className="w-16 h-16 rounded-3xl shadow-lg"
            />
            <span>TimeFlow</span>
          </div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500 dark:text-slate-300">
            PLANNING • MINDFULNESS • PRODUCTIVITY
          </p>
          <nav className="flex flex-wrap justify-center gap-3 text-sm">
            <button className="px-4 py-2 border border-white/40 dark:border-slate-700 rounded-full backdrop-blur bg-white/70 dark:bg-slate-900/60" onClick={() => setView("settings")}>Ustawienia</button>
            <button className="px-4 py-2 border border-white/40 dark:border-slate-700 rounded-full backdrop-blur bg-white/70 dark:bg-slate-900/60" onClick={() => setView("archive")}>Archiwum</button>
            <button className="px-4 py-2 border border-white/40 dark:border-slate-700 rounded-full backdrop-blur bg-white/70 dark:bg-slate-900/60" onClick={handleLogout}>Wyloguj</button>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            <DailySummary
              tasks={tasks}
              showCompleted={showCompletedPanel}
              onToggleCompleted={() => setShowCompletedPanel(prev => !prev)}
            />
            <TaskList
              userNick={user.nick}
              tasks={tasks}
              setTasks={setTasks}
              setArchive={setArchive}
              showCompleted={showCompletedPanel}
              onToggleCompleted={() => setShowCompletedPanel(prev => !prev)}
              theme={preferences.theme}
              onToggleTheme={() =>
                updatePreference('theme', isDarkTheme ? 'light' : 'dark')
              }
            />
          </div>
          <aside className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {preferences.showWeather && (
                <Weather weather={weather} location={location} setLocation={setLocation} />
              )}
              {preferences.showQuote && <Quote />}
              {!preferences.showWeather && !preferences.showQuote && (
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-800 border border-dashed text-sm text-gray-500 dark:text-gray-400">
                  Panele pogody i cytatu sa wylaczone w ustawieniach.
                </div>
              )}
            </div>
            <section className="p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow border border-gray-100 dark:border-zinc-800 space-y-3">
              <h3 className="font-semibold text-lg">Szybkie statystyki</h3>
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div>
                  <p className="text-2xl font-bold">{quickStats.active}</p>
                  <p className="text-gray-500 dark:text-gray-400">Aktywne</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{quickStats.overdue}</p>
                  <p className="text-gray-500 dark:text-gray-400">Zaległe</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{quickStats.completed}</p>
                  <p className="text-gray-500 dark:text-gray-400">Wykonane</p>
                </div>
              </div>
            </section>
            <section
              className={
                isDarkTheme
                  ? "p-5 rounded-3xl shadow-xl space-y-3 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 text-slate-100"
                  : "p-5 rounded-3xl shadow-xl space-y-3 bg-gradient-to-br from-indigo-500 to-blue-500 text-white"
              }
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-white/20 dark:bg-slate-800/60 text-white">
                  <FiCloud className="text-2xl" />
                </div>
                <div>
                  <p className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-white/80'}`}>
                    Wkrótce
                  </p>
                  <h3 className="text-lg font-semibold">
                    TimeFlow Cloud
                  </h3>
                </div>
              </div>
              <p className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-white/90'}`}>
                Przechowuj zdjęcia zadań, notatki głosowe i ważne dokumenty w bezpiecznej chmurze TimeFlow.
              </p>
              <ul className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-white/90'} space-y-1`}>
                <li>• Automatyczne kopie zapasowe</li>
                <li>• Synchronizacja między urządzeniami</li>
                <li>• Szyfrowane udostępnianie</li>
              </ul>
              <button
                className={
                  isDarkTheme
                    ? "w-full mt-2 px-4 py-2 rounded-2xl bg-indigo-900 text-indigo-100 hover:bg-indigo-800 text-sm font-semibold backdrop-blur"
                    : "w-full mt-2 px-4 py-2 rounded-2xl bg-white/30 hover:bg-white/40 text-sm font-semibold backdrop-blur"
                }
              >
                Dowiedz się więcej
              </button>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;
