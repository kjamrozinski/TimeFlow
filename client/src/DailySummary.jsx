import React, { useMemo, useState } from "react";

const DailySummary = ({ tasks }) => {
  const doneTasks = useMemo(() => tasks.filter((task) => task.completed), [tasks]);
  const pendingTasks = useMemo(() => tasks.filter((task) => !task.completed), [tasks]);
  const done = doneTasks.length;
  const all = tasks.length;
  const [expanded, setExpanded] = useState(false);

  if (all === 0) return null;

  const percent = Math.round((done / all) * 100);
  const highPriorityPending = pendingTasks.filter((task) => (task.priority || "Low") === "High")
    .length;
  const nextDeadlineTask = pendingTasks
    .filter((task) => task.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];

  const recentCompleted = doneTasks.slice(-3).reverse();

  const encouragement =
    done === all
      ? "100% wykonane!"
      : done === 0
      ? "Czas wystartować!"
      : "Dobry progres, jeszcze trochę!";

  return (
    <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/70 rounded-2xl shadow space-y-3 text-green-900 dark:text-green-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="font-semibold text-lg text-green-950 dark:text-green-50">
            Bilans dnia: {done} z {all} zadań ({percent}%)
          </p>
          <p className="text-sm text-green-800 dark:text-green-200">{encouragement}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-3 py-1 rounded bg-green-600 text-black hover:bg-green-700 dark:text-white dark:bg-green-700 dark:hover:bg-green-800"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Ukryj szczegóły" : "Pokaż szczegóły"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="bg-white/80 dark:bg-green-950/50 rounded-xl p-3 text-sm space-y-2 text-green-900 dark:text-green-100">
          <p>
            Wysoki priorytet do zrobienia: <span className="font-semibold">{highPriorityPending}</span>
          </p>
          {nextDeadlineTask ? (
            <p>
              Najbliższy termin:{" "}
              <span className="font-semibold">
                {nextDeadlineTask.content || nextDeadlineTask.text} (
                {new Date(nextDeadlineTask.deadline).toLocaleDateString("pl-PL")})
              </span>
            </p>
          ) : (
            <p>Brak zaplanowanych terminów.</p>
          )}
          {recentCompleted.length > 0 && (
            <div>
              <p className="font-semibold mb-1">Ostatnio wykonane:</p>
              <ul className="list-disc pl-4 space-y-1">
                {recentCompleted.map((task) => (
                  <li key={task.id || task.content} className="text-green-800 dark:text-green-200">
                    {task.content || task.text}
                    {task.deadline && (
                      <span className="text-xs text-green-600 dark:text-green-200 ml-2">
                        {new Date(task.deadline).toLocaleDateString("pl-PL")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailySummary;
