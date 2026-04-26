# RaceHub — Guide d'utilisation

> **RaceHub** est un site web qui répertorie les courses sportives en France
> (trails, marathons, 10 km, ultras, cross). Trois rôles cohabitent :
> les **runners** (coureurs), les **organisateurs** et un **admin**.

Ce projet est entièrement écrit en :

- **HTML, CSS et JavaScript "vanille"** côté navigateur (aucun framework)
- **Node.js + Express** côté serveur
- **MySQL** pour la base de données

---

## 1. Contenu du dossier

```
racehub-vanilla/
├── backend/                  ← Le serveur Node.js
│   ├── server.js             ← Point d'entrée
│   ├── db.js                 ← Connexion MySQL
│   ├── routes/               ← Toutes les routes /api/...
│   │   ├── home.js
│   │   ├── session.js
│   │   ├── users.js
│   │   ├── raceTypes.js
│   │   ├── events.js
│   │   ├── comments.js
│   │   ├── admin.js
│   │   └── _helpers.js       ← Fonctions utilitaires partagées
│   ├── database/
│   │   └── seed.js           ← Script de remplissage de la BDD
│   ├── package.json
│   └── .env.example          ← Modèle de configuration
│
├── frontend/                 ← Les pages HTML/CSS/JS
│   ├── index.html            ← Page d'accueil
│   ├── courses.html          ← Liste de toutes les courses
│   ├── course.html           ← Détail d'une course
│   ├── runners.html          ← Communauté de coureurs
│   ├── profile.html          ← Tableau de bord (selon le rôle)
│   ├── css/style.css         ← Toutes les règles de style
│   └── js/                   ← Le JavaScript de chaque page
│       ├── api.js            ← Helper pour appeler l'API
│       ├── navbar.js         ← La barre de navigation partagée
│       ├── home.js
│       ├── courses.js
│       ├── course.js
│       ├── runners.js
│       └── profile.js
│
├── database/
│   └── schema.sql            ← Le script SQL pour créer la base
│
└── GUIDE_UTILISATION.md      ← Ce fichier
```

---

## 2. Pré-requis

Tu dois avoir ces logiciels installés sur ton ordinateur :

| Logiciel    | Version    | Pour quoi faire                         |
|-------------|------------|------------------------------------------|
| **Node.js** | 18 ou plus | Faire tourner le serveur backend         |
| **MySQL**   | 8 ou plus  | Stocker les données (XAMPP/WAMP marche)  |

Vérifie tes versions dans un terminal :

```bash
node -v       # doit afficher v18 ou plus
mysql --version
```

> 💡 Si tu utilises **XAMPP** ou **WAMP**, MySQL est déjà inclus.
> Lance simplement le panneau de contrôle et démarre le service "MySQL".

---

## 3. Installation pas à pas

### Étape 1 — Créer la base de données

1. Ouvre **phpMyAdmin** (généralement à `http://localhost/phpmyadmin`)
   *ou* la console MySQL Workbench, *ou* un terminal MySQL.

2. Importe le fichier `database/schema.sql` :
   - **Dans phpMyAdmin** : onglet *Importer*, choisis le fichier, clique *Exécuter*.
   - **En ligne de commande** :
     ```bash
     mysql -u root -p < database/schema.sql
     ```

3. Tu dois voir une nouvelle base **`racehub`** avec 8 tables.

### Étape 2 — Configurer le serveur

1. Va dans le dossier `backend/`.
2. Copie `.env.example` en `.env` :
   ```bash
   cp .env.example .env
   ```
3. Ouvre `.env` et adapte tes infos MySQL :
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=         ← mets ton mot de passe MySQL ici
   DB_NAME=racehub
   SESSION_SECRET=changez-moi
   ```

### Étape 3 — Installer les dépendances Node

Toujours dans le dossier `backend/` :

```bash
npm install
```

Ça va télécharger les paquets nécessaires (Express, mysql2, etc.).
Cela peut prendre 30 secondes à 1 minute.

### Étape 4 — Remplir la base avec des données de démo

```bash
npm run seed
```

Tu vas voir ces messages :
```
Nettoyage des tables existantes...
Insertion des utilisateurs...
Insertion des types de courses...
Insertion des événements...
Insertion des résultats manuels...
Insertion des commentaires...
✅ Base remplie : 13 utilisateurs.
```

### Étape 5 — Démarrer le serveur

```bash
npm start
```

Tu dois voir :
```
✅ RaceHub démarré sur http://localhost:3000
```

### Étape 6 — Ouvrir le site

Ouvre ton navigateur sur **http://localhost:3000**. 🎉

---

## 4. Utilisation du site

### Le sélecteur "Démo Auth"

Comme c'est un projet d'école, il n'y a pas de "vraie" authentification
avec mot de passe. À la place, en haut à droite, tu trouveras un bouton
**"Démo Auth ▾"**. Clique dessus : tu verras la liste de tous les
utilisateurs. **Choisis-en un** et tu seras "connecté" en tant que cette
personne. Le menu te montre le rôle de chacun (runner, organizer, admin).

C'est une simulation pratique pour tester les 3 rôles sans avoir à
gérer mot de passe ni inscription.

### Les pages

#### 🏠 Accueil (`/`)
- Un grand visuel avec un bouton "Explorer les courses".
- Un bandeau orange qui défile avec les noms des prochaines courses.
- Les chiffres clés (nombre de courses, coureurs, inscriptions).
- L'événement **tendance** (celui avec le plus d'inscrits).
- Les 6 prochaines courses confirmées.
- Les 4 types de courses (clique pour filtrer).

#### 🏁 Toutes les courses (`/courses.html`)
- Une barre de recherche (par nom ou par lieu).
- Une sidebar à gauche pour filtrer par type de course.
- La liste des courses confirmées sous forme de cartes.

#### 📋 Détail d'une course (`/course.html?id=X`)
- Photo de couverture, description, parcours, programme, commentaires.
- À droite : la **carte d'inscription**. Si tu es "connecté" en tant
  que runner, tu peux choisir un parcours et t'inscrire.
- Tu peux aussi laisser un commentaire en bas.

#### 👥 Runners (`/runners.html`)
- Toutes les fiches de coureurs.
- Clique sur une fiche → une fenêtre s'ouvre avec son profil détaillé
  et son palmarès.

#### 👤 Mon profil (`/profile.html`)

Le contenu de cette page **dépend du rôle** de l'utilisateur connecté :

- **Si tu es runner** :
  - Tes inscriptions à venir.
  - Ton palmarès complet (avec les courses externes).
  - Bouton **"+ Ajouter un résultat"** pour saisir une course que tu as
    faite ailleurs (ex : Marathon de Berlin).

- **Si tu es organisateur** (Antoine, Camille ou Marc) :
  - Tes événements organisés.
  - Bouton **"+ Créer un événement"** pour en proposer un nouveau.
    Il sera "en attente" tant qu'un admin ne l'a pas validé.

- **Si tu es admin** (Sophie Martin) :
  - Statistiques globales du site.
  - Onglet **"En attente"** : événements à valider ou refuser.
  - Onglet **"Confirmés"** : événements en ligne (qu'on peut annuler).

---

## 5. Comptes de démo disponibles

| Rôle         | Nom              | À tester                                    |
|--------------|------------------|---------------------------------------------|
| `admin`      | Sophie Martin    | Validation/refus des événements en attente  |
| `organizer`  | Antoine Lefebvre | Voir ses 4 événements + en créer un nouveau |
| `organizer`  | Camille Dubois   | Idem                                        |
| `organizer`  | Marc Rousseau    | Idem                                        |
| `runner`     | Léa Bernard      | Inscription à une course + ajout résultat   |
| `runner`     | + 8 autres       | Tester d'autres profils                     |

---

## 6. Comment ça fonctionne (architecture)

### Le serveur (`backend/`)

C'est une application **Express** très classique :

1. `server.js` démarre le serveur et :
   - Sert les fichiers du dossier `frontend/` (HTML, CSS, JS).
   - Branche les routes API sous `/api/...`.

2. Chaque fichier dans `routes/` gère une famille de routes :
   - `home.js` → `GET /api/home` (données de la page d'accueil)
   - `events.js` → `GET/POST /api/events`, etc.
   - `users.js` → `GET/POST /api/users`, `GET /api/users/:id`...
   - `admin.js` → routes réservées à l'admin

3. `db.js` crée un **pool de connexions** MySQL (réutilisable, plus
   efficace qu'ouvrir/fermer une connexion pour chaque requête).

### Le frontend (`frontend/`)

5 pages HTML statiques. Aucun framework : juste HTML + CSS + JS.

- Chaque page charge `api.js` (helper fetch) + `navbar.js` (barre de
  nav partagée) + son propre script (ex: `home.js`).
- Le JavaScript appelle `/api/...` avec `fetch`, reçoit du JSON et
  injecte le HTML dans la page.
- Le style est centralisé dans `css/style.css`.

### La session (cookie)

Quand tu cliques sur un utilisateur dans "Démo Auth" :
1. Le navigateur appelle `POST /api/session` avec l'`userId`.
2. Le serveur pose un **cookie** `racehub_uid` dans le navigateur.
3. À chaque requête suivante, le serveur lit ce cookie pour savoir
   "qui tu es".

C'est volontairement simple — pas de mots de passe ni de hash, parce
qu'on est sur un projet d'école. En production il faudrait remplacer
par une vraie authentification (par exemple avec `bcrypt` + `jsonwebtoken`).

---

## 7. Modèle de la base de données

| Table             | Rôle                                                |
|-------------------|------------------------------------------------------|
| `users`           | Utilisateurs (3 rôles : runner, organizer, admin)   |
| `race_types`      | Types de courses (Trail, Route, Ultra, Cross)       |
| `events`          | Les événements (= courses)                          |
| `event_courses`   | Les parcours d'un événement (10 km, semi, marathon) |
| `event_programme` | Horaires de la journée                              |
| `registrations`   | Inscriptions des runners aux événements             |
| `manual_results`  | Résultats saisis manuellement (course externe)      |
| `comments`        | Commentaires sous un événement                      |

Toutes les clés étrangères sont posées avec `ON DELETE CASCADE` ou
`ON DELETE SET NULL`, donc supprimer un événement supprime aussi ses
parcours, son programme, ses inscriptions et ses commentaires.

---

## 8. Dépannage

### "Cannot connect to MySQL"
- Vérifie que MySQL tourne (XAMPP/WAMP/service système).
- Vérifie les identifiants dans `backend/.env`.
- Si ton mot de passe MySQL est vide, laisse `DB_PASSWORD=` vide.

### "Address already in use :::3000"
- Un autre programme utilise le port 3000. Change `PORT=3001` dans `.env`.

### "Erreur 500 dans le navigateur"
- Regarde le terminal où tourne `npm start`, l'erreur s'affiche en rouge.
- Vérifie que tu as bien lancé `npm run seed` au moins une fois.

### Le bouton "Démo Auth" ne montre personne
- C'est que la table `users` est vide. Lance `npm run seed`.

### Les images des coureurs ne se chargent pas
- Les photos viennent d'**Unsplash** (internet). Vérifie ta connexion.
- Tu peux remplacer les URLs dans `backend/database/seed.js` par tes
  propres images locales si tu préfères.

---

## 9. Pour aller plus loin

Quelques idées pour étendre le projet :

- Ajouter une **vraie authentification** (avec `bcrypt` + sessions).
- Ajouter une **page d'inscription** publique.
- Permettre à l'organisateur d'**uploader une image** au lieu de mettre une URL.
- Ajouter un **classement général** (leaderboard) tous coureurs confondus.
- Envoyer un **email** de confirmation à chaque inscription.
- Ajouter une **carte interactive** des courses (avec Leaflet).

---

Bon code et bonnes courses ! 🏃
