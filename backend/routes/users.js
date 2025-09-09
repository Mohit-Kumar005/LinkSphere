import express from 'express';
import { getProfile, searchUsers } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Search endpoint must come before parameter routes
router.get('/search', authMiddleware, searchUsers);

// Get user profile by ID
router.get('/:userId', getProfile);

router.post('/', authMiddleware, createUserProfile);

// GET /api/users/search - Searches users by name or email (requires authentication)
router.get('/search', authMiddleware, searchUsers);

export default router;
