// Petit helper qui simplifie les appels HTTP vers /api/...
// (équivalent JS pur de fetch + JSON, en plus court)

const API = {
  async get(path) {
    const r = await fetch(`/api${path}`, { credentials: "include" });
    if (!r.ok) throw new Error(`GET ${path} → ${r.status}`);
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(`/api${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    if (!r.ok) throw new Error(`POST ${path} → ${r.status}`);
    return r.json();
  },
};

// ---------- Helpers d'affichage ----------

function formatDateFr(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShortFr(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function escapeHtml(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showToast(message, type) {
  const root = document.getElementById("toast-root");
  if (!root) return alert(message);
  const el = document.createElement("div");
  el.className = "toast" + (type === "error" ? " error" : "");
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// HTML d'une carte d'événement (utilisée sur plusieurs pages)
function eventCardHtml(evt, opts) {
  opts = opts || {};
  const cover = evt.coverImageUrl || "";
  const dist =
    evt.shortestDistanceKm != null
      ? evt.shortestDistanceKm === evt.longestDistanceKm
        ? `${evt.shortestDistanceKm} km`
        : `${evt.shortestDistanceKm}–${evt.longestDistanceKm} km`
      : "";
  return `
    <a href="/course.html?id=${evt.id}" class="event-card ${opts.featured ? "featured" : ""}">
      <div class="cover" style="background-image:url('${cover}')"></div>
      <span class="badge">${escapeHtml(evt.raceType.name)}</span>
      <div class="body">
        <div class="name">${escapeHtml(evt.name)}</div>
        <div class="meta">
          <span> ${formatDateShortFr(evt.date)}</span>
          <span> ${escapeHtml(evt.location)}</span>
        </div>
        <div class="footer">
          <span>${evt.participantsCount} inscrits</span>
          <span class="distance">${dist}</span>
        </div>
      </div>
    </a>
  `;
}
