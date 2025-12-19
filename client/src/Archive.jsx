import React, { useMemo, useState } from "react";

const typeColors = {
  Praca: "bg-blue-100 text-blue-800",
  Nauka: "bg-green-100 text-green-800",
  Relaks: "bg-purple-100 text-purple-800",
  Sport: "bg-orange-100 text-orange-800",
  Spotkania: "bg-red-100 text-red-800",
  Inne: "bg-gray-200 text-gray-800",
};

const priorityLabels = {
  Low: "Niski",
  Medium: "Średni",
  High: "Wysoki",
};

const sortOptions = [
  { value: "deadlineDesc", label: "Termin: najnowsze" },
  { value: "deadlineAsc", label: "Termin: najstarsze" },
  { value: "alphaAsc", label: "Alfabetycznie A–Z" },
  { value: "alphaDesc", label: "Alfabetycznie Z–A" },
];

const Archive = ({ archive, onBack, onRestore, onRestoreAll, onDelete, onClear }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("deadlineDesc");

  const stats = useMemo(() => {
    const total = archive.length;
    const completed = archive.filter((task) => task.completed).length;
    const overdue = archive.filter(
      (task) => !task.completed && task.deadline && new Date(task.deadline) < new Date()
    ).length;
    const byType = archive.reduce((acc, task) => {
      const type = task.type || "Inne";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const topType =
      Object.entries(byType)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => `${type} (${count})`)
        .slice(0, 2)
        .join(", ") || "Brak danych";
    return { total, completed, overdue, topType };
  }, [archive]);

  const availableTypes = useMemo(() => {
    const baseTypes = ["Praca", "Nauka", "Relaks", "Sport", "Spotkania", "Inne"];
    const fromArchive = Array.from(new Set(archive.map((task) => task.type || "Inne")));
    return ["All", ...Array.from(new Set([...baseTypes, ...fromArchive]))];
  }, [archive]);

  const availablePriorities = ["All", "Low", "Medium", "High"];

  const filteredArchive = useMemo(() => {
    return archive.filter((task) => {
      const text = `${task.content || task.text || ""} ${task.description || ""}`.toLowerCase();
      const matchesSearch = text.includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "All" || (task.type || "Inne") === typeFilter;
      const matchesPriority = priorityFilter === "All" || (task.priority || "Low") === priorityFilter;
      return matchesSearch && matchesType && matchesPriority;
    });
  }, [archive, searchTerm, typeFilter, priorityFilter]);

  const sortedArchive = useMemo(() => {
    const list = [...filteredArchive];
    const getDeadline = (task) => (task.deadline ? new Date(task.deadline).getTime() : 0);
    const getTitle = (task) => (task.content || task.text || "").toLowerCase();

    list.sort((a, b) => {
      switch (sortBy) {
        case "deadlineAsc":
          return getDeadline(a) - getDeadline(b);
        case "deadlineDesc":
          return getDeadline(b) - getDeadline(a);
        case "alphaDesc":
          return getTitle(b).localeCompare(getTitle(a));
        case "alphaAsc":
        default:
          return getTitle(a).localeCompare(getTitle(b));
      }
    });

    return list;
  }, [filteredArchive, sortBy]);

  const formatDate = (value) => {
    if (!value) return "Brak";
    try {
      return new Date(value).toLocaleDateString("pl-PL");
    } catch (_err) {
      return value;
    }
  };

  const renderTags = (task) => {
    const tags = Array.isArray(task.tags)
      ? task.tags
      : task.tags
      ? String(task.tags)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    if (!tags.length) {
      return null;
    }
    return (
      <div className="flex flex-wrap gap-2 mt-2 text-xs">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
          >
            #{tag}
          </span>
        ))}
      </div>
    );
  };

  const exportToCsv = () => {
    if (sortedArchive.length === 0) return;
    const headers = ["Treść", "Opis", "Termin", "Priorytet", "Typ", "Tagi", "Status"];
    const rows = sortedArchive.map((task) => {
      const tags = Array.isArray(task.tags)
        ? task.tags.join(", ")
        : task.tags
        ? String(task.tags)
        : "";
      const status = task.completed ? "Zakończone" : "Nieukończone";
      const values = [
        task.content || task.text || "",
        task.description || "",
        formatDate(task.deadline),
        priorityLabels[task.priority] || task.priority || "Niski",
        task.type || "Inne",
        tags,
        status,
      ];
      return values.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "timeflow-archiwum.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 p-6 transition-colors">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/70 dark:bg-slate-900/70 rounded-3xl px-6 py-4 shadow border border-white/60 dark:border-slate-800">
          <div>
            <h1 className="text-3xl font-semibold mb-1">Archiwum zadań</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Przechowuj wykonane lub ukryte zadania i zarządzaj nimi w jednym miejscu.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center sm:justify-end">
            <button
              className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold shadow"
              onClick={onBack}
            >
              Powrót do zadań
            </button>
            <button
              className="px-4 py-2 rounded-full bg-emerald-500 text-white font-semibold shadow disabled:bg-emerald-900 disabled:text-gray-300"
              disabled={!archive.length}
              onClick={exportToCsv}
            >
              Eksportuj CSV
            </button>
            <button
              className="px-4 py-2 rounded-full bg-green-500 text-white font-semibold shadow disabled:bg-green-900 disabled:text-gray-300"
              disabled={!archive.length}
              onClick={() => onRestoreAll && onRestoreAll()}
            >
              Przywróć wszystkie
            </button>
            <button
              className="px-4 py-2 rounded-full bg-red-600 text-white font-semibold shadow disabled:bg-red-900 disabled:text-gray-300"
              disabled={!archive.length}
              onClick={() => onClear && onClear()}
            >
              Wyczyść archiwum
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Łącznie" value={stats.total} />
          <StatCard label="Zakończone" value={stats.completed} />
          <StatCard label="Zaległe" value={stats.overdue} />
          <StatCard label="Najczęstsze typy" value={stats.topType} />
        </section>

        <section className="bg-white dark:bg-zinc-800 rounded-2xl shadow p-4 space-y-4">
          <h2 className="font-semibold text-lg">Filtry</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm mb-1">Wyszukiwanie</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Szukaj po treści lub opisie..."
                className="w-full p-2 rounded border bg-white dark:bg-zinc-700 dark:border-zinc-600 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Typ zadania</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full p-2 rounded border bg-white dark:bg-zinc-700 dark:border-zinc-600 text-slate-900 dark:text-slate-100"
              >
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "All" ? "Wszystkie" : type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Priorytet</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full p-2 rounded border bg-white dark:bg-zinc-700 dark:border-zinc-600 text-slate-900 dark:text-slate-100"
              >
                {availablePriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority === "All"
                      ? "Wszystkie"
                      : priority === "Low"
                      ? "Niski"
                      : priority === "Medium"
                      ? "Średni"
                      : "Wysoki"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Sortowanie</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 rounded border bg-white dark:bg-zinc-700 dark:border-zinc-600 text-slate-900 dark:text-slate-100"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          {sortedArchive.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-10 border border-dashed rounded-2xl">
              Brak zadań spełniających kryteria wyszukiwania.
            </div>
          )}
          {sortedArchive.map((task) => (
            <article
              key={task.id || `${task.content}-${task.deadline}`}
              className="bg-white dark:bg-zinc-800 rounded-2xl shadow p-4 border border-gray-100 dark:border-zinc-700"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold">{task.content || task.text}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        typeColors[task.type] || typeColors.Inne
                      }`}
                    >
                      {task.type || "Inne"}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">{task.description}</p>
                  )}
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                    <div>Priorytet: {priorityLabels[task.priority] || task.priority || "Niski"}</div>
                    <div>Termin: {formatDate(task.deadline)}</div>
                    <div>Status: {task.completed ? "Zakończone" : "Nieukończone"}</div>
                  </div>
                  {renderTags(task)}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                    onClick={() => onRestore && onRestore(task.id)}
                  >
                    Przywróć
                  </button>
                  <button
                    className="px-4 py-2 rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-100"
                    onClick={() => onDelete && onDelete(task.id)}
                  >
                    Usuń z archiwum
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow p-4 border border-gray-100 dark:border-zinc-800">
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    <p className="text-2xl font-semibold mt-1">{value}</p>
  </div>
);

export default Archive;
