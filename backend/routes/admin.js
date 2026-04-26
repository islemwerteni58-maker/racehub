// Routes réservées à l'admin :
//   GET  /api/admin/stats                  -> tableau de bord
//   POST /api/admin/events/:id/confirm     -> valider un événement
//   POST /api/admin/events/:id/cancel      -> annuler un événement

const express = require("express");
const pool = require("../db");
const { fetchEventSummaries } = require("./_helpers");

const router = express.Router();

async function eventsByStatus(status) {
  const [rows] = await pool.query(
    "SELECT id FROM events WHERE status = ? ORDER BY date ASC",
    [status],
  );
  return fetchEventSummaries(pool, rows.map((r) => r.id));
}

router.get("/admin/stats", async (req, res) => {
  try {
    const [statusCounts] = await pool.query(
      "SELECT status, COUNT(*) AS c FROM events GROUP BY status",
    );
    const cmap = new Map(statusCounts.map((s) => [s.status, Number(s.c)]));

    const [roleCounts] = await pool.query(
      "SELECT role, COUNT(*) AS c FROM users GROUP BY role",
    );
    const rmap = new Map(roleCounts.map((r) => [r.role, Number(r.c)]));

    const [[{ total_registrations }]] = await pool.query(
      "SELECT COUNT(*) AS total_registrations FROM registrations",
    );

    const [pending, confirmed] = await Promise.all([
      eventsByStatus("pending"),
      eventsByStatus("confirmed"),
    ]);

    res.json({
      confirmedCount: cmap.get("confirmed") ?? 0,
      pendingCount: cmap.get("pending") ?? 0,
      cancelledCount: cmap.get("cancelled") ?? 0,
      runnersCount: rmap.get("runner") ?? 0,
      organizersCount: rmap.get("organizer") ?? 0,
      totalRegistrations: Number(total_registrations) || 0,
      pendingEvents: pending,
      confirmedEvents: confirmed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/admin/events/:id/confirm", async (req, res) => {
  try {
    await pool.query("UPDATE events SET status = 'confirmed' WHERE id = ?", [
      Number(req.params.id),
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/admin/events/:id/cancel", async (req, res) => {
  try {
    await pool.query("UPDATE events SET status = 'cancelled' WHERE id = ?", [
      Number(req.params.id),
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
