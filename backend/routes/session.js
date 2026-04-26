// Gestion de la "session de démo".
//
// Pour ce projet d'école on n'a pas mis en place de vraie authentification
// (mots de passe, hash, JWT…). Le navigateur stocke simplement l'identifiant
// d'un utilisateur dans un cookie. Le menu "Démo Auth" en haut du site
// permet de basculer entre les utilisateurs.

const express = require("express");
const pool = require("../db");
const {
  getSessionUserId,
  setSessionUserId,
  serializeUser,
} = require("./_helpers");

const router = express.Router();

// Qui suis-je ?
router.get("/session", async (req, res) => {
  const id = getSessionUserId(req);
  if (!id) return res.json({ user: null });
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
  res.json({ user: serializeUser(rows[0]) });
});

// Changer d'utilisateur de démo
router.post("/session", async (req, res) => {
  const userId = Number(req.body?.userId);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: "userId invalide" });
  }
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
  if (!rows.length) return res.status(404).json({ error: "Utilisateur introuvable" });
  setSessionUserId(res, userId);
  res.json({ user: serializeUser(rows[0]) });
});

module.exports = router;
