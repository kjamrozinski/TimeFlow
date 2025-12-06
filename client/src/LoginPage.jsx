import React, { useEffect, useMemo, useState } from "react";
import {
  FiArrowRight,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiRefreshCw,
  FiShield,
  FiUser,
} from "react-icons/fi";

const DEFAULT_ROLE = "admin";

const marketingItems = [
  { title: "Planowanie dnia", desc: "Twórz listy zadań z terminami i priorytetami." },
  { title: "Postępy w jednym miejscu", desc: "Szybkie podsumowania, statystyki i archiwum." },
  { title: "Chmura TimeFlow", desc: "Bezpieczne przechowywanie notatek i plików (wkrótce)." },
];

const passwordHints = ["Min. 8 znaków", "Litera i cyfra", "Bez spacji na końcu"];

function LoginPage({ onLogin, onReset, onCreateAccount, theme, onToggleTheme }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: true,
    role: DEFAULT_ROLE,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const savedEmail = localStorage.getItem("timeflow_login_email");
    const savedRole = localStorage.getItem("timeflow_login_role") || DEFAULT_ROLE;
    if (savedEmail) {
      setForm((prev) => ({ ...prev, email: savedEmail, role: savedRole }));
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.email.trim()) {
      setError("Podaj login lub e-mail.");
      return;
    }
    if (form.password.trim().length < 3) {
      setError("Hasło musi mieć co najmniej 3 znaki.");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      if (form.remember) {
        localStorage.setItem("timeflow_login_email", form.email);
        localStorage.setItem("timeflow_login_role", form.role || DEFAULT_ROLE);
      }
      onLogin({
        email: form.email,
        nick: form.email,
        password: form.password,
        remember: form.remember,
        role: form.role || DEFAULT_ROLE,
      });
      setIsLoading(false);
    }, 400);
  };

  const handleDemoFill = () => {
    setForm((prev) => ({
      ...prev,
      email: "demo@timeflow.app",
      password: "demo1234",
      role: "admin",
    }));
    setError("");
  };

  const versionLabel = useMemo(() => "v1.0.0-preview", []);

  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 login-animated-bg relative overflow-hidden ${
        isDark ? "bg-slate-950 text-slate-50" : "bg-slate-100 text-slate-900"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.12),transparent_35%),radial_gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(99,102,241,0.12),transparent_30%)] pointer-events-none" />
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 relative z-10">
        <div
          className={`rounded-3xl p-8 shadow-2xl ${
            isDark
              ? "bg-white/10 border border-white/10 backdrop-blur-xl"
              : "bg-white border border-slate-200"
          }`}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-extrabold mt-1">Logowanie</h1>
              <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Planowanie dnia, zadania i postępy w jednym miejscu.
              </p>
            </div>
            <div className="text-right">
              <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Wersja</span>
              <div className="text-sm font-semibold">{versionLabel}</div>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label
                className={`text-sm flex items-center gap-2 ${isDark ? "text-slate-200" : "text-slate-700"}`}
              >
                <FiMail /> Login lub e-mail
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="np. jan.kowalski lub jan@timeflow.app"
                  className={`w-full rounded-xl px-4 py-3 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/70 ${
                    isDark
                      ? "border border-white/10 bg-white/5 text-slate-50"
                      : "border border-slate-200 bg-white text-slate-900"
                  }`}
                  autoComplete="email"
                  required
                />
                <FiUser className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label
                className={`text-sm flex items-center gap-2 ${isDark ? "text-slate-200" : "text-slate-700"}`}
              >
                <FiLock /> Hasło
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  onKeyUp={(e) => setCapsLockOn(e.getModifierState && e.getModifierState("CapsLock"))}
                  placeholder="Min. 3 znaki"
                  className={`w-full rounded-xl px-4 py-3 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/70 ${
                    isDark
                      ? "border border-white/10 bg-white/5 text-slate-50"
                      : "border border-slate-200 bg-white text-slate-900"
                  }`}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <div
                className={`flex items-center justify-between text-xs ${
                  isDark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FiShield />
                  <span>Wymagania: {passwordHints.join(" • ")}</span>
                </div>
                {capsLockOn && <span className="text-amber-600 font-semibold">Caps Lock włączony</span>}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 text-sm ${isDark ? "text-slate-200" : "text-slate-700"}`}
              >
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => setForm((prev) => ({ ...prev, remember: e.target.checked }))}
                  className="rounded border-white/20 bg-white/10 text-sky-400 focus:ring-sky-400/60"
                />
                Zapamiętaj mnie
              </label>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>Rola (mock)</span>
                <select
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                  className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/70 ${
                    isDark
                      ? "bg-slate-900 border border-slate-700 text-slate-100"
                      : "bg-white border border-slate-300 text-slate-900"
                  }`}
                >
                  <option className="text-slate-900" value="user">
                    Użytkownik
                  </option>
                  <option className="text-slate-900" value="advanced">
                    Zaawansowany
                  </option>
                  <option className="text-slate-900" value="admin">
                    Administrator
                  </option>
                </select>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-400/40 text-rose-100 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 px-4 py-3 font-semibold shadow-lg shadow-sky-900/30 transition hover:scale-[1.01] disabled:opacity-70"
            >
              {isLoading && <FiRefreshCw className="animate-spin" />}
              Zaloguj się
              <FiArrowRight />
            </button>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDemoFill}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm ${
                  isDark
                    ? "border border-white/15 bg-white/5 text-slate-100 hover:border-sky-400/50"
                    : "border border-slate-200 bg-white text-slate-900 hover:border-sky-400"
                }`}
              >
                Uzupełnij dane demo
              </button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => onReset?.(form.email)}
                  className="text-sky-600 hover:text-sky-700 underline underline-offset-4"
                >
                  Zapomniałem hasła
                </button>
                <button
                  type="button"
                  onClick={() => onCreateAccount?.()}
                  className="text-sky-600 hover:text-sky-700 underline underline-offset-4"
                >
                  Stwórz konto
                </button>
              </div>
            </div>
            </div>

            <div
              className={`flex items-center justify-between text-xs ${
                isDark ? "text-slate-300" : "text-slate-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isOnline ? "bg-emerald-400" : "bg-amber-400"
                  } animate-pulse`}
                />
                <span>{isOnline ? "Online" : "Offline"}</span>
              </div>
              <a
                className={`${isDark ? "hover:text-white" : "hover:text-slate-900"} text-sky-600`}
                href="#about"
              >
                O aplikacji
              </a>
              {onToggleTheme && (
                <button
                  type="button"
                  className={`${isDark ? "hover:text-white" : "hover:text-slate-900"}`}
                  onClick={onToggleTheme}
                >
                  Motyw: {theme === "dark" ? "Ciemny" : "Jasny"}
                </button>
              )}
            </div>
          </form>
        </div>

        <div
          id="about"
          className={`rounded-3xl p-8 shadow-2xl space-y-6 ${
            isDark
              ? "bg-white/5 border border-white/10 backdrop-blur-xl"
              : "bg-white border border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Planowanie, które przyspiesza dzień</h2>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs border ${
                isDark
                  ? "bg-emerald-400/25 text-emerald-50 border-emerald-300/70"
                  : "bg-emerald-100 text-emerald-800 border-emerald-300"
              } font-semibold`}
            >
              Nowość
            </div>
          </div>

          <div className="grid gap-3">
            {marketingItems.map((item) => (
              <div
                key={item.title}
                className={`flex items-start gap-3 rounded-2xl p-3 ${
                  isDark ? "bg-white/5 border border-white/10" : "bg-slate-50 border border-slate-200"
                }`}
              >
                <div className="mt-1">
                  <FiCheckCircle className="text-sky-300" />
                </div>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div
            className={`flex items-center justify-between text-sm ${
              isDark ? "text-slate-200" : "text-slate-600"
            }`}
          >
            <div className="flex items-center gap-2">
              <FiUser />
              <span>Wsparcie: support@timeflow.app</span>
            </div>
            <div className="flex items-center gap-2">
              <FiShield />
              <span>Bezpieczeństwo klasy enterprise</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
