
## 🔧 Major Challenges Faced & How I Solved Them

### 1️⃣ MongoDB Connection Failed (ENOTFOUND / Authentication Error)

**Problem:**
MongoDB did not connect and showed:

```
querySrv ENOTFOUND
bad auth : Authentication failed
```

**Root Cause:**

* I used an incorrect MongoDB Atlas cluster hostname
* My database password contained special characters (`@`) that broke the URI

**Solution:**

* I copied the exact connection string from MongoDB Atlas → Drivers
* I reset the database user password to a simple one
* I stored the connection string in `.env`

```env
MONGO_URI=mongodb+srv://serviceadmin:Mongo12345@cluster0.xxxx.mongodb.net/serviceDB
```

**Learning:**

> Always use Atlas-generated URI and store it in environment variables.

---

### 2️⃣ JWT Login Failed – “secretOrPrivateKey must have a value”

**Problem:**
Login API returned:

```
Error: secretOrPrivateKey must have a value
```

**Root Cause:**
JWT secret was not defined in `.env`.

**Solution:**
Added this to `.env`:

```env
JWT_SECRET=MyServiceAppJwtSecret2026
```

and restarted the server.

**Learning:**

> JWT always requires a secret key to sign and verify tokens.

---

### 3️⃣ Status Update API returned “Request not found”

**Problem:**
Admin could not update ticket status, and email was not sent.

**Root Cause:**
MongoDB uses `_id` but my frontend was sending `id` or ticket number.

**Solution:**
I updated the UI to always use MongoDB `_id` in API calls:

```js
<button data-id="${req._id}">
```

while showing `REQ-000001` only for display.

**Learning:**

> Use business IDs for UI, database IDs for API.

---

### 4️⃣ Email was sent but showed wrong ID & status

**Problem:**
Email content was incorrect:

```
Status: Closed → undefined
```

**Root Cause:**
Wrong parameters were passed to `sendStatusEmail()`.

**Solution:**
I passed the full `request` object and extracted fields properly.

**Learning:**

> Always align function parameters with what is being passed.

---

### 5️⃣ Gmail email sending failed

**Problem:**
Nodemailer showed:

```
Missing credentials for "PLAIN"
```

**Root Cause:**
Environment variables were named incorrectly.

**Solution:**
Used correct `.env` keys:

```env
EMAIL_USER=mygmail@gmail.com
EMAIL_PASS=my_app_password
```

---

## 🧠 What I Learned From This Project

* How JWT authentication works
* How MongoDB `_id` differs from business ticket numbers
* How to use environment variables securely
* How to debug production-level issues
* How real ticketing systems generate auto-increment IDs

---
---

