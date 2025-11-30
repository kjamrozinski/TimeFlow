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

const API_URL = 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login"); // login/register/reset/dashboard/settings/archive
  const [tasks, setTasks] = useState([]);
  const [archive, setArchive] = useState([]);
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [showCompletedPanel, setShowCompletedPanel] = useState(false);

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
    // Przykład z Open-Meteo (możesz podmienić na inne API)
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current_weather=true`
    )
      .then((r) => r.json())
      .then((data) => setWeather(data.current_weather))
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

  if (!user) {
    if (view === "login")
      return <Login onLogin={handleLogin} onSwitch={() => setView("register")} onReset={() => setView("reset")} />;
    if (view === "register")
      return <Register onRegister={handleRegister} onSwitch={() => setView("login")} />;
    if (view === "reset")
      return <ResetPassword onReset={handleResetPassword} onSwitch={() => setView("login")} />;
  }

  if (view === "settings") return <Settings user={user} onBack={() => setView("dashboard")} />;
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white transition-colors">
      <header className="p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-100 dark:border-zinc-800">
        <span className="font-bold text-2xl">TimeFlow</span>
        <nav className="flex flex-wrap gap-3 text-sm">
          <button className="px-3 py-1 border rounded" onClick={() => setView("settings")}>Ustawienia</button>
          <button className="px-3 py-1 border rounded" onClick={() => setView("archive")}>Archiwum</button>
          <button className="px-3 py-1 border rounded" onClick={handleLogout}>Wyloguj</button>
        </nav>
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
            />
          </div>
          <aside className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <Weather weather={weather} location={location} setLocation={setLocation} />
              <Quote />
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
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;
