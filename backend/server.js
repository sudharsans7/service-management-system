require("dotenv").config();
const Request = require("./models/Request");
const Counter = require("./models/Counter");


const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

mongoose
.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log("Mongo error:", err.message));



const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
transporter.verify()
  .then(() => console.log("Mail transporter ready"))
  .catch((err) => console.log("Mail transporter error:", err.message));


function sendStatusEmail(to, request, oldStatus, newStatus) {
  const ticket = request.ticketNo
    ? `REQ-${String(request.ticketNo).padStart(6, "0")}`
    : request._id.toString().slice(-6);

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: `${ticket} — Status Updated`,
    text: `Hello,

Your service request has been updated.

Ticket: ${ticket}
Title: ${request.title}
Category: ${request.category}
Old Status: ${oldStatus}
New Status: ${newStatus}

Thank you,
Service Management System
`
  });
}



function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function auth(req, res, next) {
  const header = req.headers.authorization;   // "Bearer <token>"
  if (!header) return res.status(401).json({ message: "Missing Authorization header" });

  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token)
    return res.status(401).json({ message: "Invalid auth format" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  next();
}

let users = [];
let userId = 1;

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function auth(req, res, next) {
  const header = req.headers.authorization; // "Bearer <token>"
  if (!header) return res.status(401).json({ message: "Missing Authorization header" });

  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return res.status(401).json({ message: "Invalid auth format" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid/expired token" });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access required" });
  next();
}


let requests = [];
let id = 1;

app.post("/auth/register", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) return res.status(400).json({ message: "Email & password required" });

  const exists = users.find(u => u.email === email);
  if (exists) return res.status(409).json({ message: "Email already registered" });

  const hashed = await bcrypt.hash(password, 10);

  const user = {
    id: userId++,
    email,
    password: hashed,
    role: role === "admin" ? "admin" : "user"
  };

  users.push(user);
  res.status(201).json({ message: "Registered", user: { id: user.id, email: user.email, role: user.role } });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = createToken(user);
  res.json({ message: "Login success", token, user: { id: user.id, email: user.email, role: user.role } });
});


app.get("/requests", async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/requests", async (req, res) => {
  const { title, category, email } = req.body;

  if (!email) return res.status(400).json({ message: "Email required" });

  const counter = await Counter.findOneAndUpdate(
    { name: "request" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const newRequest = await Request.create({
    title,
    category,
    email,
    ticketNo: counter.seq
  });

  res.status(201).json(newRequest);
});

app.put("/requests/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const id = req.params.id;

    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const oldStatus = request.status;
    request.status = status;
    await request.save();

    // send email
    try {
      await sendStatusEmail(request.email, request, oldStatus, status);
    } catch (err) {
      console.log("Mail failed:", err.message);
    }

    res.json({ message: "Status updated", request });
  } catch (err) {
    console.log("Status update error:", err.message);
    res.status(500).json({ message: err.message });
  }
});


app.listen(5000, () => {
    console.log("Server running on port 5000");
});

app.get("/", (req, res) => {
  res.send("API OK - Service Management Backend");
});
