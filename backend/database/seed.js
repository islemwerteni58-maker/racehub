// Script de remplissage de la base RaceHub — Tunisie
// Lancement : node database/seed.js (depuis le dossier backend/)
//
// Crée :
//   - 1 admin, 3 organisateurs tunisiens, 5 runners tunisiens
//   - 2 types de courses (Trail, Course sur route)
//   - 6 événements de running en Tunisie
//   - inscriptions, résultats manuels, commentaires

const pool = require("../db");

// Simple SHA-256 hash identique à auth.js
function hashPassword(password) {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(password + "racehub_salt_2026").digest("hex");
}

async function clearAll() {
  console.log("Nettoyage des tables existantes...");
  await pool.query("DELETE FROM comments");
  await pool.query("DELETE FROM registrations");
  await pool.query("DELETE FROM manual_results");
  await pool.query("DELETE FROM event_programme");
  await pool.query("DELETE FROM event_courses");
  await pool.query("DELETE FROM events");
  await pool.query("DELETE FROM race_types");
  await pool.query("DELETE FROM users");
  await pool.query("ALTER TABLE users           AUTO_INCREMENT = 1");
  await pool.query("ALTER TABLE race_types      AUTO_INCREMENT = 1");
  await pool.query("ALTER TABLE events          AUTO_INCREMENT = 1");
  await pool.query("ALTER TABLE event_courses   AUTO_INCREMENT = 1");
  await pool.query("ALTER TABLE event_programme AUTO_INCREMENT = 1");
  await pool.query("ALTER TABLE registrations   AUTO_INCREMENT = 1");
  await pool.query("ALTER TABLE manual_results  AUTO_INCREMENT = 1");
  await pool.query("ALTER TABLE comments        AUTO_INCREMENT = 1");
}

async function seedUsers() {
  console.log("Insertion des utilisateurs...");

  const users = [
    // ── id 1 : ADMIN ──────────────────────────────────────────────────
    {
      name: "Sarra Ben Ali", email: "sarra.benali@racehub.tn", password: "Admin2026!",
      role: "admin",
      photo: "https://plus.unsplash.com/premium_photo-1732117941506-cd5f33e25a08?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      bio: "Administratrice de la plateforme RaceHub Tunisie.",
      city: "Tunis", country: "Tunisie", gender: "F", age: 34,
    },
    // ── id 2 : ORGANIZER — Hippodiaritus & Rimel ──────────────────────
    {
      name: "Karim Gharbi", email: "karim.gharbi@hippodiaritus.tn", password: "Org2026!",
      role: "organizer",
      photo: "https://images.unsplash.com/photo-1647535993927-bcf896be066b?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      bio: "Organisateur de courses depuis 8 ans, fondateur du Hippodiaritus Run.",
      city: "Bizerte", country: "Tunisie", gender: "M", age: 42,
    },
    // ── id 3 : ORGANIZER — Ooredoo & Comar ───────────────────────────
    {
      name: "Yasmine Trabelsi", email: "yasmine.trabelsi@ooredoo-run.tn", password: "Org2026!",
      role: "organizer",
      photo: "https://images.unsplash.com/photo-1683830190453-eccededd3ed2?q=80&w=715&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      bio: "Co-organisatrice du Ooredoo Night Run et du Comar Marathon.",
      city: "Tunis", country: "Tunisie", gender: "F", age: 37,
    },
    // ── id 4 : ORGANIZER — Vaga Run & Laarrousia ─────────────────────
    {
      name: "Mehdi Jouini", email: "mehdi.jouini@vaga-run.tn", password: "Org2026!",
      role: "organizer",
      photo: "https://images.unsplash.com/photo-1610362556225-eac73c6d235d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      bio: "Passionné de trail et organisateur du Vaga Run et du Laarrousia Trail Festival.",
      city: "Béja", country: "Tunisie", gender: "M", age: 39,
    },
    // ── id 5 : RUNNER ─────────────────────────────────────────────────
    {
      name: "Amine Khelifi", email: "amine.khelifi@gmail.com", password: "Runner2026!",
      role: "runner",
      photo: "https://images.unsplash.com/photo-1652784549134-bae822a7c4a3?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      bio: "Marathonien tunisien, 4 ans de compétition.",
      city: "Tunis", country: "Tunisie", gender: "M", age: 28,
    },
    // ── id 6 : RUNNER ─────────────────────────────────────────────────
    {
      name: "Inès Chaabane", email: "ines.chaabane@gmail.com", password: "Runner2026!",
      role: "runner",
      photo: "https://images.unsplash.com/photo-1565292849963-a50ad3c5ddd5?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      bio: "Trail runner et coach sportive à Sfax.",
      city: "Sfax", country: "Tunisie", gender: "F", age: 31,
    },
    // ── id 7 : RUNNER ─────────────────────────────────────────────────
    {
      name: "Youssef Belhaj", email: "youssef.belhaj@gmail.com", password: "Runner2026!",
      role: "runner",
      photo: "https://images.unsplash.com/photo-1647535993927-bcf896be066b?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      bio: "Coureur du dimanche devenu sérieux.",
      city: "Sousse", country: "Tunisie", gender: "M", age: 25,
    },
    // ── id 8 : RUNNER ─────────────────────────────────────────────────
    {
      name: "Fatma Nasri", email: "fatma.nasri@gmail.com", password: "Runner2026!",
      role: "runner",
      photo: "https://images.unsplash.com/photo-1765833468912-56ca0afa0c83?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      bio: "Spécialiste des courses sur route, première femme de sa région à finir un semi.",
      city: "Monastir", country: "Tunisie", gender: "F", age: 29,
    },
    // ── id 9 : RUNNER ─────────────────────────────────────────────────
    {
      name: "Bilel Hamdi", email: "bilel.hamdi@gmail.com", password: "Runner2026!",
      role: "runner",
      photo: "https://images.unsplash.com/photo-1712189142492-b9e40244a7d0?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      bio: "Trail addict, fan des sentiers de Béja et de la Kroumirie.",
      city: "Béja", country: "Tunisie", gender: "M", age: 33,
    },
  ];

  for (const u of users) {
    const hash = hashPassword(u.password);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, photo_url, bio, city, country, gender, age)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [u.name, u.email, hash, u.role, u.photo, u.bio, u.city, u.country, u.gender, u.age],
    );
  }

  return users.length;
}

async function seedRaceTypes() {
  console.log("Insertion des types de courses...");
  // id 1 = Trail, id 2 = Course sur route
  const types = [
    ["trail", "Trail",
     "Courses en pleine nature sur sentiers, dénivelés et terrains techniques."],
    ["route", "Course sur route",
     "Du 5 km au marathon, sur asphalte, en ville ou en campagne."],
  ];
  for (const t of types) {
    await pool.query("INSERT INTO race_types (slug, name, description) VALUES (?,?,?)", t);
  }
}

async function seedEvents() {
  console.log("Insertion des événements...");

  // race_types : 1=trail, 2=route
  // organizers : 2=Karim, 3=Yasmine, 4=Mehdi
  // runners    : 5=Amine, 6=Inès, 7=Youssef, 8=Fatma, 9=Bilel

  const events = [

    // ── 1. RIMEL CHALLENGE — Nov 2026 (confirmed, le plus proche) ──────
    {
      name: "Rimel Challenge",
      description: "Une aventure nature dans les forêts de Rimel, à deux pas de Bizerte. Trois distances pour tous les profils : randonnée sportive 8 km, trail 32 km et le défi ultime 55 km. Paysages de pins, sentiers forestiers et vue sur la Méditerranée.",
      date: "2026-11-18 07:00:00", location: "Rimel, Bizerte",
      raceTypeId: 1, organizerId: 2, status: "confirmed",
      coverImageUrl: "/images/events/rimel.png",
      courses: [
        { name: "Rando 8 km",  distanceKm: 8,  elevationGainM: 250,  description: "Randonnée sportive accessible à tous." },
        { name: "Trail 32 km", distanceKm: 32, elevationGainM: 1100, description: "Parcours trail technique en forêt de pins." },
        { name: "Trail 55 km", distanceKm: 55, elevationGainM: 1900, description: "L'épreuve reine du Rimel Challenge." },
      ],
      programme: [
        { time: "06:00", title: "Ouverture des dossards" },
        { time: "06:45", title: "Briefing Trail 55 km" },
        { time: "07:00", title: "Départ Trail 55 km" },
        { time: "08:00", title: "Départ Trail 32 km" },
        { time: "09:00", title: "Départ Rando 8 km" },
        { time: "17:00", title: "Remise des prix" },
      ],
      registrationsCount: 5,
    },

    // ── 2. HIPPODIARITUS RUN — Jan 2027 (confirmed) ─────────────────────
    {
      name: "Hippodiaritus Run",
      description: "La course incontournable de Bizerte ! Départ depuis l'hippodrome, sur les routes côtières de la plus ancienne ville d'Afrique. Deux distances pour se dépasser au bord de la Méditerranée.",
      date: "2027-01-12 08:30:00", location: "Bizerte",
      raceTypeId: 2, organizerId: 2, status: "confirmed",
      coverImageUrl: "/images/events/hippodiaritus.png",
      courses: [
        { name: "5 km",          distanceKm: 5,    elevationGainM: 30, description: "Parcours plat, idéal pour les débutants." },
        { name: "Semi-marathon", distanceKm: 21.1, elevationGainM: 80, description: "Tracé côtier panoramique." },
      ],
      programme: [
        { time: "07:30", title: "Retrait des dossards" },
        { time: "08:00", title: "Échauffement collectif" },
        { time: "08:30", title: "Départ Semi-marathon" },
        { time: "09:00", title: "Départ 5 km" },
        { time: "12:00", title: "Remise des prix" },
      ],
      registrationsCount: 4,
    },

    // ── 3. LAARROUSIA TRAIL FESTIVAL — Avr 2027 (confirmed) ─────────────
    {
      name: "Laarrousia Trail Festival",
      description: "Le premier trail festival de la région de Manouba. Trois parcours traversent les collines et oliveraies de Laarrousia. Ambiance festive, musique et gastronomie locale à l'arrivée.",
      date: "2027-04-12 07:30:00", location: "Manouba",
      raceTypeId: 1, organizerId: 4, status: "confirmed",
      coverImageUrl: "/images/events/laarrousia.png",
      courses: [
        { name: "7 km découverte",  distanceKm: 7,  elevationGainM: 180, description: "Initiation au trail, tout terrain." },
        { name: "16 km sportif",    distanceKm: 16, elevationGainM: 480, description: "Parcours varié, oliveraies et collines." },
        { name: "32 km expérience", distanceKm: 32, elevationGainM: 950, description: "L'épreuve phare du festival." },
      ],
      programme: [
        { time: "06:30", title: "Ouverture du village" },
        { time: "07:00", title: "Départ 32 km" },
        { time: "07:30", title: "Départ 16 km" },
        { time: "08:30", title: "Départ 7 km" },
        { time: "15:00", title: "Cérémonie de clôture & festival" },
      ],
      registrationsCount: 3,
    },

    // ── 4. VAGA RUN — Avr 2027 (confirmed) ──────────────────────────────
    {
      name: "Vaga Run",
      description: "Course sur route à travers la magnifique ville de Béja, au cœur du grenier de la Tunisie. Les participants longent les champs de blé et traversent le centre historique.",
      date: "2027-04-26 09:00:00", location: "Béja",
      raceTypeId: 2, organizerId: 4, status: "confirmed",
      coverImageUrl: "/images/events/vaga_run.png",
      courses: [
        { name: "5 km",          distanceKm: 5,    elevationGainM: 40,  description: "Parcours plat en centre-ville." },
        { name: "Semi-marathon", distanceKm: 21.1, elevationGainM: 120, description: "Boucle champêtre autour de Béja." },
      ],
      programme: [
        { time: "08:00", title: "Retrait des dossards" },
        { time: "08:45", title: "Échauffement" },
        { time: "09:00", title: "Départ Semi-marathon" },
        { time: "09:30", title: "Départ 5 km" },
        { time: "13:00", title: "Remise des prix" },
      ],
      registrationsCount: 3,
    },

    // ── 5. OOREDOO NIGHT RUN — Mar 2027 (pending) ───────────────────────
    {
      name: "Ooredoo Night Run",
      description: "La course nocturne la plus festive de Tunisie ! Avenue Habib Bourguiba illuminée, ambiance électrique, musique live et des milliers de coureurs qui envahissent le cœur de Tunis.",
      date: "2027-03-14 20:00:00", location: "Avenue Habib Bourguiba, Tunis",
      raceTypeId: 2, organizerId: 3, status: "pending",
      coverImageUrl: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1200&h=800&fit=crop",
      courses: [
        { name: "5 km",  distanceKm: 5,  elevationGainM: 10, description: "Parcours festif, idéal en famille." },
        { name: "10 km", distanceKm: 10, elevationGainM: 20, description: "Double boucle sur l'avenue." },
      ],
      programme: [
        { time: "18:30", title: "Ouverture du village sportif" },
        { time: "19:30", title: "Retrait des dossards" },
        { time: "20:00", title: "Départ 10 km" },
        { time: "20:15", title: "Départ 5 km" },
        { time: "22:00", title: "Remise des prix & concert" },
      ],
      registrationsCount: 0,
    },

    // ── 6. COMAR MARATHON — Nov 2027 (pending) ──────────────────────────
    {
      name: "Comar Marathon",
      description: "Le marathon officiel de Tunis. Trois épreuves pour tous les niveaux sur l'avenue Habib Bourguiba : 5 km, semi-marathon et marathon homologué. L'événement running le plus attendu de l'année en Tunisie.",
      date: "2027-11-30 07:00:00", location: "Avenue Habib Bourguiba, Tunis",
      raceTypeId: 2, organizerId: 3, status: "pending",
      coverImageUrl: "https://images.unsplash.com/photo-1486218119243-13883505764c?w=1200&h=800&fit=crop",
      courses: [
        { name: "5 km",          distanceKm: 5,    elevationGainM: 15,  description: "Idéal pour les débutants et les familles." },
        { name: "Semi-marathon", distanceKm: 21.1, elevationGainM: 60,  description: "Boucle à travers Tunis." },
        { name: "Marathon",      distanceKm: 42.2, elevationGainM: 110, description: "L'épreuve reine, tracé homologué." },
      ],
      programme: [
        { time: "06:00", title: "Ouverture du village marathon" },
        { time: "07:00", title: "Départ Marathon" },
        { time: "07:30", title: "Départ Semi-marathon" },
        { time: "08:00", title: "Départ 5 km" },
        { time: "15:00", title: "Cérémonie de clôture" },
      ],
      registrationsCount: 0,
    },
  ];

  const runnerIds = [5, 6, 7, 8, 9];

  for (const e of events) {
    const [r] = await pool.query(
      `INSERT INTO events (name, description, date, location, race_type_id, organizer_id, status, cover_image_url)
       VALUES (?,?,?,?,?,?,?,?)`,
      [e.name, e.description, e.date, e.location, e.raceTypeId, e.organizerId, e.status, e.coverImageUrl],
    );
    const eventId = r.insertId;

    const courseIds = [];
    for (const c of e.courses) {
      const [cr] = await pool.query(
        `INSERT INTO event_courses (event_id, name, distance_km, elevation_gain_m, description)
         VALUES (?,?,?,?,?)`,
        [eventId, c.name, c.distanceKm, c.elevationGainM ?? null, c.description ?? null],
      );
      courseIds.push(cr.insertId);
    }

    for (let i = 0; i < e.programme.length; i++) {
      const p = e.programme[i];
      await pool.query(
        `INSERT INTO event_programme (event_id, time, title, description, position)
         VALUES (?,?,?,?,?)`,
        [eventId, p.time, p.title, p.description ?? null, i],
      );
    }

    // Inscriptions pour les événements confirmés
    if (e.status === "confirmed" && e.registrationsCount > 0) {
      const selected = runnerIds.slice(0, e.registrationsCount);
      for (let i = 0; i < selected.length; i++) {
        const uid = selected[i];
        const cid = courseIds[i % courseIds.length];
        await pool.query(
          `INSERT INTO registrations (user_id, event_id, course_id) VALUES (?,?,?)`,
          [uid, eventId, cid],
        );
      }
    }
  }
}

async function seedManualResults() {
  console.log("Insertion des résultats manuels...");
  const data = [
    [5, "Carthage Marathon",      "2025-11-15", "Tunis",       38,  "3h22m10s"],
    [5, "Médina Run Sousse",      "2025-03-08", "Sousse",      12,  "0h44m30s"],
    [6, "Trail du Cap Bon",       "2025-04-20", "Nabeul",       7,  "2h18m00s"],
    [6, "10 km de Hammamet",      "2025-09-14", "Hammamet",     3,  "0h41m55s"],
    [7, "5 km de la Médina",      "2025-05-01", "Tunis",       21,  "0h22m40s"],
    [8, "Semi de Monastir",       "2025-10-05", "Monastir",     5,  "1h52m30s"],
    [9, "Trail des Kroumirs",     "2025-06-12", "Aïn Draham",  14,  "3h05m00s"],
    [9, "Rimel Challenge 32 km",  "2025-11-20", "Bizerte",      9,  "3h41m00s"],
  ];
  for (const d of data) {
    await pool.query(
      `INSERT INTO manual_results (user_id, event_name, event_date, location, \`rank\`, time)
       VALUES (?,?,?,?,?,?)`,
      d,
    );
  }
}

async function seedComments() {
  console.log("Insertion des commentaires...");

  // Rimel Challenge = event id 1
  await pool.query("INSERT INTO comments (event_id, user_id, content) VALUES (?,?,?)",
    [1, 5, "J'ai déjà fait le 32 km l'année dernière, c'est une course magnifique ! La forêt de pins au lever du soleil c'est magique."]);
  await pool.query("INSERT INTO comments (event_id, user_id, content) VALUES (?,?,?)",
    [1, 9, "Je connais bien les sentiers de Rimel. Le 55 km va être du feu cette année !"]);
  await pool.query("INSERT INTO comments (event_id, user_id, content) VALUES (?,?,?)",
    [1, 6, "Est-ce qu'il y aura des points de ravitaillement sur le 32 km ?"]);

  // Hippodiaritus Run = event id 2
  await pool.query("INSERT INTO comments (event_id, user_id, content) VALUES (?,?,?)",
    [2, 7, "Mon premier semi-marathon, j'espère passer sous les 2h !"]);
  await pool.query("INSERT INTO comments (event_id, user_id, content) VALUES (?,?,?)",
    [2, 8, "Bizerte en janvier c'est parfait pour courir, la température est idéale."]);

  // Laarrousia Trail Festival = event id 3
  await pool.query("INSERT INTO comments (event_id, user_id, content) VALUES (?,?,?)",
    [3, 6, "Première édition du festival, hâte de découvrir les oliveraies de Manouba en trail !"]);
}

async function main() {
  await clearAll();
  const userCount = await seedUsers();
  await seedRaceTypes();
  await seedEvents();
  await seedManualResults();
  await seedComments();

  console.log(`\n--------- Base RaceHub Tunisie remplie : ${userCount} utilisateurs.\n`);
  console.log("  COMPTES DE CONNEXION");
  console.log("\n ---------------ADMIN");
  console.log("  sarra.benali@racehub.tn          →  Admin2026!");
  console.log("\n ----------------ORGANISATEURS");
  console.log("  karim.gharbi@hippodiaritus.tn    →  Org2026!");
  console.log("  yasmine.trabelsi@ooredoo-run.tn  →  Org2026!");
  console.log("  mehdi.jouini@vaga-run.tn         →  Org2026!");
  console.log("\n -----------------RUNNERS");
  console.log("  amine.khelifi@gmail.com          →  Runner2026!");
  console.log("  ines.chaabane@gmail.com          →  Runner2026!");
  console.log("  youssef.belhaj@gmail.com         →  Runner2026!");
  console.log("  fatma.nasri@gmail.com            →  Runner2026!");
  console.log("  bilel.hamdi@gmail.com            →  Runner2026!");
  console.log("═══════════════════════════════════════════════════════════════\n");

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});