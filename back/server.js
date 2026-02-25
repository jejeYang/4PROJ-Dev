import express from 'express';
import { readFile } from 'node:fs/promises';
import { PORT, PG_CONFIG } from './src/global_properties.js';
import compteRouter from './src/controller/compte.js';
import dossierRouter from './src/controller/dossier.js';
import { db } from './src/db.js';

async function initialiserBase() {
    try {
        const sql = await readFile('./script.sql', 'utf-8');
        await db.multi(sql);
        console.log('✅ Script SQL exécuté avec succès.');
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la base de données :', error.message);
    }
}

await initialiserBase();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

app.use(compteRouter);
app.use(dossierRouter);

app.get('/', (req, res) => {
    res.json({ 
        message: 'API SupFile',
        database: PG_CONFIG.database,
        port: PORT
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
});