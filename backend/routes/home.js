// Données de la page d'accueil :
//   - 6 prochaines courses confirmées
//   - tous les types de courses avec le nombre d'événements à venir
//   - l'événement "tendance" (le plus d'inscriptions)
//   - statistiques globales

const express = require("express");
const pool = require("../db");
const { fetchEventSummaries } = require("./_helpers");

const router = express.Router();

router.get("/home", async (req, res) => {
  try {
    // 6 prochaines courses confirmées
    const [upcoming] = await pool.query(
      `SELECT id FROM events
       WHERE status = 'confirmed' AND date >= NOW()
       ORDER BY date ASC LIMIT 6`,
    );
    const upcomingEvents = await fetchEventSummaries(
      pool,
      upcoming.map((r) => r.id),
    );

    // Tous les types de courses + nombre d'événements à venir
    const [raceTypes] = await pool.query(
      `SELECT
         rt.id, rt.slug, rt.name, rt.description,
         COUNT(e.id) AS events_count
       FROM race_types rt
       LEFT JOIN events e
         ON e.race_type_id = rt.id
        AND e.status = 'confirmed'
        AND e.date >= NOW()
       GROUP BY rt.id
       ORDER BY rt.id`,
    );

    // Événement tendance = celui avec le plus d'inscriptions
    const [trending] = await pool.query(
      `SELECT e.id, COUNT(r.id) AS c
       FROM events e
       LEFT JOIN registrations r ON r.event_id = e.id
       WHERE e.status = 'confirmed' AND e.date >= NOW()
       GROUP BY e.id
       ORDER BY c DESC, e.date ASC
       LIMIT 1`,
    );
    let trendingEvent = null;
    if (trending.length) {
      const [s] = await fetchEventSummaries(pool, [trending[0].id]);
      trendingEvent = s ?? null;
    }

    // Totaux pour la barre de stats
    const [[{ events }]] = await pool.query(
      `SELECT COUNT(*) AS events FROM events WHERE status = 'confirmed'`,
    );
    const [[{ runners }]] = await pool.query(
      `SELECT COUNT(*) AS runners FROM users WHERE role = 'runner'`,
    );
    const [[{ registrations }]] = await pool.query(
      `SELECT COUNT(*) AS registrations FROM registrations`,
    );

    res.json({
      upcomingEvents,
      raceTypes: raceTypes.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        description: r.description,
        eventsCount: Number(r.events_count) || 0,
      })),
      trendingEvent,
      totals: {
        events: Number(events),
        runners: Number(runners),
        registrations: Number(registrations),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
