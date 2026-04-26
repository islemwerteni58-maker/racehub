// Page "Toutes les courses"
(async function () {
  const params = new URLSearchParams(window.location.search);
  let activeTypeId = params.get("raceTypeId") || "";
  let searchQ = "";

  const filtersEl = document.getElementById("race-type-filters");
  const listEl = document.getElementById("events-list");
  const searchInput = document.getElementById("search-input");

  // Charge les types pour la sidebar
  let types = [];
  try {
    types = await API.get("/race-types");
  } catch {}

  function renderFilters() {
    const items = [
      { id: "", name: "Tous les types", count: types.reduce((a, t) => a + t.eventsCount, 0) },
      ...types.map((t) => ({ id: String(t.id), name: t.name, count: t.eventsCount })),
    ];
    filtersEl.innerHTML = items
      .map(
        (it) => `
        <button class="filter-item ${activeTypeId === it.id ? "active" : ""}" data-id="${it.id}">
          <span>${escapeHtml(it.name)}</span>
          <span class="count">${it.count}</span>
        </button>`,
      )
      .join("");
    filtersEl.querySelectorAll(".filter-item").forEach((b) => {
      b.addEventListener("click", () => {
        activeTypeId = b.dataset.id;
        renderFilters();
        loadEvents();
      });
    });
  }

  async function loadEvents() {
    listEl.innerHTML = '<div class="spinner"></div>';
    const q = new URLSearchParams();
    if (activeTypeId) q.set("raceTypeId", activeTypeId);
    if (searchQ) q.set("q", searchQ);
    let events = [];
    try {
      events = await API.get(`/events?${q.toString()}`);
    } catch {
      listEl.innerHTML = '<p class="empty">Erreur de chargement.</p>';
      return;
    }
    if (!events.length) {
      listEl.innerHTML =
        '<p class="empty">Aucun événement ne correspond à ces critères.</p>';
      return;
    }
    listEl.innerHTML = events.map((e) => eventCardHtml(e)).join("");
  }

  // Recherche avec petit délai pour pas spammer
  let searchTimer;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQ = e.target.value.trim();
      loadEvents();
    }, 300);
  });

  renderFilters();
  loadEvents();
})();
