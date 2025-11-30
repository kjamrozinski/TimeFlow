import React from "react";

const DailySummary = ({ tasks }) => {
  const done = tasks.filter((t) => t.completed).length;
  const all = tasks.length;
  if (all === 0) return null;
  return (
    <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg flex justify-between items-center shadow">
      <span>
        <b>Bilans dnia:</b> {done} z {all} zadań wykonano ({Math.round((done / all) * 100)}%)
      </span>
      <span>
        {done === all
          ? "🔥 Wszystko zrobione!"
          : done === 0
          ? "🤔 Do roboty!"
          : "🚀 Jeszcze trochę!"}
      </span>
    </div>
  );
};

export default DailySummary;
