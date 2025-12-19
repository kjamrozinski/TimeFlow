import React, { useEffect, useMemo, useRef, useState } from "react";
import Register from "./Register";
import ResetPassword from "./ResetPassword";
import Weather from "./Weather";
import TaskList from "./TaskList";
import Settings from "./Settings";
import Archive from "./Archive";
import Quote from "./Quote";
import DailySummary from "./DailySummary";
import { FiCloud } from "react-icons/fi";
import LoginPage from "./LoginPage";
import ProfilePage from "./ProfilePage";
import WeekView from "./WeekView";

const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("timeflow_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const defaultPreferences = {
  theme: "light",
  showWeather: true,
  showQuote: true,
  autoExpandCompleted: false,
  defaultPriority: "Low",
  defaultType: "Inne",
  focusMode: false,
};
const FOCUS_STORAGE_KEY = "timeflow_focus_sessions";
const DEFAULT_FOCUS_MINUTES = 25;


function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login"); // login/register/reset/dashboard/settings/archive/profile/week
  const [tasks, setTasks] = useState([]);
  const [archive, setArchive] = useState([]);
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);

  const [preferences, setPreferences] = useState(() => {
    try {
      const stored = localStorage.getItem("timeflow_preferences");
      return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences;
    } catch (_err) {
      return defaultPreferences;
    }
  });
  const [showCompletedPanel, setShowCompletedPanel] = useState(!!preferences.autoExpandCompleted);
  const [focusHours, setFocusHours] = useState(0);
  const [focusMinutes, setFocusMinutes] = useState(DEFAULT_FOCUS_MINUTES);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [focusRemaining, setFocusRemaining] = useState(DEFAULT_FOCUS_MINUTES * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const focusStartedAtRef = useRef(null);
  const focusInitialSecondsRef = useRef(DEFAULT_FOCUS_MINUTES * 60);
  const [focusSessions, setFocusSessions] = useState(() => {
    try {
      const stored = localStorage.getItem(FOCUS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (_err) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("timeflow_preferences", JSON.stringify(preferences));
    document.documentElement.classList.toggle("dark", preferences.theme === "dark");
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(focusSessions));
  }, [focusSessions]);

  const persistPreferences = (nextPreferences) => {
    if (!user?.nick) return;
    fetch(`${API_URL}/api/preferences/${encodeURIComponent(user.nick)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(nextPreferences),
    }).catch(() => {});
  };

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
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [preferences.theme]);

  useEffect(() => {
    setPreferences((prev) => {
      if (prev.autoExpandCompleted === showCompletedPanel) {
        return prev;
      }
      const next = { ...prev, autoExpandCompleted: showCompletedPanel };
      persistPreferences(next);
      return next;
    });
  }, [showCompletedPanel]);

  const saveFocusSession = ({ startAt, endAt, durationSeconds, completed }) => {
    const session = {
      id: `${startAt}-${endAt}`,
      startAt,
      endAt,
      durationSeconds,
      completed,
    };
    setFocusSessions((prev) => [session, ...prev].slice(0, 100));
  };

  const focusTotalSeconds =
    Math.max(0, Number(focusHours) || 0) * 3600 +
    Math.max(0, Number(focusMinutes) || 0) * 60 +
    Math.max(0, Number(focusSeconds) || 0);

  useEffect(() => {
    if (!focusRunning) return;
    const timer = setInterval(() => {
      setFocusRemaining((prev) => {
        if (prev <= 1) {
          const endAt = new Date().toISOString();
          const startAt = focusStartedAtRef.current || endAt;
          saveFocusSession({
            startAt,
            endAt,
            durationSeconds: focusInitialSecondsRef.current,
            completed: true,
          });
          focusStartedAtRef.current = null;
          focusInitialSecondsRef.current = focusTotalSeconds;
          setFocusRunning(false);
          setTimeout(() => alert("Sesja skupienia zakończona."), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [focusRunning, focusTotalSeconds]);

  const handleFocusStart = () => {
    if (focusRunning) return;
    if (focusTotalSeconds <= 0) return;
    if (focusRemaining <= 0) {
      setFocusRemaining(focusTotalSeconds);
      focusInitialSecondsRef.current = focusTotalSeconds;
    }
    focusStartedAtRef.current = new Date().toISOString();
    setFocusRunning(true);
  };

  const handleFocusPause = () => {
    setFocusRunning(false);
  };

  const handleFocusReset = () => {
    setFocusRunning(false);
    setFocusRemaining(focusTotalSeconds);
    focusInitialSecondsRef.current = focusTotalSeconds;
    focusStartedAtRef.current = null;
  };

  useEffect(() => {
    if (focusRunning) return;
    setFocusRemaining(focusTotalSeconds);
    focusInitialSecondsRef.current = focusTotalSeconds;
    focusStartedAtRef.current = null;
  }, [focusTotalSeconds, focusRunning]);

const updatePreference = (key, value) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: value };
      persistPreferences(next);
      return next;
    });
    if (key === "autoExpandCompleted") {
      setShowCompletedPanel(!!value);
    }
  };

  useEffect(() => {
    if (!user?.nick) return;
    fetch(`${API_URL}/api/preferences/${encodeURIComponent(user.nick)}`, {
      headers: getAuthHeaders(),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Preferences fetch failed");
        return res.json();
      })
      .then((data) => {
        setPreferences((prev) => ({
          ...prev,
          theme: data.theme || prev.theme,
          showWeather: typeof data.showWeather === "boolean" ? data.showWeather : prev.showWeather,
          showQuote: typeof data.showQuote === "boolean" ? data.showQuote : prev.showQuote,
          autoExpandCompleted:
            typeof data.autoExpandCompleted === "boolean"
              ? data.autoExpandCompleted
              : prev.autoExpandCompleted,
          defaultPriority: data.defaultPriority || prev.defaultPriority,
          defaultType: data.defaultType || prev.defaultType,
          focusMode: typeof data.focusMode === "boolean" ? data.focusMode : prev.focusMode,
        }));
        setShowCompletedPanel(!!data.autoExpandCompleted);
      })
      .catch(() => {});
  }, [user?.nick]);

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
          },
          { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 }
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
          fetchedAt: new Date().toISOString(),
        });
      })
      .catch(() => setWeather(null));
  }, [location]);

  // Obsługa zalogowania/rejestracji/resetu (symulacja backendu)
  const handleLogin = async ({ nick, email, password, role }) => {
    const nickValue = nick || email?.split("@")[0] || "użytkownik";
    const chosenRole = role || "user";

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nick: nickValue, password }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.token) {
          localStorage.setItem("timeflow_token", data.token);
        } else {
          localStorage.removeItem("timeflow_token");
        }
        setUser({ nick: data.nick || nickValue, role: data.role || chosenRole });
        setView("dashboard");
        return;
      }
    } catch (_err) {
      // Brak poczenia z API  przechodzimy na tryb mock poniej.
    }

    // Fallback mock (gdy API jest niedostępne lub zwraca błąd)
    localStorage.removeItem("timeflow_token");
    setUser({ nick: nickValue, role: chosenRole });
    setView("dashboard");
  };

  const handleRegister = async ({ nick, password }) => {
    try {
      const res = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nick, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Nie udało się założyć konta");
      }

      const data = await res.json();
      if (data?.token) {
        localStorage.setItem("timeflow_token", data.token);
      } else {
        localStorage.removeItem("timeflow_token");
      }
      setUser({ nick: data.nick, role: data.role || "user" });
      setView("dashboard");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetPassword = async (email) => {
    try {
      await fetch(`${API_URL}/api/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch (err) {
      console.error("Reset password error:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("timeflow_token");
    setUser(null);
    setView("login");
    setTasks([]);
    setArchive([]);
    setShowCompletedPanel(false);
  };

  const handleProfileUpdate = (updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const handleRestoreTask = (taskId) => {
    setArchive((prevArchive) => {
      const taskToRestore = prevArchive.find((task) => task.id === taskId);
      if (!taskToRestore) {
        return prevArchive;
      }
      setTasks((prevTasks) => [...prevTasks, taskToRestore]);
      return prevArchive.filter((task) => task.id !== taskId);
    });
  };

  const handleRemoveFromArchive = (taskId) => {
    setArchive((prevArchive) => prevArchive.filter((task) => task.id !== taskId));
  };

  const handleRestoreAll = () => {
    setArchive((prevArchive) => {
      if (prevArchive.length === 0) {
        return prevArchive;
      }
      setTasks((prevTasks) => [...prevTasks, ...prevArchive]);
      return [];
    });
  };

  const handleClearArchive = () => {
    setArchive([]);
  };

  const quickStats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const active = tasks.filter((task) => !task.completed).length;
    const overdue = tasks.filter(
      (task) => !task.completed && task.deadline && new Date(task.deadline) < today
    ).length;
    const completed = tasks.filter((task) => task.completed).length;
    return { active, overdue, completed };
  }, [tasks]);

  const isDarkTheme = preferences.theme === "dark";

  if (!user) {
    if (view === "login")
      return (
        <LoginPage
          onLogin={handleLogin}
          onReset={() => setView("reset")}
          onCreateAccount={() => setView("register")}
          theme={preferences.theme}
          onToggleTheme={() => updatePreference("theme", isDarkTheme ? "light" : "dark")}
        />
      );
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
  if (view === "profile")
    return (
      <ProfilePage
        user={user}
        onBack={() => setView("dashboard")}
        onUpdate={handleProfileUpdate}
      />
    );
  if (view === "week")
    return (
      <WeekView
        tasks={tasks}
        onBack={() => setView("dashboard")}
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
            PLANNING | MINDFULNESS | PRODUCTIVITY
          </p>
          <nav className="flex flex-wrap justify-center gap-3 text-sm">
            <button
              className="px-4 py-2 border border-white/40 dark:border-slate-700 rounded-full backdrop-blur bg-white/70 dark:bg-slate-900/60"
              onClick={() => setView("profile")}
            >
              Profil
            </button>
            <button
              className="px-4 py-2 border border-white/40 dark:border-slate-700 rounded-full backdrop-blur bg-white/70 dark:bg-slate-900/60"
              onClick={() => setView("week")}
            >
              Historia
            </button>
            <button
              className="px-4 py-2 border border-white/40 dark:border-slate-700 rounded-full backdrop-blur bg-white/70 dark:bg-slate-900/60"
              onClick={() => setView("settings")}
            >
              Ustawienia
            </button>
            <button
              className="px-4 py-2 border border-white/40 dark:border-slate-700 rounded-full backdrop-blur bg-white/70 dark:bg-slate-900/60"
              onClick={() => setView("archive")}
            >
              Archiwum
            </button>
            <button
              className="px-4 py-2 border border-white/40 dark:border-slate-700 rounded-full backdrop-blur bg-white/70 dark:bg-slate-900/60"
              onClick={() => updatePreference("focusMode", !preferences.focusMode)}
            >
              {preferences.focusMode ? "Wyłącz fokus" : "Tryb skupienia"}
            </button>
            <button
              className="px-4 py-2 border border-white/40 dark:border-slate-700 rounded-full backdrop-blur bg-white/70 dark:bg-slate-900/60"
              onClick={handleLogout}
            >
              Wyloguj
            </button>
          </nav>
        </div>
      </header>
      <main className={`max-w-6xl mx-auto px-4 py-6 space-y-6 ${preferences.focusMode ? "max-w-4xl" : ""}`}>
        <div className={`grid gap-4 ${preferences.focusMode ? "lg:grid-cols-1" : "lg:grid-cols-[2fr,1fr]"}`}>
          <div className="space-y-4">
            {preferences.focusMode && (
              <section className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 shadow p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Sesja skupienia</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Skup się na jednym zadaniu. Po zakończeniu pojawi się alert.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <label className="text-slate-500 dark:text-slate-400">Godz</label>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={focusHours}
                        onChange={(e) => setFocusHours(Number(e.target.value))}
                        disabled={focusRunning}
                        className="w-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-2 py-1 text-sm text-slate-700 dark:text-slate-100"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-slate-500 dark:text-slate-400">Min</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={focusMinutes}
                        onChange={(e) => setFocusMinutes(Number(e.target.value))}
                        disabled={focusRunning}
                        className="w-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-2 py-1 text-sm text-slate-700 dark:text-slate-100"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-slate-500 dark:text-slate-400">Sek</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={focusSeconds}
                        onChange={(e) => setFocusSeconds(Number(e.target.value))}
                        disabled={focusRunning}
                        className="w-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-2 py-1 text-sm text-slate-700 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="text-4xl font-semibold tracking-tight">
                    {String(Math.floor(focusRemaining / 60)).padStart(2, "0")}:
                    {String(focusRemaining % 60).padStart(2, "0")}
                  </div>
                  <div className="flex items-center gap-2">
                    {!focusRunning ? (
                      <button
                        className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500"
                        onClick={handleFocusStart}
                      >
                        Start
                      </button>
                    ) : (
                      <button
                        className="px-4 py-2 rounded-full bg-amber-400 text-slate-900 text-sm font-semibold hover:bg-amber-300"
                        onClick={handleFocusPause}
                      >
                        Pauza
                      </button>
                    )}
                    <button
                      className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-200 hover:border-indigo-300"
                      onClick={handleFocusReset}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </section>
            )}
            <DailySummary
              tasks={tasks}
              showCompleted={showCompletedPanel}
              onToggleCompleted={() => setShowCompletedPanel((prev) => !prev)}
            />
            <TaskList
              userNick={user.nick}
              tasks={tasks}
              setTasks={setTasks}
              setArchive={setArchive}
              showCompleted={showCompletedPanel}
              onToggleCompleted={() => setShowCompletedPanel((prev) => !prev)}
              theme={preferences.theme}
              defaultPriority={preferences.defaultPriority}
              defaultType={preferences.defaultType}
              onToggleTheme={() => updatePreference("theme", isDarkTheme ? "light" : "dark")}
            />
          </div>
          {!preferences.focusMode && (
            <aside className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {preferences.showWeather && (
                <Weather weather={weather} location={location} setLocation={setLocation} />
              )}
              {preferences.showQuote && <Quote />}
              {!preferences.showWeather && !preferences.showQuote && (
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-800 border border-dashed text-sm text-gray-500 dark:text-gray-400">
                  Panele pogody i cytatu s wyczone w ustawieniach.
                </div>
              )}
            </div>
            <section className="p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow border border-gray-100 dark:border-zinc-800 space-y-3">
              <h3 className="font-semibold text-lg">Szybkie statystyki</h3>
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div>
                  <p className="text-2xl font-bold">{quickStats.active}</p>
                  <p className="text-slate-700 dark:text-slate-200">Aktywne</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{quickStats.overdue}</p>
                  <p className="text-slate-700 dark:text-slate-200">Zaległe</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{quickStats.completed}</p>
                  <p className="text-slate-700 dark:text-slate-200">Wykonane</p>
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
                  <p className={`text-sm ${isDarkTheme ? "text-slate-300" : "text-white/80"}`}>Wkrótce</p>
                  <h3 className="text-lg font-semibold">TimeFlow Cloud</h3>
                </div>
              </div>
              <p className={`text-sm ${isDarkTheme ? "text-slate-300" : "text-white/90"}`}>
                Przechowuj zdjęcia zadań, notatki głosowe i ważne dokumenty w bezpiecznej chmurze TimeFlow.
              </p>
              <ul className={`text-sm ${isDarkTheme ? "text-slate-300" : "text-white/90"} space-y-1`}>
                <li>- Automatyczne kopie zapasowe</li>
                <li>- Synchronizacja między urządzeniami</li>
                <li>- Szyfrowane udostępnianie</li>
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
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
