import express from 'express';
import { PORT, PG_CONFIG } from './src/global_properties.js';
import compteRouter from './src/controller/compte.js';
import { exec } from 'node:child_process';

const dbEnv = { ...process.env, PGPASSWORD: PG_CONFIG.password };
const dbNameLower = PG_CONFIG.database.toLowerCase();

// Fonction pour exécuter le script SQL
function executerScript() {
    exec(`psql -U postgres -d ${dbNameLower} -f ./script.sql`, { env: dbEnv }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erreur lors de l'exécution du script SQL:`);
            console.error(error.message);
            return;
        }
        if (stderr) {
            console.error(`Erreur dans le script SQL:`);
            console.error(stderr);
            return;
        }
        console.log(`Script SQL exécuté avec succès.`);
        if (stdout) {
            console.log(stdout);
        }
    });
}

// Création de la database si elle n'existe pas
exec(`psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${dbNameLower}'"`, { env: dbEnv }, (error, stdout) => {
    if (error) {
        console.error(`Erreur lors de la vérification de l'existence de la base de données: ${error.message}`);
        return;
    }
    
    if (stdout.trim() !== '1') {
        // La base n'existe pas, on la crée
        exec(`psql -U postgres -c "CREATE DATABASE ${PG_CONFIG.database}"`, { env: dbEnv }, (error) => {
            if (error) {
                console.error(`Erreur lors de la création de la base de données: ${error.message}`);
                return;
            }
            console.log(`Base de données ${PG_CONFIG.database} créée avec succès.`);
            // Exécuter le script après création
            executerScript();
        });
    } else {
        // La base existe déjà
        console.log(`Base de données ${PG_CONFIG.database} existe déjà.`);
        // Exécuter le script quand même
        executerScript();
    }
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

// Route de test
app.get('/', (req, res) => {
    res.json({ 
        message: 'API SupFile',
        database: PG_CONFIG.database,
        port: PORT
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
});
