import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { API_URL } from '../config';
import './PostFeed.css';

const PostFeed = ({ navigateTo, userId = null }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPostId, setEditingPostId] = useState(null);
    const [editText, setEditText] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [likes, setLikes] = useState({});

    const fetchPosts = () => {
        const url = userId ? `${API_URL}/api/users/${userId}/posts` : `${API_URL}/api/posts`;
        fetch(url)
            .then(res => res.json())
            .then(data => {
                setPosts(data);
                setLoading(false);
                
                // Initialize likes state for each post
                const likesState = {};
                data.forEach(post => {
                    likesState[post.id] = {
                        count: post.likes || 0,
                        userLiked: post.userLiked || false
                    };
                });
                setLikes(likesState);
            })
            .catch(error => { 
                console.error("Error fetching posts:", error);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPosts();
    }, [userId]);

    const handleDelete = async (postId) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;

        try {
            const token = await auth.currentUser.getIdToken();
            const response = await fetch(`${API_URL}/api/posts/${postId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('Failed to delete post.');
            
            setSuccessMessage('Post deleted successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
            fetchPosts(); // Re-fetch posts to update the UI
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleEdit = (post) => {
        setEditingPostId(post.id);
        setEditText(post.content);
    };

    const handleSave = async (postId) => {
        try {
            const token = await auth.currentUser.getIdToken();
            const response = await fetch(`${API_URL}/api/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: editText })
            });
            
            if (!response.ok) throw new Error('Failed to update post.');
            
            setEditingPostId(null);
            setSuccessMessage('Post updated successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
            fetchPosts(); // Re-fetch posts
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleLike = async (postId) => {
        // Optimistic UI update
        const currentLikeStatus = likes[postId]?.userLiked || false;
        
        setLikes(prev => ({
            ...prev,
            [postId]: {
                count: prev[postId].count + (currentLikeStatus ? -1 : 1),
                userLiked: !currentLikeStatus
            }
        }));
        
        try {
            const token = await auth.currentUser.getIdToken();
            const response = await fetch(`${API_URL}/api/posts/${postId}/like`, {
                method: currentLikeStatus ? 'DELETE' : 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                // Revert optimistic update if request failed
                setLikes(prev => ({
                    ...prev,
                    [postId]: {
                        count: prev[postId].count - (currentLikeStatus ? -1 : 1),
                        userLiked: currentLikeStatus
                    }
                }));
                throw new Error('Failed to update like status');
            }
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'just now';
        
        const date = new Date(timestamp._seconds * 1000);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="loader-post">
                <div className="post-spinner"></div>
                <p>Loading posts...</p>
            </div>
        );
    }

    return (
        <div className="post-div">
            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}
            
            {posts.length > 0 ? posts.map(post => (
                <div key={post.id} className="post-id">
                    <div className="post-header">
                        <div className="author-details">
                            <div className="author-post" onClick={() => navigateTo('profile', post.authorId)}>
                                {post.authorName || 'Anonymous User'}
                            </div>
                            <div className="time-post">
                                {formatTimestamp(post.timestamp)}
                            </div>
                        </div>
                        
                        {auth.currentUser && auth.currentUser.uid === post.authorId && (
                            <div className="post-actions">
                                <button onClick={() => handleEdit(post)} className="icon-btn edit-btn" title="Edit Post">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                                <button onClick={() => handleDelete(post.id)} className="icon-btn delete-btn" title="Delete Post">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {editingPostId === post.id ? (
                        <div className="edit-area">
                            <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="edit-textarea"
                                placeholder="What's on your mind?"
                            />
                            <div className="edit-actions">
                                <button onClick={() => handleSave(post.id)} className="save-btn">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                        <polyline points="7 3 7 8 15 8"></polyline>
                                    </svg>
                                    Save Changes
                                </button>
                                <button onClick={() => setEditingPostId(null)} className="cancel-btn">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="post-content">{post.content}</p>
                            
                            <div className="post-footer">
                                <div className="post-reactions">
                                    <button 
                                        className={`reaction-btn ${likes[post.id]?.userLiked ? 'liked' : ''}`}
                                        onClick={() => handleLike(post.id)}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill={likes[post.id]?.userLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                        </svg>
                                        {likes[post.id]?.count || 0}
                                    </button>
                                    
                                    <button className="reaction-btn">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                        </svg>
                                        Reply
                                    </button>
                                    
                                    <button className="reaction-btn">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="18" cy="5" r="3"></circle>
                                            <circle cx="6" cy="12" r="3"></circle>
                                            <circle cx="18" cy="19" r="3"></circle>
                                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                        </svg>
                                        Share
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )) : (
                <div className="no-post">
                    <div className="no-post-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                    </div>
                    <p>No posts to show</p>
                    <button className="create-first-post" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
                        Create your first post
                    </button>
                </div>
            )}
        </div>
    );
};

export default PostFeed;
