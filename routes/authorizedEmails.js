import express from 'express';
import { getAuthorizedEmails, addAuthorizedEmail, removeAuthorizedEmail } from '../controllers/authorizedEmailsController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public route to view authorized emails
router.get('/', getAuthorizedEmails);

// Protected routes
router.post('/', authMiddleware, addAuthorizedEmail);
router.delete('/:id', authMiddleware, removeAuthorizedEmail);

export default router;
