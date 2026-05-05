// Trigger restart
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "skillbridge_super_secret_key_123";

// --- ID Generation Helper ---
const generateDisplayId = async (type, role) => {
  const prefixMap = {
    'STUDENT': 'STSB-',
    'TRAINER': 'TRSB-',
    'INSTITUTION': 'INSB-',
    'MONITORING_OFFICER': 'MOSB-',
    'PROGRAMME_MANAGER': 'PMSB-',
    'BATCH': 'BTSB-',
    'ADMIN': 'ADSB-'
  };

  const prefix = type === 'BATCH' ? 'BTSB-' : (prefixMap[role] || 'USSB-');
  
  let count;
  if (type === 'BATCH') {
    count = await prisma.batch.count();
  } else {
    count = await prisma.user.count({ where: { role } });
  }

  const nextNumber = (count + 1).toString().padStart(3, '0');
  return `${prefix}${nextNumber}`;
};

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
        const displayId = await generateDisplayId('USER', role);
        const user = await prisma.user.create({
          data: {
            email,
            password,
            name: `${role} User`,
            role,
            displayId,
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
    const displayId = await generateDisplayId('USER', userRole);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
        displayId,
        institution_id: null
      }
    });

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email, institution_id: user.institution_id, displayId: user.displayId }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, institution_id: user.institution_id, displayId: user.displayId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { institution: { select: { name: true } } }
    });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email, institution_id: user.institution_id, displayId: user.displayId }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, institution_id: user.institution_id, displayId: user.displayId, institution_name: user.institution?.name || null } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/profile/me", authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;

    const existing = await prisma.user.findFirst({ where: { email, NOT: { id: req.user.id } } });
    if (existing) return res.status(400).json({ message: "Email already in use by another account" });

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, email }
    });
    res.json({ message: "Profile updated successfully", user: { id: user.id, name: user.name, email: user.email, role: user.role, displayId: user.displayId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/auth/change-password", authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) return res.status(400).json({ message: "Incorrect old password" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- User Management (Programme Manager, Admin & Institution) ---
app.put("/users/:id", authenticateToken, authorizeRole("PROGRAMME_MANAGER", "ADMIN", "INSTITUTION"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, subject, institution_id } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (subject !== undefined) updateData.subject = subject;
    if (institution_id !== undefined) updateData.institution_id = institution_id ? parseInt(institution_id) : null;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    res.json({ message: "User updated successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/users/:id", authenticateToken, authorizeRole("PROGRAMME_MANAGER", "ADMIN", "INSTITUTION"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // Delete related records first to avoid foreign key constraint errors
    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { user_id: userId } }),
      prisma.mark.deleteMany({ where: { student_id: userId } }),
      prisma.attendance.deleteMany({ where: { student_id: userId } }),
      prisma.batchStudent.deleteMany({ where: { student_id: userId } }),
      prisma.batchTrainer.deleteMany({ where: { trainer_id: userId } }),
      // Note: Session deletion is tricky because it has attendance records. 
      // If we need to delete trainers with sessions, we'd need to delete session attendance first.
      prisma.user.delete({ where: { id: userId } })
    ]);

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/users", authenticateToken, authorizeRole("PROGRAMME_MANAGER", "ADMIN", "INSTITUTION"), async (req, res) => {
  try {
    const { name, email, password, role, subject, institution_id } = req.body;

    if (req.user.role === "INSTITUTION" && role !== "TRAINER" && role !== "MONITORING_OFFICER") {
      return res.status(403).json({ message: "Institutions can only create Trainers and Monitoring Officers" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "User with this email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const displayId = await generateDisplayId('USER', role);
    
    let instId = null;
    if (req.user.role === "INSTITUTION") {
      instId = req.user.id; 
    } else {
      instId = institution_id ? parseInt(institution_id) : null;
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role,
        displayId,
        institution_id: instId,
        subject: subject || null
      }
    });
    res.status(201).json({ message: "User created successfully", user: { id: user.id, name: user.name, email: user.email, role: user.role, displayId: user.displayId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/users/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        institution: { select: { name: true } },
        studentBatches: { include: { batch: true } },
        trainerBatches: { include: { batch: true } }
      }
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/users", authenticateToken, async (req, res) => {
  try {
    const { role, institution_id } = req.query;
    const where = {};
    if (role) where.role = role.toUpperCase();
    
    // Scoping for Institution role
    if (req.user.role === "INSTITUTION") {
      // Fetch students directly linked OR students in any batch belonging to this institution
      const instBatches = await prisma.batch.findMany({ where: { institution_id: req.user.id } });
      const batchIds = instBatches.map(b => b.id);
      
      where.OR = [
        { institution_id: req.user.id },
        { studentBatches: { some: { batch_id: { in: batchIds } } } }
      ];
    } else if (institution_id) {
      where.institution_id = parseInt(institution_id);
    }
    
    const users = await prisma.user.findMany({
      where,
      include: {
        institution: {
          select: { name: true }
        },
        studentBatches: {
          include: {
            batch: {
              include: {
                sessions: {
                  include: {
                    attendance: true
                  }
                }
              }
            }
          }
        },
        trainerBatches: {
          include: {
            batch: true
          }
        }
      }
    });

    const flattenedUsers = users.map(u => {
      let attendance_rate = 0;
      if (u.role === "STUDENT" && u.studentBatches.length > 0) {
        let totalSessions = 0;
        let presentSessions = 0;
        u.studentBatches.forEach(sb => {
          sb.batch.sessions.forEach(session => {
            totalSessions++;
            const att = session.attendance.find(a => a.student_id === u.id);
            if (att && att.status === "PRESENT") presentSessions++;
          });
        });
        attendance_rate = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;
      }

      return {
        ...u,
        institution_name: u.institution?.name || null,
        attendance_rate
      };
    });

    res.json(flattenedUsers);
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
    let { name, institution_id } = req.body;
    
    // Automatically attach institution_id if role is INSTITUTION
    if (req.user.role === "INSTITUTION") {
      institution_id = req.user.id;
    }

    if (!institution_id) return res.status(400).json({ message: "institution_id is required" });

    const displayId = await generateDisplayId('BATCH');
    const batch = await prisma.batch.create({
      data: {
        name,
        displayId,
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
      const studentBatches = await prisma.batchStudent.findMany({ where: { student_id: req.user.id }, include: { batch: { include: { trainers: { include: { trainer: true } } } } } });
      batches = studentBatches.map(sb => sb.batch);
    } else if (req.user.role === "TRAINER") {
      const trainerBatches = await prisma.batchTrainer.findMany({ where: { trainer_id: req.user.id }, include: { batch: true } });
      batches = trainerBatches.map(tb => tb.batch);
    } else if (req.user.role === "INSTITUTION") {
      batches = await prisma.batch.findMany({ 
        where: { institution_id: req.user.id },
        include: { 
          trainers: { include: { trainer: true } },
          _count: { select: { students: true } }
        }
      });
    } else {
      batches = await prisma.batch.findMany({
        include: { 
          trainers: { include: { trainer: true } },
          _count: { select: { students: true } }
        }
      });
    }
    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/batches/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const batch = await prisma.batch.findUnique({
      where: { id: parseInt(id) },
      include: {
        trainers: { include: { trainer: true } },
        students: { include: { student: true } },
        sessions: true
      }
    });
    if (!batch) return res.status(404).json({ message: "Batch not found" });
    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/batches/:id/assign-trainer", authenticateToken, authorizeRole("INSTITUTION", "ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const { trainer_id } = req.body;
    
    const assignment = await prisma.batchTrainer.upsert({
      where: { batch_id_trainer_id: { batch_id: parseInt(id), trainer_id: parseInt(trainer_id) } },
      update: {},
      create: { batch_id: parseInt(id), trainer_id: parseInt(trainer_id) }
    });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/batches/:id/trainers/bulk", authenticateToken, authorizeRole("INSTITUTION", "ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const { trainer_ids } = req.body; // Array of IDs
    
    const data = trainer_ids.map(tid => ({ batch_id: parseInt(id), trainer_id: parseInt(tid) }));
    
    // Using a loop to avoid upsert issues with createMany in some SQLite configs
    for (const item of data) {
      await prisma.batchTrainer.upsert({
        where: { batch_id_trainer_id: item },
        update: {},
        create: item
      });
    }
    
    res.json({ message: "Trainers assigned successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/batches/:id/students/bulk", authenticateToken, authorizeRole("INSTITUTION", "ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const { student_ids } = req.body;
    const batchId = parseInt(id);

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    
    for (const sid of student_ids) {
      const studentId = parseInt(sid);
      await prisma.batchStudent.upsert({
        where: { batch_id_student_id: { batch_id: batchId, student_id: studentId } },
        update: {},
        create: { batch_id: batchId, student_id: studentId }
      });
      
      // Also link student to institution
      await prisma.user.update({
        where: { id: studentId },
        data: { institution_id: batch.institution_id }
      });
    }

    res.json({ message: "Students assigned successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/batches/:id/students", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const batchId = parseInt(id);
    
    const students = await prisma.batchStudent.findMany({
      where: { batch_id: batchId },
      include: { student: true }
    });

    const sessions = await prisma.session.findMany({ where: { batch_id: batchId } });
    const sessionIds = sessions.map(s => s.id);

    const results = await Promise.all(students.map(async (bs) => {
      const attendances = await prisma.attendance.findMany({
        where: { student_id: bs.student_id, session_id: { in: sessionIds } }
      });
      const presentCount = attendances.filter(a => a.status === "PRESENT").length;
      return {
        ...bs.student,
        attendance_rate: sessions.length > 0 ? (presentCount / sessions.length) * 100 : 0,
        total_sessions: sessions.length,
        attended_sessions: presentCount
      };
    }));

    res.json(results);
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

    const batch = await prisma.batch.findUnique({ where: { id: parseInt(id) } });
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    const joined = await prisma.batchStudent.create({
      data: {
        batch_id: parseInt(id),
        student_id: req.user.id
      }
    });

    // Automatically link student to the institution
    await prisma.user.update({
      where: { id: req.user.id },
      data: { institution_id: batch.institution_id }
    });

    res.status(200).json({ message: "Successfully joined batch", joined });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to parse "HH:MM AM/PM" or "HH:MM" to total minutes for comparison
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  // Handle "HH:MM" 24h or "HH:MM AM/PM"
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;
  let hours = parseInt(match[1]);
  const mins = parseInt(match[2]);
  const period = match[3];
  if (period) {
    if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
  }
  return hours * 60 + mins;
};

app.post("/sessions", authenticateToken, authorizeRole("TRAINER"), async (req, res) => {
  try {
    const { batch_id, title, date, start_time, end_time, meeting_link } = req.body;
    const batchId = parseInt(batch_id);

    // 1. Verify trainer is assigned to this batch
    const assignment = await prisma.batchTrainer.findUnique({
      where: { batch_id_trainer_id: { batch_id: batchId, trainer_id: req.user.id } }
    });
    if (!assignment) return res.status(403).json({ message: "You are not assigned to this batch" });

    // 2. Check for time conflicts on the same date in the same batch
    const sessionDate = new Date(date);
    const existing = await prisma.session.findMany({
      where: { batch_id: batchId, date: sessionDate }
    });

    const newStart = parseTimeToMinutes(start_time);
    const newEnd = parseTimeToMinutes(end_time);

    const conflict = existing.find(s => {
      const exStart = parseTimeToMinutes(s.start_time);
      const exEnd = parseTimeToMinutes(s.end_time);
      return (newStart < exEnd) && (newEnd > exStart);
    });

    if (conflict) {
      return res.status(409).json({
        message: `Time slot already occupied by "${conflict.title}" (${conflict.start_time} – ${conflict.end_time}). Please choose a different time.`
      });
    }

    const session = await prisma.session.create({
      data: {
        batch_id: batchId,
        trainer_id: req.user.id,
        title,
        date: sessionDate,
        start_time,
        end_time,
        meeting_link: meeting_link || null
      },
      include: { batch: true }
    });

    // Send notifications to all students in this batch
    const batchStudents = await prisma.batchStudent.findMany({ where: { batch_id: batchId } });
    await Promise.all(batchStudents.map(bs =>
      prisma.notification.create({
        data: {
          user_id: bs.student_id,
          title: `New Session: ${title}`,
          message: `A new session "${title}" has been scheduled for ${new Date(sessionDate).toLocaleDateString()} at ${start_time}.${ meeting_link ? ' Meeting link is available.' : ''}`
        }
      })
    ));
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
      const rawSessions = await prisma.session.findMany({ 
        where: { batch_id: { in: batchIds } }, 
        include: { batch: true },
        orderBy: { date: 'asc' }
      });
      // Attach each student's own attendance record
      sessions = await Promise.all(rawSessions.map(async s => {
        const att = await prisma.attendance.findUnique({
          where: { session_id_student_id: { session_id: s.id, student_id: req.user.id } }
        });
        return { ...s, myAttendance: att || null };
      }));
    } else if (req.user.role === "TRAINER") {
      sessions = await prisma.session.findMany({ where: { trainer_id: req.user.id }, include: { batch: true, _count: { select: { attendance: true } } }, orderBy: { date: 'desc' } });
    } else {
      sessions = await prisma.session.findMany({ include: { batch: true }, orderBy: { date: 'desc' } });
    }
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/sessions/:id", authenticateToken, authorizeRole("TRAINER"), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, start_time, end_time, meeting_link } = req.body;
    const session = await prisma.session.findUnique({ where: { id: parseInt(id) } });
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.trainer_id !== req.user.id) return res.status(403).json({ message: "You can only edit your own sessions" });

    const updated = await prisma.session.update({
      where: { id: parseInt(id) },
      data: {
        title,
        date: new Date(date),
        start_time,
        end_time,
        meeting_link: meeting_link || null
      },
      include: { batch: true }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/sessions/:id", authenticateToken, authorizeRole("TRAINER", "INSTITUTION", "ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const session = await prisma.session.findUnique({ where: { id: parseInt(id) } });
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (req.user.role === "TRAINER" && session.trainer_id !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own sessions" });
    }
    // Delete attendance first
    await prisma.attendance.deleteMany({ where: { session_id: parseInt(id) } });
    await prisma.session.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Session deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/batches/:id/sessions", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    const where = { batch_id: parseInt(id) };
    if (date) where.date = new Date(date);
    const sessions = await prisma.session.findMany({ where, include: { batch: true }, orderBy: { start_time: 'asc' } });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student clicks the meeting link — marks attendance as PRESENT
app.post("/sessions/:id/join", authenticateToken, authorizeRole("STUDENT"), async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (!session.meeting_link) return res.status(400).json({ message: "No meeting link for this session" });

    // Verify student is in the batch
    const enrolled = await prisma.batchStudent.findUnique({
      where: { batch_id_student_id: { batch_id: session.batch_id, student_id: req.user.id } }
    });
    if (!enrolled) return res.status(403).json({ message: "You are not enrolled in this batch" });

    // Check link is accessible (within 10 mins before start OR ongoing)
    const now = new Date();
    const sessionDate = new Date(session.date);
    const todayStr = now.toDateString();
    const sessionDateStr = sessionDate.toDateString();
    if (todayStr !== sessionDateStr) {
      return res.status(400).json({ message: "Meeting link is only available on the session day" });
    }
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const startMins = parseTimeToMinutes(session.start_time);
    const endMins = parseTimeToMinutes(session.end_time);
    if (nowMins < startMins - 10) {
      return res.status(400).json({ message: "Meeting link will be available 10 minutes before the session starts" });
    }
    if (nowMins > endMins) {
      return res.status(400).json({ message: "This session has already ended" });
    }

    // Mark attendance as PRESENT
    await prisma.attendance.upsert({
      where: { session_id_student_id: { session_id: sessionId, student_id: req.user.id } },
      update: { status: "PRESENT" },
      create: { session_id: sessionId, student_id: req.user.id, status: "PRESENT" }
    });

    // Send notification to student confirming attendance
    await prisma.notification.create({
      data: {
        user_id: req.user.id,
        title: "Attendance Marked ✅",
        message: `You joined "${session.title}" and your attendance has been marked as Present.`
      }
    });

    res.json({ meeting_link: session.meeting_link, message: "Attendance marked. Redirecting to session..." });
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
    const batchId = parseInt(id);
    const sessions = await prisma.session.findMany({ where: { batch_id: batchId } });
    const students = await prisma.batchStudent.findMany({ where: { batch_id: batchId } });
    const sessionIds = sessions.map(s => s.id);
    
    const attendances = await prisma.attendance.findMany({
      where: { session_id: { in: sessionIds } }
    });

    const presentCount = attendances.filter(a => a.status === "PRESENT").length;
    const totalPossible = students.length * sessions.length;

    res.json({
      batch_id: id,
      total_students: students.length,
      total_sessions: sessions.length,
      total_attendances_marked: attendances.length,
      present_count: presentCount,
      attendance_rate: totalPossible > 0 ? (presentCount / totalPossible) * 100 : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/sessions/:id/attendance-summary", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const attendances = await prisma.attendance.findMany({ where: { session_id: parseInt(id) } });
    const summary = {
      present: attendances.filter(a => a.status === "PRESENT").length,
      absent: attendances.filter(a => a.status === "ABSENT").length,
      late: attendances.filter(a => a.status === "LATE").length,
      total: attendances.length
    };
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/students/:id/attendance-summary", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = parseInt(id);
    const attendances = await prisma.attendance.findMany({
      where: { student_id: studentId },
      include: { session: true }
    });
    
    const presentCount = attendances.filter(a => a.status === "PRESENT").length;
    res.json({
      total_sessions_attended: attendances.length,
      present_sessions: presentCount,
      attendance_rate: attendances.length > 0 ? (presentCount / attendances.length) * 100 : 0,
      history: attendances
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/institutions/:id/summary", authenticateToken, authorizeRole("PROGRAMME_MANAGER", "ADMIN", "INSTITUTION", "MONITORING_OFFICER"), async (req, res) => {
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
    const sessionIds = sessions.map(s => s.id);

    const attendances = await prisma.attendance.findMany({ where: { session_id: { in: sessionIds } } });
    const presentCount = attendances.filter(a => a.status === "PRESENT").length;

    // Students linked to this institution
    const totalStudents = await prisma.user.count({ 
      where: { 
        role: "STUDENT",
        OR: [
          { institution_id: instId },
          { studentBatches: { some: { batch_id: { in: batchIds } } } }
        ]
      } 
    });

    res.json({ 
      total_batches: batches.length, 
      total_sessions: sessions.length,
      total_students: totalStudents,
      overall_attendance_rate: attendances.length > 0 ? (presentCount / attendances.length) * 100 : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/programme/summary", authenticateToken, authorizeRole("PROGRAMME_MANAGER", "ADMIN", "MONITORING_OFFICER"), async (req, res) => {
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
      select: { id: true, name: true, email: true, role: true, institution_id: true, displayId: true }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});