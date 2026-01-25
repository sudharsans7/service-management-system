const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sudharsansrinivasan621@gmail.com",
    pass: "bjsu ozfr xfyi jrbd"
  }
});

function sendStatusEmail(to, id, title, oldStatus, newStatus) {
  return transporter.sendMail({
    from: "yourgmail@gmail.com",
    to,
    subject: `Request #${id} status updated`,
    text: `
Hello,

Your service request has been updated.

Request ID: ${id}
Title: ${title}
Status: ${oldStatus} → ${newStatus}

Thank you.
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


app.get("/requests", (req, res) => {
    res.json(requests);
});

app.post("/requests", (req, res) => {
    const { title, category,email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const newRequest = {
        id: id++,
        title,
        category,
        email,
        status: "Open",
        createdAt: new Date().toLocaleString()
    };

    requests.push(newRequest);
    res.status(201).json(newRequest);
});

app.put("/requests/:id/status", auth, adminOnly, async (req, res) => {
    const requestId = Number(req.params.id);
    const { status } = req.body;

    if (!status) return res.status(400).json({ message: "Status required" });

    const request = requests.find(r => r.id === requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const oldStatus = request.status;
    const newStatus = status;

    if (oldStatus === newStatus) {
        return res.json({ message: "No change", request });
    }

    request.status = newStatus;

let emailSent = false;

try {
  const info = await sendStatusEmail(request.email, request.id, request.title, oldStatus, newStatus);
  emailSent = true;
  console.log("Email sent:", info.response);
} catch (err) {
  console.log("Email failed:", err.message);
}

res.json({ message: "Status updated", request, emailSent });



    res.json({ message: "Status updated", request });
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});

app.get("/", (req, res) => {
  res.send("API OK - Service Management Backend");
});
