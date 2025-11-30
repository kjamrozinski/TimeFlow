const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
const app = express();

app.use(cors());
app.use(bodyParser.json());

// Logowanie i rejestracja (symulacja, produkcyjnie hashe itd.)
app.post('/api/login', (req, res) => {
  const { nick, password } = req.body;
  db.get(
    'SELECT * FROM users WHERE nick = ? AND password = ?',
    [nick, password],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Błąd serwera' });
      if (!row) return res.status(401).json({ error: 'Złe dane logowania' });
      res.json({ nick: row.nick });
    }
  );
});

app.post('/api/register', (req, res) => {
  const { nick, password } = req.body;
  db.run(
    'INSERT INTO users (nick, password) VALUES (?, ?)',
    [nick, password],
    (err) => {
      if (err) return res.status(400).json({ error: 'Nick zajęty' });
      res.json({ nick });
    }
  );
});

// Zadania
app.get('/api/tasks/:nick', (req, res) => {
  db.all('SELECT * FROM tasks WHERE nick = ?', [req.params.nick], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Błąd serwera' });
    const tasks = rows.map(row => {
      const tagsArray = row.tags ? JSON.parse(row.tags) : [];
      const { done, ...taskData } = row;
      return {
        ...taskData,
        tags: tagsArray,
        completed: !!done,
        // Konwersja nazw pól na używane w frontendzie
        content: row.text,
        deadline: row.dueDate
      };
    });
    res.json(tasks);
  });
});


app.post('/api/tasks', (req, res) => {
  const { nick, content, text, description, deadline, priority, tags, done, type } = req.body;
  const taskText = content || text;
  const tagsStr = JSON.stringify(tags || []);
  db.run(
    'INSERT INTO tasks (nick, text, done, description, dueDate, priority, tags, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [nick, taskText, done ? 1 : 0, description || '', deadline || '', priority || 'Low', tagsStr, type || 'Inne'],
    function (err) {
      if (err) return res.status(500).json({ error: 'Błąd serwera' });
      // Zwracamy utworzone zadanie (wraz z nowym ID)
      res.json({
        id: this.lastID,
        nick: nick,
        content: taskText,
        description: description || '',
        deadline: deadline || '',
        priority: priority || 'Low',
        tags: tags || [],
        completed: !!(done ? done : false),
        type: type || 'Inne'
      });
    }
  );
});

app.put('/api/tasks/:id', (req, res) => {
  const { content, text, description, deadline, priority, tags, done, completed, type } = req.body;
  const taskText = content || text;
  const tagsStr = JSON.stringify(tags || []);
  // Ustalenie wartości pola "done" na podstawie przesłanych danych (completed/done)
  let doneValue;
  if (typeof completed !== 'undefined') {
    doneValue = completed ? 1 : 0;
  } else if (typeof done !== 'undefined') {
    doneValue = done ? 1 : 0;
  }
  // Budowanie zapytania aktualizującego tylko przekazane pola
  const updates = [];
  const params = [];
  if (taskText !== undefined) { updates.push('text = ?'); params.push(taskText); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (deadline !== undefined) { updates.push('dueDate = ?'); params.push(deadline); }
  if (priority !== undefined) { updates.push('priority = ?'); params.push(priority); }
  if (tags !== undefined) { updates.push('tags = ?'); params.push(tagsStr); }
  if (doneValue !== undefined) { updates.push('done = ?'); params.push(doneValue); }
  if (type !== undefined) { updates.push('type = ?'); params.push(type); }
  if (updates.length === 0) {
    return res.json({ changed: 0 });
  }
  const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;
  params.push(req.params.id);
  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: 'Błąd serwera' });
    res.json({ changed: this.changes });
  });
});

app.delete('/api/tasks/:id', (req, res) => {
  db.run('DELETE FROM tasks WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Błąd serwera' });
    res.json({ deleted: this.changes });
  });
});

// Reset hasła (symulacja)
app.post('/api/reset', (req, res) => {
  // Tylko symulacja UX
  res.json({ ok: true });
});

app.listen(5000, () => {
  console.log('Backend API na http://localhost:5000');
});
