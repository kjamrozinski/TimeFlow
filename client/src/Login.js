import React, { useState } from "react";

const Login = ({ onLogin, onSwitch, onReset }) => {
  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    // Prosta symulacja logowania
    if (nick.trim() === "" || password.length < 3) {
      setError("Podaj login i hasło (min 3 znaki).");
      return;
    }
    setError("");
    onLogin({ nick, password });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form
        onSubmit={handleLogin}
        className="bg-white dark:bg-zinc-800 shadow-xl rounded-2xl p-8 w-96 flex flex-col gap-4"
      >
        <h2 className="text-2xl font-bold mb-2 text-center">Zaloguj się</h2>
        <input
          type="text"
          placeholder="Login"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          className="p-2 rounded border"
          autoFocus
        />
        <input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 rounded border"
        />
        {error && <div className="text-red-500">{error}</div>}
        <button
          type="submit"
          className="bg-blue-600 text-white font-semibold rounded py-2 hover:bg-blue-700 transition"
        >
          Zaloguj
        </button>
        <div className="flex justify-between text-xs mt-2">
          <button type="button" className="text-blue-600 hover:underline" onClick={onSwitch}>
            Załóż konto
          </button>
          <button type="button" className="text-blue-600 hover:underline" onClick={onReset}>
            Zapomniałem hasła
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
