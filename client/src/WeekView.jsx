import React, { useMemo } from "react";

const dayLabels = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

const formatShortDate = (date) =>
  date.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" });

const getStartOfWeek = (date) => {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setDate(date.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const normalizeDateKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return normalized.toISOString().slice(0, 10);
};

const buildHeatmapDays = (tasks, days = 28) => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1));
  const counts = new Map();

  tasks.forEach((task) => {
    const key = normalizeDateKey(task.deadline);
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const cells = [];
  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = normalizeDateKey(date);
    cells.push({
      key,
      date,
      count: counts.get(key) || 0,
    });
  }
  return cells;
};

const getHeatColor = (count) => {
  if (count >= 5) return "bg-emerald-600";
  if (count >= 3) return "bg-emerald-500";
  if (count >= 1) return "bg-emerald-300";
  return "bg-slate-200 dark:bg-slate-700";
};

const WeekView = ({ tasks = [], onBack }) => {
  const today = new Date();
  const startOfWeek = getStartOfWeek(today);
  const days = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + idx);
    return date;
  });

  const tasksByDay = useMemo(() => {
    const map = new Map();
    days.forEach((date) => {
      map.set(normalizeDateKey(date), []);
    });
    tasks.forEach((task) => {
      const key = normalizeDateKey(task.deadline);
      if (!key || !map.has(key)) return;
      map.get(key).push(task);
    });
    return map;
  }, [tasks, days]);

  const weekStats = useMemo(() => {
    const weekTasks = Array.from(tasksByDay.values()).flat();
    const completed = weekTasks.filter((task) => task.completed).length;
    const overdue = weekTasks.filter(
      (task) => !task.completed && task.deadline && new Date(task.deadline) < today
    ).length;
    return {
      total: weekTasks.length,
      completed,
      overdue,
    };
  }, [tasksByDay, today]);

  const heatmapCells = useMemo(() => buildHeatmapDays(tasks, 28), [tasks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 p-6 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/70 dark:bg-slate-900/70 rounded-3xl px-6 py-4 shadow border border-white/60 dark:border-slate-800">
          <div>
            <h1 className="text-3xl font-semibold mb-1">Historia</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Przegląd zadań zaplanowanych na bieżący tydzień.
            </p>
          </div>
          {onBack && (
            <button
              className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold shadow"
              onClick={onBack}
            >
              Powrót do panelu
            </button>
          )}
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Zadania w tygodniu" value={weekStats.total} />
          <StatCard label="Wykonane" value={weekStats.completed} />
          <StatCard label="Zaległe" value={weekStats.overdue} />
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow border border-slate-100 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold">Plan tygodnia</h2>
            <span className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              {formatShortDate(days[0])} – {formatShortDate(days[6])}
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-7">
            {days.map((date, index) => {
              const key = normalizeDateKey(date);
              const items = tasksByDay.get(key) || [];
              return (
                <div
                  key={key}
                  className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 p-3 space-y-2 min-h-[140px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{dayLabels[index]}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{formatShortDate(date)}</div>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500">Brak zadań</p>
                  ) : (
                    <ul className="space-y-2 text-xs">
                      {items.map((task) => (
                        <li
                          key={task.id || `${task.content}-${task.deadline}`}
                          className={`rounded-xl px-2 py-1 ${
                            task.completed
                              ? "bg-emerald-100/80 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                              : "bg-white/90 text-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                          }`}
                        >
                          {task.content || task.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow border border-slate-100 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold">Mapa aktywności (planowane zadania)</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">Ostatnie 4 tygodnie</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {heatmapCells.map((cell) => (
              <div
                key={cell.key}
                title={`${cell.count} zadań – ${formatShortDate(cell.date)}`}
                className={`h-6 w-full rounded-lg ${getHeatColor(cell.count)}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Mało</span>
            <span className="h-3 w-3 rounded bg-slate-200 dark:bg-slate-700" />
            <span className="h-3 w-3 rounded bg-emerald-300" />
            <span className="h-3 w-3 rounded bg-emerald-500" />
            <span className="h-3 w-3 rounded bg-emerald-600" />
            <span>Dużo</span>
          </div>
        </section>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-4 border border-slate-100 dark:border-slate-800">
    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    <p className="text-2xl font-semibold mt-1">{value}</p>
  </div>
);

export default WeekView;
