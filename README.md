# ReachInbox - Full-Stack Email Job Scheduler

A production-grade email scheduling service with a React dashboard for scheduling, viewing, and managing bulk email sends at scale.

![Tech Stack](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Features Implemented](#-features-implemented)
- [Architecture Overview](#-architecture-overview)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Rate Limiting & Concurrency](#-rate-limiting--concurrency)
- [Persistence on Restart](#-persistence-on-restart)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **TypeScript** | Type-safe JavaScript |
| **Express.js** | REST API framework |
| **BullMQ** | Job queue with Redis |
| **Redis** | Queue persistence + rate limiting |
| **PostgreSQL (Neon)** | Primary database |
| **Drizzle ORM** | Type-safe database queries |
| **Passport.js** | Google OAuth authentication |
| **Nodemailer** | Email sending via Ethereal |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **Tailwind CSS v4** | Styling |
| **React Router** | Navigation |
| **Lucide React** | Icons |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **Docker** | Redis container |
| **Ethereal Email** | Fake SMTP for testing |

---

## ✅ Features Implemented

### Backend Features
| Feature | Status | Description |
|---------|--------|-------------|
| Email Scheduling API | ✅ | POST endpoint to schedule emails |
| BullMQ Delayed Jobs | ✅ | No cron - pure queue-based scheduling |
| Redis Persistence | ✅ | Jobs survive server restarts |
| Idempotency | ✅ | Unique job IDs prevent duplicates |
| Worker Concurrency | ✅ | Configurable via `WORKER_CONCURRENCY` |
| Rate Limiting | ✅ | Redis-backed hourly limits |
| Delay Between Emails | ✅ | 2-second minimum delay |
| Auto-Rescheduling | ✅ | Jobs delayed to next hour when limit hit |
| Ethereal SMTP | ✅ | Auto-generated test credentials |
| Google OAuth | ✅ | Real authentication |

### Frontend Features
| Feature | Status | Description |
|---------|--------|-------------|
| Google Login | ✅ | Real OAuth with avatar |
| Dashboard | ✅ | Scheduled + Sent tabs |
| Compose Email | ✅ | Rich text editor |
| CSV/TXT Upload | ✅ | Parse email lists |
| File Attachments | ✅ | Gmail-style chips |
| Schedule Picker | ✅ | Date/time selection |
| Email List View | ✅ | Search, filter, refresh |
| Email Detail View | ✅ | Star, archive, delete |
| Loading States | ✅ | Spinners |
| Empty States | ✅ | Helpful messages |
| Logout | ✅ | Session destruction |

---

## 🏗 Architecture Overview

### System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │  Login   │  │ Dashboard│  │ Compose  │  │ Scheduled/Sent Lists │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘ │
└───────┼─────────────┼─────────────┼────────────────────┼────────────┘
        │             │             │                    │
        ▼             ▼             ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Express.js)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  Auth Routes │  │ Email Routes │  │     Rate Limiter         │   │
│  │  /api/auth   │  │ /api/emails  │  │  (Redis Counters)        │   │
│  └──────────────┘  └──────┬───────┘  └──────────────────────────┘   │
└──────────────────────────┼──────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌────────────────┐  ┌──────────────┐
│  PostgreSQL  │  │     Redis      │  │   BullMQ     │
│   (Neon)     │  │   (Docker)     │  │   Worker     │
│              │  │                │  │              │
│ • users      │  │ • Job Queue    │  │ • Processes  │
│ • emails     │  │ • Rate Limits  │  │   delayed    │
│              │  │ • Sessions     │  │   jobs       │
└──────────────┘  └────────────────┘  └──────┬───────┘
                                             │
                                             ▼
                                    ┌──────────────┐
                                    │   Ethereal   │
                                    │    SMTP      │
                                    │  (Testing)   │
                                    └──────────────┘
```

### How Scheduling Works

1. **User schedules email** → Frontend calls `POST /api/emails/schedule`
2. **Backend stores in PostgreSQL** → Email record with `status: 'scheduled'`
3. **Job added to BullMQ** → Delayed job with calculated delay in milliseconds
4. **At scheduled time** → Worker picks up job from Redis queue
5. **Rate limit check** → Redis counter for current hour
6. **If allowed** → Send via Ethereal SMTP, update status to `sent`
7. **If rate limited** → Reschedule to next hour window

### Persistence on Restart

```
SERVER STOPS
     │
     ▼
┌─────────────────┐
│  Redis persists │ ← Jobs saved in Redis RDB/AOF
│  all BullMQ     │
│  delayed jobs   │
└─────────────────┘
     │
SERVER RESTARTS
     │
     ▼
┌─────────────────┐
│ Worker reconnects│ ← BullMQ auto-resumes
│ to Redis queue   │   processing delayed jobs
└─────────────────┘
     │
     ▼
  Emails send at
  correct scheduled time ✓
```

---

## 📦 Prerequisites

- **Node.js** 18+
- **Docker Desktop** (for Redis)
- **Neon PostgreSQL** account (free tier)
- **Google Cloud Console** project (for OAuth)

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/aryanrai97861/ReachInbox.git
cd ReachInbox
```

### 2. Start Redis (Docker)

```bash
docker-compose up -d
```

Verify it's running:
```bash
docker ps
# Should show: reachinbox-redis
```

### 3. Setup Backend

```bash
cd backend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your credentials (see Environment Variables section)

# Push database schema to Neon
npm run db:push

# Start backend server
npm run dev
```

Backend runs on: `http://localhost:3001`

### 4. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

### 5. Open the App

Navigate to `http://localhost:5173` and login with Google!

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Session
SESSION_SECRET=your-random-secret-key-min-32-chars

# Worker Configuration
WORKER_CONCURRENCY=5
MAX_EMAILS_PER_HOUR=200
EMAIL_DELAY_MS=2000

# Server
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### How to Get Credentials

#### Neon PostgreSQL
1. Go to [neon.tech](https://neon.tech)
2. Create a free project
3. Copy the connection string

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable "Google+ API"
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Add authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
6. Copy Client ID and Client Secret

#### Ethereal Email
- **Auto-generated!** No setup needed
- Credentials are logged to console when backend starts
- View sent emails at: https://ethereal.email

---

## ⚡ Rate Limiting & Concurrency

### Rate Limiting Strategy

| Parameter | Default | Config Variable |
|-----------|---------|-----------------|
| Emails per hour | 200 | `MAX_EMAILS_PER_HOUR` |
| Delay between emails | 2 seconds | `EMAIL_DELAY_MS` |
| Worker concurrency | 5 | `WORKER_CONCURRENCY` |

### How Rate Limiting Works

```typescript
// Redis key format: ratelimit:YYYY-MM-DD:HH
// Example: ratelimit:2024-01-13:22

// Before sending each email:
1. GET current count from Redis
2. If count < MAX_EMAILS_PER_HOUR → Send email, INCR counter
3. If count >= MAX_EMAILS_PER_HOUR → Reschedule to next hour
```

### Behavior Under Load (1000+ emails)

When 1000 emails are scheduled for the same time:

1. First 200 emails → Sent immediately (within rate limit)
2. Next 200 emails → Rescheduled to Hour+1
3. Next 200 emails → Rescheduled to Hour+2
4. And so on...

**Jobs are never dropped** - they're automatically delayed to the next available hour window.

### Thread Safety

- Rate limit counters use **Redis INCR** (atomic operation)
- Safe for multiple workers/instances
- BullMQ's limiter provides additional throttling

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | OAuth callback |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |

### Emails
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/emails/schedule` | Schedule emails |
| GET | `/api/emails/scheduled` | List scheduled emails |
| GET | `/api/emails/sent` | List sent emails |
| GET | `/api/emails/stats` | Queue statistics |

### Schedule Email Request
```json
POST /api/emails/schedule
{
  "subject": "Hello!",
  "body": "<b>HTML content</b>",
  "recipients": ["user1@example.com", "user2@example.com"],
  "scheduledAt": "2024-01-14T10:00:00.000Z",
  "delayBetweenEmails": 2000,
  "hourlyLimit": 200
}
```

---

## 📁 Project Structure

```
ReachInbox/
├── backend/
│   ├── src/
│   │   ├── config/          # Redis, Email config
│   │   ├── db/              # Drizzle schema & connection
│   │   ├── middleware/      # Auth middleware
│   │   ├── queues/          # BullMQ queue & worker
│   │   ├── routes/          # API routes
│   │   ├── services/        # Rate limiter
│   │   └── index.ts         # Entry point
│   ├── drizzle.config.ts
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   ├── types/           # TypeScript interfaces
│   │   └── App.tsx          # Router setup
│   └── package.json
│
├── docker-compose.yml       # Redis container
└── README.md
```

---

## 📝 Assumptions & Trade-offs

1. **Ethereal Email**: Used as per requirements - emails are NOT delivered to real mailboxes
2. **Single Sender**: Currently uses one Ethereal account (can be extended for multi-sender)
3. **Global Rate Limit**: Implemented globally, not per-sender (simpler for demo)
4. **In-Memory Session Backup**: Sessions stored in Redis for persistence
5. **Frontend Polling**: Dashboard refreshes every 5 seconds (could use WebSockets)

---

## 📄 License

MIT
