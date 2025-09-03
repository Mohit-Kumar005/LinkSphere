import admin, { db } from '../firebaseAdmin.js';

export const getAllPosts = async (req, res) => {
    try {
        const postsSnapshot = await db.collection('posts').orderBy('timestamp', 'desc').get();
        
        const postsPromises = postsSnapshot.docs.map(async (doc) => {
            const postData = doc.data();
            const post = { id: doc.id, ...postData };
            
            // Get comment count for each post
            const commentsSnapshot = await db.collection('posts').doc(doc.id).collection('comments').get();
            post.commentCount = commentsSnapshot.size;

            // If a user is authenticated, check which posts they've liked
            if (req.user) {
                const { uid } = req.user;
                post.userLiked = (postData.likes || []).includes(uid);
            } else {
                post.userLiked = false;
            }
            // Always return the count of likes
            post.likes = (postData.likes || []).length;
            
            return post;
        });

        const posts = await Promise.all(postsPromises);
        res.status(200).json(posts);
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ error: 'Failed to fetch posts.' });
    }
};

export const createPost = async (req, res) => {
    try {
        const { content } = req.body;
        const { uid, name } = req.user;
        if (!content) {
            return res.status(400).json({ error: 'Post content is required.' });
        }
        const newPost = {
            content,
            authorId: uid,
            authorName: name || 'Anonymous User',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            likes: [],
            shareCount: 0 // Initialize share count
        };
        const docRef = await db.collection('posts').add(newPost);
        res.status(201).json({ id: docRef.id, ...newPost });
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ error: 'Failed to create post.' });
    }
};

export const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { uid } = req.user;
        const postRef = db.collection('posts').doc(postId);
        const doc = await postRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'Post not found.' });
        if (doc.data().authorId !== uid) return res.status(403).json({ error: 'User not authorized to delete this post.' });
        
        await postRef.delete();
        res.status(200).json({ message: 'Post deleted successfully.' });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ error: 'Failed to delete post.' });
    }
};

export const updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const { uid } = req.user;
        const postRef = db.collection('posts').doc(postId);
        const doc = await postRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'Post not found.' });
        if (doc.data().authorId !== uid) return res.status(403).json({ error: 'User not authorized to edit this post.' });

        await postRef.update({ content });
        res.status(200).json({ message: 'Post updated successfully.' });
    } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).json({ error: 'Failed to update post.' });
    }
};

export const likePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { uid } = req.user;
        const postRef = db.collection('posts').doc(postId);
        const doc = await postRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        const postData = doc.data();
        const likes = postData.likes || [];
        
        if (likes.includes(uid)) {
            await postRef.update({
                likes: admin.firestore.FieldValue.arrayRemove(uid)
            });
        } else {
            await postRef.update({
                likes: admin.firestore.FieldValue.arrayUnion(uid)
            });
        }
        
        res.status(200).json({ message: 'Like status updated.' });
    } catch (error) {
        console.error("Error updating like status:", error);
        res.status(500).json({ error: 'Failed to update like status.' });
    }
};

// --- NEW FUNCTION: SHARE POST ---
export const sharePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const postRef = db.collection('posts').doc(postId);

        await postRef.update({
            shareCount: admin.firestore.FieldValue.increment(1)
        });
        
        res.status(200).json({ message: 'Post shared successfully.' });
    } catch (error) {
        console.error("Error sharing post:", error);
        res.status(500).json({ error: 'Failed to share post.' });
    }
};

// --- NEW FUNCTION: ADD COMMENT (REPLY) ---
export const addComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const { uid, name } = req.user;

        if (!content) {
            return res.status(400).json({ error: 'Comment content is required.' });
        }

        const comment = {
            content,
            authorId: uid,
            authorName: name || 'Anonymous User',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };

        const commentRef = await db.collection('posts').doc(postId).collection('comments').add(comment);
        res.status(201).json({ id: commentRef.id, ...comment });
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ error: 'Failed to add comment.' });
    }
};