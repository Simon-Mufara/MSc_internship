# MSc Dashboard Platform

A web-based collaboration dashboard for Simon Mufara's MSc Computational Health Informatics programme (UCT) and NGS Internship (UFS). It connects three user roles — Student, Conveyor, and Supervisor — through shared messaging, a calendar, progress tracking, assignments, and resource management.

---

## Architecture

```
Browser (Frontend)
  ├─ public/index.html      — HTML markup
  ├─ public/css/styles.css  — All styling
  ├─ public/js/api.js       — API client (fetch wrappers + JWT handling)
  └─ public/js/app.js       — UI logic, view rendering, event handling
         │
         │  HTTP / JSON  (JWT in Authorization header)
         ▼
Express.js Server (Backend)
  ├─ server/server.js       — App entry point, middleware, route mounting
  ├─ server/db.js           — SQLite connection, schema init, async helpers
  ├─ server/middleware/auth.js — JWT verification middleware
  └─ server/routes/
       ├─ auth.js           — POST /api/auth/login, /api/auth/logout
       ├─ events.js         — CRUD /api/events
       ├─ assignments.js    — CRUD /api/assignments
       ├─ messages.js       — CRUD /api/messages
       ├─ progress.js       — GET/PUT /api/progress
       └─ resources.js      — CRUD /api/resources
         │
         │  SQL (sqlite3 async/await)
         ▼
SQLite Database  (server/dashboard.db)
  ├─ users        — credentials (bcrypt-hashed passwords), roles
  ├─ events       — calendar entries
  ├─ assignments  — tasks with due dates and statuses
  ├─ messages     — direct messages between users
  ├─ progress     — student progress (PTY6027F, PTY6028F) + supervisor feedback
  └─ resources    — metadata for uploaded learning materials
```

---

## Authentication & Authorization

1. The client POSTs credentials to `/api/auth/login`.
2. The server validates the password with **bcryptjs** and, on success, issues a signed **JWT** (7-day expiry) containing the user's username and role.
3. The JWT is stored client-side and sent as a `Bearer` token on every subsequent API request.
4. The `auth` middleware in `server/middleware/auth.js` verifies the token on all protected routes. Requests with missing or invalid tokens receive `401 Unauthorized`.
5. Role checks inside route handlers restrict certain actions by role (e.g. only Conveyor/Supervisor can create events).

---

## Database Layer

`server/db.js` wraps the callback-based `sqlite3` driver in three Promise helpers used throughout the routes:

| Helper | Usage |
|---|---|
| `runAsync(sql, params)` | INSERT / UPDATE / DELETE |
| `getAsync(sql, params)` | SELECT single row |
| `allAsync(sql, params)` | SELECT multiple rows |

On first startup `initDatabase()` creates all tables and seeds three default users if they do not already exist.

---

## User Roles & Capabilities

| Feature | Student | Conveyor | Supervisor |
|---|---|---|---|
| View calendar | ✅ | ✅ | ✅ |
| Create/manage events | — | ✅ | ✅ |
| Send & receive messages | ✅ | ✅ | ✅ |
| Update own progress | ✅ | — | — |
| Add supervisor feedback | — | — | ✅ |
| Create/manage assignments | — | ✅ | ✅ |
| Upload/manage resources | — | ✅ | ✅ |

---

## Key Features

### Messaging
- Direct messages stored in the `messages` table with `sender`, `recipient`, and `timestamp`.
- Each user can view their conversation thread with any other user.
- The frontend polls the API periodically so new messages appear automatically.

### Calendar
- Events have a `type` (assessment, deadline, work, class), a date range, and an optional reminder flag.
- All authenticated users see the same events; Conveyor and Supervisor can create, edit, and delete them.

### Progress Tracking
- One progress record per student (upserted via `INSERT OR REPLACE`).
- Stores course completion percentages for PTY6027F and PTY6028F, a monthly update text, and supervisor feedback.
- The student updates their own progress; the supervisor adds feedback to the same record.

### Assignments
- Created by Conveyor or Supervisor with a title, description, and due date.
- Status transitions: `active` → `completed` or `overdue`.

### Resources
- Metadata (name, type, size, uploader) stored in the database.
- Types: `lectures`, `recordings`, `materials`.

---

## Quick Start

```bash
# 1. Install dependencies
cd server
npm install

# 2. Create environment file
cp .env.example .env   # edit JWT_SECRET for production

# 3. Start server
npm start
# → http://localhost:5000
```

**Default credentials**

| Role | Username | Password |
|---|---|---|
| Student | `simon` | `simon2026` |
| Conveyor | `conveyor` | `conveyor2026` |
| Supervisor | `dalvie` | `dalvie2026` |

---

## Production Notes

- Set a strong, random `JWT_SECRET` in `.env`.
- Set `NODE_ENV=production`.
- Enable HTTPS/SSL on your hosting platform.
- The SQLite database file (`server/dashboard.db`) is excluded from Git via `.gitignore`. Back it up separately in production.
