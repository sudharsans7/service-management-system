// ================== CONFIG ==================
const API_URL = "http://localhost:5000/requests";
const AUTH_LOGIN_URL = "http://localhost:5000/auth/login";

// ================== VIEW STATE ==================
let currentView = "user"; // "user" | "admin"

// ================== HELPERS ==================
function getToken() {
  return localStorage.getItem("token");
}

function setThemeIcon() {
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;
  toggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
}

function setAuthUI() {
  const token = getToken();

  // Navbar auth
  const navUser = document.getElementById("navUser");
  const navLogout = document.getElementById("navLogout");
  if (navUser) navUser.textContent = token ? "Admin" : "User";
  if (navLogout) navLogout.style.display = token ? "inline-block" : "none";

  // AuthBox buttons (optional)
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  if (loginBtn) loginBtn.style.display = token ? "none" : "inline-block";
  if (logoutBtn) logoutBtn.style.display = token ? "inline-block" : "none";

  const authMsg = document.getElementById("authMsg");
  if (authMsg) authMsg.textContent = token ? "Admin logged in ✅" : "Not logged in";
}

function renderView() {
  const token = getToken();

  // Show/hide auth box based on view
  const authBox = document.querySelector(".authBox");
  if (authBox) authBox.style.display = currentView === "admin" ? "block" : "none";

  // Active tab highlight
  const userBtn = document.getElementById("userViewBtn");
  const adminBtn = document.getElementById("adminViewBtn");
  if (userBtn && adminBtn) {
    userBtn.classList.toggle("active", currentView === "user");
    adminBtn.classList.toggle("active", currentView === "admin");
  }

  // If admin view and not logged in: don't kick back, just show message
  const authMsg = document.getElementById("authMsg");
  if (currentView === "admin" && !token && authMsg) {
    authMsg.textContent = "Admin login required to update status.";
  }

  setAuthUI();
  loadRequests();
}


// ================== THEME TOGGLE ==================
(function initTheme() {
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
    setThemeIcon();
  });

  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }
  setThemeIcon();
})();

// ================== NAV BUTTONS ==================
(function initNav() {
  const userViewBtn = document.getElementById("userViewBtn");
  const adminViewBtn = document.getElementById("adminViewBtn");
  const navLogout = document.getElementById("navLogout");

  if (userViewBtn) {
    userViewBtn.addEventListener("click", () => {
      currentView = "user";
      renderView();
    });
  }

  if (adminViewBtn) {
    adminViewBtn.addEventListener("click", () => {
      currentView = "admin";
      renderView();
    });
  }

  if (navLogout) {
    navLogout.addEventListener("click", () => {
      localStorage.removeItem("token");
      currentView = "user";
      renderView();
    });
  }
})();

// ================== AUTH (ADMIN LOGIN) ==================
(function initAuthBox() {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const authMsg = document.getElementById("authMsg");

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const email = (document.getElementById("loginEmail")?.value || "").trim();
      const password = document.getElementById("loginPassword")?.value || "";

      if (!email || !password) {
        if (authMsg) authMsg.textContent = "Enter admin email + password";
        return;
      }

      const resp = await fetch(AUTH_LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        if (authMsg) authMsg.textContent = data.message || "Login failed";
        return;
      }

      localStorage.setItem("token", data.token);
      if (authMsg) authMsg.textContent = "Login success ✅";
      currentView = "admin";
      renderView();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      currentView = "user";
      renderView();
    });
  }
})();

// ================== CREATE REQUEST (USER) ==================
(function initForm() {
  document.getElementById("requestForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const category = document.getElementById("category").value;
  const email = document.getElementById("email").value.trim();
  const description = document.getElementById("description").value.trim();

  const resp = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, category, email, description })
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    alert(data.message || "Failed to create request");
    return;
  }

  this.reset();
  await loadRequests(); 
});

})();

// ================== LOAD + RENDER REQUESTS ==================

async function loadRequests() {
  const res = await fetch(API_URL, { cache: "no-store" });
  const data = await res.json();

  const table = document.getElementById("requestTable");
  table.innerHTML = "";

  const token = getToken();
  const isAdmin = currentView === "admin" && !!token;

  data.forEach((req) => {
    const mongoId = req._id;
    if (!mongoId) console.warn("Missing _id for request:", req);
    const rid = req._id || req.id; // Mongo _id fallback
    const ticket = req.ticketNo
      ? `REQ-${String(req.ticketNo).padStart(6, "0")}`
      : (rid || "-");

    // support both Mongo timestamps and your old createdAt string
    const createdRaw = req.createdAt || req.createdAtCustom || req.created_at || "";
    const created = createdRaw ? new Date(createdRaw).toLocaleString() : "-";

    table.innerHTML += `
      <tr>
        <td>${ticket}</td>
        <td>${req.title || "-"}</td>
        <td>${req.category || "-"}</td>

        <td>
          ${req.status || "Open"}
          ${isAdmin ? `
            <div style="margin-top:8px;">
              <select class="statusSelect" data-id="${mongoId}">
                <option value="Open" ${req.status === "Open" ? "selected" : ""}>Open</option>
                <option value="In Progress" ${req.status === "In Progress" ? "selected" : ""}>In Progress</option>
                <option value="Closed" ${req.status === "Closed" ? "selected" : ""}>Closed</option>
              </select>
            </div>
          ` : ``}
        </td>

        <td>${created}</td>

        <td>
          ${isAdmin ? `<button class="updateBtn" data-id="${mongoId}" type="button">Update</button>` : "—"}
        </td>
      </tr>
    `;
  });

  // ✅ Wire update buttons (Admin)
  if (!isAdmin) return;

  document.querySelectorAll(".updateBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const sel = document.querySelector(`.statusSelect[data-id="${id}"]`);
      const newStatus = sel?.value;

      if (!id) return alert("Missing request id");
      if (!newStatus) return alert("Select a status first");

      const resp = await fetch(`${API_URL}/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const raw = await resp.text();
      if (!resp.ok) return alert(`Failed (${resp.status})\n${raw}`);

      loadRequests();
    });
  });
}



// ================== INIT ==================
renderView();
loadRequests();
