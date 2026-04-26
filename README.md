# RaceHub

Site web français des courses sportives. Projet d'école.

**Stack :** HTML + CSS + JavaScript (vanilla) · Node.js + Express · MySQL

## Démarrage rapide

```bash
# 1. Importer la base
mysql -u root -p < database/schema.sql

# 2. Configurer le serveur
cd backend
cp .env.example .env
# (édite .env avec ton mot de passe MySQL)

# 3. Installer et lancer
npm install
npm run seed
npm start
```

Puis ouvre **http://localhost:3000**.

📖 **Lis [`GUIDE_UTILISATION.md`](GUIDE_UTILISATION.md) pour les détails complets.**
