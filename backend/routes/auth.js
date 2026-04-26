// Routes d'authentification :
//   POST /api/auth/register   -> créer un compte
//   POST /api/auth/login      -> se connecter
//   POST /api/auth/logout     -> se déconnecter
//   GET  /api/session         -> qui suis-je ?

const express = require("express");
const pool = require("../db");
const { setSessionUserId, getSessionUserId, serializeUser } = require("./_helpers");

const router = express.Router();

// Simple hash (pour un projet école - en prod utiliser bcrypt)
function hashPassword(password) {
  // On utilise une dérivation simple avec le module crypto de Node
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(password + "racehub_salt_2026").digest("hex");
}

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, role, city, country, age } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nom, e-mail et mot de passe sont requis." });
    }
    if (!["runner", "organizer"].includes(role)) {
      return res.status(400).json({ error: "Rôle invalide." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit faire au moins 6 caractères." });
    }

    // Vérifier unicité e-mail
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) {
      return res.status(409).json({ error: "Cet e-mail est déjà utilisé." });
    }

    const hashedPwd = hashPassword(password);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, city, country, age)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        hashedPwd,
        role,
        city || null,
        country || "France",
        age ? Number(age) : null,
      ]
    );

    const userId = result.insertId;
    setSessionUserId(res, userId);

    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
    res.status(201).json({ user: serializeUser(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "E-mail et mot de passe requis." });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email.trim().toLowerCase(),
    ]);

    if (!rows.length) {
      return res.status(401).json({ error: "Identifiants incorrects." });
    }

    const user = rows[0];

    // Support des anciens comptes seeds (sans mot de passe) et nouveaux comptes
    if (user.password_hash) {
      const hashedPwd = hashPassword(password);
      if (hashedPwd !== user.password_hash) {
        return res.status(401).json({ error: "Identifiants incorrects." });
      }
    }
    // Si pas de password_hash (comptes de démo seeds), on accepte tout pour la rétro-compat
    // En prod, il faudrait exiger le hash

    setSessionUserId(res, user.id);
    res.json({ user: serializeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// POST /api/auth/logout
router.post("/auth/logout", (req, res) => {
  res.clearCookie("racehub_uid");
  res.json({ ok: true });
});

module.exports = router;