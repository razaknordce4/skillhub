  SkillHub – Attendance Management System

SkillHub is a high-performance, role-based attendance management system designed for large-scale educational and training programmes. It provides a seamless interface for students, trainers, and administrators to track engagement, manage batches, and analyze performance in real-time.

---

   Live Deployment

| Component | URL |
| :--- | :--- |
| **Frontend** | [https://skillhub-six-ebon.vercel.app/](https://skillhub-six-ebon.vercel.app/) |
| **Backend API** | [https://skillhub-ycrv.onrender.com](https://skillhub-ycrv.onrender.com) |
| **Email Service** | Powered by [Resend](https://resend.com) |

---

   Test Accounts

Use the following credentials to explore the system's role-based features. All passwords are **password123**. 
To initialize these accounts on a fresh setup, call the `/seed` endpoint via the backend URL.

| Role | Email | Password | Dashboard Access |
| :--- | :--- | :--- | :--- |
| **Super Admin** | admin@skillbridge.com | password123 | Full System Control |
| **Programme Manager** | programme_manager@skillbridge.com | password123 | Aggregated Analytics |
| **Institution Admin** | institution@skillbridge.com | password123 | Batch & Trainer Management |
| **Trainer** | trainer@skillbridge.com | password123 | Session & Attendance Control |
| **Student** | student@skillbridge.com | password123 | Attendance Self-Marking |

---

   Tech Stack & Decisions

    1. Frontend: React + Vite + Tailwind CSS
*   **React 19**: Leveraged for its declarative UI and efficient rendering.
*   **Tailwind CSS v4**: Used for rapid, modern styling with a focus on responsiveness and performance.
*   **Framer Motion**: Integrated for smooth micro-animations and transitions.
*   **React Router v7**: Handles complex role-based routing and protected layouts.

    2. Backend: Node.js + Express + Prisma
*   **Express**: Provides a lightweight and flexible REST API structure.
*   **Prisma ORM**: Chosen for its type-safe database queries and seamless migration management.
*   **JWT & Bcrypt**: Ensures secure authentication and password hashing.
*   **Resend**: Implemented for reliable transactional emails (OTP delivery), replacing less reliable SMTP solutions.

    3. Database: PostgreSQL (Neon)
*   **Neon DB**: Serverless PostgreSQL for scalable and fast data access.
*   **Relational Model**: Used to handle complex many-to-many relationships between Students, Trainers, and Batches.

---

   Schema Design Choice
The database is architected around a central **User** model with distinct roles. Key design choices include:
*   **Many-to-Many Relationships**: Batches are linked to multiple Trainers and Students via explicit join tables (BatchTrainer, BatchStudent) for maximum flexibility.
*   **Session-Based Attendance**: Instead of a simple present/absent flag, attendance is tied to specific **Sessions**, allowing for granular tracking over time.
*   **Hierarchical Scoping**: Data visibility is strictly enforced based on the role (e.g., Institution Admins only see their own students and trainers).

---

   Local Setup Instructions

    Prerequisites
*   Node.js (v18+)
*   PostgreSQL (Local or Cloud instance)

    1. Clone and Install
1.  Clone the repository: `git clone https://github.com/razaknordce4/skillhub.git`
2.  Navigate to the project root: `cd Institute`

    2. Backend Configuration
1.  Navigate to the server directory: `cd server`
2.  Install dependencies: `npm install`
3.  Create a **.env** file with the following variables:

| Variable | Description | Value |
| :--- | :--- | :--- |
| **PORT** | Server Port | 5000 |
| **DATABASE_URL** | PostgreSQL Connection String | postgresql://neondb_owner:npg_AwEW8bFfZ0ls@ep-crimson-firefly-amienjqy.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require |
| **JWT_SECRET** | JWT Secret Key | skillbridge_super_secret_key_123 |
| **RESEND_API_KEY** | Resend API Key | re_i7oNM3Dd_KabXSvvSYofsCYDoPN19XNDa |

4.  Push schema and generate client: `npx prisma db push`
5.  Start the server: `npm start`

    3. Frontend Configuration
1.  Navigate to the client directory: `cd ../client`
2.  Install dependencies: `npm install`
3.  Create a **.env** file with the following variable:

| Variable | Description | Value |
| :--- | :--- | :--- |
| **VITE_API_URL** | Backend API URL | http://localhost:5000 |

4.  Start development server: `npm run dev`

---

   Project Status

| Feature | Status | Notes |
| :--- | :--- | :--- |
| **Auth System** | Fully Working | JWT-based login, signup, and OTP password reset. |
| **Role Dashboards** | Fully Working | Tailored views for all 5 major roles (and MO). |
| **Batch Management** | Fully Working | Creation, assignment, and invite links. |
| **Attendance Tracking** | Fully Working | Trainer-led session creation and Student self-marking. |
| **Email System** | Fully Working | Integrated with Resend for high deliverability. |
| **Real-time Notifs** | Partially Done | Uses DB-based persistence; UI updates on refresh/poll. |
| **Profile Images** | Skipped | Using dynamic initials to focus on core logical flow. |

---

   Lessons Learned
**Broken and Fixed**: Initially, we used Gmail SMTP for OTP emails, but it consistently failed in the Render deployment environment due to authentication blocks and modern security restrictions. We pivoted to **Resend API**, which not only resolved the delivery issue but also provided better analytics and a cleaner implementation for transactional emails.

**One thing I'd do differently**: With more time, I would implement **WebSockets (Socket.io)** for truly real-time notifications and live attendance updates, eliminating the need for manual refreshes when a trainer starts a session or marks attendance.

---
© 2026 SkillHub Programme
