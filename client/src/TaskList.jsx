import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("timeflow_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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

const createEmptyTask = (defaultPriority = "Low", defaultType = "Inne") => ({
  content: "",
  description: "",
  deadline: "",
  priority: defaultPriority || "Low",
  tags: "",
  type: defaultType || "Inne",
});

const normalizeTags = (tags) =>
  tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

const getUniqueTags = (tasks) => {
  const allTags = tasks.flatMap((task) => {
    if (!task.tags) return [];
    if (Array.isArray(task.tags)) return task.tags;
    return String(task.tags)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  });
  return Array.from(new Set(allTags));
};

const groupTasksByDate = (tasks) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const dayAfterTomorrow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);

  const overdue = [];
  const todayTasks = [];
  const tomorrowTasks = [];
  const future = [];

  tasks.forEach((task) => {
    if (!task.deadline) {
      future.push(task);
      return;
    }
    const taskDate = new Date(task.deadline);
    if (taskDate < today) {
      overdue.push(task);
    } else if (taskDate >= today && taskDate < tomorrow) {
      todayTasks.push(task);
    } else if (taskDate >= tomorrow && taskDate < dayAfterTomorrow) {
      tomorrowTasks.push(task);
    } else {
      future.push(task);
    }
  });

  return { overdue, today: todayTasks, tomorrow: tomorrowTasks, future };
};

const TaskFilters = ({
  tasks,
  filterTag,
  filterPriority,
  filterDate,
  onChangeTag,
  onChangePriority,
  onChangeDate,
  onReset,
}) => {
  const availableTags = useMemo(() => getUniqueTags(tasks), [tasks]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-4 text-sm">
      <div className="mb-2 sm:mb-0">
        <label className="mr-1">Tag:</label>
        <select
          value={filterTag}
          onChange={(e) => onChangeTag(e.target.value)}
          className="p-1 border rounded bg-white dark:bg-gray-800"
        >
          <option value="All">Wszystkie</option>
          {availableTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-2 sm:mb-0">
        <label className="mr-1">Priorytet:</label>
        <select
          value={filterPriority}
          onChange={(e) => onChangePriority(e.target.value)}
          className="p-1 border rounded bg-white dark:bg-gray-800"
        >
          <option value="All">Wszystkie</option>
          <option value="Low">Niski</option>
          <option value="Medium">Średni</option>
          <option value="High">Wysoki</option>
        </select>
      </div>
      <div className="mb-2 sm:mb-0">
        <label className="mr-1">Termin:</label>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => onChangeDate(e.target.value)}
          className="p-1 border rounded bg-white dark:bg-gray-800"
        />
      </div>
      <button
        onClick={onReset}
        className="p-1 bg-gray-200 dark:bg-gray-800 border rounded"
      >
        Wyczyść filtry
      </button>
    </div>
  );
};

const TaskForm = ({ newTask, setNewTask, onSubmit }) => (
  <div className="mb-6 p-4 rounded bg-gray-50 dark:bg-gray-800">
    <h3 className="font-semibold mb-2">Dodaj zadanie</h3>
    <div className="mb-2">
      <input
        type="text"
        placeholder="Treść zadania..."
        value={newTask.content}
        onChange={(e) => setNewTask((prev) => ({ ...prev, content: e.target.value }))}
        className="w-full p-2 mb-2 border rounded bg-white dark:bg-gray-700 dark:text-gray-100"
      />
      <textarea
        placeholder="Opis (opcjonalnie)"
        value={newTask.description}
        onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
        className="w-full p-2 mb-2 border rounded bg-white dark:bg-gray-700 dark:text-gray-100"
      />
      <div className="flex flex-col sm:flex-row sm:space-x-4 mb-2">
        <div className="mb-2 sm:mb-0 flex-1">
          <label className="mr-1">Termin:</label>
          <input
            type="date"
            value={newTask.deadline}
            onChange={(e) => setNewTask((prev) => ({ ...prev, deadline: e.target.value }))}
            className="p-1 border rounded w-full bg-white dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
        <div className="flex-1">
          <label className="mr-1">Priorytet:</label>
          <select
            value={newTask.priority}
            onChange={(e) => setNewTask((prev) => ({ ...prev, priority: e.target.value }))}
            className="p-1 border rounded w-full bg-white dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="Low">Niski</option>
            <option value="Medium">Średni</option>
            <option value="High">Wysoki</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:space-x-4 mb-2">
        <div className="mb-2 sm:mb-0 flex-1">
          <label className="mr-1">Typ:</label>
          <select
            value={newTask.type}
            onChange={(e) => setNewTask((prev) => ({ ...prev, type: e.target.value }))}
            className="p-1 border rounded w-full bg-white dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="Praca">Praca</option>
            <option value="Nauka">Nauka</option>
            <option value="Relaks">Relaks</option>
            <option value="Sport">Sport</option>
            <option value="Spotkania">Spotkania</option>
            <option value="Inne">Inne</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="mr-1">Tagi:</label>
          <input
            type="text"
            placeholder="np. praca, dom"
            value={newTask.tags}
            onChange={(e) => setNewTask((prev) => ({ ...prev, tags: e.target.value }))}
            className="p-1 border rounded w-full bg-white dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
      </div>
    </div>
    <button
      onClick={onSubmit}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Dodaj zadanie
    </button>
  </div>
);

const TaskItem = ({
  task,
  onUpdate,
  onDelete,
  onArchive,
  today,
  tomorrow,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({
    content: task.content || "",
    description: task.description || "",
    deadline: task.deadline ? task.deadline.slice(0, 10) : "",
    priority: task.priority || "Low",
    tags: Array.isArray(task.tags) ? task.tags.join(", ") : task.tags || "",
    type: task.type || "Inne",
  });

  useEffect(() => {
    setDraft({
      content: task.content || "",
      description: task.description || "",
      deadline: task.deadline ? task.deadline.slice(0, 10) : "",
      priority: task.priority || "Low",
      tags: Array.isArray(task.tags) ? task.tags.join(", ") : task.tags || "",
      type: task.type || "Inne",
    });
  }, [task]);

  const handleSave = () => {
    const payload = {
      content: draft.content,
      description: draft.description,
      deadline: draft.deadline,
      priority: draft.priority,
      tags: normalizeTags(draft.tags),
      type: draft.type,
    };
    onUpdate(task.id, payload);
    setIsEditing(false);
  };

  const showDueToday =
    task.deadline &&
    new Date(task.deadline) >= today &&
    new Date(task.deadline) < tomorrow &&
    !task.completed;

  if (isEditing) {
    return (
      <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded space-y-2">
        <input
          type="text"
          value={draft.content}
          onChange={(e) => setDraft((prev) => ({ ...prev, content: e.target.value }))}
          className="w-full p-1 border rounded bg-white dark:bg-gray-600 dark:text-gray-100"
        />
        <textarea
          value={draft.description}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, description: e.target.value }))
          }
          className="w-full p-1 border rounded bg-white dark:bg-gray-600 dark:text-gray-100"
        />
        <div className="flex flex-col sm:flex-row sm:space-x-4">
          <div className="mb-1 sm:mb-0 flex-1">
            <label className="mr-1 text-sm">Termin:</label>
            <input
              type="date"
              value={draft.deadline}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, deadline: e.target.value }))
              }
              className="p-1 border rounded w-full bg-white dark:bg-gray-600 dark:text-gray-100"
            />
          </div>
          <div className="flex-1">
            <label className="mr-1 text-sm">Priorytet:</label>
            <select
              value={draft.priority}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, priority: e.target.value }))
              }
              className="p-1 border rounded w-full bg-white dark:bg-gray-600 dark:text-gray-100"
            >
              <option value="Low">Niski</option>
              <option value="Medium">Średni</option>
              <option value="High">Wysoki</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:space-x-4">
          <div className="mb-1 sm:mb-0 flex-1">
            <label className="mr-1 text-sm">Typ:</label>
            <select
              value={draft.type}
              onChange={(e) => setDraft((prev) => ({ ...prev, type: e.target.value }))}
              className="p-1 border rounded w-full bg-white dark:bg-gray-600 dark:text-gray-100"
            >
              <option value="Praca">Praca</option>
              <option value="Nauka">Nauka</option>
              <option value="Relaks">Relaks</option>
              <option value="Sport">Sport</option>
              <option value="Spotkania">Spotkania</option>
              <option value="Inne">Inne</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="mr-1 text-sm">Tagi:</label>
            <input
              type="text"
              value={draft.tags}
              onChange={(e) => setDraft((prev) => ({ ...prev, tags: e.target.value }))}
              className="p-1 border rounded w-full bg-white dark:bg-gray-600 dark:text-gray-100"
            />
          </div>
        </div>
        <div className="text-right space-x-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Zapisz
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Anuluj
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start justify-between p-2 rounded ${task.completed ? "line-through opacity-50" : ""}`}>
      <div>
        <div className="font-semibold flex items-center gap-2">
          {task.content}
          {showDueToday && <span className="text-red-500 text-sm">!</span>}
        </div>
        {task.description && <div className="text-sm">{task.description}</div>}
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
          <div>
            Termin: {task.deadline ? task.deadline.slice(0, 10) : "Brak"} | Priorytet:{" "}
            {priorityLabels[task.priority] || task.priority}
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${typeColors[task.type] || typeColors.Inne}`}>
              {task.type || "Inne"}
            </span>
            {task.tags && String(task.tags).trim() && (
              <span className="text-xs text-gray-500">
                {Array.isArray(task.tags) ? task.tags.join(", ") : task.tags}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2 ml-4">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(e) => onUpdate(task.id, { completed: e.target.checked })}
          className="h-4 w-4"
          title="Oznacz jako wykonane"
        />
        <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:underline text-sm">
          Edytuj
        </button>
        <button onClick={() => onArchive(task)} className="text-yellow-600 hover:underline text-sm">
          Archiwizuj
        </button>
        <button onClick={() => onDelete(task.id)} className="text-red-600 hover:underline text-sm">
          Usuń
        </button>
      </div>
    </div>
  );
};

const TaskGroup = ({ title, accent, tasks, ...handlers }) => (
  <section className="mb-6">
    <h3 className={`font-bold text-lg mb-2 ${accent}`}>{title}</h3>
    {tasks.length > 0 ? (
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li key={task.id} className="pl-2 border-l-4 border-current">
            <TaskItem task={task} {...handlers} />
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-gray-500">Brak zadań w tej sekcji.</p>
    )}
  </section>
);

const CompletedSection = ({
  tasks,
  showCompleted,
  onToggleCompleted,
  onReopen,
  onArchive,
  onDelete,
}) => (
  <section className="mb-6">
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-bold text-lg">Wykonane zadania ({tasks.length})</h3>
      <button
        className="text-sm text-blue-600 hover:underline"
        onClick={onToggleCompleted}
      >
        {showCompleted ? "Ukryj wykonane" : "Pokaż wykonane"}
      </button>
    </div>
    {showCompleted ? (
      tasks.length > 0 ? (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="p-3 rounded bg-white dark:bg-gray-800 shadow border border-gray-100 dark:border-gray-700"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <div className="font-semibold">{task.content || task.text}</div>
                  {task.description && (
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {task.description}
                    </div>
                  )}
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                    <div>Termin: {task.deadline ? task.deadline.slice(0, 10) : "Brak"}</div>
                    <div>Priorytet: {priorityLabels[task.priority] || task.priority || "Low"}</div>
                    <div>Typ: {task.type || "Inne"}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onReopen(task.id)}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Cofnij ukończenie
                  </button>
                  <button
                    onClick={() => onArchive(task)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                  >
                    Archiwizuj
                  </button>
                  <button
                    onClick={() => onDelete(task.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">Brak wykonanych zadań spełniających filtry.</p>
      )
    ) : (
      <p className="text-xs text-gray-500 mb-2">
        Użyj przycisku, aby pokazać lub ukryć wykonane zadania.
      </p>
    )}
  </section>
);

function TaskList({
  userNick,
  tasks = [],
  setTasks,
  setArchive,
  showCompleted = false,
  onToggleCompleted = () => {},
  theme = "light",
  defaultPriority = "Low",
  defaultType = "Inne",
  onToggleTheme = () => {},
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterTag, setFilterTag] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterDate, setFilterDate] = useState("");

  const [newTask, setNewTask] = useState(() => createEmptyTask(defaultPriority, defaultType));

  useEffect(() => {
    const isPristine =
      !newTask.content &&
      !newTask.description &&
      !newTask.deadline &&
      !newTask.tags &&
      (newTask.priority === "Low" || newTask.priority === defaultPriority) &&
      (newTask.type === "Inne" || newTask.type === defaultType);
    if (isPristine) {
      setNewTask(createEmptyTask(defaultPriority, defaultType));
    }
  }, [defaultPriority, defaultType]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios
      .get(`${API_URL}/api/tasks/${userNick}`, { headers: getAuthHeaders() })
      .then((res) => {
        if (!mounted) return;
        setTasks(res.data || []);
        setError(null);
      })
      .catch((err) => {
        console.error("Fetch tasks error:", err);
        setError("Nie udało się pobrać zadań.");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [userNick, setTasks]);

  const handleAddTask = () => {
    if (!newTask.content.trim()) return;
    const taskData = {
      nick: userNick,
      content: newTask.content.trim(),
      description: newTask.description.trim(),
      deadline: newTask.deadline,
      priority: newTask.priority,
      tags: normalizeTags(newTask.tags),
      type: newTask.type,
    };
    axios
      .post(`${API_URL}/api/tasks`, taskData, { headers: getAuthHeaders() })
      .then((res) => {
        const createdTask = res.data;
        if (createdTask) {
          setTasks((prev) => [...prev, createdTask]);
        } else {
          return axios
            .get(`${API_URL}/api/tasks/${userNick}`, { headers: getAuthHeaders() })
            .then((r) => setTasks(r.data || []));
        }
      })
      .catch((err) => {
        console.error("Add task error:", err);
        setError("Nie udało się dodać zadania.");
      })
      .finally(() => {
        setNewTask(createEmptyTask(defaultPriority, defaultType));
      });
  };

  const handleUpdateTask = (id, updatedFields) => {
    axios
      .put(`${API_URL}/api/tasks/${id}`, updatedFields, { headers: getAuthHeaders() })
      .then(() => {
        setTasks((prev) =>
          prev.map((task) => (task.id === id ? { ...task, ...updatedFields } : task))
        );
      })
      .catch((err) => {
        console.error("Update task error:", err);
        setError("Nie udało się zaktualizować zadania.");
      });
  };

  const handleDeleteTask = (id) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    axios
      .delete(`${API_URL}/api/tasks/${id}`, { headers: getAuthHeaders() })
      .then(() => {
        setTasks((prev) => prev.filter((task) => task.id !== id));
        if (taskToDelete) {
          setArchive((prev) => [...prev, taskToDelete]);
        }
      })
      .catch((err) => {
        console.error("Delete task error:", err);
        setError("Nie udało się usunąć zadania.");
      });
  };

  const handleArchiveTask = (task) => {
    setArchive((prev) => [...prev, task]);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (filterTag !== "All") {
      result = result.filter((task) => {
        if (!task.tags) return false;
        const tags = Array.isArray(task.tags)
          ? task.tags
          : String(task.tags)
              .split(",")
              .map((t) => t.trim());
        return tags.includes(filterTag);
      });
    }
    if (filterPriority !== "All") {
      result = result.filter((task) => task.priority === filterPriority);
    }
    if (filterDate) {
      result = result.filter((task) => {
        if (!task.deadline) return false;
        const taskDate = new Date(task.deadline);
        const selectedDate = new Date(filterDate);
        return (
          taskDate.getFullYear() === selectedDate.getFullYear() &&
          taskDate.getMonth() === selectedDate.getMonth() &&
          taskDate.getDate() === selectedDate.getDate()
        );
      });
    }
    return result;
  }, [tasks, filterTag, filterPriority, filterDate]);

  const activeFilteredTasks = filteredTasks.filter((task) => !task.completed);
  const completedFilteredTasks = filteredTasks.filter((task) => task.completed);
  const groupedActive = groupTasksByDate(activeFilteredTasks);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  const doneCount = tasks.filter((task) => task.completed).length;
  const overdueCount = tasks.filter(
    (task) => !task.completed && task.deadline && new Date(task.deadline) < new Date()
  ).length;
  const activeCount = tasks.filter(
    (task) => !task.completed && (!task.deadline || new Date(task.deadline) >= new Date())
  ).length;

  if (loading) {
    return <div className="p-4 text-center">adowanie...</div>;
  }
  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-2xl shadow">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
        <div className="mb-2 sm:mb-0 text-sm">
          <span className="font-semibold">Wykonane:</span> {doneCount} |{" "}
          <span className="font-semibold">Zaległe:</span> {overdueCount} |{" "}
          <span className="font-semibold">Aktywne:</span> {activeCount}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggleTheme}
            className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 text-sm font-medium"
          >
            {theme === "dark" ? "Włącz tryb jasny" : "Włącz tryb ciemny"}
          </button>
          <button
            onClick={onToggleCompleted}
            className="px-3 py-1 rounded border border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/30 text-sm font-medium"
          >
            {showCompleted ? "Ukryj wykonane" : "Pokaż wykonane"}
          </button>
        </div>
      </div>

      <TaskFilters
        tasks={tasks}
        filterTag={filterTag}
        filterPriority={filterPriority}
        filterDate={filterDate}
        onChangeTag={setFilterTag}
        onChangePriority={setFilterPriority}
        onChangeDate={setFilterDate}
        onReset={() => {
          setFilterTag("All");
          setFilterPriority("All");
          setFilterDate("");
        }}
      />

      <TaskForm newTask={newTask} setNewTask={setNewTask} onSubmit={handleAddTask} />

      <TaskGroup
        title="Zaległe"
        accent="text-red-600"
        tasks={groupedActive.overdue}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        onArchive={handleArchiveTask}
        today={startOfToday}
        tomorrow={startOfTomorrow}
      />

      <TaskGroup
        title="Dziś"
        accent="text-emerald-600"
        tasks={groupedActive.today}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        onArchive={handleArchiveTask}
        today={startOfToday}
        tomorrow={startOfTomorrow}
      />

      <TaskGroup
        title="Jutro"
        accent="text-green-600"
        tasks={groupedActive.tomorrow}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        onArchive={handleArchiveTask}
        today={startOfToday}
        tomorrow={startOfTomorrow}
      />

      <TaskGroup
        title="Przyszłe"
        accent="text-purple-600"
        tasks={groupedActive.future}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        onArchive={handleArchiveTask}
        today={startOfToday}
        tomorrow={startOfTomorrow}
      />

      <CompletedSection
        tasks={completedFilteredTasks}
        showCompleted={showCompleted}
        onToggleCompleted={onToggleCompleted}
        onReopen={(id) => handleUpdateTask(id, { completed: false })}
        onArchive={handleArchiveTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}

export default TaskList;
