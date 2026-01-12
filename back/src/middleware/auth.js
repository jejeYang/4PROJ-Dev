import jwt from 'jsonwebtoken';
import ServiceCompte from '../metier/compte.js';

const serviceCompte = new ServiceCompte();

export const authentifierToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Token d\'authentification requis' });
    }

    const decoded = serviceCompte.verifierToken(token);
    if (!decoded) {
        return res.status(403).json({ message: 'Token invalide' });
    }

    req.utilisateur = decoded;
    next();
};

export default authentifierToken;