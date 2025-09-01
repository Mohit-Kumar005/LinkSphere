import admin, { db } from '../firebaseAdmin.js';

// Controller to get all posts
export const getAllPosts = async (req, res) => {
    try {
        const postsSnapshot = await db.collection('posts').orderBy('timestamp', 'desc').get();
        const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(posts);
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ error: 'Failed to fetch posts.' });
    }
};

// Controller to create a new post
export const createPost = async (req, res) => {
    try {
        const { content } = req.body;
        const { uid, name } = req.user; // User info is added by authMiddleware

        if (!content) {
            return res.status(400).json({ error: 'Post content is required.' });
        }

        const newPost = {
            content,
            authorId: uid,
            authorName: name || 'Anonymous User',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('posts').add(newPost);
        res.status(201).json({ id: docRef.id, ...newPost });

    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ error: 'Failed to create post.' });
    }
};

// New controller function to delete a post
export const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { uid } = req.user;
        const postRef = db.collection('posts').doc(postId);
        const doc = await postRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Post not found.' });
        }
        if (doc.data().authorId !== uid) {
            return res.status(403).json({ error: 'User not authorized to delete this post.' });
        }
        await postRef.delete();
        res.status(200).json({ message: 'Post deleted successfully.' });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ error: 'Failed to delete post.' });
    }
};

// New controller function to update a post
export const updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const { uid } = req.user;
        const postRef = db.collection('posts').doc(postId);
        const doc = await postRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Post not found.' });
        }
        if (doc.data().authorId !== uid) {
            return res.status(403).json({ error: 'User not authorized to edit this post.' });
        }
        await postRef.update({ content });
        res.status(200).json({ message: 'Post updated successfully.' });
    } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).json({ error: 'Failed to update post.' });
    }
};

