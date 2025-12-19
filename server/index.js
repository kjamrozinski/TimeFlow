const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();

const HASH_PREFIX = 'pbkdf2$';
const HASH_ITERATIONS = 120000;
const HASH_KEYLEN = 32;
const HASH_DIGEST = 'sha256';

const allowedOrigins = (process.env.TIMEFLOW_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const apiKey = (process.env.TIMEFLOW_API_KEY || '').trim();
const tokenSecret = (process.env.TIMEFLOW_TOKEN_SECRET || '').trim();
const tokenTtlSeconds = Number.parseInt(process.env.TIMEFLOW_TOKEN_TTL || '86400', 10);
const tokenTtl = Number.isFinite(tokenTtlSeconds) && tokenTtlSeconds > 0 ? tokenTtlSeconds : 86400;

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');
const isValidNick = (nick) => nick.length >= 3 && nick.length <= 32;
const isValidPassword = (password) => password.length >= 3 && password.length <= 128;

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEYLEN, HASH_DIGEST).toString('hex');
  return `${HASH_PREFIX}${salt}$${hash}`;
};

const isHashed = (value) => typeof value === 'string' && value.startsWith(HASH_PREFIX);

const verifyPassword = (password, stored) => {
  if (!stored) return false;
  if (!isHashed(stored)) return stored === password;

  const parts = stored.split('$');
  if (parts.length !== 3) return false;

  const salt = parts[1];
  const storedHash = parts[2];
  const testHash = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEYLEN, HASH_DIGEST).toString('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(testHash, 'hex'));
  } catch (_err) {
    return false;
  }
};

const toStringArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',');
  return [];
};

const sanitizeTags = (value) =>
  toStringArray(value)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10);

const normalizeEmail = (value) => {
  const email = normalizeString(value).toLowerCase();
  if (!email) return '';
  if (!email.includes('@') || email.length > 254) return '';
  return email;
};

const normalizeTheme = (value) => {
  const theme = normalizeString(value).toLowerCase();
  if (theme === 'dark' || theme === 'light') return theme;
  return '';
};

const normalizeBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  return fallback;
};

const normalizePriority = (value) => {
  const priority = normalizeString(value);
  if (priority === 'Low' || priority === 'Medium' || priority === 'High') return priority;
  return '';
};

const normalizeType = (value) => {
  const type = normalizeString(value);
  const allowed = new Set(['Praca', 'Nauka', 'Relaks', 'Sport', 'Spotkania', 'Inne']);
  return allowed.has(type) ? type : '';
};

const normalizeAvatar = (value) => {
  const url = normalizeString(value);
  if (!url) return '';
  if (url.length > 500) return '';
  if (!/^https?:\/\//i.test(url)) return '';
  return url;
};

const normalizeTimezone = (value) => {
  const tz = normalizeString(value);
  if (!tz) return '';
  if (tz.length > 64) return '';
  return tz;
};

const base64UrlEncode = (input) => {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const base64UrlDecode = (input) => {
  const normalized = String(input).replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf-8');
};

const signToken = (payload) => {
  if (!tokenSecret) return null;
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + tokenTtl })
  );
  const data = `${header}.${body}`;
  const signature = base64UrlEncode(crypto.createHmac('sha256', tokenSecret).update(data).digest());
  return `${data}.${signature}`;
};

const verifyToken = (token) => {
  if (!tokenSecret || !token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const data = `${header}.${body}`;
  const expected = base64UrlEncode(crypto.createHmac('sha256', tokenSecret).update(data).digest());

  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  } catch (_err) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(body));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (_err) {
    return null;
  }
};

const getBearerToken = (req) => {
  const authHeader = req.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return '';
  return authHeader.slice('Bearer '.length).trim();
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS blocked'));
    },
  })
);
app.use(bodyParser.json());

app.use((req, res, next) => {
  if (!apiKey && !tokenSecret) return next();
  if (
    req.path.startsWith('/api/login') ||
    req.path.startsWith('/api/register') ||
    req.path.startsWith('/api/reset')
  ) {
    return next();
  }

  const hasApiKey = apiKey && req.get('x-api-key') === apiKey;
  const token = tokenSecret ? getBearerToken(req) : '';
  const payload = token ? verifyToken(token) : null;

  if (payload) {
    req.user = payload;
  }

  if (hasApiKey || payload) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
});

// Login and register
app.post('/api/login', (req, res) => {
  const nick = normalizeString(req.body?.nick);
  const password = normalizeString(req.body?.password);

  if (!isValidNick(nick) || !isValidPassword(password)) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  db.get('SELECT * FROM users WHERE nick = ?', [nick], (err, row) => {
    if (err) return res.status(500).json({ error: 'Blad serwera' });
    if (!row || !verifyPassword(password, row.password)) {
      return res.status(401).json({ error: 'Zle dane logowania' });
    }

    if (!isHashed(row.password)) {
      db.run('UPDATE users SET password = ? WHERE id = ?', [hashPassword(password), row.id]);
    }

    const token = signToken({ nick: row.nick });
    return res.json(token ? { nick: row.nick, token } : { nick: row.nick });
  });
});

app.post('/api/register', (req, res) => {
  const nick = normalizeString(req.body?.nick);
  const password = normalizeString(req.body?.password);

  if (!isValidNick(nick) || !isValidPassword(password)) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const passwordHash = hashPassword(password);
  db.run(
    'INSERT INTO users (nick, password) VALUES (?, ?)',
    [nick, passwordHash],
    (err) => {
      if (err) return res.status(400).json({ error: 'Nick zajety' });
      const token = signToken({ nick });
      return res.json(token ? { nick, token } : { nick });
    }
  );
});

// Profile
app.get('/api/profile/:nick', (req, res) => {
  const nick = normalizeString(req.params.nick);
  if (!isValidNick(nick)) {
    return res.status(400).json({ error: 'Invalid nick' });
  }
  if (tokenSecret && req.user?.nick && req.user.nick !== nick) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  db.get('SELECT * FROM profiles WHERE nick = ?', [nick], (err, row) => {
    if (err) return res.status(500).json({ error: 'Blad serwera' });
    if (!row) return res.json({ nick, name: '', email: '', avatarUrl: '', timezone: '' });
    return res.json({
      nick: row.nick,
      name: row.name || '',
      email: row.email || '',
      avatarUrl: row.avatarUrl || '',
      timezone: row.timezone || '',
      updatedAt: row.updatedAt || '',
    });
  });
});

app.put('/api/profile/:nick', (req, res) => {
  const nick = normalizeString(req.params.nick);
  if (!isValidNick(nick)) {
    return res.status(400).json({ error: 'Invalid nick' });
  }
  if (tokenSecret && req.user?.nick && req.user.nick !== nick) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const name = normalizeString(req.body?.name);
  const email = normalizeEmail(req.body?.email);
  const avatarUrl = normalizeAvatar(req.body?.avatarUrl);
  const timezone = normalizeTimezone(req.body?.timezone);
  const updatedAt = new Date().toISOString();

  if (name.length > 100) {
    return res.status(400).json({ error: 'Name too long' });
  }

  db.get('SELECT id FROM profiles WHERE nick = ?', [nick], (err, row) => {
    if (err) return res.status(500).json({ error: 'Blad serwera' });
    if (!row) {
      db.run(
        'INSERT INTO profiles (nick, name, email, avatarUrl, timezone, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        [nick, name, email, avatarUrl, timezone, updatedAt],
        (insertErr) => {
          if (insertErr) return res.status(500).json({ error: 'Blad serwera' });
          return res.json({ nick, name, email, avatarUrl, timezone, updatedAt });
        }
      );
      return;
    }

    db.run(
      'UPDATE profiles SET name = ?, email = ?, avatarUrl = ?, timezone = ?, updatedAt = ? WHERE nick = ?',
      [name, email, avatarUrl, timezone, updatedAt, nick],
      (updateErr) => {
        if (updateErr) return res.status(500).json({ error: 'Blad serwera' });
        return res.json({ nick, name, email, avatarUrl, timezone, updatedAt });
      }
    );
  });
});

// Preferences
app.get('/api/preferences/:nick', (req, res) => {
  const nick = normalizeString(req.params.nick);
  if (!isValidNick(nick)) {
    return res.status(400).json({ error: 'Invalid nick' });
  }
  if (tokenSecret && req.user?.nick && req.user.nick !== nick) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  db.get('SELECT * FROM preferences WHERE nick = ?', [nick], (err, row) => {
    if (err) return res.status(500).json({ error: 'Blad serwera' });
    if (!row) {
      return res.json({
        nick,
        theme: 'light',
        showWeather: true,
        showQuote: true,
        autoExpandCompleted: false,
        defaultPriority: 'Low',
        defaultType: 'Inne',
        updatedAt: '',
      });
    }
    return res.json({
      nick: row.nick,
      theme: row.theme || 'light',
      showWeather: !!row.showWeather,
      showQuote: !!row.showQuote,
      autoExpandCompleted: !!row.autoExpandCompleted,
      defaultPriority: row.defaultPriority || 'Low',
      defaultType: row.defaultType || 'Inne',
      updatedAt: row.updatedAt || '',
    });
  });
});

app.put('/api/preferences/:nick', (req, res) => {
  const nick = normalizeString(req.params.nick);
  if (!isValidNick(nick)) {
    return res.status(400).json({ error: 'Invalid nick' });
  }
  if (tokenSecret && req.user?.nick && req.user.nick !== nick) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const theme = normalizeTheme(req.body?.theme) || 'light';
  const showWeather = normalizeBoolean(req.body?.showWeather, true);
  const showQuote = normalizeBoolean(req.body?.showQuote, true);
  const autoExpandCompleted = normalizeBoolean(req.body?.autoExpandCompleted, false);
  const defaultPriority = normalizePriority(req.body?.defaultPriority) || 'Low';
  const defaultType = normalizeType(req.body?.defaultType) || 'Inne';
  const updatedAt = new Date().toISOString();

  db.get('SELECT id FROM preferences WHERE nick = ?', [nick], (err, row) => {
    if (err) return res.status(500).json({ error: 'Blad serwera' });
    if (!row) {
      db.run(
        `INSERT INTO preferences (nick, theme, showWeather, showQuote, autoExpandCompleted, defaultPriority, defaultType, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nick,
          theme,
          showWeather ? 1 : 0,
          showQuote ? 1 : 0,
          autoExpandCompleted ? 1 : 0,
          defaultPriority,
          defaultType,
          updatedAt,
        ],
        (insertErr) => {
          if (insertErr) return res.status(500).json({ error: 'Blad serwera' });
          return res.json({
            nick,
            theme,
            showWeather,
            showQuote,
            autoExpandCompleted,
            defaultPriority,
            defaultType,
            updatedAt,
          });
        }
      );
      return;
    }

    db.run(
      `UPDATE preferences
       SET theme = ?, showWeather = ?, showQuote = ?, autoExpandCompleted = ?, defaultPriority = ?, defaultType = ?, updatedAt = ?
       WHERE nick = ?`,
      [
        theme,
        showWeather ? 1 : 0,
        showQuote ? 1 : 0,
        autoExpandCompleted ? 1 : 0,
        defaultPriority,
        defaultType,
        updatedAt,
        nick,
      ],
      (updateErr) => {
        if (updateErr) return res.status(500).json({ error: 'Blad serwera' });
        return res.json({
          nick,
          theme,
          showWeather,
          showQuote,
          autoExpandCompleted,
          defaultPriority,
          defaultType,
          updatedAt,
        });
      }
    );
  });
});

// Tasks
app.get('/api/tasks/:nick', (req, res) => {
  const nick = normalizeString(req.params.nick);
  if (!isValidNick(nick)) {
    return res.status(400).json({ error: 'Invalid nick' });
  }
  if (tokenSecret && req.user?.nick && req.user.nick !== nick) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  db.all('SELECT * FROM tasks WHERE nick = ?', [nick], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Blad serwera' });

    const tasks = rows.map((row) => {
      let tagsArray = [];
      if (row.tags) {
        try {
          tagsArray = JSON.parse(row.tags);
        } catch (_err) {
          tagsArray = [];
        }
      }

      const { done, ...taskData } = row;
      return {
        ...taskData,
        tags: tagsArray,
        completed: !!done,
        content: row.text,
        deadline: row.dueDate,
      };
    });

    return res.json(tasks);
  });
});

app.post('/api/tasks', (req, res) => {
  const nick = normalizeString(req.body?.nick);
  const content = normalizeString(req.body?.content);
  const text = normalizeString(req.body?.text);
  const description = normalizeString(req.body?.description);
  const deadline = normalizeString(req.body?.deadline);
  const priority = normalizeString(req.body?.priority) || 'Low';
  const type = normalizeString(req.body?.type) || 'Inne';
  const done = req.body?.done;

  const taskText = content || text;
  const cleanedTags = sanitizeTags(req.body?.tags);
  const tagsStr = JSON.stringify(cleanedTags);

  if (!isValidNick(nick) || !taskText) {
    return res.status(400).json({ error: 'Invalid task data' });
  }
  if (tokenSecret && req.user?.nick && req.user.nick !== nick) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (taskText.length > 200 || description.length > 1000) {
    return res.status(400).json({ error: 'Task data too long' });
  }

  db.run(
    'INSERT INTO tasks (nick, text, done, description, dueDate, priority, tags, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [nick, taskText, done ? 1 : 0, description || '', deadline || '', priority, tagsStr, type],
    function (err) {
      if (err) return res.status(500).json({ error: 'Blad serwera' });
      return res.json({
        id: this.lastID,
        nick,
        content: taskText,
        description: description || '',
        deadline: deadline || '',
        priority,
        tags: cleanedTags,
        completed: !!(done ? done : false),
        type,
      });
    }
  );
});

app.put('/api/tasks/:id', (req, res) => {
  const content = normalizeString(req.body?.content);
  const text = normalizeString(req.body?.text);
  const description = normalizeString(req.body?.description);
  const deadline = normalizeString(req.body?.deadline);
  const priority = normalizeString(req.body?.priority);
  const type = normalizeString(req.body?.type);
  const done = req.body?.done;
  const completed = req.body?.completed;

  const taskText = content || text;
  const tagsStr = req.body?.tags !== undefined ? JSON.stringify(sanitizeTags(req.body.tags)) : undefined;

  const runUpdate = () => {
    let doneValue;
    if (typeof completed !== 'undefined') {
      doneValue = completed ? 1 : 0;
    } else if (typeof done !== 'undefined') {
      doneValue = done ? 1 : 0;
    }

    const updates = [];
    const params = [];
    if (taskText !== undefined) {
      updates.push('text = ?');
      params.push(taskText);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (deadline !== undefined) {
      updates.push('dueDate = ?');
      params.push(deadline);
    }
    if (priority !== undefined && priority) {
      updates.push('priority = ?');
      params.push(priority);
    }
    if (tagsStr !== undefined) {
      updates.push('tags = ?');
      params.push(tagsStr);
    }
    if (doneValue !== undefined) {
      updates.push('done = ?');
      params.push(doneValue);
    }
    if (type !== undefined && type) {
      updates.push('type = ?');
      params.push(type);
    }

    if (updates.length === 0) {
      return res.json({ changed: 0 });
    }

    const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;
    params.push(req.params.id);

    db.run(sql, params, function (err) {
      if (err) return res.status(500).json({ error: 'Blad serwera' });
      return res.json({ changed: this.changes });
    });
  };

  if (tokenSecret && req.user?.nick) {
    db.get('SELECT nick FROM tasks WHERE id = ?', [req.params.id], (err, row) => {
      if (err) return res.status(500).json({ error: 'Blad serwera' });
      if (!row) return res.status(404).json({ error: 'Not found' });
      if (row.nick !== req.user.nick) return res.status(403).json({ error: 'Forbidden' });
      return runUpdate();
    });
    return;
  }

  return runUpdate();
});

app.delete('/api/tasks/:id', (req, res) => {
  const runDelete = () => {
    db.run('DELETE FROM tasks WHERE id = ?', [req.params.id], function (err) {
      if (err) return res.status(500).json({ error: 'Blad serwera' });
      return res.json({ deleted: this.changes });
    });
  };

  if (tokenSecret && req.user?.nick) {
    db.get('SELECT nick FROM tasks WHERE id = ?', [req.params.id], (err, row) => {
      if (err) return res.status(500).json({ error: 'Blad serwera' });
      if (!row) return res.status(404).json({ error: 'Not found' });
      if (row.nick !== req.user.nick) return res.status(403).json({ error: 'Forbidden' });
      return runDelete();
    });
    return;
  }

  return runDelete();
});

// Password reset (mock)
app.post('/api/reset', (_req, res) => {
  res.json({ ok: true });
});

app.listen(5000, () => {
  console.log('Backend API on http://localhost:5000');
});
