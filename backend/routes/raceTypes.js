// Liste des types de courses (Trail, Route, Ultra, Cross-country)
// avec le nombre d'événements à venir pour chacun.

const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/race-types", async (req, res) => {
  try {
    const [rows] = await pool.query(
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
    res.json(
      rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        description: r.description,
        eventsCount: Number(r.events_count) || 0,
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
