import React, { useEffect, useMemo, useState } from "react";

const weatherCodeMap = {
  0: { label: "Bezchmurnie", emoji: "☀️" },
  1: { label: "Słonecznie z chmurami", emoji: "🌤️" },
  2: { label: "Zachmurzenie umiarkowane", emoji: "⛅" },
  3: { label: "Pełne zachmurzenie", emoji: "☁️" },
  45: { label: "Mgła", emoji: "🌫️" },
  48: { label: "Marznąca mgła", emoji: "🌫️" },
  51: { label: "Mżawka lekka", emoji: "🌦️" },
  53: { label: "Mżawka", emoji: "🌦️" },
  55: { label: "Mżawka intensywna", emoji: "🌧️" },
  61: { label: "Lekki deszcz", emoji: "🌦️" },
  63: { label: "Deszcz", emoji: "🌧️" },
  65: { label: "Intensywny deszcz", emoji: "🌧️" },
  71: { label: "Lekki śnieg", emoji: "🌨️" },
  73: { label: "Śnieg", emoji: "🌨️" },
  75: { label: "Intensywny śnieg", emoji: "❄️" },
  77: { label: "Śnieg ziarnisty", emoji: "❄️" },
  80: { label: "Przelotne opady", emoji: "🌦️" },
  81: { label: "Umiarkowane przelotne opady", emoji: "🌧️" },
  82: { label: "Ulewa", emoji: "🌧️" },
  85: { label: "Przelotny śnieg", emoji: "🌨️" },
  86: { label: "Burza śnieżna", emoji: "🌨️" },
  95: { label: "Burza", emoji: "⛈️" },
  96: { label: "Burza z gradem", emoji: "⛈️" },
  99: { label: "Burza i grad", emoji: "⛈️" }
};

const hazardRules = [
  {
    label: "Silny wiatr",
    check: (w) => w?.windspeed >= 50,
    description: "Zabezpiecz luźne przedmioty i uważaj na silne podmuchy."
  },
  {
    label: "Upał",
    check: (w) => w?.temperature >= 30,
    description: "Pij dużo wody i ogranicz wysiłek w najgorętszych godzinach."
  },
  {
    label: "Mróz",
    check: (w) => w?.temperature <= -5,
    description: "Ubierz dodatkowe warstwy i uważaj na oblodzenia."
  },
  {
    label: "Intensywne opady",
    check: (w) => [61, 63, 65, 80, 81, 82].includes(w?.weathercode),
    description: "Możliwa gorsza widoczność i śliskie nawierzchnie."
  },
  {
    label: "Burza",
    check: (w) => [95, 96, 99].includes(w?.weathercode),
    description: "Zachowaj ostrożność – możliwe wyładowania i grad."
  }
];

const Weather = ({ weather, location, setLocation }) => {
  const [city, setCity] = useState("");
  const [cityName, setCityName] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );

  useEffect(() => {
    if (location?.lat && location?.lon) {
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lon}&format=json`
      )
        .then((r) => r.json())
        .then((data) =>
          setCity(
            data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              "Nieznana lokalizacja"
          )
        )
        .catch(() => setCity("Nieznana lokalizacja"));
    } else if (location?.city) {
      setCity(location.city);
    }
  }, [location]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    });
    return () => observer.disconnect();
  }, []);

  const handleCitySubmit = (e) => {
    e.preventDefault();
    if (!cityName.trim()) return;
    fetch(
      `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
        cityName
      )}&format=json`
    )
      .then((r) => r.json())
      .then((results) => {
        if (results.length > 0) {
          setLocation({
            lat: parseFloat(results[0].lat),
            lon: parseFloat(results[0].lon)
          });
          setCityName("");
          setIsSearching(false);
        } else {
          alert("Nie znaleziono miasta. Spróbuj innej nazwy.");
        }
      })
      .catch(() => alert("Błąd podczas wyszukiwania miasta."));
  };

  const descriptor = weather
    ? weatherCodeMap[weather.weathercode] || { label: "Aktualizacja pogody", emoji: "🌍" }
    : null;

  const hazards = useMemo(() => {
    if (!weather) return [];
    return hazardRules.filter((rule) => rule.check(weather));
  }, [weather]);

  const stats = useMemo(
    () => [
      {
        label: "Temperatura",
        value: weather ? `${Math.round(weather.temperature)}°C` : "--",
        detail: weather?.feelsLike
          ? `Odczuwalna ${Math.round(weather.feelsLike)}°C`
          : "Brak danych"
      },
      {
        label: "Wilgotność",
        value: weather?.humidity != null ? `${Math.round(weather.humidity)}%` : "--",
        detail: "Comfort level"
      },
      {
        label: "Ciśnienie",
        value: weather?.pressure ? `${Math.round(weather.pressure)} hPa` : "--",
        detail: weather?.pressure
          ? weather.pressure >= 1015
            ? "Stabilne warunki"
            : "Możliwy ból głowy"
          : "Brak danych"
      },
      {
        label: "Wiatr",
        value: weather ? `${Math.round(weather.windspeed)} km/h` : "--",
        detail: weather?.winddirection != null ? `Kierunek ${Math.round(weather.winddirection)}°` : "Brak danych"
      }
    ],
    [weather]
  );

  const gradient = isDarkTheme
    ? "from-slate-900 via-gray-900 to-black text-blue-100"
    : weather?.is_day
    ? "from-sky-300 via-blue-400 to-indigo-600 text-white"
    : "from-slate-700 via-indigo-800 to-indigo-900 text-blue-100";

  return (
    <div className={`rounded-3xl p-5 mb-4 shadow-xl bg-gradient-to-br ${gradient}`}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-white/70 text-center sm:text-left">
              Pogoda
            </p>
            <h3 className="text-2xl font-semibold flex items-center gap-2 justify-center sm:justify-start">
              {descriptor ? (
                <>
                  <span>{descriptor.emoji}</span>
                  {descriptor.label}
                </>
              ) : (
                "Pobieranie danych..."
              )}
            </h3>
            <p className="text-sm text-white/70">
              {city || "Pobieranie lokalizacji..."}
            </p>
            {weather?.fetchedAt && (
              <p className="text-[11px] text-white/60">
                Aktualizacja: {new Date(weather.fetchedAt).toLocaleTimeString("pl-PL")}
              </p>
            )}
          </div>
          {weather ? (
            <div className="text-right">
              <p className="text-5xl font-bold leading-none">{Math.round(weather.temperature)}°</p>
              <p className="text-sm text-white/70">
                Wiatr {Math.round(weather.windspeed)} km/h
              </p>
              {weather.precipitation != null && (
                <p className="text-xs text-white/60">
                  Opady: {weather.precipitation.toFixed(1)} mm
                </p>
              )}
            </div>
          ) : (
            <div className="text-sm text-white/70">Pobieranie pogody...</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {stats.map(({ label, value, detail }) => (
            <div key={label} className="bg-white/10 rounded-2xl p-3">
              <p className="text-xs uppercase tracking-wide text-white/70">{label}</p>
              <p className="text-xl font-semibold">{value}</p>
              <p className="text-[11px] text-white/60">{detail}</p>
            </div>
          ))}
        </div>

        <div className="bg-white/10 rounded-2xl p-3">
          <p className="text-xs uppercase tracking-wide text-white/70 mb-2">Ostrzeżenia</p>
          {hazards.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {hazards.map((hazard) => (
                <li key={hazard.label} className="flex items-start gap-2">
                  <span>⚠️</span>
                  <div>
                    <p className="font-semibold">{hazard.label}</p>
                    <p className="text-white/70 text-xs">{hazard.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-white/70">Brak istotnych zagrożeń pogodowych.</p>
          )}
        </div>

        <div className="bg-white/10 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-white/70">
              Zmień lokalizację
            </p>
            <button
              className="text-xs font-semibold underline text-white/80"
              onClick={() => setIsSearching((v) => !v)}
            >
              {isSearching ? "Zamknij" : "Wpisz miasto"}
            </button>
          </div>
          {isSearching && (
            <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleCitySubmit}>
              <input
                type="text"
                placeholder="np. Wrocław"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                className="flex-1 rounded-xl px-3 py-2 text-sm text-gray-900"
              />
              <button className="px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-semibold">
                Szukaj
              </button>
            </form>
          )}
          {!isSearching && (
            <p className="text-xs text-white/60">
              Możesz śledzić pogodę w innych miastach, wybierając je ręcznie.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Weather;
