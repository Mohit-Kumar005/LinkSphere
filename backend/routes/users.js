import express from 'express';
import { getUserProfile, getUserPosts, createUserProfile } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/users/:uid - Fetches a user's profile information
router.get('/:uid', getUserProfile);

// GET /api/users/:uid/posts - Fetches all posts made by a specific user
router.get('/:uid/posts', getUserPosts);

// POST /api/users - Creates a user profile document in the database (requires authentication)
router.post('/', authMiddleware, createUserProfile);

export default router;
