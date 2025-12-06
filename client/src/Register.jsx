import React, { useState } from "react";

const Register = ({ onRegister, onSwitch }) => {
  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState("");

  const handleRegister = (e) => {
    e.preventDefault();
    if (nick.trim() === "" || password.length < 3) {
      setError("Login i hasło (min 3 znaki) są wymagane.");
      return;
    }
    if (password !== repeat) {
      setError("Hasła się nie zgadzają.");
      return;
    }
    setError("");
    onRegister({ nick, password });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form
        onSubmit={handleRegister}
        className="bg-white dark:bg-zinc-800 shadow-xl rounded-2xl p-8 w-96 flex flex-col gap-4"
      >
        <h2 className="text-2xl font-bold mb-2 text-center">Rejestracja</h2>
        <input
          type="text"
          placeholder="Login"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          className="p-2 rounded border"
        />
        <input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 rounded border"
        />
        <input
          type="password"
          placeholder="Powtórz hasło"
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          className="p-2 rounded border"
        />
        {error && <div className="text-red-500">{error}</div>}
        <button
          type="submit"
          className="bg-green-600 text-white font-semibold rounded py-2 hover:bg-green-700 transition"
        >
          Zarejestruj
        </button>
        <div className="flex justify-between text-xs mt-2">
          <button type="button" className="text-blue-600 hover:underline" onClick={onSwitch}>
            Mam już konto — zaloguj się
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;
