import React, { useEffect, useState } from "react";

// Przykładowa baza cytatów motywacyjnych (możesz rozbudować)
const quotes = [
  "Najlepszy czas na działanie jest teraz.",
  "Nie musisz być wielki, żeby zacząć, ale musisz zacząć, żeby być wielki.",
  "Sukces to suma niewielkich wysiłków powtarzanych dzień po dniu.",
  "Jeśli chcesz osiągnąć wielkość, przestań pytać o pozwolenie.",
  "Każdy dzień to nowa szansa, by zmienić swoje życie.",
];

const Quote = () => {
  const [quote, setQuote] = useState("");

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  return (
    <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg text-center font-medium">
      <span>{quote}</span>
    </div>
  );
};

export default Quote;
