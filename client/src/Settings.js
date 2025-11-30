import React, { useState } from "react";

const Settings = ({ user, onBack }) => {
  const [nick, setNick] = useState(user.nick || "");
  const [msg, setMsg] = useState("");

  const handleSave = (e) => {
    e.preventDefault();
    setMsg("Nick zapisany! (Symulacja)");
  };

  const handleResetLocal = () => {
    if (window.confirm("Na pewno zresetować lokalne dane?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Ustawienia użytkownika</h2>
      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <label>
          Nick:
          <input
            type="text"
            className="ml-2 p-1 rounded border"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
          />
        </label>
        <button className="bg-blue-600 text-white px-3 py-1 rounded mt-2">
          Zapisz
        </button>
        {msg && <span className="text-green-600">{msg}</span>}
      </form>
      <button
        className="bg-red-600 text-white px-3 py-1 rounded mt-4"
        onClick={handleResetLocal}
      >
        Resetuj lokalne dane
      </button>
      <button
        className="bg-gray-500 text-white px-3 py-1 rounded mt-4 ml-2"
        onClick={onBack}
      >
        Powrót
      </button>
    </div>
  );
};

export default Settings;
