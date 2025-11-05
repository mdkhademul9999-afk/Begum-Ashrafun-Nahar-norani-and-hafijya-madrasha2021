amar-shikkha/
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── Procfile
│   ├── README.md
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── index.js
│       ├── middlewares/
│       │   └── auth.js
│       └── routes/
│           ├── auth.js
│           ├── students.js
│           ├── teachers.js
│           ├── fees.js
│           ├── attendance.js
│           └── results.js
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── App.js
        └── styles.css
        {
  "name": "amar-shikkha-backend",
  "version": "1.0.0",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "prisma": "prisma"
  },
  "dependencies": {
    "@prisma/client": "^5.4.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.0",
    "prisma": "^5.4.0"
  }
}
# Copy to .env and set values
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME"
JWT_SECRET="change_this_to_a_long_random_secret"
PORT=5000
FRONTEND_URL="http://localhost:3000"
web: node src/index.js
Amar Shikkha — Backend README (Short)

Local dev:
1. cp .env.example .env and set DATABASE_URL and JWT_SECRET
2. npm install
3. npx prisma generate
4. npx prisma migrate dev --name init
5. npm run dev

Prisma:
- schema in prisma/schema.prisma
- Use Render Managed Postgres in production; set DATABASE_URL in Render env vars.

Deploy to Render:
- Create Managed Postgres -> get DATABASE_URL
- Create Web Service (root: backend)
- Build Command: npm ci && npx prisma generate && npx prisma migrate deploy
- Start Command: npm start
- Add env vars in Render
- import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth.js";
import studentsRoutes from "./routes/students.js";
import teachersRoutes from "./routes/teachers.js";
import feesRoutes from "./routes/fees.js";
import attendanceRoutes from "./routes/attendance.js";
import resultsRoutes from "./routes/results.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// attach prisma to req.app for routes
app.locals.prisma = prisma;

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/teachers", teachersRoutes);
app.use("/api/fees", feesRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/results", resultsRoutes);

// Serve frontend build if exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../../frontend/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/build", "index.html"));
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log("✅ Server running on port", port));
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

/**
 * requireAuth: সাধারণ টোকেন যাচাই
 * requireRole(role): নির্দিষ্ট role (e.g., "admin", "teacher") চেক করে; ADMIN হলে সবকিছু করতে পারবে
 */

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "টোকেন মিসিং" });
  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "ভুল বা মেয়াদ উত্তীর্ণ টোকেন" });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "প্রবেশাধিকার নেই" });
    if (req.user.role === "ADMIN" || req.user.role === role) return next();
    return res.status(403).json({ error: "এই অপশন ব্যবহারের অনুমতি নেই" });
  };
}
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// register (for demo, open register; in production restrict to admin)
router.post("/register", async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { name, email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: "ইমেইল ও পাসওয়ার্ড লাগবে" });
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { name: name || email, email, password: hashed, role: role || "student" }
    });
    res.json({ message: "নিবন্ধন সফল", user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    res.status(400).json({ error: "ইমেইল পূর্বে ব্যবহার করা হয়েছে" });
  }
});

// login
router.post("/login", async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: "ব্যবহারকারী পাওয়া যায়নি" });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: "পাসওয়ার্ড ভুল" });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ message: "লগইন সফল", token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

export default router;
import express from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// GET /api/students
router.get("/", requireAuth, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const students = await prisma.student.findMany({ include: { fees: true, attendance: true, results: true } });
  res.json(students);
});

// POST /api/students (admin)
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { name, class: className, section, guardian, address, photoUrl } = req.body;
  const student = await prisma.student.create({
    data: { name, class: className || "", section, guardian, address, photoUrl }
  });
  res.json({ message: "ছাত্র যুক্ত হয়েছে", student });
});

// GET /api/students/:id
router.get("/:id", requireAuth, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const id = Number(req.params.id);
  const student = await prisma.student.findUnique({ where: { id }, include: { fees: true, attendance: true, results: true } });
  if (!student) return res.status(404).json({ error: "নথি পাওয়া যায়নি" });
  res.json(student);
});

// PUT /api/students/:id (admin)
router.put("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const id = Number(req.params.id);
  const data = req.body;
  const student = await prisma.student.update({ where: { id }, data });
  res.json({ message: "আপডেট হয়েছে", student });
});

// DELETE /api/students/:id (admin)
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const id = Number(req.params.id);
  await prisma.student.delete({ where: { id }});
  res.json({ message: "মুছে ফেলা হয়েছে" });
});

export default router;
import express from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// GET teachers
router.get("/", requireAuth, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const teachers = await prisma.teacher.findMany();
  res.json(teachers);
});

// POST teacher (admin) - also creates a User for teacher
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { name, email, password, subject, salary } = req.body;
  // create user
  const hashed = await bcrypt.hash(password || "password", 10);
  const user = await prisma.user.create({ data: { name, email, password: hashed, role: "teacher" }});
  const teacher = await prisma.teacher.create({ data: { name, subject, salary: Number(salary) || 0 }});
  res.json({ message: "শিক্ষক যোগ করা হয়েছে", user, teacher });
});

export default router;
import express from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// GET fees
router.get("/", requireAuth, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const fees = await prisma.fee.findMany({ include: { student: true }});
  res.json(fees);
});

// POST fee (admin)
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { studentId, month, amount, paid } = req.body;
  const fee = await prisma.fee.create({
    data: { studentId: Number(studentId), month, amount: Number(amount), paid: Boolean(paid), paidAt: paid ? new Date() : null }
  });
  res.json({ message: "বেতন রেকর্ড হয়েছে", fee });
});

export default router;
import express from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// GET all results
router.get("/", requireAuth, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const results = await prisma.result.findMany({ include: { student: true }});
  res.json(results);
});

// POST (teacher)
router.post("/", requireAuth, requireRole("teacher"), async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { studentId, subject, marks, total } = req.body;
  const r = await prisma.result.create({
    data: { studentId: Number(studentId), subject, marks: Number(marks), total: Number(total) }
  });
  res.json({ message: "রেজাল্ট সেভ হয়েছে", result: r });
});

export default router;
{
  "name": "amar-shikkha-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  }
}
<!doctype html>
<html lang="bn">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>আমার শিক্ষা - মাদ্রাসা ম্যানেজমেন্ট</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
import React, { useEffect, useState } from "react";

function App() {
  const [students, setStudents] = useState([]);
  const [name, setName] = useState("");

  const API = process.env.REACT_APP_API_URL || "";

  useEffect(() => {
    fetch(API + "/api/students")
      .then(r => r.json())
      .then(setStudents)
      .catch(() => setStudents([]));
  }, []);

  const addStudent = async () => {
    if (!name) return alert("নাম দিন");
    const res = await fetch(API + "/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, class: "৫ম" })
    });
    const data = await res.json();
    alert(data.message || "সম্পন্ন");
    // reload
    const s = await fetch(API + "/api/students").then(r => r.json());
    setStudents(s);
    setName("");
  };

  return (
    <div className="container">
      <h1>🕌 আমার শিক্ষা — মাদ্রাসা ম্যানেজমেন্ট</h1>

      <div className="card">
        <h2>ছাত্র-ছাত্রী</h2>
        <input placeholder="নাম লিখুন" value={name} onChange={e=>setName(e.target.value)} />
        <button onClick={addStudent}>ছাত্র যোগ করুন</button>

        <ul>
          {students.map(s => (
            <li key={s.id}>{s.name} — {s.class}</li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>দ্রুত লিংক</h2>
        <p>আপনি এখানে লজিক বর্ধন করে শিক্ষক, বেতন, উপস্থিতি ইত্যাদি ম্যানেজ করতে পারবেন।</p>
      </div>
    </div>
  );
}

export default App;
body {
  font-family: "Noto Sans Bengali", Arial, sans-serif;
  background: #f5f7fb;
  color: #111;
  padding: 20px;
}
.container {
  max-width: 900px;
  margin: 0 auto;
}
.card {
  background: #fff;
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 12px;
}
input {
  padding: 8px;
  font-size: 16px;
  margin-right: 8px;
}
button {
  padding: 8px 12px;
  background: #007bff;
  color: #fff;
  border: none;
  cursor: pointer;
}
button:hover { opacity: 0.95; }
ul { margin-top: 10px; list-style: none; padding-left: 0; }
cd amar-shikkha/backend
npm install
cp .env.example .env
# .env-এ DATABASE_URL ও JWT_SECRET চেক করুন
npx prisma generate
npx prisma migrate dev --name init
npm run dev
cd ../frontend
npm install
npm start
