// Point d'entrée du serveur RaceHub

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const app = express();

// --- Middlewares globaux ---
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// --- API ---
app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/home"));
app.use("/api", require("./routes/session"));
app.use("/api", require("./routes/users"));
app.use("/api", require("./routes/raceTypes"));
app.use("/api", require("./routes/events"));
app.use("/api", require("./routes/comments"));
app.use("/api", require("./routes/admin"));

// --- Front-end statique ---
app.use(express.static(path.join(__dirname, "..", "frontend")));

// --- Démarrage ---
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`------------- RaceHub démarré sur http://localhost:${PORT}`);
});