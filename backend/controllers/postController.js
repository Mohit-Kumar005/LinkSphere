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

export const getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const commentsSnapshot = await db.collection('posts').doc(postId).collection('comments').orderBy('timestamp', 'asc').get();
        
        const comments = commentsSnapshot.docs.map(doc => {
            return { id: doc.id, ...doc.data() };
        });
        
        res.status(200).json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ error: 'Failed to fetch comments.' });
    }
};

export const updateComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { content } = req.body;
        const { uid } = req.user;

        if (!content) {
            return res.status(400).json({ error: 'Comment content is required.' });
        }

        const commentRef = db.collection('posts').doc(postId).collection('comments').doc(commentId);
        const doc = await commentRef.get();
        
        if (!doc.exists) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        if (doc.data().authorId !== uid) {
            return res.status(403).json({ error: 'User not authorized to edit this comment.' });
        }

        await commentRef.update({ 
            content,
            editedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        res.status(200).json({ message: 'Comment updated successfully.' });
    } catch (error) {
        console.error("Error updating comment:", error);
        res.status(500).json({ error: 'Failed to update comment.' });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { uid } = req.user;

        const commentRef = db.collection('posts').doc(postId).collection('comments').doc(commentId);
        const doc = await commentRef.get();
        
        if (!doc.exists) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        if (doc.data().authorId !== uid) {
            return res.status(403).json({ error: 'User not authorized to delete this comment.' });
        }

        await commentRef.delete();
        
        res.status(200).json({ message: 'Comment deleted successfully.' });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ error: 'Failed to delete comment.' });
    }
};

// New function for hashtag search
export const searchHashtags = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim().length < 2) {
            return res.status(400).json({ error: 'Search query must be at least 2 characters long.' });
        }
        
        const hashtagQuery = q.toLowerCase();
        
        // First, query all posts
        const postsSnapshot = await db.collection('posts').get();
        
        // Process posts to extract and count hashtags
        const hashtagCounts = {};
        
        postsSnapshot.docs.forEach(doc => {
            const post = doc.data();
            // Extract hashtags from post content using regex
            const hashtags = (post.content.match(/#[a-zA-Z0-9_]+/g) || [])
                .map(tag => tag.substring(1).toLowerCase()); // Remove # and lowercase
                
            hashtags.forEach(tag => {
                if (tag.includes(hashtagQuery)) {
                    if (hashtagCounts[tag]) {
                        hashtagCounts[tag]++;
                    } else {
                        hashtagCounts[tag] = 1;
                    }
                }
            });
        });
        
        // Convert to array and sort by count
        const results = Object.entries(hashtagCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Limit to top 10 results
            
        res.status(200).json(results);
    } catch (error) {
        console.error("Error searching hashtags:", error);
        res.status(500).json({ error: 'Failed to search hashtags.' });
    }
};

// New function to get posts by hashtag
export const getPostsByHashtag = async (req, res) => {
    try {
        const { hashtag } = req.params;
        
        if (!hashtag || hashtag.trim().length < 1) {
            return res.status(400).json({ error: 'Hashtag must not be empty.' });
        }
        
        console.log(`Searching for posts with hashtag: #${hashtag}`);
        
        // Query all posts
        const postsSnapshot = await db.collection('posts').orderBy('timestamp', 'desc').get();
        
        // Filter posts containing the hashtag
        const hashtagPosts = [];
        const hashtagRegex = new RegExp(`#${hashtag}\\b`, 'i'); // Case insensitive, word boundary
        
        for (const doc of postsSnapshot.docs) {
            const postData = doc.data();
            const post = { id: doc.id, ...postData };
            
            if (hashtagRegex.test(post.content)) {
                // Get comment count for each post
                const commentsSnapshot = await db.collection('posts').doc(doc.id).collection('comments').get();
                post.commentCount = commentsSnapshot.size;

                // If a user is authenticated, check if they've liked the post
                if (req.user) {
                    const { uid } = req.user;
                    post.userLiked = (postData.likes || []).includes(uid);
                } else {
                    post.userLiked = false;
                }
                
                // Always return the count of likes
                post.likes = (postData.likes || []).length;
                
                hashtagPosts.push(post);
            }
        }
        
        console.log(`Found ${hashtagPosts.length} posts with hashtag #${hashtag}`);
        res.status(200).json(hashtagPosts);
    } catch (error) {
        console.error("Error fetching posts by hashtag:", error);
        res.status(500).json({ error: 'Failed to fetch posts by hashtag.' });
    }
};

// Add this new function for getting posts by user
export const getPostsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required.' });
        }
        
        const postsSnapshot = await db.collection('posts')
            .where('authorId', '==', userId)
            .orderBy('timestamp', 'desc')
            .get();
        
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
        console.error("Error fetching user posts:", error);
        res.status(500).json({ error: 'Failed to fetch user posts.' });
    }
};