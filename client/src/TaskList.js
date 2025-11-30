import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

function TaskList({
  userNick,
  tasks = [],
  setTasks,
  setArchive,
  showCompleted = false,
  onToggleCompleted = () => {},
  theme = 'light',
  onToggleTheme = () => {},
}) {
  // Stany aplikacji
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtry wyświetlania
  const [filterTag, setFilterTag] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterDate, setFilterDate] = useState('');

  // Pobieranie zadań z backendu po załadowaniu komponentu
  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_URL}/api/tasks/${userNick}`)
      .then((res) => {
        setTasks(res.data || []);
        setError(null);
      })
      .catch((err) => {
        console.error('Fetch tasks error:', err);
        setError('Nie udało się pobrać zadań.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userNick]);

  // Stan formularza dodawania nowego zadania
  const [newTask, setNewTask] = useState({
    content: '',
    description: '',
    deadline: '',
    priority: 'Low',  // wewnętrznie używamy wartości Low/Medium/High
    tags: '',
    type: 'Inne'
  });
  const handleAddTask = () => {
    if (!newTask.content.trim()) return;  // wymagane jest podanie treści zadania
    const taskData = {
      nick: userNick,
      content: newTask.content,
      description: newTask.description,
      deadline: newTask.deadline,
      priority: newTask.priority,
      // rozbijamy wpisane tagi po przecinku na tablicę
      tags: newTask.tags ? newTask.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      type: newTask.type
    };
    axios.post(`${API_URL}/api/tasks`, taskData)
      .then(res => {
        const createdTask = res.data;
        if (createdTask) {
          setTasks(prev => [...prev, createdTask]);
        } else {
          // Jeśli API nie zwróci nowego zadania, pobieramy całą listę zadań
          return axios.get(`${API_URL}/api/tasks/${userNick}`).then(r => setTasks(r.data || []));
        }
      })
      .catch(err => {
        console.error('Add task error:', err);
        setError('Nie udało się dodać zadania.');
      })
      .finally(() => {
        // Wyczyść pola formularza niezależnie od wyniku
        setNewTask({ content: '', description: '', deadline: '', priority: 'Low', tags: '', type: 'Inne' });
      });
  };

  // Funkcje usuwania i częściowej aktualizacji (np. oznaczanie jako wykonane)
  const handleDeleteTask = (id) => {
  const taskToDelete = tasks.find((t) => t.id === id);
  axios
    .delete(`${API_URL}/api/tasks/${id}`)
    .then(() => {
      setTasks((prev) => prev.filter((task) => task.id !== id));
      if (taskToDelete) {
        setArchive((prev) => [...prev, taskToDelete]);
      }
    })
    .catch((err) => {
      console.error('Delete task error:', err);
      setError('Nie udało się usunąć zadania.');
    });
};
  const handleUpdateTask = (id, updatedFields) => {
    axios.put(`${API_URL}/api/tasks/${id}`, updatedFields)
      .then(() => {
        setTasks(prev => prev.map(task =>
          task.id === id ? { ...task, ...updatedFields } : task
        ));
      })
      .catch(err => {
        console.error('Update task error:', err);
        setError('Nie udało się zaktualizować zadania.');
      });
  };

  const revertTaskCompletion = (id) => {
    handleUpdateTask(id, { completed: false });
  };

  const handleArchiveTask = (task) => {
    setArchive(prev => [...prev, task]);
    setTasks(prev => prev.filter(t => t.id !== task.id));
  };

  // Stany i funkcje dla trybu edycji istniejącego zadania
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTaskData, setEditTaskData] = useState({
    content: '', description: '', deadline: '', priority: 'Low', tags: '', type: ''
  });
  const startEdit = (task) => {
    setEditTaskId(task.id);
    setEditTaskData({
      content: task.content,
      description: task.description || '',
      deadline: task.deadline ? task.deadline.slice(0, 10) : '',  // ucinamy czas, zostawiamy YYYY-MM-DD
      priority: task.priority || 'Low',
      tags: task.tags 
        ? Array.isArray(task.tags) 
            ? task.tags.join(', ')        // konwertuj tablicę tagów na string
            : String(task.tags)           // jeśli już string
        : '',
      type: task.type || 'Inne'
    });
  };
  const cancelEdit = () => {
    setEditTaskId(null);
  };
  const submitEdit = (id) => {
    // Przygotowanie zaktualizowanych danych do wysłania na backend
    const updated = {
      content: editTaskData.content,
      description: editTaskData.description,
      deadline: editTaskData.deadline,
      priority: editTaskData.priority,
      tags: editTaskData.tags ? editTaskData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      type: editTaskData.type
    };
    axios.put(`${API_URL}/api/tasks/${id}`, updated)
      .then(() => {
        setTasks(prev => prev.map(task =>
          task.id === id ? { ...task, ...updated } : task
        ));
        setEditTaskId(null);
      })
      .catch(err => {
        console.error('Edit task error:', err);
        setError('Nie udało się zapisać zmian.');
      });
  };

  // Filtrowanie zadań według wybranych kryteriów
  let filteredTasks = tasks;
  if (filterTag !== 'All') {
    filteredTasks = filteredTasks.filter(task => {
      if (!task.tags) return false;
      const taskTags = Array.isArray(task.tags) 
        ? task.tags 
        : String(task.tags).split(',').map(t => t.trim());
      return taskTags.includes(filterTag);
    });
  }
  if (filterPriority !== 'All') {
    filteredTasks = filteredTasks.filter(task => task.priority === filterPriority);
  }
  if (filterDate) {
    filteredTasks = filteredTasks.filter(task => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline);
      const selectedDate = new Date(filterDate);
      // porównaj tylko rok, miesiąc i dzień
      return taskDate.getFullYear() === selectedDate.getFullYear() &&
             taskDate.getMonth() === selectedDate.getMonth() &&
             taskDate.getDate() === selectedDate.getDate();
    });
  }

  const activeFilteredTasks = filteredTasks.filter(task => !task.completed);
  const completedFilteredTasks = filteredTasks.filter(task => task.completed);

  // Grupowanie zadań według terminu (zaległe, na dziś, na jutro, przyszłe)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); 
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const dayAfterTomorrow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);

  const overdueTasks = activeFilteredTasks.filter(task =>
    task.deadline && new Date(task.deadline) < today
  );
  const todayTasks = activeFilteredTasks.filter(task =>
    task.deadline && new Date(task.deadline) >= today && new Date(task.deadline) < tomorrow
  );
  const tomorrowTasks = activeFilteredTasks.filter(task =>
    task.deadline && new Date(task.deadline) >= tomorrow && new Date(task.deadline) < dayAfterTomorrow
  );
  const futureTasks = activeFilteredTasks.filter(task =>
    task.deadline && new Date(task.deadline) >= dayAfterTomorrow
  );
  const noDeadlineTasks = activeFilteredTasks.filter(task => !task.deadline);
  if (noDeadlineTasks.length > 0) {
    futureTasks.push(...noDeadlineTasks);
  }

  // Obliczenie statystyk ogólnych: wykonane, zaległe, aktywne
  const doneCount = tasks.filter(task => task.completed).length;
  const overdueCount = tasks.filter(task =>
    !task.completed && task.deadline && new Date(task.deadline) < today
  ).length;
  const activeCount = tasks.filter(task =>
    !task.completed && (
      !task.deadline || new Date(task.deadline) >= today
    )
  ).length;

  // Definicja kolorów dla etykiet typów zadań
  const typeColors = {
    Praca: 'bg-blue-100 text-blue-800',
    Nauka: 'bg-green-100 text-green-800',
    Relaks: 'bg-purple-100 text-purple-800',
    Sport: 'bg-orange-100 text-orange-800',
    Spotkania: 'bg-red-100 text-red-800',
    Inne: 'bg-gray-200 text-gray-800'
  };

  // Renderowanie komponentu listy zadań
  if (loading) {
    return <div className="p-4 text-center">Ładowanie...</div>;
  }
  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className={`p-4 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen`}>
      {/* Górny pasek: statystyki i przełącznik trybu ciemnego */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
        <div className="mb-2 sm:mb-0 text-sm">
          <span className="font-semibold">Wykonane:</span> {doneCount} |{" "}
          <span className="font-semibold">Zaległe:</span> {overdueCount} |{" "}
          <span className="font-semibold">Aktywne:</span> {activeCount}
        </div>
        <button
          onClick={onToggleTheme}
          className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 text-sm font-medium"
        >
          {theme === 'dark' ? '☀️ Tryb jasny' : '🌙 Tryb ciemny'}
        </button>
      </div>

      {/* Filtry */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-4 text-sm">
        <div className="mb-2 sm:mb-0">
          <label className="mr-1">Tag:</label>
          <select 
            value={filterTag} 
            onChange={e => setFilterTag(e.target.value)} 
            className="p-1 border rounded bg-white dark:bg-gray-800"
          >
            <option value="All">Wszystkie</option>
            {
              [...new Set(tasks.flatMap(task => 
                Array.isArray(task.tags) ? task.tags : (task.tags ? String(task.tags).split(',').map(t=>t.trim()) : [])
              ))]
              .filter(tag => tag)
              .map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))
            }
          </select>
        </div>
        <div className="mb-2 sm:mb-0">
          <label className="mr-1">Priorytet:</label>
          <select 
            value={filterPriority} 
            onChange={e => setFilterPriority(e.target.value)} 
            className="p-1 border rounded bg-white dark:bg-gray-800"
          >
            <option value="All">Wszystkie</option>
            <option value="Low">Niski</option>
            <option value="Medium">Średni</option>
            <option value="High">Wysoki</option>
          </select>
        </div>
        <div className="mb-2 sm:mb-0">
          <label className="mr-1">Termin:</label>
          <input 
            type="date" 
            value={filterDate} 
            onChange={e => setFilterDate(e.target.value)} 
            className="p-1 border rounded bg-white dark:bg-gray-800" 
          />
        </div>
        <button 
          onClick={() => { setFilterTag('All'); setFilterPriority('All'); setFilterDate(''); }}
          className="p-1 bg-gray-200 dark:bg-gray-800 border rounded"
        >
          Wyczyść filtry
        </button>
      </div>

      {/* Formularz dodawania nowego zadania */}
      <div className="mb-6 p-4 rounded bg-gray-50 dark:bg-gray-800">
        <h3 className="font-semibold mb-2">Dodaj zadanie</h3>
        <div className="mb-2">
          <input 
            type="text" 
            placeholder="Treść zadania..." 
            value={newTask.content} 
            onChange={e => setNewTask(prev => ({ ...prev, content: e.target.value }))} 
            className="w-full p-2 mb-2 border rounded bg-white dark:bg-gray-700 dark:text-gray-100"
          />
          <textarea 
            placeholder="Opis (opcjonalnie)" 
            value={newTask.description} 
            onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))} 
            className="w-full p-2 mb-2 border rounded bg-white dark:bg-gray-700 dark:text-gray-100"
          />
          <div className="flex flex-col sm:flex-row sm:space-x-4 mb-2">
            <div className="mb-2 sm:mb-0 flex-1">
              <label className="mr-1">Termin:</label>
              <input 
                type="date" 
                value={newTask.deadline} 
                onChange={e => setNewTask(prev => ({ ...prev, deadline: e.target.value }))} 
                className="p-1 border rounded w-full bg-white dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div className="flex-1">
              <label className="mr-1">Priorytet:</label>
              <select 
                value={newTask.priority} 
                onChange={e => setNewTask(prev => ({ ...prev, priority: e.target.value }))} 
                className="p-1 border rounded w-full bg-white dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="Low">Niski</option>
                <option value="Medium">Średni</option>
                <option value="High">Wysoki</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:space-x-4 mb-2">
            <div className="mb-2 sm:mb-0 flex-1">
              <label className="mr-1">Typ:</label>
              <select 
                value={newTask.type} 
                onChange={e => setNewTask(prev => ({ ...prev, type: e.target.value }))} 
                className="p-1 border rounded w-full bg-white dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="Praca">Praca</option>
                <option value="Nauka">Nauka</option>
                <option value="Relaks">Relaks</option>
                <option value="Sport">Sport</option>
                <option value="Spotkania">Spotkania</option>
                <option value="Inne">Inne</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="mr-1">Tagi:</label>
              <input 
                type="text" 
                placeholder="np. praca, dom" 
                value={newTask.tags} 
                onChange={e => setNewTask(prev => ({ ...prev, tags: e.target.value }))} 
                className="p-1 border rounded w-full bg-white dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
        <button 
          onClick={handleAddTask} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Dodaj zadanie
        </button>
      </div>

      {/* Sekcja z zadaniami zaległymi (przeterminowane) */}
      {overdueTasks.length > 0 && (
        <section className="mb-6">
          <h3 className="font-bold text-lg text-red-600 mb-2">Zaległe</h3>
          <ul>
            {overdueTasks.map(task => (
              <li key={task.id} className="mb-2 pl-2 border-l-4 border-red-500">
                {/* Widok edycji zadania */}
                {editTaskId === task.id ? (
                  <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded">
                    <input 
                      type="text" 
                      value={editTaskData.content} 
                      onChange={e => setEditTaskData(prev => ({ ...prev, content: e.target.value }))} 
                      className="w-full p-1 mb-1 border rounded bg-white dark:bg-gray-600 dark:text-gray-100"
                    />
                    <textarea 
                      value={editTaskData.description} 
                      onChange={e => setEditTaskData(prev => ({ ...prev, description: e.target.value }))} 
                      className="w-full p-1 mb-1 border rounded bg-white dark:bg-gray-600 dark:text-gray-100"
                    />
                    <div className="flex flex-col sm:flex-row sm:space-x-4 mb-1">
                      <div className="mb-1 sm:mb-0 flex-1">
                        <label className="mr-1">Termin:</label>
                        <input 
                          type="date" 
                          value={editTaskData.deadline} 
                          onChange={e => setEditTaskData(prev => ({ ...prev, deadline: e.target.value }))} 
                          className="p-1 border rounded w-full bg-white dark:bg-gray-600 dark:text-gray-100"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="mr-1">Priorytet:</label>
                        <select 
                          value={editTaskData.priority} 
                          onChange={e => setEditTaskData(prev => ({ ...prev, priority: e.target.value }))} 
                          className="p-1 border rounded w-full bg-white dark:bg-gray-600 dark:text-gray-100"
                        >
                          <option value="Low">Niski</option>
                          <option value="Medium">Średni</option>
                          <option value="High">Wysoki</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:space-x-4 mb-2">
                      <div className="mb-1 sm:mb-0 flex-1">
                        <label className="mr-1">Typ:</label>
                        <select 
                          value={editTaskData.type} 
                          onChange={e => setEditTaskData(prev => ({ ...prev, type: e.target.value }))} 
                          className="p-1 border rounded w-full bg-white dark:bg-gray-600 dark:text-gray-100"
                        >
                          <option value="Praca">Praca</option>
                          <option value="Nauka">Nauka</option>
                          <option value="Relaks">Relaks</option>
                          <option value="Sport">Sport</option>
                          <option value="Spotkania">Spotkania</option>
                          <option value="Inne">Inne</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="mr-1">Tagi:</label>
                        <input 
                          type="text" 
                          value={editTaskData.tags} 
                          onChange={e => setEditTaskData(prev => ({ ...prev, tags: e.target.value }))} 
                          className="p-1 border rounded w-full bg-white dark:bg-gray-600 dark:text-gray-100"
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <button 
                        onClick={() => submitEdit(task.id)} 
                        className="mr-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Zapisz
                      </button>
                      <button 
                        onClick={cancelEdit} 
                        className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                      >
                        Anuluj
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Widok zwykły (odczyt) */
                  <div className={`flex items-center justify-between p-2 rounded ${task.completed ? 'line-through opacity-50' : ''}`}>
                    <div>
                      <div className="font-semibold">
                        {task.content}
                        {/* Ikona alarmu jeśli termin jest na dziś i nieukończone */}
                        {task.deadline && new Date(task.deadline) >= today && new Date(task.deadline) < tomorrow && !task.completed && (
                          <span className="ml-2 text-red-500">⏰</span>
                        )}
                      </div>
                      {task.description && <div className="text-sm">{task.description}</div>}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Termin: {task.deadline ? task.deadline.slice(0, 10) : 'Brak'} | Priorytet: {task.priority} {task.priority === 'Low' ? '(Niski)' : task.priority === 'Medium' ? '(Średni)' : task.priority === 'High' ? '(Wysoki)' : ''}{' | Typ: '}<span className={`px-2 py-0.5 text-xs font-semibold rounded ${typeColors[task.type]}`}>{task.type}</span>
                        {task.tags && String(task.tags).trim() && <> {' | Tagi: '} {Array.isArray(task.tags) ? task.tags.join(', ') : task.tags} </>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <input 
                        type="checkbox" 
                        checked={task.completed} 
                        onChange={e => handleUpdateTask(task.id, { completed: e.target.checked })} 
                        className="h-4 w-4"
                        title="Oznacz jako wykonane"
                      />
                      <button onClick={() => startEdit(task)} className="text-blue-600 hover:underline">Edytuj</button>
                      <button onClick={() => handleArchiveTask(task)} className="text-yellow-600 hover:underline">Archiwizuj</button>
                      <button onClick={() => handleDeleteTask(task.id)} className="text-red-600 hover:underline">Usuń</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sekcja "Dzisiaj" */}
      <section className="mb-6">
        <h3 className="font-bold text-lg mb-2">Dzisiaj</h3>
        {todayTasks.length > 0 ? (
          <ul>
            {todayTasks.map(task => (
              <li key={task.id} className="mb-2 pl-2 border-l-4 border-blue-500">
                {editTaskId === task.id ? (
                  <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded">
                    <input 
                      type="text" 
                      value={editTaskData.content} 
                      onChange={e => setEditTaskData(prev => ({ ...prev, content: e.target.value }))} 
                      className="w-full p-1 mb-1 border rounded bg-white dark:bg-gray-600 dark:text-gray-100"
                    />
                    <textarea 
                      value={editTaskData.description} 
                      onChange={e => setEditTaskData(prev => ({ ...prev, description: e.target.value }))} 
                      className="w-full p-1 mb-1 border rounded bg-white dark:bg-gray-600 dark:text-gray-100"
                    />
                    <div className="flex flex-col sm:flex-row sm:space-x-4 mb-1">
                      <div className="mb-1 sm:mb-0 flex-1">
                        <label className="mr-1">Termin:</label>
                        <input 
                          type="date" 
                          value={editTaskData.deadline} 
                          onChange={e => setEditTaskData(prev => ({ ...prev, deadline: e.target.value }))} 
                          className="p-1 border rounded w-full bg-white dark:bg-gray-600 dark:text-gray-100"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="mr-1">Priorytet:</label>
                        <select 
                          value={editTaskData.priority} 
                          onChange={e => setEditTaskData(prev => ({ ...prev, priority: e.target.value }))} 
                          className="p-1 border rounded w-full bg-white dark:bg-gray-600 dark:text-gray-100"
                        >
                          <option value="Low">Niski</option>
                          <option value="Medium">Średni</option>
                          <option value="High">Wysoki</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:space-x-4 mb-2">
                      <div className="mb-1 sm:mb-0 flex-1">
                        <label className="mr-1">Typ:</label>
                        <select 
                          value={editTaskData.type} 
                          onChange={e => setEditTaskData(prev => ({ ...prev, type: e.target.value }))} 
                          className="p-1 border rounded w-full bg-white dark:bg-gray-600 dark:text-gray-100"
                        >
                          <option value="Praca">Praca</option>
                          <option value="Nauka">Nauka</option>
                          <option value="Relaks">Relaks</option>
                          <option value="Sport">Sport</option>
                          <option value="Spotkania">Spotkania</option>
                          <option value="Inne">Inne</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="mr-1">Tagi:</label>
                        <input 
                          type="text" 
                          value={editTaskData.tags} 
                          onChange={e => setEditTaskData(prev => ({ ...prev, tags: e.target.value }))} 
                          className="p-1 border rounded w-full bg-white dark:bg-gray-600 dark:text-gray-100"
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <button 
                        onClick={() => submitEdit(task.id)} 
                        className="mr-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Zapisz
                      </button>
                      <button 
                        onClick={cancelEdit} 
                        className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                      >
                        Anuluj
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`flex items-center justify-between p-2 rounded ${task.completed ? 'line-through opacity-50' : ''}`}>
                    <div>
                      <div className="font-semibold">
                        {task.content}
                        {task.deadline && new Date(task.deadline) >= today && new Date(task.deadline) < tomorrow && !task.completed && (
                          <span className="ml-2 text-red-500">⏰</span>
                        )}
                      </div>
                      {task.description && <div className="text-sm">{task.description}</div>}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Termin: {task.deadline ? task.deadline.slice(0, 10) : 'Brak'} | Priorytet: {task.priority} {task.priority === 'Low' ? '(Niski)' : task.priority === 'Medium' ? '(Średni)' : task.priority === 'High' ? '(Wysoki)' : ''}{' | Typ: '}<span className={`px-2 py-0.5 text-xs font-semibold rounded ${typeColors[task.type]}`}>{task.type}</span>
                        {task.tags && String(task.tags).trim() && <> {' | Tagi: '} {Array.isArray(task.tags) ? task.tags.join(', ') : task.tags} </>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <input 
                        type="checkbox" 
                        checked={task.completed} 
                        onChange={e => handleUpdateTask(task.id, { completed: e.target.checked })} 
                        className="h-4 w-4"
                        title="Oznacz jako wykonane"
                      />
                      <button onClick={() => startEdit(task)} className="text-blue-600 hover:underline">Edytuj</button>
                      <button onClick={() => handleArchiveTask(task)} className="text-yellow-600 hover:underline">Archiwizuj</button>
                      <button onClick={() => handleDeleteTask(task.id)} className="text-red-600 hover:underline">Usuń</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Brak zadań na dziś.</p>
        )}
      </section>

      {/* Sekcja "Jutro" */}
      <section className="mb-6">
        <h3 className="font-bold text-lg mb-2">Jutro</h3>
        {tomorrowTasks.length > 0 ? (
          <ul>
            {tomorrowTasks.map(task => (
              <li key={task.id} className="mb-2 pl-2 border-l-4 border-green-500">
                {editTaskId === task.id ? (
                  <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded">
                    <input 
                      type="text" 
                      value={editTaskData.content} 
                      onChange={e => setEditTaskData(prev => ({ ...prev, content: e.target.value }))} 
                      className="w-full p-1 mb-1 border rounded bg-white dark:bg-gray-600 dark:text-gray-100"
                    />
                    {/* (Analogicznie dodajemy pola opisu, terminu, priorytetu, typu i tagów - tak jak wyżej) */}
                    <div className="flex flex-col sm:flex-row sm:space-x-4 mb-1">
                      <div className="mb-1 sm:mb-0 flex-1">
                        <label className="mr-1">Termin:</label>
                        <input 
                          type="date" 
                          value={editTaskData.deadline} 
                          onChange={e => setEditTaskData(prev => ({ ...prev, deadline: e.target.value }))} 
                          className="p-1 border rounded w-full bg-white dark:bg-gray-600 dark:text-gray-100"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="mr-1">Priorytet:</label>
                        <select 
                          value={editTaskData.priority} 
                          onChange={e => setEditTaskData(prev => ({ ...prev, priority: e.target.value }))} 
                          className="p-1 border rounded w-full bg-white dark:bg-gray-600 dark:text-gray-100"
                        >
                          <option value="Low">Niski</option>
                          <option value="Medium">Średni</option>
                          <option value="High">Wysoki</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:space-x-4 mb-2">
                      <div className="mb-1 sm:mb-0 flex-1">
                        <label className="mr-1">Typ:</label>
                        <select 
                          value={editTaskData.type} 
                          onChange={e => setEditTaskData(prev => ({ ...prev, type: e.target.value }))} 
                          className="p-1 border rounded w-full bg-white dark:bg-gray-600 dark:text-gray-100"
                        >
                          <option value="Praca">Praca</option>
                          <option value="Nauka">Nauka</option>
                          <option value="Relaks">Relaks</option>
                          <option value="Sport">Sport</option>
                          <option value="Spotkania">Spotkania</option>
                          <option value="Inne">Inne</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="mr-1">Tagi:</label>
                        <input 
                          type="text" 
                          value={editTaskData.tags} 
                          onChange={e => setEditTaskData(prev => ({ ...prev, tags: e.target.value }))} 
                          className="p-1 border rounded w-full bg-white dark:bg-gray-600 dark:text-gray-100"
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <button onClick={() => submitEdit(task.id)} className="mr-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Zapisz</button>
                      <button onClick={cancelEdit} className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500">Anuluj</button>
                    </div>
                  </div>
                ) : (
                  <div className={`flex items-center justify-between p-2 rounded ${task.completed ? 'line-through opacity-50' : ''}`}>
                    <div>
                      <div className="font-semibold">
                        {task.content}
                        {task.deadline && new Date(task.deadline) >= today && new Date(task.deadline) < tomorrow && !task.completed && (
                          <span className="ml-2 text-red-500">⏰</span>
                        )}
                      </div>
                      {task.description && <div className="text-sm">{task.description}</div>}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Termin: {task.deadline ? task.deadline.slice(0, 10) : 'Brak'} | Priorytet: {task.priority} {task.priority === 'Low' ? '(Niski)' : task.priority === 'Medium' ? '(Średni)' : task.priority === 'High' ? '(Wysoki)' : ''}{' | Typ: '}<span className={`px-2 py-0.5 text-xs font-semibold rounded ${typeColors[task.type]}`}>{task.type}</span>
                        {task.tags && String(task.tags).trim() && <> {' | Tagi: '} {Array.isArray(task.tags) ? task.tags.join(', ') : task.tags} </>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <input 
                        type="checkbox" 
                        checked={task.completed} 
                        onChange={e => handleUpdateTask(task.id, { completed: e.target.checked })} 
                        className="h-4 w-4"
                        title="Oznacz jako wykonane"
                      />
                      <button onClick={() => startEdit(task)} className="text-blue-600 hover:underline">Edytuj</button>
                      <button onClick={() => handleArchiveTask(task)} className="text-yellow-600 hover:underline">Archiwizuj</button>
                      <button onClick={() => handleDeleteTask(task.id)} className="text-red-600 hover:underline">Usuń</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Brak zadań na jutro.</p>
        )}
      </section>

      {/* Sekcja "Przyszłe" */}
      <section className="mb-2">
        <h3 className="font-bold text-lg mb-2">Przyszłe</h3>
        {futureTasks.length > 0 ? (
          <ul>
            {futureTasks.map(task => (
              <li key={task.id} className="mb-2 pl-2 border-l-4 border-purple-500">
                {editTaskId === task.id ? (
                  <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded">
                    <input 
                      type="text" 
                      value={editTaskData.content} 
                      onChange={e => setEditTaskData(prev => ({ ...prev, content: e.target.value }))} 
                      className="w-full p-1 mb-1 border rounded bg-white dark:bg-gray-600 dark:text-gray-100"
                    />
                    {/* (Analogicznie dodajemy pola opisu, terminu, priorytetu, typu i tagów) */}
                    <div className="flex flex-col sm:flex-row sm:space-x-4 mb-1">
                      <div className="mb-1 sm:mb-0 flex-1">
                        <label className="mr-1">Termin:</label>
                        <input 
                          type="date" 
                          value={editTaskData.deadline} 
                          onChange={e => setEditTaskData(prev => ({ ...prev, deadline: e.target.value }))} 
                          className="p-1 border rounded w-full bg-white dark:bg-gray-600 dark:text-gray-100"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="mr-1">Priorytet:</label>
                        <select 
                          value={editTaskData.priority} 
                          onChange={e => setEditTaskData(prev => ({ ...prev, priority: e.target.value }))} 
                          className="p-1 border rounded w-full bg-white dark:bg-gray-600 dark:text-gray-100"
                        >
                          <option value="Low">Niski</option>
                          <option value="Medium">Średni</option>
                          <option value="High">Wysoki</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:space-x-4 mb-2">
                      <div className="mb-1 sm:mb-0 flex-1">
                        <label className="mr-1">Typ:</label>
                        <select 
                          value={editTaskData.type} 
                          onChange={e => setEditTaskData(prev => ({ ...prev, type: e.target.value }))} 
                          className="p-1 border rounded w-full bg-white dark:bg-gray-600 dark:text-gray-100"
                        >
                          <option value="Praca">Praca</option>
                          <option value="Nauka">Nauka</option>
                          <option value="Relaks">Relaks</option>
                          <option value="Sport">Sport</option>
                          <option value="Spotkania">Spotkania</option>
                          <option value="Inne">Inne</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="mr-1">Tagi:</label>
                        <input 
                          type="text" 
                          value={editTaskData.tags} 
                          onChange={e => setEditTaskData(prev => ({ ...prev, tags: e.target.value }))} 
                          className="p-1 border rounded w-full bg-white dark:bg-gray-600 dark:text-gray-100"
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <button onClick={() => submitEdit(task.id)} className="mr-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Zapisz</button>
                      <button onClick={cancelEdit} className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500">Anuluj</button>
                    </div>
                  </div>
                ) : (
                  <div className={`flex items-center justify-between p-2 rounded ${task.completed ? 'line-through opacity-50' : ''}`}>
                    <div>
                      <div className="font-semibold">
                        {task.content}
                        {task.deadline && new Date(task.deadline) >= today && new Date(task.deadline) < tomorrow && !task.completed && (
                          <span className="ml-2 text-red-500">⏰</span>
                        )}
                      </div>
                      {task.description && <div className="text-sm">{task.description}</div>}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Termin: {task.deadline ? task.deadline.slice(0, 10) : 'Brak'} | Priorytet: {task.priority} {task.priority === 'Low' ? '(Niski)' : task.priority === 'Medium' ? '(Średni)' : task.priority === 'High' ? '(Wysoki)' : ''}{' | Typ: '}<span className={`px-2 py-0.5 text-xs font-semibold rounded ${typeColors[task.type]}`}>{task.type}</span>
                        {task.tags && String(task.tags).trim() && <> {' | Tagi: '} {Array.isArray(task.tags) ? task.tags.join(', ') : task.tags} </>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <input 
                        type="checkbox" 
                        checked={task.completed} 
                        onChange={e => handleUpdateTask(task.id, { completed: e.target.checked })} 
                        className="h-4 w-4"
                        title="Oznacz jako wykonane"
                      />
                      <button onClick={() => startEdit(task)} className="text-blue-600 hover:underline">Edytuj</button>
                      <button onClick={() => handleArchiveTask(task)} className="text-yellow-600 hover:underline">Archiwizuj</button>
                      <button onClick={() => handleDeleteTask(task.id)} className="text-red-600 hover:underline">Usuń</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Brak przyszłych zadań.</p>
        )}
      </section>

      {/* Sekcja wykonanych zadan */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg">Wykonane zadania ({completedFilteredTasks.length})</h3>
        </div>
        {!showCompleted && (
          <p className="text-xs text-gray-500 mb-2">
            Uzyj przycisku w sekcji Bilans dnia, aby pokazywac lub ukrywac wykonane zadania.
          </p>
        )}
        {showCompleted && (
          completedFilteredTasks.length > 0 ? (
            <ul className="space-y-2">
              {completedFilteredTasks.map(task => (
                <li key={task.id} className="p-3 rounded bg-white dark:bg-gray-800 shadow border border-gray-100 dark:border-gray-700">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <div className="font-semibold">
                        {task.content || task.text}
                      </div>
                      {task.description && <div className="text-sm text-gray-600 dark:text-gray-300">{task.description}</div>}
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                        <div>Termin: {task.deadline ? task.deadline.slice(0, 10) : 'Brak'}</div>
                        <div>Priorytet: {task.priority || 'Low'}</div>
                        <div>Typ: {task.type || 'Inne'}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => revertTaskCompletion(task.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        Cofnij ukonczenie
                      </button>
                      <button
                        onClick={() => handleArchiveTask(task)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                      >
                        Archiwizuj
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        Usun
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Brak wykonanych zadan spelniajacych filtry.</p>
          )
        )}
      </section>

    </div>
  );
}

export default TaskList;
