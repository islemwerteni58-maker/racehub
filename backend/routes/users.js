// Tout ce qui touche aux utilisateurs :
//   GET  /api/users                  -> liste filtrable (role, q)
//   GET  /api/users/:id              -> profil détaillé + résultats + inscriptions
//   POST /api/users/:id/results      -> ajout d'un résultat manuel (course externe)

const express = require("express");
const pool = require("../db");
const { serializeUser } = require("./_helpers");

const router = express.Router();

async function computeUserStats(userId) {
  const [reg] = await pool.query(
    "SELECT id FROM registrations WHERE user_id = ?",
    [userId],
  );
  const [man] = await pool.query(
    "SELECT `rank` FROM manual_results WHERE user_id = ?",
    [userId],
  );
  const ranks = man
    .map((r) => r.rank)
    .filter((x) => Number.isInteger(x) && x > 0);
  return {
    racesCount: reg.length + man.length,
    bestRank: ranks.length ? Math.min(...ranks) : null,
  };
}

router.get("/users", async (req, res) => {
  try {
    const role = req.query.role;
    const q = req.query.q;
    const where = [];
    const args = [];
    if (role) {
      where.push("role = ?");
      args.push(role);
    }
    if (q) {
      where.push("(name LIKE ? OR city LIKE ?)");
      args.push(`%${q}%`, `%${q}%`);
    }
    const sql =
      "SELECT * FROM users" +
      (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
      " ORDER BY name ASC";
    const [rows] = await pool.query(sql, args);

    const out = await Promise.all(
      rows.map(async (u) => {
        const stats = await computeUserStats(u.id);
        return serializeUser(u, stats);
      }),
    );
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    const u = rows[0];
    if (!u) return res.status(404).json({ error: "Introuvable" });

    const stats = await computeUserStats(id);

    // Résultats manuels uniquement (ajoutés via le bouton "Ajouter")
    const [manualResults] = await pool.query(
      `SELECT * FROM manual_results
       WHERE user_id = ?
       ORDER BY event_date DESC`,
      [id],
    );

    const results = manualResults.map((m) => ({
      id: m.id * 10 + 2,
      eventId: null,
      eventName: m.event_name,
      eventDate: m.event_date,
      location: m.location,
      rank: m.rank,
      time: m.time,
      source: "manual",
    }));

    // Inscriptions à venir
    const [upcoming] = await pool.query(
      `SELECT e.id, e.name, e.date, e.location, e.cover_image_url, e.status,
              rt.id AS race_type_id, rt.slug AS race_type_slug, rt.name AS race_type_name,
              (SELECT COUNT(*) FROM registrations rr WHERE rr.event_id = e.id) AS participants_count
       FROM registrations r
       INNER JOIN events e       ON e.id = r.event_id
       INNER JOIN race_types rt  ON rt.id = e.race_type_id
       WHERE r.user_id = ? AND e.date >= NOW()
       ORDER BY e.date ASC`,
      [id],
    );

    // Si l'utilisateur est organisateur, ses événements
    const [organized] = await pool.query(
      `SELECT e.id, e.name, e.date, e.location, e.cover_image_url, e.status,
              rt.id AS race_type_id, rt.slug AS race_type_slug, rt.name AS race_type_name,
              (SELECT COUNT(*) FROM registrations rr WHERE rr.event_id = e.id) AS participants_count
       FROM events e
       INNER JOIN race_types rt ON rt.id = e.race_type_id
       WHERE e.organizer_id = ?
       ORDER BY e.date DESC`,
      [id],
    );

    const mapEvt = (r) => ({
      id: r.id,
      name: r.name,
      date: r.date,
      location: r.location,
      coverImageUrl: r.cover_image_url,
      status: r.status,
      raceType: {
        id: r.race_type_id,
        slug: r.race_type_slug,
        name: r.race_type_name,
      },
      participantsCount: Number(r.participants_count) || 0,
    });

    res.json({
      ...serializeUser(u, stats),
      results,
      upcomingRegistrations: upcoming.map(mapEvt),
      organizedEvents: organized.map(mapEvt),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/users/:id/results", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { eventName, eventDate, location, rank, time } = req.body || {};
    if (!eventName || !eventDate || !location) {
      return res.status(400).json({ error: "Champs requis manquants" });
    }
    const [result] = await pool.query(
      `INSERT INTO manual_results (user_id, event_name, event_date, location, \`rank\`, time)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, eventName, eventDate, location, rank ?? null, time ?? null],
    );
    res.status(201).json({
      id: result.insertId,
      userId: id,
      eventName,
      eventDate,
      location,
      rank: rank ?? null,
      time: time ?? null,
      source: "manual",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;