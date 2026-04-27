// Page "Profil" — change selon le rôle de l'utilisateur connecté
(async function () {
  const main = document.getElementById("profile-page");

  let session;
  try {
    session = await API.get("/session");
  } catch {
    main.innerHTML = '<p class="empty">Erreur</p>';
    return;
  }
  if (!session.user) {
    main.innerHTML = `
      <div style="min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4rem 1rem;text-align:center">
        <div style="font-family:'Anton',sans-serif;font-size:5rem;color:var(--orange);line-height:1"></div>
        <h2 style="font-family:'Anton',sans-serif;font-size:2rem;text-transform:uppercase;margin:1rem 0 0.5rem">Accès réservé</h2>
        <p style="color:var(--grey-700);margin-bottom:2rem">Connectez-vous pour accéder à votre espace.</p>
        <a href="/login.html" class="btn btn-primary">Se connecter →</a>
      </div>
    `;
    return;
  }

  const u = session.user;
  let detail;
  try {
    detail = await API.get(`/users/${u.id}`);
  } catch {
    main.innerHTML = '<p class="empty">Erreur de chargement</p>';
    return;
  }

  // Header commun
  const initial = u.name ? u.name[0].toUpperCase() : "?";
  let html = `
    <header class="profile-header">
      <div class="container">
        <div class="profile-avatar-wrap" id="avatar-wrap" title="Changer la photo">
          ${u.photoUrl
            ? `<img src="${u.photoUrl}" alt="" id="avatar-img" />`
            : `<div class="profile-avatar-initials" id="avatar-initials">${escapeHtml(initial)}</div>`
          }
          <div class="profile-avatar-overlay">
            
            <span class="profile-avatar-overlay-text">Changer la photo</span>
          </div>
          <input type="file" class="profile-avatar-input" id="avatar-file-input" accept="image/*" />
        </div>
        <div>
          <span class="role-badge">${u.role}</span>
          <h1>${escapeHtml(u.name)}</h1>
          <p style="color:var(--grey-200);margin-top:0.35rem">
            ${u.city ? ` ${escapeHtml(u.city)}` : ""}
            ${u.bio ? ` · ${escapeHtml(u.bio)}` : ""}
          </p>
        </div>
      </div>
    </header>
    <section class="container" style="padding:3rem 2rem">
  `;

  if (u.role === "runner")       html += renderRunner(detail);
  else if (u.role === "organizer") html += renderOrganizer(detail);
  else if (u.role === "admin")     html += await renderAdmin();

  html += "</section>";
  main.innerHTML = html;

  // Bind events
  if (u.role === "runner") bindRunnerEvents(u.id);
  if (u.role === "organizer") bindOrganizerEvents(u.id);
  if (u.role === "admin") bindAdminEvents();

  // ── Avatar upload ──────────────────────────────────────────────────
  bindAvatarUpload(u.id);
})();

// ============================================================
// Vue RUNNER — 
// ============================================================
function renderRunner(detail) {
  const upcoming = detail.upcomingRegistrations || [];
  const results = detail.results || [];

  // Stats summary bar
  const totalRaces = results.length;
  const bestRank = detail.bestRank;

  return `
    <!-- STATS ROW -->
    <div class="runner-stats-row">
      <div class="runner-stat-box">
        <span class="runner-stat-value">${totalRaces}</span>
        <span class="runner-stat-label">Courses</span>
      </div>
      <div class="runner-stat-box">
        <span class="runner-stat-value">${bestRank ?? '—'}</span>
        <span class="runner-stat-label">Meilleur rang</span>
      </div>
      <div class="runner-stat-box">
        <span class="runner-stat-value">${upcoming.length}</span>
        <span class="runner-stat-label">À venir</span>
      </div>
    </div>

    <!-- MES PROCHAINES COURSES -->
    <div class="runner-section-header">
      <h2 class="runner-section-title">
        <span class="runner-section-icon"></span>
        Mes prochaines courses
      </h2>
    </div>
    ${
      upcoming.length
        ? `<div class="events-grid">${upcoming.map((e) => eventCardHtml(e)).join("")}</div>`
        : '<p class="empty" style="padding:2rem 0">Aucune inscription à venir. <a href="/courses.html" style="color:var(--orange);font-weight:700">Explorer les courses →</a></p>'
    }

    <!-- MON PALMARES -->
    <div class="runner-section-header" style="margin-top:3rem">
      <h2 class="runner-section-title">
        <span class="runner-section-icon"></span>
        Mon palmarès
      </h2>
      <button class="btn btn-primary" id="add-result-btn" style="padding:0.625rem 1.25rem;font-size:0.8rem">
        + Ajouter
      </button>
    </div>

    ${
      results.length
        ? `<div class="palmares-table-wrap">
            <table class="palmares-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>COURSE</th>
                  <th>LIEU</th>
                  <th>TEMPS</th>
                  <th>RANG</th>
                </tr>
              </thead>
              <tbody>
                ${results
                  .map(
                    (r) => `
                  <tr>
                    <td class="palmares-date">${formatDateShortFr(r.eventDate)}</td>
                    <td class="palmares-name">${escapeHtml(r.eventName)}</td>
                    <td class="palmares-location">${escapeHtml(r.location)}</td>
                    <td>${escapeHtml(r.time || "—")}</td>
                    <td class="rank">${r.rank ?? "—"}</td>
                  </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>`
        : '<p class="empty" style="padding:2rem 0">Aucun résultat enregistré pour le moment.</p>'
    }
  `;
}

function bindRunnerEvents(userId) {
  const btn = document.getElementById("add-result-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    openFormModal(
      "Ajouter un résultat manuel",
      `
      <form id="add-result-form">
        <div class="form-group">
          <label>Nom de la course *</label>
          <input name="eventName" required placeholder="Ex: Marathon de Berlin" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Date *</label>
            <input name="eventDate" type="date" required />
          </div>
          <div class="form-group">
            <label>Lieu *</label>
            <input name="location" required placeholder="Ville, Pays" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Temps (HH:MM:SS)</label>
            <input name="time" placeholder="03:45:12" />
          </div>
          <div class="form-group">
            <label>Classement</label>
            <input name="rank" type="number" min="1" placeholder="14" />
          </div>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;margin-top:0.75rem">Enregistrer</button>
      </form>
      `,
      async (form) => {
        const data = Object.fromEntries(new FormData(form));
        if (data.rank) data.rank = Number(data.rank);
        await API.post(`/users/${userId}/results`, data);
        showToast("Résultat ajouté !");
        setTimeout(() => window.location.reload(), 600);
      },
    );
  });
}

// ============================================================
// Vue ORGANIZER — with multi-parcours + D+/D-
// ============================================================
function renderOrganizer(detail) {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;flex-wrap:wrap;gap:1rem">
      <h2 style="font-family:'Anton',sans-serif;font-size:2rem;text-transform:uppercase">Mes événements</h2>
      <button class="btn btn-primary" id="create-event-btn">+ Créer un événement</button>
    </div>
    ${
      detail.organizedEvents.length
        ? `<div class="events-grid">${detail.organizedEvents.map((e) => eventCardHtml(e)).join("")}</div>`
        : '<p class="empty">Vous n\'avez pas encore organisé d\'événement.</p>'
    }
  `;
}

async function bindOrganizerEvents(userId) {
  let raceTypes;
  try {
    raceTypes = await API.get("/race-types");
  } catch {
    raceTypes = [];
  }

  document.getElementById("create-event-btn").addEventListener("click", () => {
    openFormModal(
      "Créer un nouvel événement",
      `
      <form id="create-event-form">
        <div class="form-group">
          <label>Nom de l'événement *</label>
          <input name="name" required placeholder="Ex: Trail des Aiguilles Rouges" />
        </div>
        <div class="form-group">
          <label>Description *</label>
          <textarea name="description" rows="4" required placeholder="Décrivez votre événement…"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Date *</label>
            <input name="date" type="datetime-local" required />
          </div>
          <div class="form-group">
            <label>Lieu *</label>
            <input name="location" required placeholder="Ville, Région" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Type de course *</label>
            <select name="raceTypeId" required>
              ${raceTypes.map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label>Image de couverture (URL)</label>
            <input name="coverImageUrl" type="url" placeholder="https://…" />
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin:1.75rem 0 1rem">
          <h4 style="font-family:'Anton',sans-serif;text-transform:uppercase;margin:0">Parcours</h4>
          <button type="button" class="btn btn-dark" id="add-course-btn" style="padding:0.5rem 1rem;font-size:0.8rem">
            + Ajouter un parcours
          </button>
        </div>

        <div id="courses-container">
          <!-- Premier parcours -->
          ${buildCourseInputHtml(0)}
        </div>

        <p style="font-size:0.75rem;color:var(--grey-700);margin:1.25rem 0 1rem">
           Votre événement sera <strong>en attente</strong> jusqu'à validation par un admin.
        </p>
        <button type="submit" class="btn btn-primary" style="width:100%">Soumettre l'événement</button>
      </form>
      `,
      async (form) => {
        const data = Object.fromEntries(new FormData(form));

        // Collect all courses from the container
        const coursesContainer = form.querySelector("#courses-container");
        const courseBlocks = coursesContainer.querySelectorAll(".course-block");
        const courses = [];
        courseBlocks.forEach((block) => {
          const name = block.querySelector('[data-field="courseName"]')?.value?.trim();
          const distanceKm = block.querySelector('[data-field="distanceKm"]')?.value;
          const elevationGainM = block.querySelector('[data-field="elevationGainM"]')?.value;
          const elevationLossM = block.querySelector('[data-field="elevationLossM"]')?.value;
          if (name && distanceKm) {
            courses.push({
              name,
              distanceKm: Number(distanceKm),
              elevationGainM: elevationGainM ? Number(elevationGainM) : null,
              elevationLossM: elevationLossM ? Number(elevationLossM) : null,
            });
          }
        });

        if (!courses.length) {
          throw new Error("Ajoutez au moins un parcours.");
        }

        const body = {
          name: data.name,
          description: data.description,
          date: data.date,
          location: data.location,
          raceTypeId: Number(data.raceTypeId),
          organizerId: userId,
          coverImageUrl: data.coverImageUrl || null,
          courses,
          programme: [],
        };
        await API.post("/events", body);
        showToast("Événement soumis ! En attente de validation.");
        setTimeout(() => window.location.reload(), 800);
      },
    );

    // Add course button
    let courseCount = 1;
    document.getElementById("add-course-btn")?.addEventListener("click", () => {
      const container = document.getElementById("courses-container");
      const div = document.createElement("div");
      div.innerHTML = buildCourseInputHtml(courseCount);
      container.appendChild(div.firstElementChild);
      courseCount++;
    });

    // Delegate remove buttons
    document.getElementById("courses-container")?.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-course-btn")) {
        const block = e.target.closest(".course-block");
        if (block && document.querySelectorAll(".course-block").length > 1) {
          block.remove();
        }
      }
    });
  });
}

function buildCourseInputHtml(index) {
  return `
    <div class="course-block" style="border:2px solid var(--grey-200);padding:1.25rem;margin-bottom:0.75rem;position:relative">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <span style="font-weight:700;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--orange)">
          Parcours ${index + 1}
        </span>
        ${index > 0 ? `<button type="button" class="remove-course-btn" style="font-size:1.25rem;color:var(--grey-400);cursor:pointer;background:none;border:none;line-height:1">×</button>` : ""}
      </div>
      <div class="form-group">
        <label>Nom du parcours *</label>
        <input data-field="courseName" placeholder="Ex: 10 km, Semi-marathon, Grande Boucle" required />
      </div>
      <div class="form-row" style="grid-template-columns:1fr 1fr 1fr">
        <div class="form-group">
          <label>Distance (km) *</label>
          <input data-field="distanceKm" type="number" step="0.1" min="0" placeholder="21.1" required />
        </div>
        <div class="form-group">
          <label>D+ (m)</label>
          <input data-field="elevationGainM" type="number" min="0" placeholder="850" />
        </div>
        <div class="form-group">
          <label>D- (m)</label>
          <input data-field="elevationLossM" type="number" min="0" placeholder="850" />
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// Vue ADMIN
// ============================================================
async function renderAdmin() {
  let stats;
  try {
    stats = await API.get("/admin/stats");
  } catch {
    return '<p class="empty">Erreur de chargement</p>';
  }
  window.__adminStats = stats;

  return `
    <h2 style="font-family:'Anton',sans-serif;font-size:2rem;text-transform:uppercase;margin-bottom:1.5rem">Tableau de bord admin</h2>
    <div class="admin-stats">
      <div class="admin-stat"><div class="value">${stats.confirmedCount}</div><div class="label">Confirmés</div></div>
      <div class="admin-stat"><div class="value">${stats.pendingCount}</div><div class="label">En attente</div></div>
      <div class="admin-stat"><div class="value">${stats.cancelledCount}</div><div class="label">Annulés</div></div>
      <div class="admin-stat"><div class="value">${stats.runnersCount}</div><div class="label">Runners</div></div>
      <div class="admin-stat"><div class="value">${stats.organizersCount}</div><div class="label">Organisateurs</div></div>
      <div class="admin-stat"><div class="value">${stats.totalRegistrations}</div><div class="label">Inscriptions</div></div>
    </div>

    <div class="tabs">
      <button class="tab active" data-tab="pending">En attente (${stats.pendingCount})</button>
      <button class="tab" data-tab="confirmed">Confirmés (${stats.confirmedCount})</button>
    </div>
    <div id="admin-tab-content"></div>
  `;
}

function bindAdminEvents() {
  const stats = window.__adminStats;
  if (!stats) return;
  const tabs = document.querySelectorAll(".tab");
  const content = document.getElementById("admin-tab-content");

  function renderTab(name) {
    const events = name === "pending" ? stats.pendingEvents : stats.confirmedEvents;
    if (!events.length) {
      content.innerHTML = `<p class="empty">Aucun événement ${name === "pending" ? "en attente" : "confirmé"}.</p>`;
      return;
    }
    content.innerHTML = events
      .map(
        (e) => `
      <div style="display:grid;grid-template-columns:1fr auto;gap:1rem;align-items:center;padding:1.25rem;border:2px solid var(--grey-200);margin-bottom:0.75rem">
        <div>
          <div style="font-family:'Anton',sans-serif;text-transform:uppercase;font-size:1.25rem">${escapeHtml(e.name)}</div>
          <div style="font-size:0.85rem;color:var(--grey-700)">
             ${formatDateShortFr(e.date)} ·  ${escapeHtml(e.location)} · ${e.participantsCount} inscrits
          </div>
        </div>
        <div style="display:flex;gap:0.5rem">
          ${
            name === "pending"
              ? `<button class="btn btn-primary" data-action="confirm" data-id="${e.id}">Valider</button>
                 <button class="btn btn-dark" data-action="cancel" data-id="${e.id}">Refuser</button>`
              : `<a href="/course.html?id=${e.id}" class="btn btn-ghost">Voir →</a>
                 <button class="btn btn-dark" data-action="cancel" data-id="${e.id}">Annuler</button>`
          }
        </div>
      </div>`,
      )
      .join("");

    content.querySelectorAll("button[data-action]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        btn.disabled = true;
        try {
          await API.post(`/admin/events/${id}/${action}`);
          showToast(action === "confirm" ? "Événement validé !" : "Événement annulé.");
          setTimeout(() => window.location.reload(), 600);
        } catch {
          showToast("Erreur", "error");
          btn.disabled = false;
        }
      });
    });
  }

  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      tabs.forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      renderTab(t.dataset.tab);
    });
  });

  renderTab("pending");
}

// ============================================================
// Modale formulaire générique
// ============================================================
function openFormModal(title, bodyHtml, onSubmit) {
  const modal = document.getElementById("form-modal");
  const content = document.getElementById("form-modal-content");
  content.innerHTML = `
    <div class="modal-header" style="background:var(--white);color:var(--black);border-bottom:4px solid var(--orange)">
      <h2>${escapeHtml(title)}</h2>
    </div>
    <div class="modal-body">${bodyHtml}</div>
  `;
  modal.classList.add("open");
  const form = content.querySelector("form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Envoi…";
    try {
      await onSubmit(form);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Erreur lors de l'envoi", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Soumettre l'événement";
    }
  });
}

// ============================================================
// Avatar upload
// ============================================================
function bindAvatarUpload(userId) {
  const wrap = document.getElementById("avatar-wrap");
  const fileInput = document.getElementById("avatar-file-input");
  if (!wrap || !fileInput) return;

  // Clicking the wrap triggers the hidden file input
  wrap.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    // Validate type and size (max 5 MB)
    if (!file.type.startsWith("image/")) {
      showToast("Veuillez choisir une image.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("L'image ne doit pas dépasser 5 Mo.", "error");
      return;
    }

    // Show spinner inside the avatar wrap
    const spinner = document.createElement("div");
    spinner.className = "avatar-upload-spinner";
    spinner.innerHTML = '<div class="spinner"></div>';
    wrap.appendChild(spinner);

    try {
      // Convert to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); // data:image/...;base64,...
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Send to server
      const r = await fetch(`/api/users/${userId}/photo`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoDataUrl: base64 }),
      });
      if (!r.ok) throw new Error("Erreur serveur");
      const data = await r.json();

      // Update avatar in the DOM without full reload
      const photoUrl = data.photoUrl;
      const existingImg = document.getElementById("avatar-img");
      const existingInitials = document.getElementById("avatar-initials");

      if (existingImg) {
        existingImg.src = photoUrl;
      } else if (existingInitials) {
        // Replace initials div with an img
        const img = document.createElement("img");
        img.src = photoUrl;
        img.alt = "";
        img.id = "avatar-img";
        existingInitials.replaceWith(img);
      }

      // Also update navbar avatar if present
      const navAvatar = document.querySelector(".user-avatar");
      if (navAvatar) navAvatar.src = photoUrl;
      const navInitial = document.querySelector(".user-initial");
      if (navInitial) navInitial.style.display = "none";
      if (navAvatar) navAvatar.style.display = "";

      showToast("Photo de profil mise à jour !");
    } catch (err) {
      console.error(err);
      showToast("Erreur lors du téléchargement.", "error");
    } finally {
      spinner.remove();
      fileInput.value = ""; // reset so same file can be re-selected
    }
  });
}

function closeFormModal() {
  document.getElementById("form-modal").classList.remove("open");
}