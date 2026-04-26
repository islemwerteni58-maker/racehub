// Page "Runners"
(async function () {
  const grid = document.getElementById("runners-grid");
  let runners = [];
  try {
    runners = await API.get("/users?role=runner");
  } catch {
    grid.innerHTML = '<p class="empty">Erreur de chargement.</p>';
    return;
  }

  if (!runners.length) {
    grid.innerHTML = '<p class="empty">Aucun runner pour le moment.</p>';
    return;
  }

  grid.innerHTML = runners
    .map(
      (u) => `
      <div class="runner-card" data-uid="${u.id}">
        <img src="${u.photoUrl || ""}" alt="" />
        <div class="name">${escapeHtml(u.name)}</div>
        <div class="city"> ${escapeHtml(u.city || "—")}</div>
        <hr />
        <div class="stats">
          <div>
            <span class="v">${u.racesCount}</span>
            Courses
          </div>
          <div>
            <span class="v">${u.bestRank ?? "—"}</span>
            Meilleur rang
          </div>
        </div>
      </div>
    `,
    )
    .join("");

  grid.querySelectorAll(".runner-card").forEach((c) => {
    c.addEventListener("click", () => openRunnerModal(Number(c.dataset.uid)));
  });
})();

async function openRunnerModal(id) {
  const modal = document.getElementById("runner-modal");
  const content = document.getElementById("runner-modal-content");
  content.innerHTML = '<div class="modal-body"><div class="spinner"></div></div>';
  modal.classList.add("open");

  let u;
  try {
    u = await API.get(`/users/${id}`);
  } catch {
    content.innerHTML = '<div class="modal-body"><p class="empty">Erreur</p></div>';
    return;
  }

  content.innerHTML = `
    <div class="modal-header">
      <img src="${u.photoUrl || ""}" alt="" />
      <div>
        <div class="role">${u.role}</div>
        <h2>${escapeHtml(u.name)}</h2>
        <div style="font-size:0.85rem;color:var(--grey-200);margin-top:0.25rem">
           ${escapeHtml(u.city || "—")}, ${escapeHtml(u.country || "")}
          ${u.age ? ` · ${u.age} ans` : ""}
        </div>
      </div>
    </div>
    <div class="modal-body">
      ${u.bio ? `<p style="margin-bottom:1.5rem">${escapeHtml(u.bio)}</p>` : ""}
      <div class="admin-stats">
        <div class="admin-stat">
          <div class="value">${u.racesCount}</div>
          <div class="label">Courses</div>
        </div>
        <div class="admin-stat">
          <div class="value">${u.bestRank ?? "—"}</div>
          <div class="label">Meilleur rang</div>
        </div>
        <div class="admin-stat">
          <div class="value">${u.upcomingRegistrations.length}</div>
          <div class="label">À venir</div>
        </div>
      </div>

      <h3 style="font-family:'Anton',sans-serif;text-transform:uppercase;margin-bottom:1rem">Palmarès</h3>
      ${
        u.results.length
          ? `<table>
              <thead>
                <tr><th>Course</th><th>Lieu</th><th>Date</th><th>Rang</th><th>Temps</th></tr>
              </thead>
              <tbody>
                ${u.results
                  .map(
                    (r) => `
                  <tr>
                    <td>${escapeHtml(r.eventName)}</td>
                    <td>${escapeHtml(r.location)}</td>
                    <td>${formatDateShortFr(r.eventDate)}</td>
                    <td class="rank">${r.rank ?? "—"}</td>
                    <td>${escapeHtml(r.time || "—")}</td>
                  </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>`
          : '<p class="empty">Aucun résultat enregistré.</p>'
      }
    </div>
  `;
}

function closeRunnerModal() {
  document.getElementById("runner-modal").classList.remove("open");
}
