import express from 'express';
import { PORT, PG_CONFIG } from './src/global_properties.js';
import compteRouter from './src/controller/compte.js';
import { exec } from 'node:child_process';

// Création de la database si elle n'existe pas
exec(`PGPASSWORD=${PG_CONFIG.password} psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${PG_CONFIG.database}'"`, (error, stdout, stderr) => {
    if (error) {
        console.error(`Erreur lors de la vérification de l'existence de la base de données: ${error.message}`);
        return;
    }
    if (stdout.trim() !== '1') {
        exec(`PGPASSWORD=${PG_CONFIG.password} psql -U postgres -c "CREATE DATABASE ${PG_CONFIG.database}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Erreur lors de la création de la base de données: ${error.message}`);
                return;
            }
            console.log(`Base de données ${PG_CONFIG.database} créée avec succès.`);
        });
    }
});

// Execute le script SQL de création des tables
exec(`PGPASSWORD=${PG_CONFIG.password} psql -U postgres -d ${PG_CONFIG.database} -f ./script.sql`, (error, stdout, stderr) => {
    if (error) {
        console.error(`Erreur lors de l'exécution du script SQL: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`Erreur dans le script SQL: ${stderr}`);
        return;
    }
    console.log(`Script SQL exécuté avec succès: ${stdout}`);
});

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Routes
app.use(compteRouter);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
