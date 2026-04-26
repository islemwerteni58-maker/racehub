-- Schéma de la base de données RaceHub (MySQL 8+)

DROP DATABASE IF EXISTS racehub;
CREATE DATABASE racehub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE racehub;

-- ==========================================
-- Utilisateurs (3 rôles : runner, organizer, admin)
-- ==========================================
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(180)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NULL,          -- NULL pour les comptes seeds de démo
  role          ENUM('runner','organizer','admin') NOT NULL,
  photo_url     VARCHAR(500)  NULL,
  bio           TEXT          NULL,
  city          VARCHAR(120)  NULL,
  country       VARCHAR(120)  NULL,
  gender        VARCHAR(10)   NULL,
  age           INT           NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- Types de courses (Trail, Route, Ultra, Cross-country…)
-- ==========================================
CREATE TABLE race_types (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  slug        VARCHAR(50)   NOT NULL UNIQUE,
  name        VARCHAR(120)  NOT NULL,
  description TEXT          NOT NULL
);

-- ==========================================
-- Événements (courses)
-- ==========================================
CREATE TABLE events (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(200)  NOT NULL,
  description     TEXT          NOT NULL,
  date            DATETIME      NOT NULL,
  location        VARCHAR(200)  NOT NULL,
  race_type_id    INT           NOT NULL,
  organizer_id    INT           NOT NULL,
  status          ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
  cover_image_url VARCHAR(500)  NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (race_type_id) REFERENCES race_types(id) ON DELETE RESTRICT,
  FOREIGN KEY (organizer_id) REFERENCES users(id)      ON DELETE RESTRICT
);

-- ==========================================
-- Parcours d'un événement
-- ==========================================
CREATE TABLE event_courses (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  event_id         INT           NOT NULL,
  name             VARCHAR(120)  NOT NULL,
  distance_km      DECIMAL(6,2)  NOT NULL,
  elevation_gain_m INT           NULL,
  elevation_loss_m INT           NULL,
  description      TEXT          NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- ==========================================
-- Programme de la journée
-- ==========================================
CREATE TABLE event_programme (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  event_id    INT           NOT NULL,
  time        VARCHAR(20)   NOT NULL,
  title       VARCHAR(200)  NOT NULL,
  description TEXT          NULL,
  position    INT           NOT NULL DEFAULT 0,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- ==========================================
-- Inscriptions
-- ==========================================
CREATE TABLE registrations (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT           NOT NULL,
  event_id   INT           NOT NULL,
  course_id  INT           NULL,
  `rank`     INT           NULL,
  time       VARCHAR(50)   NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_event (user_id, event_id),
  FOREIGN KEY (user_id)   REFERENCES users(id)         ON DELETE CASCADE,
  FOREIGN KEY (event_id)  REFERENCES events(id)        ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES event_courses(id) ON DELETE SET NULL
);

-- ==========================================
-- Résultats manuels
-- ==========================================
CREATE TABLE manual_results (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT           NOT NULL,
  event_name VARCHAR(200)  NOT NULL,
  event_date DATE          NOT NULL,
  location   VARCHAR(200)  NOT NULL,
  `rank`     INT           NULL,
  time       VARCHAR(50)   NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- Commentaires
-- ==========================================
CREATE TABLE comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  event_id   INT       NOT NULL,
  user_id    INT       NOT NULL,
  content    TEXT      NOT NULL,
  created_at DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
);