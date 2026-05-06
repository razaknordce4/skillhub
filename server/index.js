// Trigger restart
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "skillbridge_super_secret_key_123";

// --- Nodemailer transporter (reads from .env) ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

// --- In-memory OTP store: { email -> { otp, expiresAt, role } } ---
const otpStore = {};


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
  
  // Find the highest existing number for this prefix
  let existingId;
  let nextNumber = 1;
  
  while (true) {
    const candidateId = `${prefix}${nextNumber.toString().padStart(3, '0')}`;
    
    if (type === 'BATCH') {
      existingId = await prisma.batch.findUnique({ where: { displayId: candidateId } });
    } else {
      existingId = await prisma.user.findUnique({ where: { displayId: candidateId } });
    }
    
    if (!existingId) {
      return candidateId;
    }
    
    nextNumber++;
  }
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
    const { name, email, password, role, institution_id, institution_name } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || "STUDENT";
    const displayId = await generateDisplayId('USER', userRole);
    
    let finalInstitutionId = institution_id ? parseInt(institution_id) : null;
    
    // If institution_name is provided, create new institution first
    if (institution_name && !finalInstitutionId) {
      try {
        const institutionDisplayId = await generateDisplayId('USER', 'INSTITUTION');
        const institutionEmail = `${institution_name.toLowerCase().replace(/\s+/g, '_')}@skillbridge.com`;
        const institutionPassword = await bcrypt.hash('temp123', 10);
        
        console.log('Creating institution:', { institution_name, institutionEmail, institutionDisplayId });
        
        const institution = await prisma.user.create({
          data: {
            name: institution_name,
            email: institutionEmail,
            password: institutionPassword,
            role: 'INSTITUTION',
            displayId: institutionDisplayId,
            createdByStudent: true,
            hasCredentials: false,
            tempPassword: 'temp123'
          }
        });
        
        console.log('Institution created successfully:', institution.id);
        finalInstitutionId = institution.id;
      } catch (institutionError) {
        console.error('Error creating institution:', institutionError);
        return res.status(500).json({ error: 'Failed to create institution: ' + institutionError.message });
      }
    }
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
        displayId,
        institution_id: finalInstitutionId
      }
    });

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email, institution_id: user.institution_id, displayId: user.displayId }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, institution_id: user.institution_id, displayId: user.displayId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Public: List all institutions (for Register page, no auth required) ---
app.get("/institutions", async (req, res) => {
  try {
    const institutions = await prisma.user.findMany({
      where: { role: "INSTITUTION" },
      select: { id: true, name: true, displayId: true },
      orderBy: { name: "asc" }
    });
    res.json(institutions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ 
      where: { email }
    });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: "Invalid credentials" });

    // Get institution name separately if needed
    let institutionName = null;
    if (user.institution_id) {
      const institution = await prisma.user.findUnique({
        where: { id: user.institution_id },
        select: { name: true }
      });
      institutionName = institution?.name || null;
    }

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email, institution_id: user.institution_id, displayId: user.displayId }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, institution_id: user.institution_id, displayId: user.displayId, institution_name: institutionName } });
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

// --- Forgot Password: Send OTP ---
app.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "No account found with this email" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore[email] = { otp, expiresAt, role: user.role, userId: user.id };

    // Send OTP email
    const roleLabel = user.role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    await transporter.sendMail({
      from: `"SkillBridge" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'SkillBridge – Password Reset OTP',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          <div style="background:#2563eb;padding:24px 32px">
            <h2 style="color:#fff;margin:0">SkillBridge</h2>
            <p style="color:#bfdbfe;margin:4px 0 0">Password Reset Request</p>
          </div>
          <div style="padding:32px">
            <p style="color:#374151">Hello, <strong>${user.name}</strong></p>
            <p style="color:#374151">Your account role: <strong>${roleLabel}</strong></p>
            <p style="color:#374151">Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
            <div style="text-align:center;margin:32px 0">
              <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#1d4ed8;background:#eff6ff;padding:16px 32px;border-radius:12px;border:2px dashed #93c5fd">${otp}</span>
            </div>
            <p style="color:#6b7280;font-size:13px">If you did not request a password reset, please ignore this email.</p>
          </div>
        </div>
      `
    });

    res.json({ message: `OTP sent to ${email}`, role: user.role });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- Forgot Password: Verify OTP ---
app.post("/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = otpStore[email];
    if (!record) return res.status(400).json({ message: "No OTP requested for this email" });
    if (Date.now() > record.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }
    if (record.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    // OTP valid – issue a short-lived reset token
    const resetToken = jwt.sign({ userId: record.userId, email, purpose: 'reset' }, JWT_SECRET, { expiresIn: '15m' });
    res.json({ message: "OTP verified", resetToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Forgot Password: Set New Password ---
app.post("/auth/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) return res.status(400).json({ message: "Passwords do not match" });
    if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
    } catch {
      return res.status(400).json({ message: "Reset token is invalid or expired" });
    }
    if (decoded.purpose !== 'reset') return res.status(400).json({ message: "Invalid reset token" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword }
    });

    // Invalidate OTP
    delete otpStore[decoded.email];

    res.json({ message: "Password reset successfully. You can now log in." });
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

app.put("/users/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, hasCredentials, tempPassword } = req.body;
    
    // Verify user exists and is an institution
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.role !== 'INSTITUTION') {
      return res.status(403).json({ message: "Only institutions can update credentials" });
    }
    
    const updateData = {};
    if (email) updateData.email = email;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (hasCredentials !== undefined) updateData.hasCredentials = hasCredentials;
    if (tempPassword !== undefined) updateData.tempPassword = tempPassword;
    
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    res.json({
      message: "Institution credentials updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        displayId: updatedUser.displayId,
        hasCredentials: updatedUser.hasCredentials
      }
    });
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
    } else if (req.user.role === "STUDENT" && role === "TRAINER") {
      // Students can only see trainers from their own institution
      // Find student's institution through their batch membership
      const studentBatches = await prisma.batchStudent.findMany({
        where: { student_id: req.user.id },
        include: { batch: { select: { institution_id: true } } }
      });
      
      if (studentBatches.length > 0) {
        // Get unique institution IDs from all batches the student belongs to
        const institutionIds = [...new Set(studentBatches.map(sb => sb.batch.institution_id))];
        where.institution_id = { in: institutionIds };
      } else {
        // If student is not in any batch, return no results
        where.institution_id = -1;
      }
    } else if (req.user.role === "TRAINER") {
      // Trainers can only see students in batches they are assigned to
      const trainerBatches = await prisma.batchTrainer.findMany({
        where: { trainer_id: req.user.id },
        select: { batch_id: true }
      });
      const batchIds = trainerBatches.map(b => b.batch_id);
      where.role = "STUDENT";
      where.studentBatches = { some: { batch_id: { in: batchIds } } };
    } else if (institution_id && req.user.role !== "STUDENT") {
      // Only use institution_id parameter for non-student users
      where.institution_id = parseInt(institution_id);
    }
    
    let include = {
      institution: {
        select: { name: true }
      },
      studentBatches: {
        include: {
          batch: {
            select: { name: true }
          }
        }
      },
      trainerBatches: {
        include: {
          batch: {
            select: { name: true }
          }
        }
      }
    };
      
    // Include trainer subjects if requested or if role is TRAINER
    if (req.query.include === 'subjects' || role === 'TRAINER') {
      // Subject is already included in the main user select
    }
      
    const users = await prisma.user.findMany({
      where,
      include,
      orderBy: { created_at: 'desc' }
    });

    const flattenedUsers = users.map(u => {
      let batchName = null;
      if (u.role === "STUDENT" && u.studentBatches?.length > 0) {
         batchName = u.studentBatches[0].batch.name;
      } else if (u.role === "TRAINER" && u.trainerBatches?.length > 0) {
         batchName = u.trainerBatches[0].batch.name;
      }

      return {
        ...u,
        institution_name: u.institution?.name || null,
        batch: batchName,
        attendance_rate: 0,
        studentBatches: u.studentBatches,
        trainerBatches: u.trainerBatches
      };
    });

    res.json(flattenedUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- Batch Endpoints ---
app.get("/batches", authenticateToken, async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'INSTITUTION') {
      where = { institution_id: req.user.id };
    } else if (req.user.role !== 'ADMIN' && req.user.role !== 'PROGRAMME_MANAGER') {
      // For trainers, they might need to see batches they are assigned to
      if (req.user.role === 'TRAINER') {
        const assignments = await prisma.batchTrainer.findMany({
          where: { trainer_id: req.user.id },
          select: { batch_id: true }
        });
        where = { id: { in: assignments.map(a => a.batch_id) } };
      } else {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    
    const batches = await prisma.batch.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });
    res.json(batches);
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

// --- PM: Bulk send notifications ---
// target_type: 'ALL_MO' | 'SPECIFIC_MO' | 'ALL_INST' | 'SPECIFIC_INST'
// target_ids: array of user IDs (used for SPECIFIC_* types)
app.post("/notifications/bulk", authenticateToken, authorizeRole("PROGRAMME_MANAGER", "ADMIN"), async (req, res) => {
  try {
    const { title, message, target_type, target_ids } = req.body;
    if (!title || !message || !target_type) {
      return res.status(400).json({ message: "title, message and target_type are required" });
    }

    let recipients = [];

    if (target_type === 'ALL_MO') {
      recipients = await prisma.user.findMany({ where: { role: 'MONITORING_OFFICER' }, select: { id: true } });
    } else if (target_type === 'SPECIFIC_MO') {
      if (!target_ids?.length) return res.status(400).json({ message: "target_ids required for SPECIFIC_MO" });
      recipients = target_ids.map(id => ({ id: parseInt(id) }));
    } else if (target_type === 'ALL_INST') {
      recipients = await prisma.user.findMany({ where: { role: 'INSTITUTION' }, select: { id: true } });
    } else if (target_type === 'SPECIFIC_INST') {
      if (!target_ids?.length) return res.status(400).json({ message: "target_ids required for SPECIFIC_INST" });
      recipients = target_ids.map(id => ({ id: parseInt(id) }));
    } else {
      return res.status(400).json({ message: "Invalid target_type" });
    }

    if (!recipients.length) return res.status(400).json({ message: "No recipients found" });

    await prisma.notification.createMany({
      data: recipients.map(r => ({ user_id: r.id, title, message }))
    });

    res.json({ message: `Notification sent to ${recipients.length} recipient(s)`, count: recipients.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Mark notification as read ---
app.put("/notifications/:id/read", authenticateToken, async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'READ' }
    });
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Mark all notifications as read ---
app.put("/notifications/read-all", authenticateToken, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { user_id: req.user.id, status: 'UNREAD' },
      data: { status: 'READ' }
    });
    res.json({ message: "All marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Delete a single notification ---
app.delete("/notifications/:id", authenticateToken, async (req, res) => {
  try {
    const notif = await prisma.notification.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    if (notif.user_id !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    await prisma.notification.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Delete all notifications for current user ---
app.delete("/notifications", authenticateToken, async (req, res) => {
  try {
    await prisma.notification.deleteMany({ where: { user_id: req.user.id } });
    res.json({ message: "All notifications deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Institution: Bulk send notifications ---
// target_type: 'ALL_STUDENTS' | 'BATCH_STUDENTS' | 'SPECIFIC_STUDENTS'
//            | 'ALL_TRAINERS' | 'BATCH_TRAINERS'  | 'SPECIFIC_TRAINERS'
// target_ids: batch IDs (for BATCH_*) or user IDs (for SPECIFIC_*)
app.post("/notifications/institution/bulk", authenticateToken, authorizeRole("INSTITUTION", "ADMIN"), async (req, res) => {
  try {
    const { title, message, target_type, target_ids } = req.body;
    if (!title || !message || !target_type) {
      return res.status(400).json({ message: "title, message and target_type are required" });
    }

    const institutionId = req.user.id;
    let recipients = [];

    if (target_type === 'ALL_STUDENTS') {
      // All students in any batch belonging to this institution
      const batchStudents = await prisma.batchStudent.findMany({
        where: { batch: { institution_id: institutionId } },
        select: { student_id: true }
      });
      const ids = [...new Set(batchStudents.map(bs => bs.student_id))];
      // Also include students directly linked to institution
      const directStudents = await prisma.user.findMany({
        where: { role: 'STUDENT', institution_id: institutionId },
        select: { id: true }
      });
      const allIds = [...new Set([...ids, ...directStudents.map(s => s.id)])];
      recipients = allIds.map(id => ({ id }));

    } else if (target_type === 'BATCH_STUDENTS') {
      if (!target_ids?.length) return res.status(400).json({ message: "target_ids (batch IDs) required" });
      // Verify batches belong to institution
      const batches = await prisma.batch.findMany({
        where: { id: { in: target_ids.map(Number) }, institution_id: institutionId }
      });
      if (!batches.length) return res.status(403).json({ message: "No valid batches found for your institution" });
      const batchStudents = await prisma.batchStudent.findMany({
        where: { batch_id: { in: batches.map(b => b.id) } },
        select: { student_id: true }
      });
      const ids = [...new Set(batchStudents.map(bs => bs.student_id))];
      recipients = ids.map(id => ({ id }));

    } else if (target_type === 'SPECIFIC_STUDENTS') {
      if (!target_ids?.length) return res.status(400).json({ message: "target_ids (user IDs) required" });
      recipients = target_ids.map(id => ({ id: parseInt(id) }));

    } else if (target_type === 'ALL_TRAINERS') {
      const batchTrainers = await prisma.batchTrainer.findMany({
        where: { batch: { institution_id: institutionId } },
        select: { trainer_id: true }
      });
      const ids = [...new Set(batchTrainers.map(bt => bt.trainer_id))];
      const directTrainers = await prisma.user.findMany({
        where: { role: 'TRAINER', institution_id: institutionId },
        select: { id: true }
      });
      const allIds = [...new Set([...ids, ...directTrainers.map(t => t.id)])];
      recipients = allIds.map(id => ({ id }));

    } else if (target_type === 'BATCH_TRAINERS') {
      if (!target_ids?.length) return res.status(400).json({ message: "target_ids (batch IDs) required" });
      const batches = await prisma.batch.findMany({
        where: { id: { in: target_ids.map(Number) }, institution_id: institutionId }
      });
      if (!batches.length) return res.status(403).json({ message: "No valid batches found for your institution" });
      const batchTrainers = await prisma.batchTrainer.findMany({
        where: { batch_id: { in: batches.map(b => b.id) } },
        select: { trainer_id: true }
      });
      const ids = [...new Set(batchTrainers.map(bt => bt.trainer_id))];
      recipients = ids.map(id => ({ id }));

    } else if (target_type === 'SPECIFIC_TRAINERS') {
      if (!target_ids?.length) return res.status(400).json({ message: "target_ids (user IDs) required" });
      recipients = target_ids.map(id => ({ id: parseInt(id) }));

    } else if (target_type === 'ALL_MO') {
      // Send to monitoring officers assigned to this institution
      recipients = await prisma.user.findMany({
        where: { role: 'MONITORING_OFFICER', institution_id: institutionId },
        select: { id: true }
      });

    } else {
      return res.status(400).json({ message: "Invalid target_type" });
    }

    if (!recipients.length) return res.status(400).json({ message: "No recipients found for the selected target" });

    await prisma.notification.createMany({
      data: recipients.map(r => ({ user_id: r.id, title, message }))
    });

    res.json({ message: `Notification sent to ${recipients.length} recipient(s)`, count: recipients.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Trainer: Bulk send notifications ---
// target_type: 'ALL_MY_STUDENTS' | 'BATCH_STUDENTS' | 'SPECIFIC_STUDENTS'
app.post("/notifications/trainer/bulk", authenticateToken, authorizeRole("TRAINER", "ADMIN"), async (req, res) => {
  try {
    const { title, message, target_type, target_ids } = req.body;
    if (!title || !message || !target_type) {
      return res.status(400).json({ message: "title, message and target_type are required" });
    }

    const trainerId = req.user.id;
    let recipients = [];

    // Get batches assigned to this trainer
    const trainerBatches = await prisma.batchTrainer.findMany({
      where: { trainer_id: trainerId },
      select: { batch_id: true }
    });
    const myBatchIds = trainerBatches.map(b => b.batch_id);

    if (target_type === 'ALL_MY_STUDENTS') {
      const batchStudents = await prisma.batchStudent.findMany({
        where: { batch_id: { in: myBatchIds } },
        select: { student_id: true }
      });
      const ids = [...new Set(batchStudents.map(bs => bs.student_id))];
      recipients = ids.map(id => ({ id }));

    } else if (target_type === 'BATCH_STUDENTS') {
      if (!target_ids?.length) return res.status(400).json({ message: "target_ids (batch IDs) required" });
      const targetBatchIds = target_ids.map(Number).filter(id => myBatchIds.includes(id));
      if (!targetBatchIds.length) return res.status(403).json({ message: "None of the selected batches are assigned to you" });

      const batchStudents = await prisma.batchStudent.findMany({
        where: { batch_id: { in: targetBatchIds } },
        select: { student_id: true }
      });
      const ids = [...new Set(batchStudents.map(bs => bs.student_id))];
      recipients = ids.map(id => ({ id }));

    } else if (target_type === 'SPECIFIC_STUDENTS') {
      if (!target_ids?.length) return res.status(400).json({ message: "target_ids (user IDs) required" });
      // We could verify each student is in one of the trainer's batches, but for now we trust the client search which is scoped
      recipients = target_ids.map(id => ({ id: parseInt(id) }));

    } else {
      return res.status(400).json({ message: "Invalid target_type" });
    }

    if (!recipients.length) return res.status(400).json({ message: "No recipients found for the selected target" });

    await prisma.notification.createMany({
      data: recipients.map(r => ({ user_id: r.id, title, message }))
    });

    res.json({ message: `Notification sent to ${recipients.length} student(s)`, count: recipients.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Monitoring Officer: Bulk send notifications ---
// target_type: 'MY_INSTITUTION'
app.post("/notifications/mo/bulk", authenticateToken, authorizeRole("MONITORING_OFFICER", "ADMIN"), async (req, res) => {
  try {
    const { title, message, target_type } = req.body;
    if (!title || !message || !target_type) {
      return res.status(400).json({ message: "title, message and target_type are required" });
    }

    let recipients = [];

    if (target_type === 'MY_INSTITUTION') {
      const instId = req.user.institution_id;
      if (!instId) return res.status(400).json({ message: "No institution assigned to you" });
      recipients = [{ id: instId }];
    } else {
      return res.status(400).json({ message: "Invalid target_type" });
    }

    await prisma.notification.createMany({
      data: recipients.map(r => ({ user_id: r.id, title, message }))
    });

    res.json({ message: "Notification sent to institution", count: recipients.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get students in a batch
app.get("/batch/:batchId/students", authenticateToken, async (req, res) => {
  try {
    const students = await prisma.batchStudent.findMany({
      where: { batch_id: parseInt(req.params.batchId) },
      include: {
        student: { select: { id: true, name: true } }
      }
    });
    res.json(students.map(bs => bs.student));
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

app.delete("/batches/:id/trainers/:trainerId", authenticateToken, authorizeRole("INSTITUTION", "ADMIN"), async (req, res) => {
  try {
    const { id, trainerId } = req.params;
    
    const deleted = await prisma.batchTrainer.deleteMany({
      where: { 
        batch_id: parseInt(id),
        trainer_id: parseInt(trainerId)
      }
    });
    
    if (deleted.count === 0) {
      return res.status(404).json({ message: "Trainer assignment not found" });
    }
    
    res.json({ message: "Trainer removed from batch successfully" });
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

      // --- Lazy auto-mark attendance for completed sessions ---
      const now = new Date();
      for (const s of rawSessions) {
        const sDate = new Date(s.date);
        const isSameDay = sDate.toDateString() === now.toDateString();
        const endMins = parseTimeToMinutes(s.end_time);
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const isCompleted = sDate < now && !isSameDay || (isSameDay && nowMins > endMins);

        if (isCompleted) {
          // Find unprocessed join records for this student
          const pendingJoin = await prisma.sessionJoin.findUnique({
            where: { session_id_student_id: { session_id: s.id, student_id: req.user.id } }
          });
          if (pendingJoin && !pendingJoin.marked) {
            // Auto-mark PRESENT
            await prisma.attendance.upsert({
              where: { session_id_student_id: { session_id: s.id, student_id: req.user.id } },
              update: { status: 'PRESENT' },
              create: { session_id: s.id, student_id: req.user.id, status: 'PRESENT' }
            });
            // Mark join as processed
            await prisma.sessionJoin.update({
              where: { session_id_student_id: { session_id: s.id, student_id: req.user.id } },
              data: { marked: true }
            });
          }
        }
      }
      // --- End auto-mark ---

      // Attach each student's own attendance and join records
      sessions = await Promise.all(rawSessions.map(async s => {
        const att = await prisma.attendance.findUnique({
          where: { session_id_student_id: { session_id: s.id, student_id: req.user.id } }
        });
        const join = await prisma.sessionJoin.findUnique({
          where: { session_id_student_id: { session_id: s.id, student_id: req.user.id } }
        });
        return { ...s, myAttendance: att || null, myJoin: join || null };
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

    // Record join attempt in SessionJoin table
    await prisma.sessionJoin.upsert({
      where: { session_id_student_id: { session_id: sessionId, student_id: req.user.id } },
      update: { joined_at: new Date() },
      create: { session_id: sessionId, student_id: req.user.id, marked: false }
    });

    // Send notification to student confirming join
    const existingNotif = await prisma.notification.findFirst({
      where: { user_id: req.user.id, title: "Session Joined" }
    });
    if (!existingNotif) {
      await prisma.notification.create({
        data: {
          user_id: req.user.id,
          title: "Session Joined",
          message: `You joined "${session.title}". Your attendance will be marked automatically after the session ends.`
        }
      });
    }

    res.json({ meeting_link: session.meeting_link, message: "Joining session... Attendance will be marked automatically after session ends." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark attendance for completed sessions based on join attempts
app.post("/sessions/mark-attendance", authenticateToken, authorizeRole("ADMIN", "PROGRAMME_MANAGER"), async (req, res) => {
  try {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    
    // Temporarily disabled until SessionJoin table is created via migration
    res.json({ message: "Session join tracking temporarily disabled. Please run database migration first." });
    return;

    // Find all sessions that have ended today
    // const completedSessions = await prisma.session.findMany({
    //   where: {
    //     date: { lte: now },
    //     end_time: { lt: `${Math.floor(currentMins / 60).toString().padStart(2, '0')}:${(currentMins % 60).toString().padStart(2, '0')}` }
    //   },
    //   include: {
    //     sessionJoins: {
    //       where: { marked: false },
    //       include: { student: { select: { id: true, name: true } } }
    //     }
    //   }
    // });

    // let markedCount = 0;
    // for (const session of completedSessions) {
    //   for (const join of session.sessionJoins) {
    //     // Mark attendance as PRESENT for students who joined
    //     await prisma.attendance.upsert({
    //       where: { session_id_student_id: { session_id: session.id, student_id: join.student_id } },
    //       update: { status: "PRESENT" },
    //       create: { session_id: session.id, student_id: join.student_id, status: "PRESENT" }
    //     });

    //     // Mark join as processed
    //     await prisma.sessionJoin.update({
    //       where: { id: join.id },
    //       data: { marked: true }
    //     });

    //     // Send notification
    //     await prisma.notification.create({
    //       data: {
    //         user_id: join.student_id,
    //         title: "Attendance Marked ",
    //         message: `Your attendance for "${session.title}" has been marked as Present.`
    //       }
    //     });

    //     markedCount++;
    //   }
    // }

    // res.json({ message: `Marked attendance for ${markedCount} students across ${completedSessions.length} completed sessions.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Exam Management (Institution) ---
app.post("/exams", authenticateToken, authorizeRole("INSTITUTION"), async (req, res) => {
  try {
    const { name, batch_id, subjects, result_publish_at } = req.body;
    
    // Validate batch belongs to institution
    const batch = await prisma.batch.findUnique({ 
      where: { id: parseInt(batch_id) } 
    });
    if (!batch || batch.institution_id !== req.user.id) {
      return res.status(400).json({ message: "Invalid batch or unauthorized" });
    }

    // Validate trainers belong to batch
    const trainerIds = subjects.map(s => s.trainer_id);
    const trainers = await prisma.user.findMany({
      where: { 
        id: { in: trainerIds },
        trainerBatches: { some: { batch_id: parseInt(batch_id) } }
      }
    });
    if (trainers.length !== trainerIds.length) {
      return res.status(400).json({ message: "One or more trainers are not assigned to this batch" });
    }

    // Create exam
    const exam = await prisma.exam.create({
      data: {
        name,
        batch_id: parseInt(batch_id),
        result_publish_at: result_publish_at ? new Date(result_publish_at) : null,
        created_by: req.user.id
      }
    });

    // Create exam subjects
    const examSubjects = await Promise.all(
      subjects.map(subject => 
        prisma.examSubject.create({
          data: {
            exam_id: exam.id,
            subject_name: subject.subject_name,
            trainer_id: subject.trainer_id,
            exam_date: new Date(subject.exam_date),
            start_time: subject.start_time,
            end_time: subject.end_time
          }
        })
      )
    );

    res.json({ 
      message: "Exam created successfully",
      exam: { ...exam, subjects: examSubjects }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/exams", authenticateToken, authorizeRole("INSTITUTION"), async (req, res) => {
  try {
    const exams = await prisma.exam.findMany({
      where: { created_by: req.user.id },
      include: {
        batch: { select: { name: true } },
        subjects: {
          include: { trainer: { select: { name: true } } }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Trainer Marks Entry ---
app.get("/trainer/exams", authenticateToken, authorizeRole("TRAINER"), async (req, res) => {
  try {
    const examSubjects = await prisma.examSubject.findMany({
      where: { trainer_id: req.user.id },
      include: {
        exam: {
          include: {
            batch: { select: { name: true } }
          }
        }
      },
      orderBy: { exam_date: 'asc' }
    });
    res.json(examSubjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/marks", authenticateToken, authorizeRole("TRAINER"), async (req, res) => {
  try {
    const { exam_id, subject_id, student_id, score } = req.body;
    
    // Validate trainer owns this subject
    const examSubject = await prisma.examSubject.findUnique({
      where: { 
        exam_id: parseInt(exam_id),
        subject_name: subject_id,
        trainer_id: req.user.id
      }
    });
    
    if (!examSubject) {
      return res.status(403).json({ message: "You are not assigned to this subject" });
    }

    // Create or update mark
    await prisma.mark.upsert({
      where: { 
        exam_id: parseInt(exam_id),
        exam_subject_id: examSubject.id,
        student_id: parseInt(student_id)
      },
      update: { score: parseInt(score) },
      create: {
        exam_id: parseInt(exam_id),
        exam_subject_id: examSubject.id,
        student_id: parseInt(student_id),
        score: parseInt(score),
        batch_id: examSubject.exam.batch_id
      }
    });

    res.json({ message: "Mark saved successfully" });
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

app.get("/programme/summary", authenticateToken, authorizeRole("PROGRAMME_MANAGER", "ADMIN", "MONITORING_OFFICER", "TRAINER"), async (req, res) => {
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

// --- Institutions Endpoints ---
app.get("/institutions", authenticateToken, async (req, res) => {
  try {
    const institutions = await prisma.user.findMany({
      where: { role: "INSTITUTION" },
      select: { 
        id: true, 
        name: true, 
        displayId: true,
        email: true,
        role: true,
        created_at: true,
        createdByStudent: true,
        hasCredentials: true,
        tempPassword: true
      },
      orderBy: { name: 'asc' }
    });
    
    res.json(institutions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new institution (Programme Manager only)
app.post("/institutions", authenticateToken, authorizeRole("PROGRAMME_MANAGER", "ADMIN"), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if institution already exists
    const existingInstitution = await prisma.user.findUnique({ where: { email } });
    if (existingInstitution) {
      return res.status(400).json({ message: "Institution with this email already exists" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const displayId = await generateDisplayId('USER', 'INSTITUTION');
    
    const institution = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'INSTITUTION',
        displayId,
        createdByStudent: false,
        hasCredentials: true,
        tempPassword: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        displayId: true,
        role: true,
        createdByStudent: true,
        hasCredentials: true,
        tempPassword: true,
        created_at: true
      }
    });
    
    res.status(201).json({ message: "Institution created successfully", institution });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update institution (Programme Manager only)
app.put("/institutions/:id", authenticateToken, authorizeRole("PROGRAMME_MANAGER", "ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;
    
    const institution = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }
    
    if (institution.role !== 'INSTITUTION') {
      return res.status(400).json({ message: "User is not an institution" });
    }
    
    // Check if email is being changed and if it already exists
    if (email && email !== institution.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    
    const updatedInstitution = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        displayId: true,
        role: true,
        createdByStudent: true,
        hasCredentials: true,
        tempPassword: true,
        created_at: true
      }
    });
    
    res.json({ message: "Institution updated successfully", institution: updatedInstitution });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete institution (Programme Manager only)
app.delete("/institutions/:id", authenticateToken, authorizeRole("PROGRAMME_MANAGER", "ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = parseInt(id);
    
    const institution = await prisma.user.findUnique({
      where: { id: institutionId }
    });
    
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }
    
    if (institution.role !== 'INSTITUTION') {
      return res.status(400).json({ message: "User is not an institution" });
    }
    
    // Delete related records first to avoid foreign key constraint errors
    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { user_id: institutionId } }),
      prisma.batchStudent.deleteMany({ where: { student: { institution_id: institutionId } } }),
      prisma.batchTrainer.deleteMany({ where: { trainer: { institution_id: institutionId } } }),
      prisma.batch.deleteMany({ where: { institution_id: institutionId } }),
      prisma.user.delete({ where: { id: institutionId } })
    ]);

    res.json({ message: "Institution deleted successfully" });
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

// --- Student Marks Viewing ---
app.get("/student/marks", authenticateToken, authorizeRole("STUDENT"), async (req, res) => {
  try {
    const studentBatches = await prisma.batchStudent.findMany({
      where: { student_id: req.user.id },
      include: {
        batch: {
          include: {
            exams: {
              include: {
                subjects: {
                  include: {
                    marks: {
                      where: { student_id: req.user.id },
                      include: { examSubject: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const results = [];
    for (const batchStudent of studentBatches) {
      const batch = batchStudent.batch;
      for (const exam of batch.exams) {
        const examSubjects = exam.subjects;
        const totalSubjects = examSubjects.length;
        const completedSubjects = examSubjects.filter(subject => 
          subject.marks.some(mark => mark.student_id === req.user.id)
        ).length;

        const isPublished = exam.result_publish_at && new Date() >= new Date(exam.result_publish_at);
        const canViewResults = completedSubjects === totalSubjects && isPublished;

        if (canViewResults) {
          const marks = examSubjects.map(subject => {
            const studentMark = subject.marks.find(mark => mark.student_id === req.user.id);
            return {
              subject_name: subject.subject_name,
              score: studentMark ? studentMark.score : null,
              trainer_name: subject.trainer.name
            };
          });

          results.push({
            exam_name: exam.name,
            batch_name: batch.name,
            marks: marks,
            completed: true,
            published: true
          });
        } else {
          results.push({
            exam_name: exam.name,
            batch_name: batch.name,
            marks: null,
            completed: false,
            published: isPublished,
            progress: `${completedSubjects}/${totalSubjects} subjects completed`
          });
        }
      }
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Attendance Statistics Endpoints ---

// Student attendance statistics
app.get("/student/attendance-stats", authenticateToken, authorizeRole("STUDENT"), async (req, res) => {
  try {
    const studentBatches = await prisma.batchStudent.findMany({
      where: { student_id: req.user.id },
      include: { batch: true }
    });

    const batchIds = studentBatches.map(bs => bs.batch_id);
    
    const sessions = await prisma.session.findMany({
      where: { batch_id: { in: batchIds } },
      include: {
        attendance: {
          where: { student_id: req.user.id }
        }
      }
    });

    const totalSessions = sessions.length;
    const attendedSessions = sessions.filter(session => 
      session.attendance.some(att => att.status === 'PRESENT')
    ).length;
    const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;

    // Get recent sessions
    const recentSessions = sessions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map(session => ({
        id: session.id,
        title: session.title,
        date: session.date,
        start_time: session.start_time,
        batch_name: studentBatches.find(bs => bs.batch_id === session.batch_id)?.batch?.name,
        attended: session.attendance.some(att => att.status === 'PRESENT')
      }));

    res.json({
      total_sessions: totalSessions,
      attended_sessions: attendedSessions,
      attendance_rate: Math.round(attendanceRate * 10) / 10,
      recent_sessions: recentSessions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trainer attendance statistics
app.get("/trainer/attendance-stats", authenticateToken, authorizeRole("TRAINER"), async (req, res) => {
  try {
    const trainerBatches = await prisma.batchTrainer.findMany({
      where: { trainer_id: req.user.id },
      include: { batch: true }
    });

    const batchIds = trainerBatches.map(tb => tb.batch_id);
    
    const sessions = await prisma.session.findMany({
      where: { batch_id: { in: batchIds } },
      include: {
        batch: true,
        attendance: {
          include: { student: { select: { name: true } } }
        }
      }
    });

    const totalSessions = sessions.length;
    const upcomingSessions = sessions.filter(session => new Date(session.date) >= new Date()).length;
    const completedSessions = sessions.filter(session => new Date(session.date) < new Date()).length;

    // Calculate attendance rates per batch
    const batchStats = await Promise.all(trainerBatches.map(async (tb) => {
      const batchSessions = sessions.filter(s => s.batch_id === tb.batch.id);
      const totalBatchSessions = batchSessions.length;
      
      if (totalBatchSessions === 0) {
        return {
          batch_id: tb.batch.id,
          batch_name: tb.batch.name,
          total_sessions: 0,
          attendance_rate: 0,
          student_count: 0
        };
      }

      const batchStudents = await prisma.batchStudent.findMany({
        where: { batch_id: tb.batch.id },
        include: { student: true }
      });

      let totalAttendances = 0;
      let possibleAttendances = 0;

      for (const session of batchSessions) {
        for (const student of batchStudents) {
          possibleAttendances++;
          if (session.attendance.some(att => att.student_id === student.student_id && att.status === 'PRESENT')) {
            totalAttendances++;
          }
        }
      }

      const attendanceRate = possibleAttendances > 0 ? (totalAttendances / possibleAttendances) * 100 : 0;

      return {
        batch_id: tb.batch.id,
        batch_name: tb.batch.name,
        total_sessions: totalBatchSessions,
        attendance_rate: Math.round(attendanceRate * 10) / 10,
        student_count: batchStudents.length
      };
    }));

    res.json({
      total_sessions: totalSessions,
      upcoming_sessions: upcomingSessions,
      completed_sessions: completedSessions,
      batch_count: trainerBatches.length,
      batch_stats: batchStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Institution attendance statistics
app.get("/institution/attendance-stats", authenticateToken, authorizeRole("INSTITUTION"), async (req, res) => {
  try {
    const batches = await prisma.batch.findMany({
      where: { institution_id: req.user.id },
      include: {
        sessions: {
          include: {
            attendance: {
              include: { student: true }
            }
          }
        },
        students: {
          include: { student: true }
        },
        trainers: {
          include: { trainer: true }
        }
      }
    });

    let totalSessions = 0;
    let totalAttendances = 0;
    let possibleAttendances = 0;

    const batchStats = await Promise.all(batches.map(async (batch) => {
      const batchSessions = batch.sessions;
      const batchTotalSessions = batchSessions.length;
      totalSessions += batchTotalSessions;

      let batchTotalAttendances = 0;
      let batchPossibleAttendances = 0;

      for (const session of batchSessions) {
        for (const student of batch.students) {
          batchPossibleAttendances++;
          possibleAttendances++;
          if (session.attendance.some(att => att.student_id === student.student_id && att.status === 'PRESENT')) {
            batchTotalAttendances++;
            totalAttendances++;
          }
        }
      }

      const attendanceRate = batchPossibleAttendances > 0 ? (batchTotalAttendances / batchPossibleAttendances) * 100 : 0;

      return {
        batch_id: batch.id,
        batch_name: batch.name,
        total_sessions: batchTotalSessions,
        attendance_rate: Math.round(attendanceRate * 10) / 10,
        student_count: batch.students.length,
        trainer_count: batch.trainers.length
      };
    }));

    const overallAttendanceRate = possibleAttendances > 0 ? (totalAttendances / possibleAttendances) * 100 : 0;

    const totalStudents = await prisma.user.count({ where: { role: "STUDENT", institution_id: req.user.id } });
    const totalTrainers = await prisma.user.count({ where: { role: "TRAINER", institution_id: req.user.id } });

    res.json({
      total_batches: batches.length,
      total_sessions: totalSessions,
      overall_attendance_rate: Math.round(overallAttendanceRate * 10) / 10,
      total_students: totalStudents,
      total_trainers: totalTrainers,
      batch_stats: batchStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Programme Manager attendance statistics
app.get("/pm/attendance-stats", authenticateToken, authorizeRole("PROGRAMME_MANAGER"), async (req, res) => {
  try {
    const institutions = await prisma.user.findMany({
      where: { role: "INSTITUTION" },
      select: { id: true, name: true }
    });

    const institutionStats = await Promise.all(institutions.map(async (institution) => {
      const batches = await prisma.batch.findMany({
        where: { institution_id: institution.id },
        include: {
          sessions: {
            include: {
              attendance: true
            }
          },
          students: {
            include: { student: { select: { id: true } } }
          },
          trainers: {
            include: { trainer: { select: { id: true } } }
          }
        }
      });

      let totalSessions = 0;
      let totalAttendances = 0;
      let possibleAttendances = 0;

      for (const batch of batches) {
        const batchSessions = batch.sessions;
        totalSessions += batchSessions.length;

        for (const session of batchSessions) {
          for (const student of batch.students) {
            possibleAttendances++;
            if (session.attendance.some(att => att.student_id === student.student_id && att.status === 'PRESENT')) {
              totalAttendances++;
            }
          }
        }
      }

      const attendanceRate = possibleAttendances > 0 ? (totalAttendances / possibleAttendances) * 100 : 0;

      const instStudents = await prisma.user.count({ where: { role: "STUDENT", institution_id: institution.id } });
      const instTrainers = await prisma.user.count({ where: { role: "TRAINER", institution_id: institution.id } });

      return {
        institution_id: institution.id,
        institution_name: institution.name,
        total_batches: batches.length,
        total_sessions: totalSessions,
        attendance_rate: Math.round(attendanceRate * 10) / 10,
        total_students: instStudents,
        total_trainers: instTrainers
      };
    }));

    const overallStats = institutionStats.reduce((acc, inst) => ({
      total_institutions: institutionStats.length,
      total_batches: acc.total_batches + inst.total_batches,
      total_sessions: acc.total_sessions + inst.total_sessions,
      total_students: acc.total_students + inst.total_students,
      total_trainers: acc.total_trainers + inst.total_trainers
    }), { total_batches: 0, total_sessions: 0, total_students: 0, total_trainers: 0 });

    const overallAttendanceRate = institutionStats.length > 0 
      ? institutionStats.reduce((sum, inst) => sum + inst.attendance_rate, 0) / institutionStats.length 
      : 0;

    res.json({
      ...overallStats,
      overall_attendance_rate: Math.round(overallAttendanceRate * 10) / 10,
      institution_stats: institutionStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Monitoring Officer attendance statistics (read-only)
app.get("/mo/attendance-stats", authenticateToken, authorizeRole("MONITORING_OFFICER"), async (req, res) => {
  try {
    // Same data as Programme Manager but for read-only access
    const institutions = await prisma.user.findMany({
      where: { role: "INSTITUTION" },
      select: { id: true, name: true }
    });

    const institutionStats = await Promise.all(institutions.map(async (institution) => {
      const batches = await prisma.batch.findMany({
        where: { institution_id: institution.id },
        include: {
          sessions: {
            include: {
              attendance: true
            }
          },
          students: {
            include: { student: { select: { id: true } } }
          },
          trainers: {
            include: { trainer: { select: { id: true } } }
          }
        }
      });

      let totalSessions = 0;
      let totalAttendances = 0;
      let possibleAttendances = 0;

      for (const batch of batches) {
        const batchSessions = batch.sessions;
        totalSessions += batchSessions.length;

        for (const session of batchSessions) {
          for (const student of batch.students) {
            possibleAttendances++;
            if (session.attendance.some(att => att.student_id === student.student_id && att.status === 'PRESENT')) {
              totalAttendances++;
            }
          }
        }
      }

      const attendanceRate = possibleAttendances > 0 ? (totalAttendances / possibleAttendances) * 100 : 0;

      const instStudents = await prisma.user.count({ where: { role: "STUDENT", institution_id: institution.id } });
      const instTrainers = await prisma.user.count({ where: { role: "TRAINER", institution_id: institution.id } });

      return {
        institution_id: institution.id,
        institution_name: institution.name,
        total_batches: batches.length,
        total_sessions: totalSessions,
        attendance_rate: Math.round(attendanceRate * 10) / 10,
        total_students: instStudents,
        total_trainers: instTrainers
      };
    }));

    const overallStats = institutionStats.reduce((acc, inst) => ({
      total_institutions: institutionStats.length,
      total_batches: acc.total_batches + inst.total_batches,
      total_sessions: acc.total_sessions + inst.total_sessions,
      total_students: acc.total_students + inst.total_students,
      total_trainers: acc.total_trainers + inst.total_trainers
    }), { total_batches: 0, total_sessions: 0, total_students: 0, total_trainers: 0 });

    const overallAttendanceRate = institutionStats.length > 0 
      ? institutionStats.reduce((sum, inst) => sum + inst.attendance_rate, 0) / institutionStats.length 
      : 0;

    res.json({
      ...overallStats,
      overall_attendance_rate: Math.round(overallAttendanceRate * 10) / 10,
      institution_stats: institutionStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API Routes with /api prefix ---
app.get("/api/sessions", authenticateToken, async (req, res) => {
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

      // --- Lazy auto-mark attendance for completed sessions ---
      const now = new Date();
      for (const s of rawSessions) {
        const sDate = new Date(s.date);
        const isSameDay = sDate.toDateString() === now.toDateString();
        const endMins = parseTimeToMinutes(s.end_time);
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const isCompleted = sDate < now && !isSameDay || (isSameDay && nowMins > endMins);

        if (isCompleted) {
          const pendingJoin = await prisma.sessionJoin.findUnique({
            where: { session_id_student_id: { session_id: s.id, student_id: req.user.id } }
          });
          if (pendingJoin && !pendingJoin.marked) {
            await prisma.attendance.upsert({
              where: { session_id_student_id: { session_id: s.id, student_id: req.user.id } },
              update: { status: 'PRESENT' },
              create: { session_id: s.id, student_id: req.user.id, status: 'PRESENT' }
            });
            await prisma.sessionJoin.update({
              where: { session_id_student_id: { session_id: s.id, student_id: req.user.id } },
              data: { marked: true }
            });
          }
        }
      }
      // --- End auto-mark ---

      // Attach each student's own attendance and join records
      sessions = await Promise.all(rawSessions.map(async s => {
        const att = await prisma.attendance.findUnique({
          where: { session_id_student_id: { session_id: s.id, student_id: req.user.id } }
        });
        const join = await prisma.sessionJoin.findUnique({
          where: { session_id_student_id: { session_id: s.id, student_id: req.user.id } }
        });
        return { ...s, myAttendance: att || null, myJoin: join || null };
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

app.get("/api/student/attendance-stats", authenticateToken, authorizeRole("STUDENT"), async (req, res) => {
  try {
    const studentBatches = await prisma.batchStudent.findMany({
      where: { student_id: req.user.id },
      include: { batch: true }
    });

    const batchIds = studentBatches.map(bs => bs.batch_id);
    
    const sessions = await prisma.session.findMany({
      where: { batch_id: { in: batchIds } },
      include: {
        attendance: {
          where: { student_id: req.user.id }
        }
      }
    });

    const totalSessions = sessions.length;
    const attendedSessions = sessions.filter(session => 
      session.attendance.some(att => att.status === 'PRESENT')
    ).length;
    const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;

    // Get recent sessions
    const recentSessions = sessions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map(session => ({
        id: session.id,
        title: session.title,
        date: session.date,
        start_time: session.start_time,
        batch_name: studentBatches.find(bs => bs.batch_id === session.batch_id)?.batch?.name,
        attended: session.attendance.some(att => att.status === 'PRESENT')
      }));

    res.json({
      total_sessions: totalSessions,
      attended_sessions: attendedSessions,
      attendance_rate: Math.round(attendanceRate * 10) / 10,
      recent_sessions: recentSessions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/pm/attendance-stats", authenticateToken, authorizeRole("PROGRAMME_MANAGER"), async (req, res) => {
  try {
    const institutions = await prisma.user.findMany({
      where: { role: "INSTITUTION" },
      select: { id: true, name: true }
    });

    const institutionStats = await Promise.all(institutions.map(async (institution) => {
      const batches = await prisma.batch.findMany({
        where: { institution_id: institution.id },
        include: {
          sessions: {
            include: {
              attendance: true
            }
          },
          students: {
            include: { student: { select: { id: true } } }
          },
          trainers: {
            include: { trainer: { select: { id: true } } }
          }
        }
      });

      let totalSessions = 0;
      let totalAttendances = 0;
      let possibleAttendances = 0;

      for (const batch of batches) {
        const batchSessions = batch.sessions;
        totalSessions += batchSessions.length;

        for (const session of batchSessions) {
          for (const student of batch.students) {
            possibleAttendances++;
            if (session.attendance.some(att => att.student_id === student.student_id && att.status === 'PRESENT')) {
              totalAttendances++;
            }
          }
        }
      }

      const attendanceRate = possibleAttendances > 0 ? (totalAttendances / possibleAttendances) * 100 : 0;

      const instStudents = await prisma.user.count({ where: { role: "STUDENT", institution_id: institution.id } });
      const instTrainers = await prisma.user.count({ where: { role: "TRAINER", institution_id: institution.id } });

      return {
        institution_id: institution.id,
        institution_name: institution.name,
        total_batches: batches.length,
        total_sessions: totalSessions,
        attendance_rate: Math.round(attendanceRate * 10) / 10,
        total_students: instStudents,
        total_trainers: instTrainers
      };
    }));

    const overallStats = institutionStats.reduce((acc, inst) => ({
      total_institutions: institutionStats.length,
      total_batches: acc.total_batches + inst.total_batches,
      total_sessions: acc.total_sessions + inst.total_sessions,
      total_students: acc.total_students + inst.total_students,
      total_trainers: acc.total_trainers + inst.total_trainers
    }), { total_batches: 0, total_sessions: 0, total_students: 0, total_trainers: 0 });

    const overallAttendanceRate = institutionStats.length > 0 
      ? institutionStats.reduce((sum, inst) => sum + inst.attendance_rate, 0) / institutionStats.length 
      : 0;

    res.json({
      ...overallStats,
      overall_attendance_rate: Math.round(overallAttendanceRate * 10) / 10,
      institution_stats: institutionStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/mo/attendance-stats", authenticateToken, authorizeRole("MONITORING_OFFICER"), async (req, res) => {
  try {
    const institutions = await prisma.user.findMany({
      where: { role: "INSTITUTION" },
      select: { id: true, name: true }
    });

    const institutionStats = await Promise.all(institutions.map(async (institution) => {
      const batches = await prisma.batch.findMany({
        where: { institution_id: institution.id },
        include: {
          sessions: {
            include: {
              attendance: true
            }
          },
          students: {
            include: { student: { select: { id: true } } }
          },
          trainers: {
            include: { trainer: { select: { id: true } } }
          }
        }
      });

      let totalSessions = 0;
      let totalAttendances = 0;
      let possibleAttendances = 0;

      for (const batch of batches) {
        const batchSessions = batch.sessions;
        totalSessions += batchSessions.length;

        for (const session of batchSessions) {
          for (const student of batch.students) {
            possibleAttendances++;
            if (session.attendance.some(att => att.student_id === student.student_id && att.status === 'PRESENT')) {
              totalAttendances++;
            }
          }
        }
      }

      const attendanceRate = possibleAttendances > 0 ? (totalAttendances / possibleAttendances) * 100 : 0;

      return {
        institution_id: institution.id,
        institution_name: institution.name,
        total_batches: batches.length,
        total_sessions: totalSessions,
        attendance_rate: Math.round(attendanceRate * 10) / 10,
        total_students: batches.reduce((sum, batch) => sum + batch.students.length, 0),
        total_trainers: batches.reduce((sum, batch) => sum + batch.trainers.length, 0)
      };
    }));

    const overallStats = institutionStats.reduce((acc, inst) => ({
      total_institutions: institutionStats.length,
      total_batches: acc.total_batches + inst.total_batches,
      total_sessions: acc.total_sessions + inst.total_sessions,
      total_students: acc.total_students + inst.total_students,
      total_trainers: acc.total_trainers + inst.total_trainers
    }), { total_batches: 0, total_sessions: 0, total_students: 0, total_trainers: 0 });

    const overallAttendanceRate = institutionStats.length > 0 
      ? institutionStats.reduce((sum, inst) => sum + inst.attendance_rate, 0) / institutionStats.length 
      : 0;

    res.json({
      ...overallStats,
      overall_attendance_rate: Math.round(overallAttendanceRate * 10) / 10,
      institution_stats: institutionStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/institution/attendance-stats", authenticateToken, authorizeRole("INSTITUTION"), async (req, res) => {
  try {
    const institutionId = req.user.id;
    
    const batches = await prisma.batch.findMany({
      where: { institution_id: institutionId },
      include: {
        sessions: {
          include: {
            attendance: true
          }
        },
        students: {
          include: { student: { select: { id: true } } }
        },
        trainers: {
          include: { trainer: { select: { id: true } } }
        }
      }
    });

    const batchStats = await Promise.all(batches.map(async (batch) => {
      let totalSessions = batch.sessions.length;
      let totalAttendances = 0;
      let possibleAttendances = 0;

      for (const session of batch.sessions) {
        for (const student of batch.students) {
          possibleAttendances++;
          if (session.attendance.some(att => att.student_id === student.student_id && att.status === 'PRESENT')) {
            totalAttendances++;
          }
        }
      }

      const attendanceRate = possibleAttendances > 0 ? (totalAttendances / possibleAttendances) * 100 : 0;

      return {
        batch_id: batch.id,
        batch_name: batch.name,
        total_sessions: totalSessions,
        attendance_rate: Math.round(attendanceRate * 10) / 10,
        student_count: batch.students.length,
        trainer_count: batch.trainers.length
      };
    }));

    const totalStudents = await prisma.user.count({ where: { role: "STUDENT", institution_id: req.user.id } });
    const totalTrainers = await prisma.user.count({ where: { role: "TRAINER", institution_id: req.user.id } });

    const overallStats = batchStats.reduce((acc, batch) => ({
      total_batches: batches.length,
      total_sessions: acc.total_sessions + batch.total_sessions
    }), { total_sessions: 0 });

    overallStats.total_students = totalStudents;
    overallStats.total_trainers = totalTrainers;

    const overallAttendanceRate = batchStats.length > 0 
      ? batchStats.reduce((sum, batch) => sum + batch.attendance_rate, 0) / batchStats.length 
      : 0;

    res.json({
      ...overallStats,
      overall_attendance_rate: Math.round(overallAttendanceRate * 10) / 10,
      batch_stats: batchStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/trainer/attendance-stats", authenticateToken, authorizeRole("TRAINER"), async (req, res) => {
  try {
    const trainerId = req.user.id;
    
    const trainerBatches = await prisma.batchTrainer.findMany({
      where: { trainer_id: trainerId },
      include: {
        batch: {
          include: {
            sessions: {
              include: {
                attendance: true
              }
            },
            students: {
              include: { student: { select: { id: true } } }
            }
          }
        }
      }
    });

    const batchStats = await Promise.all(trainerBatches.map(async (trainerBatch) => {
      const batch = trainerBatch.batch;
      let totalSessions = batch.sessions.length;
      let totalAttendances = 0;
      let possibleAttendances = 0;

      for (const session of batch.sessions) {
        for (const student of batch.students) {
          possibleAttendances++;
          if (session.attendance.some(att => att.student_id === student.student_id && att.status === 'PRESENT')) {
            totalAttendances++;
          }
        }
      }

      const attendanceRate = possibleAttendances > 0 ? (totalAttendances / possibleAttendances) * 100 : 0;

      return {
        batch_id: batch.id,
        batch_name: batch.name,
        total_sessions: totalSessions,
        attendance_rate: Math.round(attendanceRate * 10) / 10,
        student_count: batch.students.length
      };
    }));

    const overallStats = batchStats.reduce((acc, batch) => ({
      batch_count: trainerBatches.length,
      total_sessions: acc.total_sessions + batch.total_sessions,
      total_students: acc.total_students + batch.student_count
    }), { total_sessions: 0, total_students: 0 });

    const overallAttendanceRate = batchStats.length > 0 
      ? batchStats.reduce((sum, batch) => sum + batch.attendance_rate, 0) / batchStats.length 
      : 0;

    // Calculate upcoming sessions
    const allSessions = trainerBatches.flatMap(tb => tb.batch.sessions);
    const upcomingSessions = allSessions.filter(session => {
      const sessionDate = new Date(session.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate >= today;
    }).length;

    res.json({
      ...overallStats,
      overall_attendance_rate: Math.round(overallAttendanceRate * 10) / 10,
      upcoming_sessions: upcomingSessions,
      batch_stats: batchStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Todo API endpoints
app.get("/todos", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const todos = await prisma.todo.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/todos", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const todos = await prisma.todo.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/todos", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, due_date, auto_delete } = req.body;
    
    const todo = await prisma.todo.create({
      data: {
        user_id: userId,
        title,
        description,
        due_date: due_date ? new Date(due_date) : null,
        auto_delete: auto_delete || false
      }
    });
    
    res.json(todo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/todos", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, due_date, auto_delete } = req.body;
    
    const todo = await prisma.todo.create({
      data: {
        user_id: userId,
        title,
        description,
        due_date: due_date ? new Date(due_date) : null,
        auto_delete: auto_delete || false
      }
    });
    
    res.json(todo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/todos/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const todoId = parseInt(req.params.id);
    const { title, description, completed, due_date, auto_delete } = req.body;
    
    const todo = await prisma.todo.updateMany({
      where: { 
        id: todoId, 
        user_id: userId 
      },
      data: {
        title,
        description,
        completed,
        due_date: due_date ? new Date(due_date) : null,
        auto_delete
      }
    });
    
    if (todo.count === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }
    
    const updatedTodo = await prisma.todo.findUnique({
      where: { id: todoId }
    });
    
    res.json(updatedTodo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/todos/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const todoId = parseInt(req.params.id);
    const { title, description, completed, due_date, auto_delete } = req.body;
    
    const todo = await prisma.todo.updateMany({
      where: { 
        id: todoId, 
        user_id: userId 
      },
      data: {
        title,
        description,
        completed,
        due_date: due_date ? new Date(due_date) : null,
        auto_delete
      }
    });
    
    if (todo.count === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }
    
    const updatedTodo = await prisma.todo.findUnique({
      where: { id: todoId }
    });
    
    res.json(updatedTodo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/todos/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const todoId = parseInt(req.params.id);
    
    const todo = await prisma.todo.deleteMany({
      where: { 
        id: todoId, 
        user_id: userId 
      }
    });
    
    if (todo.count === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }
    
    res.json({ message: "Todo deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/todos/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const todoId = parseInt(req.params.id);
    
    const todo = await prisma.todo.deleteMany({
      where: { 
        id: todoId, 
        user_id: userId 
      }
    });
    
    if (todo.count === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }
    
    res.json({ message: "Todo deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-delete expired todos (run daily)
setInterval(async () => {
  try {
    const now = new Date();
    await prisma.todo.deleteMany({
      where: {
        auto_delete: true,
        due_date: {
          lt: now
        }
      }
    });
    console.log("Auto-deleted expired todos");
  } catch (err) {
    console.error("Error auto-deleting todos:", err);
  }
}, 24 * 60 * 60 * 1000); // Run every 24 hours

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});