TimeFlow – Planer Dnia

TimeFlow to webowa aplikacja typu PWA do planowania dnia i zarządzania zadaniami. Projekt składa się z frontendu (React) oraz backendu (Node.js + Express) z bazą danych SQLite.

WYMAGANIA:
Node.js w wersji 18 lub nowszej (LTS zalecane)
npm (instalowany razem z Node.js)
Git

INSTALACJA I URUCHOMIENIE:
Projekt składa się z dwóch części:
client – frontend
server – backend

Do uruchomienia wymagane są dwa terminale:

Klonowanie repozytorium:

git clone 
https://github.com/kjamrozinski/TimeFlow.git 
cd TimeFlow

Uruchomienie backendu:
cd server 
npm install 
npm run dev
Jeżeli komenda npm run dev nie jest dostępna: npm start

Backend uruchamia się domyślnie pod adresem: http://localhost:3001

Baza danych SQLite tworzy się automatycznie przy pierwszym uruchomieniu serwera.

Uruchomienie frontendu:
W drugim terminalu:
cd client 
npm install 
npm run dev

Frontend uruchomi się domyślnie pod adresem: http://localhost:5173

KONFIGURACJA POŁĄCZENIA FRONTEND – BACKEND:
Frontend komunikuje się z backendem przez HTTP (Axios). 
Należy upewnić się, że backend działa na porcie 3001 oraz że frontend wskazuje na adres: http://localhost:3001

STRUKTURA PROJEKTU:
TimeFlow client – frontend (React + Vite + Tailwind CSS) server – backend (Node.js + Express + SQLite) README.md

STACK TECHNOLOGICZNY:
Frontend: React Vite Tailwind CSS React Router Axios Framer Motion
Backend: Node.js Express
Baza danych: SQLite (sqlite3)

TRYB DEVELOPERSKI:
Projekt uruchamiany jest w trybie developerskim: 
frontend – hot reload (Vite) 
backend – tryb developerski


Projekt wykonany w ramach pracy inżynierskiej. 

Autor: Kacper Jamroziński
