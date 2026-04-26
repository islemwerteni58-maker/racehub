// Page "Détail d'une course"
(async function () {
  const id = new URLSearchParams(window.location.search).get("id");
  const main = document.getElementById("event-page");
  if (!id) {
    main.innerHTML = '<p class="empty">Course inconnue.</p>';
    return;
  }

  let evt, comments, session;
  try {
    [evt, comments, session] = await Promise.all([
      API.get(`/events/${id}`),
      API.get(`/events/${id}/comments`),
      API.get("/session"),
    ]);
  } catch {
    main.innerHTML = '<p class="empty">Impossible de charger cette course.</p>';
    return;
  }

  document.title = `${evt.name} — RaceHub`;

  const isRunner = session.user?.role === "runner";
  const isRegistered =
    session.user && evt.participants.some((p) => p.userId === session.user.id);

  const dist =
    evt.shortestDistanceKm != null
      ? evt.shortestDistanceKm === evt.longestDistanceKm
        ? `${evt.shortestDistanceKm} km`
        : `${evt.shortestDistanceKm}–${evt.longestDistanceKm} km`
      : "—";

  const courseOptions = evt.courses
    .map(
      (c) =>
        `<option value="${c.id}">${escapeHtml(c.name)} — ${c.distanceKm} km</option>`,
    )
    .join("");

  let inscriptionHtml;
  if (!session.user) {
    inscriptionHtml = `<div class="alert">Sélectionnez un utilisateur de démo pour vous inscrire.</div>`;
  } else if (!isRunner) {
    inscriptionHtml = `<div class="alert">Seuls les runners peuvent s'inscrire.</div>`;
  } else if (isRegistered) {
    inscriptionHtml = `<div class="alert">Vous êtes inscrit ✔</div>`;
  } else if (evt.status !== "confirmed") {
    inscriptionHtml = `<div class="alert">Inscriptions fermées</div>`;
  } else {
    inscriptionHtml = `
      <select id="course-select">${courseOptions}</select>
      <button class="btn btn-primary" id="register-btn">S'inscrire</button>
    `;
  }

  main.innerHTML = `
    <section class="event-hero">
      <div class="cover" style="background-image:url('${evt.coverImageUrl || ""}')"></div>
      <div class="gradient"></div>
      <div class="container">
        <div class="meta">
          <span class="meta-pill orange">${escapeHtml(evt.raceType.name)}</span>
          <span class="meta-pill"> ${formatDateFr(evt.date)}</span>
          <span class="meta-pill"> ${escapeHtml(evt.location)}</span>
        </div>
        <h1>${escapeHtml(evt.name)}</h1>
        <div class="organizer">
          <img src="${evt.organizer.photoUrl || ""}" alt="" />
          <div>
            <div class="label">Organisé par</div>
            <div style="font-weight:700">${escapeHtml(evt.organizer.name)}</div>
          </div>
        </div>
      </div>
    </section>

    <div class="container event-content">
      <div>
        <div class="block">
          <h2>Le concept</h2>
          <p>${escapeHtml(evt.description)}</p>
        </div>

        <div class="block">
          <h2>Parcours</h2>
          <div class="courses-list">
            ${evt.courses
              .map(
                (c) => `
                <div class="course-item">
                  <div class="distance">${c.distanceKm}<span style="font-size:1rem">km</span></div>
                  <div>
                    <div class="name">${escapeHtml(c.name)}</div>
                    <div class="elev">D+ ${c.elevationGainM ?? "—"} m</div>
                    ${c.description ? `<div class="desc">${escapeHtml(c.description)}</div>` : ""}
                  </div>
                  <div></div>
                </div>`,
              )
              .join("")}
          </div>
        </div>

        <div class="block">
          <h2>Programme</h2>
          <div class="programme-list">
            ${evt.programme
              .map(
                (p) => `
                <div class="programme-item">
                  <div class="time">${escapeHtml(p.time)}</div>
                  <div>
                    <div style="font-weight:700">${escapeHtml(p.title)}</div>
                    ${p.description ? `<div style="font-size:0.875rem;color:var(--grey-700)">${escapeHtml(p.description)}</div>` : ""}
                  </div>
                </div>`,
              )
              .join("")}
          </div>
        </div>

        <div class="block">
          <h2>Commentaires (${comments.length})</h2>
          <div class="comments-list" id="comments-list">
            ${comments.map(commentHtml).join("") || '<p class="empty">Soyez le premier à commenter.</p>'}
          </div>
          ${
            session.user
              ? `<form class="comment-form" id="comment-form">
                   <textarea id="comment-content" placeholder="Votre commentaire…" required></textarea>
                   <button type="submit" class="btn btn-primary" style="margin-top:0.75rem">Publier</button>
                 </form>`
              : ""
          }
        </div>
      </div>

      <aside>
        <div class="sidebar-card">
          <h3>Inscription</h3>
          <div class="stat-row"><span>Inscrits</span><span class="v">${evt.participantsCount}</span></div>
          <div class="stat-row"><span>Distances</span><span class="v">${dist}</span></div>
          <div class="stat-row"><span>Date</span><span class="v">${formatDateShortFr(evt.date)}</span></div>
          <div class="stat-row"><span>Statut</span><span class="v">${statusLabel(evt.status)}</span></div>
          ${inscriptionHtml}
        </div>
      </aside>
    </div>
  `;

  function commentHtml(c) {
    return `
      <div class="comment">
        <img src="${c.userPhotoUrl || ""}" alt="" />
        <div>
          <div class="author">
            <span class="name">${escapeHtml(c.userName)}</span>
            <span class="date">${formatDateShortFr(c.createdAt)}</span>
          </div>
          <div>${escapeHtml(c.content)}</div>
        </div>
      </div>
    `;
  }

  function statusLabel(s) {
    if (s === "confirmed") return "Confirmé";
    if (s === "pending") return "En attente";
    if (s === "cancelled") return "Annulé";
    return s;
  }

  // Inscription
  const regBtn = document.getElementById("register-btn");
  if (regBtn) {
    regBtn.addEventListener("click", async () => {
      regBtn.disabled = true;
      regBtn.textContent = "Inscription…";
      try {
        const courseId = Number(document.getElementById("course-select").value);
        await API.post(`/events/${id}/register`, {
          userId: session.user.id,
          courseId,
        });
        showToast("Inscription réussie ! Préparez-vous bien.");
        setTimeout(() => window.location.reload(), 800);
      } catch {
        showToast("Erreur lors de l'inscription", "error");
        regBtn.disabled = false;
        regBtn.textContent = "S'inscrire";
      }
    });
  }

  // Commentaire
  const cf = document.getElementById("comment-form");
  if (cf) {
    cf.addEventListener("submit", async (e) => {
      e.preventDefault();
      const content = document.getElementById("comment-content").value.trim();
      if (!content) return;
      try {
        await API.post(`/events/${id}/comments`, {
          userId: session.user.id,
          content,
        });
        window.location.reload();
      } catch {
        showToast("Erreur lors de la publication", "error");
      }
    });
  }
})();
