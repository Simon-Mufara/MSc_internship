const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'dashboard.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('✅ Connected to SQLite database');
});

db.configure('busyTimeout', 5000);

function initDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('student', 'conveyor', 'supervisor')),
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('assessment', 'deadline', 'work', 'class')),
        date TEXT NOT NULL,
        end_date TEXT,
        description TEXT,
        created_by TEXT NOT NULL,
        reminder INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(username)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        due_date TEXT NOT NULL,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'overdue')),
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(username)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT NOT NULL,
        recipient TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender) REFERENCES users(username),
        FOREIGN KEY (recipient) REFERENCES users(username)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE NOT NULL,
        monthly_update TEXT,
        pty6027 INTEGER,
        pty6028 INTEGER,
        supervisor_feedback TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(username)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('lectures', 'recordings', 'materials')),
        size REAL,
        data_url TEXT,
        mime_type TEXT,
        uploaded_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(username)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS portfolio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        entry_date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author) REFERENCES users(username)
      )
    `, () => {
      initializeDefaultUsers();
    });
  });
}

function initializeDefaultUsers() {
  const users = [
    { username: 'simon', role: 'student', password: 'simon2026' },
    { username: 'dalvie', role: 'conveyor', password: 'dalvie2026' },
    { username: 'martin', role: 'supervisor', password: 'martin2026' }
  ];

  users.forEach(user => {
    const passwordHash = bcrypt.hashSync(user.password, 10);
    db.run(
      `INSERT INTO users (username, role, password_hash)
       VALUES (?, ?, ?)
       ON CONFLICT(username) DO UPDATE SET
         role = excluded.role,
         password_hash = excluded.password_hash`,
      [user.username, user.role, passwordHash],
      (err) => {
        if (err) console.error(`Error creating user ${user.username}:`, err.message);
        else console.log(`✅ User ${user.username} ready`);
      }
    );
  });

  const examEvents = [
    // Weekly Classes & Lectures (repeating pattern)
    {
      title: 'IBS6024F Lecture - Biocomputing',
      type: 'class',
      date: '2026-05-13',
      description: 'Time: 3:00pm-5:00pm | Venue: Online (Zoom) | Type: Online Class | Instructor: Hocine Bendou'
    },
    {
      title: 'IBS6025F Lecture - Bioinformatic Programming',
      type: 'class',
      date: '2026-05-14',
      description: 'Time: 3:00pm-5:00pm | Venue: Online (Zoom) | Type: Online Class | Instructor: Shareefa Dalvie'
    },
    {
      title: 'IBS6026F Lecture - Machine Learning',
      type: 'class',
      date: '2026-05-15',
      description: 'Time: 3:00pm-5:00pm | Venue: Online (Zoom) | Type: Online Class | Instructor: Musalula Sinkala'
    },
    {
      title: 'PTY6027F Lecture - Omics Data Mining',
      type: 'class',
      date: '2026-05-13',
      description: 'Time: 3:00pm-5:00pm | Venue: Online (Zoom) | Type: Online Class | Instructor: Shareefa Dalvie'
    },
    {
      title: 'PTY6028F Lecture - Omics Data Generation',
      type: 'class',
      date: '2026-05-20',
      description: 'Time: 3:00pm-5:00pm | Venue: Online (Zoom) | Type: Online Class | Instructor: Shareefa Dalvie'
    },
    {
      title: 'Supervision Session - Simon',
      type: 'class',
      date: '2026-05-16',
      description: 'Time: 3:00pm-4:00pm | Venue: Online (Teams) | Type: Online Class | Supervisor: Martin (UFS)'
    },
    {
      title: 'Lab Session - Bioinformatics Tools',
      type: 'class',
      date: '2026-05-22',
      description: 'Time: 3:00pm-5:00pm | Venue: Online (Zoom) | Type: Online Class | Instructor: Dalvie'
    },
    // Exam Events
    {
      title: 'IBS6024F - Biocomputing',
      type: 'assessment',
      date: '2026-06-01',
      description: 'Time: 9:00am-12:00pm | Venue: Postgrad Room 1 | Type: Computer and paper-based | Invigilator: Hocine Bendou'
    },
    {
      title: 'IBS6025F - Bioinformatic Programming with Python',
      type: 'assessment',
      date: '2026-06-03',
      description: 'Time: 9:00am-12:00pm | Venue: Postgrad Room 1 | Type: Computer and paper-based | Invigilators: Hocine Bendou, Shareefa Dalvie'
    },
    {
      title: 'IBS6026F - Machine Learning and Biomedical Data Science',
      type: 'assessment',
      date: '2026-06-05',
      description: 'Time: 9:00am-12:00pm | Venue: Postgrad Room 1 | Type: Computer-based | Invigilator: Musalula Sinkala'
    },
    {
      title: 'PTY6028F - Omics Data Generation',
      type: 'assessment',
      date: '2026-06-08',
      description: 'Time: 9:00am-12:00pm | Venue: Postgrad Room 1 | Type: Paper-based | Invigilator: Shareefa Dalvie'
    },
    {
      title: 'PTY6027F - Omics Data Mining',
      type: 'assessment',
      date: '2026-06-10',
      description: 'Time: 9:00am-12:00pm | Venue: Postgrad Room 1 | Type: Paper-based | Invigilator: Shareefa Dalvie'
    },
    {
      title: 'PTY6029F - Population Genomics',
      type: 'assessment',
      date: '2026-06-12',
      description: 'Time: 9:00am-12:00pm | Venue: Postgrad Room 1 | Type: Paper-based | Invigilator: Shareefa Dalvie'
    }
  ];

  db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_events_title_date
    ON events(title, date)
  `);

  examEvents.forEach(event => {
    db.run(
      `INSERT OR IGNORE INTO events (title, type, date, description, created_by, reminder)
       VALUES (?, ?, ?, ?, ?, ?)` ,
      [event.title, event.type, event.date, event.description, 'dalvie', 0],
      (err) => {
        if (err) console.error(`Error creating exam event ${event.title}:`, err.message);
      }
    );
  });
}

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

module.exports = { db, initDatabase, runAsync, getAsync, allAsync };
