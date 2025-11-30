import React, { useEffect, useState } from "react";

const Weather = ({ weather, location, setLocation }) => {
  const [city, setCity] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [cityName, setCityName] = useState("");

  // Pobierz miasto po lokalizacji (reverse geocoding)
  useEffect(() => {
    if (location && location.lat && location.lon) {
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lon}&format=json`
      )
        .then((r) => r.json())
        .then((data) => setCity(data.address?.city || data.address?.town || data.address?.village || "Nieznane"))
        .catch(() => setCity("Nieznane"));
    } else if (location?.city) {
      setCity(location.city);
    }
  }, [location]);

  // Wybór własnego miasta przez użytkownika
  const handleCitySubmit = (e) => {
    e.preventDefault();
    // Możesz rozbudować: szukać po API pogody nazwę miasta i znaleźć współrzędne
    fetch(
      `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
        cityName
      )}&format=json`
    )
      .then((r) => r.json())
      .then((results) => {
        if (results.length > 0) {
          setLocation({
            lat: results[0].lat,
            lon: results[0].lon,
          });
          setCityName("");
          setShowInput(false);
        } else {
          alert("Nie znaleziono miasta!");
        }
      });
  };

  return (
    <div className="bg-blue-100 dark:bg-blue-900 rounded-xl p-4 mb-4 flex flex-col items-center shadow-md">
      <div className="flex flex-col items-center">
        <span className="text-lg font-semibold">Pogoda</span>
        <span className="mt-1">
          {city ? `Lokalizacja: ${city}` : "Pobieranie lokalizacji..."}
        </span>
        {weather ? (
          <div className="flex items-center gap-4 mt-2">
            <span className="text-3xl">{Math.round(weather.temperature)}°C</span>
            <span className="text-sm">Wiatr: {Math.round(weather.windspeed)} km/h</span>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Pobieranie pogody...</div>
        )}
      </div>
      <button
        className="mt-2 text-xs text-blue-600 hover:underline"
        onClick={() => setShowInput((v) => !v)}
      >
        {showInput ? "Anuluj" : "Zmień lokalizację"}
      </button>
      {showInput && (
        <form className="flex flex-col items-center mt-2" onSubmit={handleCitySubmit}>
          <input
            type="text"
            placeholder="Miasto"
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            className="p-1 border rounded"
          />
          <button className="bg-blue-600 text-white px-2 py-1 rounded mt-1 text-xs">
            Zatwierdź
          </button>
        </form>
      )}
    </div>
  );
};

export default Weather;
