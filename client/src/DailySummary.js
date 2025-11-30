import React, { useMemo, useState } from "react";

const DailySummary = ({ tasks, onToggleCompleted, showCompleted }) => {
  const doneTasks = useMemo(() => tasks.filter(task => task.completed), [tasks]);
  const pendingTasks = useMemo(() => tasks.filter(task => !task.completed), [tasks]);
  const done = doneTasks.length;
  const all = tasks.length;
  const [expanded, setExpanded] = useState(false);

  if (all === 0) return null;

  const percent = Math.round((done / all) * 100);
  const highPriorityPending = pendingTasks.filter(task => (task.priority || "Low") === "High").length;
  const nextDeadlineTask = pendingTasks
    .filter(task => task.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];

  const recentCompleted = doneTasks.slice(-3).reverse();

  const encouragement =
    done === all
      ? "100% wykonane!"
      : done === 0
      ? "Czas wystartowac!"
      : "Dobry progres, jeszcze troche!";

  return (
    <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/70 rounded-2xl shadow space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="font-semibold text-lg">
            Bilans dnia: {done} z {all} zadan ({percent}%)
          </p>
          <p className="text-sm text-green-900 dark:text-green-200">{encouragement}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-3 py-1 rounded border border-green-600 text-green-700 hover:bg-green-50 dark:text-green-200 dark:border-green-300"
            onClick={() => setExpanded(prev => !prev)}
          >
            {expanded ? "Ukryj szczegoly" : "Pokaz szczegoly"}
          </button>
          <button
            className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-40"
            disabled={!done}
            onClick={onToggleCompleted}
          >
            {showCompleted ? "Ukryj wykonane" : "Zarzadzaj wykonanymi"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="bg-white/70 dark:bg-green-950/40 rounded-xl p-3 text-sm space-y-2">
          <p>
            Wysoki priorytet do zrobienia:{" "}
            <span className="font-semibold">{highPriorityPending}</span>
          </p>
          {nextDeadlineTask ? (
            <p>
              Najblizszy termin:{" "}
              <span className="font-semibold">
                {nextDeadlineTask.content || nextDeadlineTask.text} (
                {new Date(nextDeadlineTask.deadline).toLocaleDateString("pl-PL")})
              </span>
            </p>
          ) : (
            <p>Brak zaplanowanych terminow.</p>
          )}
          {recentCompleted.length > 0 && (
            <div>
              <p className="font-semibold mb-1">Ostatnio wykonane:</p>
              <ul className="list-disc pl-4 space-y-1">
                {recentCompleted.map(task => (
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

DailySummary.defaultProps = {
  onToggleCompleted: () => {},
  showCompleted: false,
};

export default DailySummary;
