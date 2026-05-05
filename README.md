# SkillBridge Attendance Management System

SkillBridge is a complete full-stack, role-based attendance management system built for a state-level skilling programme. It allows various stakeholders (Students, Trainers, Institutions, Programme Managers, and Monitoring Officers) to securely manage and track attendance across training batches and sessions.

## 🚀 Project Overview
The system provides tailored dashboards based on the user's role. It features secure JWT authentication, dynamic data loading, responsive UI built with Tailwind CSS, and a robust REST API powered by Express and Prisma.

## 🛠️ Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion, Axios, React Router v7
- **Backend**: Node.js, Express.js, Prisma ORM, JSON Web Tokens (JWT), Bcrypt
- **Database**: PostgreSQL (Development currently set to SQLite for seamless local prototyping)
- **Deployment Ready**: Frontend configured for Vercel; Backend configured for Render/Railway

## 🔐 Role Explanation
The application features Strict Role-Based Access Control (RBAC):
- **Student**: Logs in to self-mark attendance for active sessions (within a 7-day window).
- **Trainer**: Creates sessions, views attendance, and generates batch invite links.
- **Institution**: Manages batches and views attendance summaries.
- **Programme Manager**: Oversees all institutions and views aggregated attendance analytics.
- **Monitoring Officer**: Read-only access to programme-wide attendance rates.
- **Admin**: Global administrative access.

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm or yarn

### 1. Backend Setup
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   JWT_SECRET=skillbridge_super_secret_key_123
   ```
4. Initialize the database:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Start the server:
   ```bash
   node index.js
   ```

### 2. Frontend Setup
1. Navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `client` directory:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🔌 API Endpoints
- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Authenticate and receive JWT
- `POST /seed` - Seed test user accounts
- `POST /batches` - Create a batch
- `GET /batches` - List batches based on role
- `POST /batches/:id/invite` - Generate invite link
- `POST /batches/:id/join` - Join a batch
- `POST /sessions` - Create a session
- `GET /sessions` - List sessions
- `GET /sessions/:id/attendance` - View session attendance
- `POST /attendance/mark` - Mark attendance
- `GET /batches/:id/summary` - Batch analytics
- `GET /institutions/:id/summary` - Institution analytics
- `GET /programme/summary` - Global analytics

## 🧪 Test User Credentials
To test the pre-configured roles, first run the seeding endpoint:
**Run in terminal:** `curl -X POST http://localhost:5000/seed`

Then login with any of the following:
- **Admin**: `admin@skillbridge.com` / `password123`
- **Programme Manager**: `programme_manager@skillbridge.com` / `password123`
- **Monitoring Officer**: `monitoring_officer@skillbridge.com` / `password123`
- **Institution**: `institution@skillbridge.com` / `password123`
- **Trainer**: `trainer@skillbridge.com` / `password123`

You can register a new account on the frontend to automatically become a **Student**.

## 🌐 Deployment Steps
1. **Frontend (Vercel)**: Connect your GitHub repo to Vercel, set root directory to `client`, framework preset to `Vite`, and add `VITE_API_URL` to environment variables.
2. **Backend (Render/Railway)**: Connect repository, set root directory to `server`, start command to `node index.js`. Add `DATABASE_URL` and `JWT_SECRET` in environment variables.
3. Update `schema.prisma` provider to `postgresql` instead of `sqlite` before production deployment.
