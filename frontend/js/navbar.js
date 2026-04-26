// Construit la barre de navigation avec bouton Connexion / menu utilisateur connecté.

(async function buildNavbar() {
  const root = document.getElementById("navbar-root");
  if (!root) return;

  const path = window.location.pathname;
  const isHome = path === "/" || path.endsWith("/index.html");
  const isCourses = path.endsWith("/courses.html") || path.endsWith("/course.html");
  const isRunners = path.endsWith("/runners.html");

  // Charge la session courante
  let session;
  try {
    session = await API.get("/session");
  } catch {
    session = { user: null };
  }

  const u = session.user;

  let authHtml;
  if (!u) {
    authHtml = `
      <a href="/login.html" class="btn btn-primary" style="padding:0.625rem 1.25rem;font-size:0.8rem">
        Connexion / Inscription
      </a>
    `;
  } else {
    authHtml = `
      <div class="user-menu" id="user-menu">
        <button class="user-menu-btn" id="user-menu-toggle">
          <img src="${u.photoUrl || ''}" alt="" class="user-avatar" onerror="this.style.display='none'" />
          <span class="user-initial" style="${u.photoUrl ? 'display:none' : ''}">${escapeHtml(u.name[0])}</span>
          <span>${escapeHtml(u.name.split(' ')[0])}</span>
          <span style="font-size:0.7rem">▾</span>
        </button>
        <div class="user-menu-dropdown" id="user-menu-dropdown">
          <div class="user-menu-header">
            <div style="font-weight:700">${escapeHtml(u.name)}</div>
            <div style="font-size:0.75rem;color:var(--orange);text-transform:uppercase;letter-spacing:0.05em">${u.role}</div>
          </div>
          <a href="/profile.html" class="user-menu-item"> Mon profil</a>
          <button class="user-menu-item" id="logout-btn" style="width:100%;text-align:left"> Déconnexion</button>
        </div>
      </div>
    `;
  }

  root.innerHTML = `
    <nav class="navbar">
      <a href="/" class="navbar-logo">
        
        <span>RACE<span class="accent">HUB</span><span/>
      </a>

      <ul class="navbar-links">
        <li><a href="/" class="${isHome ? "active" : ""}">Accueil</a></li>
        <li><a href="/courses.html" class="${isCourses ? "active" : ""}">Toutes les courses</a></li>
        <li><a href="/runners.html" class="${isRunners ? "active" : ""}">Runners</a></li>
      </ul>

      <div>${authHtml}</div>
    </nav>
  `;

  // User menu toggle
  const toggle = document.getElementById("user-menu-toggle");
  const dropdown = document.getElementById("user-menu-dropdown");
  if (toggle && dropdown) {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("open");
    });
    document.addEventListener("click", () => dropdown.classList.remove("open"));
  }

  // Logout
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await API.post("/auth/logout", {});
      } catch {}
      window.location.href = "/login.html";
    });
  }
})();