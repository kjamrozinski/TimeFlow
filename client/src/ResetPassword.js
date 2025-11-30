import React, { useState } from "react";

const ResetPassword = ({ onReset, onSwitch }) => {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const handleReset = (e) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setMsg("Podaj poprawny email.");
      return;
    }
    setMsg("");
    onReset(email);
    setMsg("Na maila został wysłany link do resetu hasła (symulacja).");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form
        onSubmit={handleReset}
        className="bg-white dark:bg-zinc-800 shadow-xl rounded-2xl p-8 w-96 flex flex-col gap-4"
      >
        <h2 className="text-2xl font-bold mb-2 text-center">Reset hasła</h2>
        <input
          type="email"
          placeholder="Twój e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 rounded border"
        />
        {msg && <div className="text-green-600">{msg}</div>}
        <button
          type="submit"
          className="bg-yellow-600 text-white font-semibold rounded py-2 hover:bg-yellow-700 transition"
        >
          Resetuj hasło
        </button>
        <div className="flex justify-between text-xs mt-2">
          <button
            type="button"
            className="text-blue-600 hover:underline"
            onClick={onSwitch}
          >
            Powrót do logowania
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
