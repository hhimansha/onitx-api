# OnitX API

Production-ready REST API for the OnitX task management system, built with Express, TypeScript, Prisma ORM, and MySQL.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v18+ |
| Framework | Express |
| Language | TypeScript |
| ORM | Prisma |
| Database | MySQL 8+ |
| Validation | Zod |
| Auth | JWT (7-day tokens) + bcrypt |
| Email | Nodemailer (Gmail SMTP) |

## Prerequisites

- Node.js v18+
- MySQL 8+
- npm

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd onitx-api
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `PORT` | Server port (default: `5000`) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `FRONTEND_URL` | Frontend base URL (used in password reset emails) |
| `EMAIL_USER` | Gmail address for sending emails |
| `EMAIL_PASSWORD` | Gmail app password (not your account password) |

**Example `DATABASE_URL`:**
```
DATABASE_URL=mysql://user:password@localhost:3306/onitx
```

### 3. Run database migrations

```bash
npm run db:generate      # generate Prisma client
npm run db:migrate       # apply migrations (dev)
```

### 4. Seed the database

Creates a default admin account.

```bash
npm run db:seed
```

Default admin credentials:
```
Email:    admin@onitx.com
Password: Admin@123
```

### 5. Start the server

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

---

## API Reference

Base URL: `http://localhost:5000/api`

All protected endpoints require:
```
Authorization: Bearer <token>
```

---

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register a new user |
| POST | `/auth/login` | No | Login and receive JWT |
| GET | `/auth/me` | Yes | Get current user profile |
| POST | `/auth/forgot-password` | No | Send password reset email |
| POST | `/auth/reset-password` | No | Reset password using token |

---

### Users

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/users` | Yes | Admin | List all users with task stats |
| GET | `/users/options` | Yes | Any | List users for dropdowns `[{ id, name }]` |
| GET | `/users/me` | Yes | Any | Get own profile |
| PUT | `/users/me` | Yes | Any | Update own profile |

**`GET /users` query params:**

| Param | Values | Default |
|---|---|---|
| `q` | search string | — |
| `sortBy` | `name` `email` `createdAt` `taskCount` | `createdAt` |
| `sortOrder` | `asc` `desc` | `desc` |

---

### Tasks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/tasks` | Yes | List tasks (scoped by role) |
| POST | `/tasks` | Yes | Create a task |
| GET | `/tasks/:id` | Yes | Get a task |
| PUT | `/tasks/:id` | Yes | Update a task |
| DELETE | `/tasks/:id` | Yes | Delete a task |

**`GET /tasks` query params:**

| Param | Values | Description |
|---|---|---|
| `q` | search string | Search title and description |
| `status` | `OPEN` `IN_PROGRESS` `TESTING` `DONE` | Filter by status |
| `priority` | `LOW` `MEDIUM` `HIGH` | Filter by priority |
| `assignedToId` | user UUID | Filter by assigned user |

**Access rules:**
- **Admin** — sees and manages all tasks
- **User** — sees only tasks they created or are assigned to

---

### Comments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/tasks/:taskId/comments` | Yes | List comments on a task |
| POST | `/tasks/:taskId/comments` | Yes | Add a comment |
| PUT | `/tasks/:taskId/comments/:id` | Yes | Edit a comment (author or admin) |
| DELETE | `/tasks/:taskId/comments/:id` | Yes | Delete a comment (author or admin) |

---

### Dashboard

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/dashboard/stats` | Yes | Get dashboard stats and chart data |

Response shape:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUsers": 12,
      "totalTasks": 56,
      "openTasks": 8,
      "inProgressTasks": 15,
      "testingTasks": 6,
      "doneTasks": 27,
      "overdueTasks": 4,
      "tasksDueToday": 3,
      "tasksDueThisWeek": 9,
      "highPriorityTasks": 12,
      "mediumPriorityTasks": 21,
      "lowPriorityTasks": 23
    },
    "charts": {
      "statusBreakdown": [{ "status": "OPEN", "label": "Open", "count": 8 }],
      "priorityBreakdown": [{ "priority": "HIGH", "label": "High", "count": 12 }],
      "tasksCreatedByDay": [{ "date": "2026-06-29", "count": 3 }],
      "dueTimeline": [{ "label": "Overdue", "count": 4 }],
      "topAssignees": [{ "id": "...", "name": "Jane", "profileImage": null, "taskCount": 8 }]
    }
  }
}
```

`totalUsers` and `topAssignees` are only present for Admin role. All stats are scoped to the authenticated user's accessible tasks for regular users.

---

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Service health check |

---

## Data Model

```
User
  id, name, email, password, role (ADMIN | USER)
  designation, profileImage
  resetToken, resetTokenExpiry

Task
  id, title, description
  priority (LOW | MEDIUM | HIGH)
  status (OPEN | IN_PROGRESS | TESTING | DONE)
  dueDate, createdById

TaskAssignment (join table)
  taskId, userId

Comment
  id, content, taskId, userId
```

---

## Project Structure

```
onitx-api/
├── src/
│   ├── app.ts                  # Express app (CORS, middleware, routes)
│   ├── server.ts               # Entry point
│   ├── controllers/            # Request handlers
│   ├── services/               # Business logic
│   ├── routes/                 # Route definitions
│   ├── middleware/             # auth, authorize, error handler
│   ├── validators/             # Zod schemas
│   ├── utils/                  # jwt, email, prisma, response helpers
│   └── types/                  # TypeScript types
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Migration history
│   └── seed.ts                 # Database seeder
├── .env.example
└── tsconfig.json
```

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Run migrations (dev) |
| `npm run db:migrate:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed default admin account |
| `npm run db:studio` | Open Prisma Studio GUI |

## Deploying to Production

1. Set all environment variables on the server
2. Run `npm run db:migrate:deploy` to apply migrations
3. Run `npm run build` then `npm start`

> Do **not** run `db:seed` in production after the initial setup — it will attempt to recreate the admin account.
