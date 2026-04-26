// Commentaires sur un événement.

const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/events/:id/comments", async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const [rows] = await pool.query(
      `SELECT c.id, c.event_id, c.user_id, c.content, c.created_at,
              u.name AS user_name, u.photo_url AS user_photo_url
       FROM comments c
       INNER JOIN users u ON u.id = c.user_id
       WHERE c.event_id = ?
       ORDER BY c.created_at DESC`,
      [eventId],
    );
    res.json(
      rows.map((r) => ({
        id: r.id,
        eventId: r.event_id,
        userId: r.user_id,
        userName: r.user_name,
        userPhotoUrl: r.user_photo_url,
        content: r.content,
        createdAt: r.created_at,
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/events/:id/comments", async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const { userId, content } = req.body || {};
    if (!userId || !content) return res.status(400).json({ error: "Champs requis" });

    const [result] = await pool.query(
      `INSERT INTO comments (event_id, user_id, content) VALUES (?, ?, ?)`,
      [eventId, userId, content],
    );
    const [rows] = await pool.query(
      `SELECT c.*, u.name AS user_name, u.photo_url AS user_photo_url
       FROM comments c INNER JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`,
      [result.insertId],
    );
    const r = rows[0];
    res.status(201).json({
      id: r.id,
      eventId: r.event_id,
      userId: r.user_id,
      userName: r.user_name,
      userPhotoUrl: r.user_photo_url,
      content: r.content,
      createdAt: r.created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
