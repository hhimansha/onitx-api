# OnitX API

A production-ready Express REST API built with TypeScript, Prisma ORM, and MySQL.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: MySQL
- **Validation**: Zod
- **Auth**: JWT + bcrypt _(coming soon)_

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

Fill in `.env`:

| Variable           | Description                           |
| ------------------ | ------------------------------------- |
| `DATABASE_URL`     | MySQL connection string               |
| `JWT_SECRET`       | Secret key for signing JWTs           |
| `PORT`             | Port to run the server on (default 5000) |
| `ALLOWED_ORIGINS`  | Comma-separated CORS origins          |

**Example `DATABASE_URL`:**

```
DATABASE_URL=mysql://user:password@localhost:3306/onitx
```

### 3. Run database migrations

```bash
npm run db:generate   # generate Prisma client
npm run db:migrate    # apply migrations (dev)
```

### 4. Seed the database _(optional)_

```bash
npm run db:seed
```

### 5. Start the server

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

## API Reference

### Health

| Method | Endpoint      | Description        |
| ------ | ------------- | ------------------ |
| GET    | `/api/health` | Service health check |

**Response:**

```json
{ "success": true, "message": "OnitX API running" }
```

## Project Structure

```
onitx-api/
├── src/
│   ├── app.ts              # Express app setup (CORS, middleware, routes)
│   ├── server.ts           # Entry point — listens on PORT
│   ├── routes/             # Route definitions
│   ├── controllers/        # Request handlers
│   ├── services/           # Business logic
│   ├── middleware/         # Express middleware (error handler, auth, etc.)
│   ├── validators/         # Zod schemas
│   ├── utils/              # Shared helpers
│   └── types/              # TypeScript type definitions
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Database seeder
├── .env.example
└── tsconfig.json
```

## Scripts

| Script                | Description                              |
| --------------------- | ---------------------------------------- |
| `npm run dev`         | Start with hot reload (tsx watch)        |
| `npm run build`       | Compile TypeScript to `dist/`            |
| `npm start`           | Run compiled build                       |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:migrate`  | Run pending migrations (dev)             |
| `npm run db:migrate:deploy` | Apply migrations in production     |
| `npm run db:seed`     | Seed the database                        |
| `npm run db:studio`   | Open Prisma Studio GUI                   |
