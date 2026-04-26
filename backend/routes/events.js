// Gestion des événements :
//   GET  /api/events                  -> liste avec filtres
//   POST /api/events                  -> créer un événement
//   GET  /api/events/:id              -> détail complet
//   POST /api/events/:id/register     -> inscrire un runner

const express = require("express");
const pool = require("../db");
const { fetchEventSummaries } = require("./_helpers");

const router = express.Router();

router.get("/events", async (req, res) => {
  try {
    const { q, raceTypeId, organizerId, status, upcoming } = req.query;
    const where = [];
    const args = [];

    if (q) {
      where.push("(name LIKE ? OR location LIKE ?)");
      args.push(`%${q}%`, `%${q}%`);
    }
    if (raceTypeId) {
      where.push("race_type_id = ?");
      args.push(Number(raceTypeId));
    }
    if (organizerId) {
      where.push("organizer_id = ?");
      args.push(Number(organizerId));
    }
    if (upcoming === "true" || upcoming === "1") {
      where.push("date >= NOW()");
    }
    if (status && status !== "all") {
      where.push("status = ?");
      args.push(status);
    } else if (!status) {
      where.push("status = 'confirmed'");
    }

    const sql =
      "SELECT id FROM events" +
      (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
      " ORDER BY date ASC";
    const [rows] = await pool.query(sql, args);
    const summaries = await fetchEventSummaries(pool, rows.map((r) => r.id));
    res.json(summaries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/events", async (req, res) => {
  try {
    const {
      name,
      description,
      date,
      location,
      raceTypeId,
      organizerId,
      coverImageUrl,
      courses,
      programme,
    } = req.body || {};

    if (!name || !description || !date || !location || !raceTypeId || !organizerId) {
      return res.status(400).json({ error: "Champs requis manquants" });
    }

    const [result] = await pool.query(
      `INSERT INTO events (name, description, date, location, race_type_id, organizer_id, status, cover_image_url)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [name, description, date, location, raceTypeId, organizerId, coverImageUrl ?? null],
    );
    const eventId = result.insertId;

    if (Array.isArray(courses) && courses.length) {
      for (const c of courses) {
        await pool.query(
          `INSERT INTO event_courses (event_id, name, distance_km, elevation_gain_m, elevation_loss_m, description)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [eventId, c.name, c.distanceKm, c.elevationGainM ?? null, c.elevationLossM ?? null, c.description ?? null],
        );
      }
    }
    if (Array.isArray(programme) && programme.length) {
      for (let i = 0; i < programme.length; i++) {
        const p = programme[i];
        await pool.query(
          `INSERT INTO event_programme (event_id, time, title, description, position)
           VALUES (?, ?, ?, ?, ?)`,
          [eventId, p.time, p.title, p.description ?? null, i],
        );
      }
    }

    const detail = await loadEventDetail(eventId);
    res.status(201).json(detail);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

async function loadEventDetail(eventId) {
  const [evtRows] = await pool.query(
    `SELECT e.*,
            rt.id AS race_type_id, rt.slug AS race_type_slug, rt.name AS race_type_name,
            u.id  AS organizer_uid, u.name AS organizer_name, u.email AS organizer_email,
            u.role AS organizer_role, u.photo_url AS organizer_photo, u.bio AS organizer_bio,
            u.city AS organizer_city, u.country AS organizer_country
     FROM events e
     INNER JOIN race_types rt ON rt.id = e.race_type_id
     INNER JOIN users u       ON u.id = e.organizer_id
     WHERE e.id = ?`,
    [eventId],
  );
  if (!evtRows.length) return null;
  const e = evtRows[0];

  const [courses] = await pool.query(
    "SELECT * FROM event_courses WHERE event_id = ? ORDER BY distance_km ASC",
    [eventId],
  );
  const [programme] = await pool.query(
    "SELECT * FROM event_programme WHERE event_id = ? ORDER BY position ASC",
    [eventId],
  );
  const [participants] = await pool.query(
    `SELECT r.user_id, r.course_id,
            u.name, u.photo_url,
            c.name AS course_name
     FROM registrations r
     INNER JOIN users u           ON u.id = r.user_id
     LEFT JOIN  event_courses c   ON c.id = r.course_id
     WHERE r.event_id = ?
     ORDER BY u.name ASC`,
    [eventId],
  );
  const [[{ comments_count }]] = await pool.query(
    "SELECT COUNT(*) AS comments_count FROM comments WHERE event_id = ?",
    [eventId],
  );

  const distances = courses.map((c) => Number(c.distance_km));

  return {
    id: e.id,
    name: e.name,
    description: e.description,
    date: e.date,
    location: e.location,
    coverImageUrl: e.cover_image_url,
    status: e.status,
    raceType: {
      id: e.race_type_id,
      slug: e.race_type_slug,
      name: e.race_type_name,
    },
    participantsCount: participants.length,
    shortestDistanceKm: distances.length ? Math.min(...distances) : null,
    longestDistanceKm: distances.length ? Math.max(...distances) : null,
    organizer: {
      id: e.organizer_uid,
      name: e.organizer_name,
      email: e.organizer_email,
      role: e.organizer_role,
      photoUrl: e.organizer_photo,
      bio: e.organizer_bio,
      city: e.organizer_city,
      country: e.organizer_country,
    },
    courses: courses.map((c) => ({
      id: c.id,
      name: c.name,
      distanceKm: Number(c.distance_km),
      elevationGainM: c.elevation_gain_m,
      elevationLossM: c.elevation_loss_m,
      description: c.description,
    })),
    programme: programme.map((p) => ({
      time: p.time,
      title: p.title,
      description: p.description,
    })),
    participants: participants.map((p) => ({
      userId: p.user_id,
      name: p.name,
      photoUrl: p.photo_url,
      courseId: p.course_id,
      courseName: p.course_name,
    })),
    commentsCount: Number(comments_count) || 0,
  };
}

router.get("/events/:id", async (req, res) => {
  try {
    const detail = await loadEventDetail(Number(req.params.id));
    if (!detail) return res.status(404).json({ error: "Introuvable" });
    res.json(detail);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/events/:id/register", async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const userId = Number(req.body?.userId);
    const courseId = req.body?.courseId ? Number(req.body.courseId) : null;
    if (!userId) return res.status(400).json({ error: "userId requis" });

    const [existing] = await pool.query(
      "SELECT id FROM registrations WHERE user_id = ? AND event_id = ?",
      [userId, eventId],
    );
    if (!existing.length) {
      await pool.query(
        `INSERT INTO registrations (user_id, event_id, course_id) VALUES (?, ?, ?)`,
        [userId, eventId, courseId],
      );
    }
    const detail = await loadEventDetail(eventId);
    res.json(detail);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;