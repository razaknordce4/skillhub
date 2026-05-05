const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "skillbridge_super_secret_key_123";

app.use(cors());
app.use(express.json());

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient role permissions" });
    }
    next();
  };
};

// --- Seed Initial Users ---
app.post("/seed", async (req, res) => {
  try {
    const roles = ["ADMIN", "PROGRAMME_MANAGER", "MONITORING_OFFICER", "INSTITUTION", "TRAINER"];
    const usersCreated = [];
    for (let role of roles) {
      const email = `${role.toLowerCase()}@skillbridge.com`;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing) {
        const password = await bcrypt.hash("password123", 10);
        const user = await prisma.user.create({
          data: {
            email,
            password,
            name: `${role} User`,
            role,
            institution_id: role === "INSTITUTION" || role === "TRAINER" ? 1 : null
          }
        });
        usersCreated.push(user);
      }
    }
    res.json({ message: "Seed successful", users: usersCreated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Auth Endpoints ---
app.post("/auth/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || "STUDENT";
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
        institution_id: userRole === "INSTITUTION" || userRole === "TRAINER" ? 1 : null // Default mock institution for prototype
      }
    });

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email, institution_id: user.institution_id }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: user.id, name: user.name, role: user.role, institution_id: user.institution_id } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email, institution_id: user.institution_id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, institution_id: user.institution_id } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- User Management (Programme Manager, Admin & Institution) ---
app.post("/users", authenticateToken, authorizeRole("PROGRAMME_MANAGER", "ADMIN", "INSTITUTION"), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (req.user.role === "INSTITUTION" && role !== "TRAINER" && role !== "MONITORING_OFFICER") {
      return res.status(403).json({ message: "Institutions can only create Trainers and Monitoring Officers" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "User with this email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    let instId = null;
    if (req.user.role === "INSTITUTION") {
      instId = req.user.institution_id; // Assign to their own institution
    } else if (role === "INSTITUTION" || role === "TRAINER") {
      instId = 1; // Default mock institution for PM/Admin creating them
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role,
        institution_id: instId
      }
    });
    res.status(201).json({ message: "User created successfully", user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/users", authenticateToken, async (req, res) => {
  try {
    const { role } = req.query;
    const where = {};
    if (role) where.role = role.toUpperCase();
    
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, institution_id: true, created_at: true }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Notifications Endpoints ---
app.get("/notifications", authenticateToken, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' }
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/notifications", authenticateToken, async (req, res) => {
  try {
    const { user_id, title, message } = req.body;
    const notification = await prisma.notification.create({
      data: {
        user_id: parseInt(user_id),
        title,
        message
      }
    });
    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Marks Endpoints ---
app.get("/marks", authenticateToken, async (req, res) => {
  try {
    let where = {};
    if (req.user.role === "STUDENT") {
      where.student_id = req.user.id;
    } else if (req.user.role === "TRAINER") {
      const { batch_id } = req.query;
      if (batch_id) where.batch_id = parseInt(batch_id);
    }
    
    const marks = await prisma.mark.findMany({
      where,
      include: { student: { select: { name: true } }, batch: { select: { name: true } } },
      orderBy: { created_at: 'desc' }
    });
    res.json(marks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/marks", authenticateToken, authorizeRole("TRAINER", "ADMIN"), async (req, res) => {
  try {
    const { student_id, batch_id, exam_title, score } = req.body;
    const mark = await prisma.mark.create({
      data: {
        student_id: parseInt(student_id),
        batch_id: parseInt(batch_id),
        exam_title,
        score: parseInt(score)
      }
    });
    res.status(201).json(mark);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Batches Endpoints ---
app.post("/batches", authenticateToken, authorizeRole("TRAINER", "INSTITUTION"), async (req, res) => {
  try {
    const { name, institution_id } = req.body;
    const batch = await prisma.batch.create({
      data: {
        name,
        institution_id: parseInt(institution_id)
      }
    });

    if (req.user.role === "TRAINER") {
      await prisma.batchTrainer.create({
        data: {
          batch_id: batch.id,
          trainer_id: req.user.id
        }
      });
    }
    
    res.status(201).json(batch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/batches", authenticateToken, async (req, res) => {
  try {
    let batches;
    if (req.user.role === "STUDENT") {
      const studentBatches = await prisma.batchStudent.findMany({ where: { student_id: req.user.id }, include: { batch: true } });
      batches = studentBatches.map(sb => sb.batch);
    } else if (req.user.role === "TRAINER") {
      const trainerBatches = await prisma.batchTrainer.findMany({ where: { trainer_id: req.user.id }, include: { batch: true } });
      batches = trainerBatches.map(tb => tb.batch);
    } else if (req.user.role === "INSTITUTION") {
      batches = await prisma.batch.findMany({ where: { institution_id: req.user.id } });
    } else {
      batches = await prisma.batch.findMany();
    }
    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/batches/:id/invite", authenticateToken, authorizeRole("TRAINER"), async (req, res) => {
  try {
    const { id } = req.params;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteLink = `${clientUrl}/join/${id}`;
    res.json({ inviteLink });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/batches/:id/join", authenticateToken, authorizeRole("STUDENT"), async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.batchStudent.findUnique({
      where: { batch_id_student_id: { batch_id: parseInt(id), student_id: req.user.id } }
    });
    
    if (existing) return res.status(400).json({ message: "Already joined this batch" });

    const joined = await prisma.batchStudent.create({
      data: {
        batch_id: parseInt(id),
        student_id: req.user.id
      }
    });
    res.status(200).json({ message: "Successfully joined batch", joined });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Sessions Endpoints ---
app.post("/sessions", authenticateToken, authorizeRole("TRAINER"), async (req, res) => {
  try {
    const { batch_id, title, date, start_time, end_time } = req.body;
    
    const sessionDate = new Date(date);
    // Sessions last 7 days? Or JWT is 7 days? "session need to be for 7 days". 
    // We can add a 7-day validity logic if needed. For now just create the session.
    
    const session = await prisma.session.create({
      data: {
        batch_id: parseInt(batch_id),
        trainer_id: req.user.id,
        title,
        date: sessionDate,
        start_time,
        end_time
      }
    });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/sessions", authenticateToken, async (req, res) => {
  try {
    let sessions = [];
    if (req.user.role === "STUDENT") {
      const studentBatches = await prisma.batchStudent.findMany({ where: { student_id: req.user.id } });
      const batchIds = studentBatches.map(b => b.batch_id);
      sessions = await prisma.session.findMany({ where: { batch_id: { in: batchIds } }, include: { batch: true } });
    } else if (req.user.role === "TRAINER") {
      sessions = await prisma.session.findMany({ where: { trainer_id: req.user.id }, include: { batch: true } });
    } else {
      sessions = await prisma.session.findMany({ include: { batch: true } });
    }
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/sessions/:id/attendance", authenticateToken, authorizeRole("TRAINER", "INSTITUTION", "PROGRAMME_MANAGER", "ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const attendance = await prisma.attendance.findMany({
      where: { session_id: parseInt(id) },
      include: { student: { select: { id: true, name: true, email: true } } }
    });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Attendance Endpoints ---
app.post("/attendance/mark", authenticateToken, authorizeRole("STUDENT"), async (req, res) => {
  try {
    const { session_id, status } = req.body;
    
    // Check if within 7 days "session need to be for 7 days"
    const session = await prisma.session.findUnique({ where: { id: parseInt(session_id) } });
    if (!session) return res.status(404).json({ message: "Session not found" });

    const sessionDate = new Date(session.date).getTime();
    const now = new Date().getTime();
    const daysDifference = (now - sessionDate) / (1000 * 3600 * 24);

    if (daysDifference > 7) {
      return res.status(400).json({ message: "Cannot mark attendance after 7 days" });
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        session_id_student_id: {
          session_id: parseInt(session_id),
          student_id: req.user.id
        }
      },
      update: { status: status.toUpperCase() },
      create: {
        session_id: parseInt(session_id),
        student_id: req.user.id,
        status: status.toUpperCase()
      }
    });

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Summaries & Dashboards ---
app.get("/batches/:id/summary", authenticateToken, authorizeRole("INSTITUTION", "PROGRAMME_MANAGER", "ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const sessions = await prisma.session.findMany({ where: { batch_id: parseInt(id) } });
    const sessionIds = sessions.map(s => s.id);
    
    const attendances = await prisma.attendance.findMany({
      where: { session_id: { in: sessionIds } }
    });

    const presentCount = attendances.filter(a => a.status === "PRESENT").length;
    const totalCount = attendances.length;

    res.json({
      batch_id: id,
      total_sessions: sessions.length,
      total_attendances_marked: totalCount,
      present_count: presentCount,
      attendance_rate: totalCount > 0 ? (presentCount / totalCount) * 100 : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/institutions/:id/summary", authenticateToken, authorizeRole("PROGRAMME_MANAGER", "ADMIN", "INSTITUTION"), async (req, res) => {
  try {
    const { id } = req.params;
    const instId = parseInt(id);
    
    if (isNaN(instId)) {
      return res.status(400).json({ message: "Invalid institution ID" });
    }

    // Security check for INSTITUTION role
    if (req.user.role === "INSTITUTION" && req.user.id !== instId) {
      return res.status(403).json({ message: "Forbidden: You can only view your own institution summary" });
    }

    const batches = await prisma.batch.findMany({ where: { institution_id: instId } });
    const batchIds = batches.map(b => b.id);
    
    const sessions = await prisma.session.findMany({ where: { batch_id: { in: batchIds } } });
    res.json({ total_batches: batches.length, total_sessions: sessions.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/programme/summary", authenticateToken, authorizeRole("PROGRAMME_MANAGER", "ADMIN"), async (req, res) => {
  try {
    const totalStudents = await prisma.user.count({ where: { role: "STUDENT" } });
    const totalTrainers = await prisma.user.count({ where: { role: "TRAINER" } });
    const totalInstitutions = await prisma.user.count({ where: { role: "INSTITUTION" } });
    const totalSessions = await prisma.session.count();
    
    const attendances = await prisma.attendance.findMany();
    const presentCount = attendances.filter(a => a.status === "PRESENT").length;

    res.json({
      total_students: totalStudents,
      total_trainers: totalTrainers,
      total_institutions: totalInstitutions,
      total_sessions: totalSessions,
      overall_attendance_rate: attendances.length > 0 ? (presentCount / attendances.length) * 100 : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/monitoring/summary", authenticateToken, authorizeRole("MONITORING_OFFICER"), async (req, res) => {
  try {
    const instId = req.user.institution_id;
    if (!instId) return res.status(400).json({ message: "No institution assigned to this officer" });

    const batches = await prisma.batch.findMany({ where: { institution_id: instId } });
    const batchIds = batches.map(b => b.id);
    
    const sessions = await prisma.session.findMany({ where: { batch_id: { in: batchIds } } });
    const sessionIds = sessions.map(s => s.id);

    const attendances = await prisma.attendance.findMany({ where: { session_id: { in: sessionIds } } });
    const presentCount = attendances.filter(a => a.status === "PRESENT").length;

    res.json({
      total_batches: batches.length,
      total_sessions: sessions.length,
      overall_attendance_rate: attendances.length > 0 ? (presentCount / attendances.length) * 100 : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/users/me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, institution_id: true }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});