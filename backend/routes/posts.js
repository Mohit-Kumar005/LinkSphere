import express from 'express';
import { getAllPosts, createPost, deletePost, updatePost } from '../controllers/postController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/posts - Fetches all posts for the main feed
router.get('/', getAllPosts);

// POST /api/posts - Creates a new post (requires authentication)
router.post('/', authMiddleware, createPost);

router.delete('/:postId', authMiddleware, deletePost); // New DELETE route
router.put('/:postId', authMiddleware, updatePost); // New PUT route for updates

export default router;

