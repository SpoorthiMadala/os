import express from 'express';
import { getOverallMarks, getFATMarks, addMarks, getMyMarks } from '../controllers/marksController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/overall', getOverallMarks);
router.get('/fat', getFATMarks);

// Protected routes
router.get('/my-marks', authMiddleware, getMyMarks);
router.post('/', authMiddleware, addMarks);

export default router;
