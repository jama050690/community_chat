import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Pool } from "pg";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { createServer } from "http";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
/* =======================
   HTTP SERVER & SOCKET.IO
======================= */

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const browsers = [];

io.on("connection", (browser) => {
  browsers.push(browser);
  console.log("foydalanuvchi ulandi");

  browser.on("NEW_MESSAGE", async (data) => {
    // Xabarni databasega saqlash
    console.log(data.user + "dan xabar keldi: ", data.message);

    await pool.query(
      `INSERT INTO ${MESSAGES_TABLE} (username, message, avatar) VALUES ($1, $2, $3)`,
      [data.user, data.message, data.avatar],
    );

    // Hammaga yuborish
    for (const b of browsers) {
      b.emit("NEW_MESSAGE", data);
    }
  });

  browser.on("TYPING", (user) => {
    for (const b of browsers) {
      b.emit("TYPING", user);
    }
  });

  browser.on("disconnect", () => {
    const index = browsers.indexOf(browser);
    if (index > -1) {
      browsers.splice(index, 1);
    }
  });
});

/* =======================
   MULTER (AVATAR UPLOAD)
======================= */

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage });

/* =======================
   AUTH MIDDLEWARE
======================= */

// Middleware
app.use(
  cors({
    origin: true, // frontend port
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Posts middleware
const authMiddleware = (req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.sendStatus(403);
  }
};

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const USER_TABLE = "users";

// INIT DB
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${USER_TABLE} (
      id SERIAL PRIMARY KEY,
      username VARCHAR(25) UNIQUE NOT NULL,
      email VARCHAR(35) NOT NULL,
      password_hash TEXT NOT NULL,
      age INT NOT NULL,
      gender BOOLEAN NOT NULL,
      avatar TEXT
    );
  `);
  // Add avatar column if it doesn't exist (for existing tables)
  await pool.query(`
    ALTER TABLE ${USER_TABLE} ADD COLUMN IF NOT EXISTS avatar TEXT;
  `);
  console.log(`${new Date().toISOString()} Database ishga tushirildi`);
}
initDb();

// Messages - barcha xabarlarni olish
app.get("/api/messages", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM ${MESSAGES_TABLE} ORDER BY created_at ASC`,
  );
  res.json(rows);
});
const MESSAGES_TABLE = "messages";

async function initMessagesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${MESSAGES_TABLE} (
      id SERIAL PRIMARY KEY,
      username VARCHAR(25) NOT NULL,
      message TEXT NOT NULL,
      avatar TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log("Messages table tayyor");
}

initMessagesTable();

/**
 * User Sign up
 */
app.post("/api/signup", async (req, res) => {
  console.log(
    `${new Date().toISOString()} da ${req.url}ga ${req.method} API chaqiruv keldi.`,
  );

  const { username, email, password, age, gender } = req.body;
  if (!username || !password || !email || !age || !gender)
    return res.status(400).json({ message: "Missing fields" });

  const hashed = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query(
      `INSERT INTO ${USER_TABLE} (username, email, password_hash, age, gender) VALUES ($1,$2, $3, $4, $5) RETURNING id, username`,
      [username, email, hashed, age, gender],
    );
    res.json({ message: "User registered", user: result.rows[0] });
  } catch (err) {
    console.error(err.message || err);
    res.status(400).json({
      message: `User ro'yhatdan o'tishda xatolik yuz berdi: ${err.message || err}`,
    });
  }
});

// ==================
// LOGIN
// ==================

app.post("/api/login", upload.single("profilePic"), async (req, res) => {
  console.log(
    `${new Date().toISOString()} da ${req.url}ga ${req.method} API chaqiruv keldi.`,
  );
  const { username, password } = req.body;
  const result = await pool.query(
    `SELECT * FROM ${USER_TABLE} WHERE username=$1`,
    [username],
  );

  if (result.rowCount === 0) {
    console.log(result.rowCount);
    return res.status(401).json({ message: "Invalid credentials" });
  }
  console.log(result.rowCount);

  const user = result.rows[0];
  const match = await bcrypt.compare(password, user.password_hash);
  console.log(match);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  // Agar yangi avatar yuklangan bo'lsa, uni saqlash
  let avatarPath = user.avatar;
  if (req.file) {
    avatarPath = `/uploads/${req.file.filename}`;
    await pool.query(`UPDATE ${USER_TABLE} SET avatar=$1 WHERE id=$2`, [
      avatarPath,
      user.id,
    ]);
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      is_premium: user.is_premium,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

  res.cookie("access_token", token, { httpOnly: true, sameSite: "lax" });
  res.json({
    message: "Login success",
    user: {
      username: user.username,
      avatar: avatarPath,
    },
  });
});

// ==================
// GET CURRENT USER
// ==================
app.get("/api/me", (req, res) => {
  console.log(
    `${new Date().toISOString()} da ${req.url}ga ${req.method} API chaqiruv keldi.`,
  );
  const token = req.cookies.access_token;
  if (!token) return res.sendStatus(401);

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user });
  } catch {
    res.sendStatus(403);
  }
});

// START SERVER
httpServer.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`Socket.IO server is also running on port ${PORT}`);
});
