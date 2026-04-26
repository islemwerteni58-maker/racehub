// Petites fonctions utilitaires partagées entre toutes les routes.

const COOKIE_NAME = "racehub_uid";

// Lit l'identifiant de l'utilisateur connecté depuis le cookie de démo.
function getSessionUserId(req) {
  const raw = req.cookies?.[COOKIE_NAME];
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Définit le cookie de démo (1 mois).
function setSessionUserId(res, userId) {
  res.cookie(COOKIE_NAME, String(userId), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

// Construit un résumé d'événement (utilisé par /home, /events, /admin/stats…).
// On lui passe les ids et il fait UNE requête JOIN qui calcule tout.
async function fetchEventSummaries(pool, ids) {
  if (!ids.length) return [];
  const placeholders = ids.map(() => "?").join(",");
  const [rows] = await pool.query(
    `
    SELECT
      e.id, e.name, e.date, e.location, e.cover_image_url, e.status,
      rt.id   AS race_type_id,
      rt.slug AS race_type_slug,
      rt.name AS race_type_name,
      (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS participants_count,
      (SELECT MIN(c.distance_km) FROM event_courses c WHERE c.event_id = e.id) AS shortest_distance_km,
      (SELECT MAX(c.distance_km) FROM event_courses c WHERE c.event_id = e.id) AS longest_distance_km
    FROM events e
    INNER JOIN race_types rt ON rt.id = e.race_type_id
    WHERE e.id IN (${placeholders})
    `,
    ids,
  );
  // Garde l'ordre demandé (MySQL ne le respecte pas avec IN)
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((r) => ({
      id: r.id,
      name: r.name,
      date: r.date,
      location: r.location,
      coverImageUrl: r.cover_image_url,
      raceType: {
        id: r.race_type_id,
        slug: r.race_type_slug,
        name: r.race_type_name,
      },
      status: r.status,
      participantsCount: Number(r.participants_count) || 0,
      shortestDistanceKm: r.shortest_distance_km
        ? Number(r.shortest_distance_km)
        : null,
      longestDistanceKm: r.longest_distance_km
        ? Number(r.longest_distance_km)
        : null,
    }));
}

// Sérialise un utilisateur de la BDD vers un objet propre pour l'API.
function serializeUser(u, stats) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    photoUrl: u.photo_url,
    bio: u.bio,
    city: u.city,
    country: u.country,
    gender: u.gender,
    age: u.age,
    racesCount: stats?.racesCount ?? 0,
    bestRank: stats?.bestRank ?? null,
  };
}

module.exports = {
  COOKIE_NAME,
  getSessionUserId,
  setSessionUserId,
  fetchEventSummaries,
  serializeUser,
};
