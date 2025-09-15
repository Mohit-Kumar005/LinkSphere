import express from 'express';
// Corrected: Changed getProfile to getUserProfile
import { getUserProfile, getUserPosts, createUserProfile, searchUsers } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Route for searching users
router.get('/search', authMiddleware, searchUsers);

// GET /api/users/:uid - Fetches a user's profile information
// Corrected: Changed getProfile to getUserProfile and :userId to :uid
router.get('/:uid', getUserProfile);

// GET /api/users/:uid/posts - Fetches all posts made by a specific user
router.get('/:uid/posts', getUserPosts);

// POST /api/users - Creates a user profile document in the database
router.post('/', authMiddleware, createUserProfile);

export default router;
