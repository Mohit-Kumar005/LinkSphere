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
    deleteComment,
    searchHashtags,
    getPostsByHashtag,
    getPostsByUser
} from '../controllers/postController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Search endpoints must come before parameter routes
router.get('/search/hashtag', authMiddleware, searchHashtags);
router.get('/hashtag/:hashtag', authMiddleware, getPostsByHashtag);
router.get('/user/:userId', authMiddleware, getPostsByUser);

// Standard routes
router.get('/', authMiddleware, getAllPosts);
router.post('/', authMiddleware, createPost);
router.delete('/:postId', authMiddleware, deletePost);
router.put('/:postId', authMiddleware, updatePost);
router.post('/:postId/like', authMiddleware, likePost);
router.post('/:postId/share', authMiddleware, sharePost);

// Comment routes
router.post('/:postId/comments', authMiddleware, addComment);
router.get('/:postId/comments', getComments);
router.put('/:postId/comments/:commentId', authMiddleware, updateComment);
router.delete('/:postId/comments/:commentId', authMiddleware, deleteComment);

export default router;
