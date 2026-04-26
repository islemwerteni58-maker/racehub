// Page d'accueil
(async function () {
  let data;
  try {
    data = await API.get("/home");
  } catch (e) {
    document.getElementById("upcoming-events").innerHTML =
      '<p class="empty">Impossible de charger la page. Vérifie que le serveur tourne.</p>';
    return;
  }

  // --- Marquee ---
  const marqueeText = data.upcomingEvents
    .map((e) => e.name.toUpperCase())
    .join(" • ");
  // On dédouble le contenu pour que le défilement soit fluide à l'infini
  document.getElementById("marquee-track").innerHTML =
    `<span>${marqueeText} • ${marqueeText} • </span>`;

  // --- Stats ---
  document.getElementById("stats-bar").innerHTML = `
    <div class="stat">
      <span class="stat-value">${data.totals.events}</span>
      <span class="stat-label">Événements</span>
    </div>
    <div class="stat">
      <span class="stat-value">${data.totals.runners}</span>
      <span class="stat-label">Coureurs</span>
    </div>
    <div class="stat">
      <span class="stat-value">${data.totals.registrations}</span>
      <span class="stat-label">Inscriptions</span>
    </div>
  `;

  // --- Tendance ---
  if (data.trendingEvent) {
    document.getElementById("trending-section").style.display = "block";
    document.getElementById("trending-event").innerHTML = eventCardHtml(
      data.trendingEvent,
      { featured: true },
    );
  }

  // --- Prochaines courses ---
  const upcomingEl = document.getElementById("upcoming-events");
  if (!data.upcomingEvents.length) {
    upcomingEl.innerHTML =
      '<p class="empty">Aucune course confirmée à venir pour le moment.</p>';
  } else {
    upcomingEl.innerHTML = data.upcomingEvents
      .map((e) => eventCardHtml(e))
      .join("");
  }

  // --- Types de courses ---
  document.getElementById("race-types-grid").innerHTML = data.raceTypes
    .map(
      (rt) => `
      <a href="/courses.html?raceTypeId=${rt.id}" class="race-type-card">
        <span class="count">${rt.eventsCount}</span>
        <div class="name">${escapeHtml(rt.name)}</div>
        <p class="desc">${escapeHtml(rt.description)}</p>
      </a>
    `,
    )
    .join("");
})();
