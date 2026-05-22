import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { patchBigIntSerialization } from './src/utils/bigint.utils.js';
import { PORT } from './src/config/env.js';
import routes from './src/routes/index.js';
import { errorMiddleware } from './src/middlewares/error.middleware.js';
import { lancerNettoyageLiensExpires } from './src/jobs/nettoyage-liens.job.js';
import swaggerSpec from './src/docs/swagger.js';

patchBigIntSerialization();

const app = express();

// CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-lien-password');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/swagger.json', (req, res) => {
    res.json(swaggerSpec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'SupFile API Docs',
}));

// Mounting routes
app.use(routes);

app.get('/', (req, res) => {
    res.json({ message: 'API SupFile', port: PORT });
});

// Global error handler
app.use(errorMiddleware);

lancerNettoyageLiensExpires();

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
});
