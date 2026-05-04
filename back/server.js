import express from 'express';
import './src/utils/bigint.utils.js'; // Patch BigInt JSON serialization
import { PORT } from './src/config/env.js';
import routes from './src/routes/index.js';
import { errorMiddleware } from './src/middlewares/error.middleware.js';

const app = express();

// CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mounting routes
app.use(routes);

app.get('/', (req, res) => {
    res.json({ message: 'API SupFile', port: PORT });
});

// Global error handler
app.use(errorMiddleware);

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
});