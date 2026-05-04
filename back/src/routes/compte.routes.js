import express from 'express';
import CompteController from '../controllers/compte.controller.js';
import { authentifierToken } from '../middlewares/auth.middleware.js';
import { uploadAvatar } from '../middlewares/upload.middleware.js';

const router = express.Router();

// Route de connexion (non protégée)
router.post('/login', CompteController.login);
router.post('/auth/google', CompteController.loginGoogle);
router.post('/register', CompteController.register);
router.get('/check-email', CompteController.checkEmail);

// Routes protégées
router.get('/users', authentifierToken, CompteController.getUsers);
router.put('/users/:id', authentifierToken, CompteController.updateUser);
router.post('/users/avatar', authentifierToken, uploadAvatar.single('avatar'), CompteController.uploadAvatar);
router.get('/users/avatar/:id', CompteController.getAvatar);
router.post('/change-password', authentifierToken, CompteController.changePassword);
router.delete('/users', authentifierToken, CompteController.deleteUser);

export default router;
