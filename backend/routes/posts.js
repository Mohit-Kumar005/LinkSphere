import express from 'express';
// Import the new controller functions
import { 
    getAllPosts, 
    createPost, 
    deletePost, 
    updatePost, 
    likePost,
    sharePost,
    addComment,
    getComments,
    updateComment,
    deleteComment
} from '../controllers/postController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Existing Routes
router.get('/', authMiddleware, getAllPosts);
router.post('/', authMiddleware, createPost);
router.delete('/:postId', authMiddleware, deletePost);
router.put('/:postId', authMiddleware, updatePost);
router.post('/:postId/like', authMiddleware, likePost);

// --- NEW ROUTES ---
// Route for sharing a post
router.post('/:postId/share', authMiddleware, sharePost);
// Route for adding a comment (reply) to a post
router.post('/:postId/comments', authMiddleware, addComment);
// Route for getting comments for a post
router.get('/:postId/comments', getComments);
// Route for updating a comment
router.put('/:postId/comments/:commentId', authMiddleware, updateComment);
// Route for deleting a comment
router.delete('/:postId/comments/:commentId', authMiddleware, deleteComment);

export default router;
