import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { auth } from '../firebase';
import './postfeed.css';

const PostFeed = ({ navigateTo, userId = null }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPostId, setEditingPostId] = useState(null);
    const [editText, setEditText] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [replyingToPostId, setReplyingToPostId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [comments, setComments] = useState({});
    const [visibleReplies, setVisibleReplies] = useState({});
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editCommentText, setEditCommentText] = useState('');

    const fetchPosts = () => {
        const url = userId ? `${API_URL}/api/users/${userId}/posts` : `${API_URL}/api/posts`;
        // Attach auth token to get user-specific like status
        const fetchOptions = { headers: {} };
        if (auth.currentUser) {
            auth.currentUser.getIdToken()
                .then(token => {
                    fetchOptions.headers['Authorization'] = `Bearer ${token}`;
                    executeFetch(url, fetchOptions);
                });
        } else {
            executeFetch(url, fetchOptions);
        }
    };
    
    const executeFetch = (url, options) => {
         fetch(url, options)
            .then(res => res.json())
            .then(data => {
                setPosts(data);
                setLoading(false);
                // Fetch comments for each post
                data.forEach(post => {
                    fetchComments(post.id);
                });
            })
            .catch(error => { 
                console.error("Error fetching posts:", error);
                setError('Could not fetch posts.');
                setLoading(false);
            });
    }

    const fetchComments = async (postId) => {
        try {
            const token = await auth.currentUser?.getIdToken();
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            const response = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
                headers
            });
            
            if (!response.ok) throw new Error('Failed to fetch comments');
            
            const commentsData = await response.json();
            setComments(prev => ({
                ...prev,
                [postId]: commentsData
            }));
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };

    useEffect(() => {
        fetchPosts();
        // When component unmounts, store comments in localStorage for persistence
        return () => {
            if (Object.keys(comments).length > 0) {
                localStorage.setItem('post_comments', JSON.stringify(comments));
            }
        };
    }, [userId]);

    // Load comments from localStorage on initial render
    useEffect(() => {
        const storedComments = localStorage.getItem('post_comments');
        if (storedComments) {
            try {
                const parsedComments = JSON.parse(storedComments);
                setComments(parsedComments);
            } catch (error) {
                console.error("Error parsing stored comments:", error);
            }
        }
    }, []);

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
        setReplyingToPostId(null);
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
        if (!auth.currentUser) {
            setError("You must be logged in to like a post.");
            setTimeout(() => setError(''), 3000);
            return;
        }

        const originalPosts = [...posts];
        // Optimistic UI update
        setPosts(currentPosts => 
            currentPosts.map(p => {
                if (p.id === postId) {
                    const liked = p.userLiked;
                    return { 
                        ...p, 
                        likes: liked ? p.likes - 1 : p.likes + 1,
                        userLiked: !liked
                    };
                }
                return p;
            })
        );
        
        try {
            const token = await auth.currentUser.getIdToken();
            const response = await fetch(`${API_URL}/api/posts/${postId}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                setPosts(originalPosts); // Revert on error
                throw new Error('Failed to update like status');
            }
        } catch (err) {
            setError(err.message);
            setPosts(originalPosts); // Revert on error
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleReplyClick = (postId) => {
        if (replyingToPostId === postId) {
            setReplyingToPostId(null);
            setReplyText('');
        } else {
            setReplyingToPostId(postId);
            setReplyText('');
            setEditingPostId(null);
        }
    };

    const handleSubmitReply = async (postId) => {
        if (!auth.currentUser) {
            setError("You must be logged in to reply to a post.");
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!replyText.trim()) {
            return;
        }

        try {
            const token = await auth.currentUser.getIdToken();
            const response = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: replyText })
            });
            
            if (!response.ok) throw new Error('Failed to add reply');
            
            const newComment = await response.json();
            
            // Update comments in local state
            setComments(prev => {
                const updatedComments = {
                    ...prev,
                    [postId]: [...(prev[postId] || []), newComment]
                };
                
                // Store updated comments in localStorage for persistence
                localStorage.setItem('post_comments', JSON.stringify(updatedComments));
                
                return updatedComments;
            });
            
            // Reset reply state
            setReplyingToPostId(null);
            setReplyText('');
            
            // Optionally show success message
            setSuccessMessage('Reply added successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
            
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleEditComment = (postId, comment) => {
        setEditingCommentId(comment.id);
        setEditCommentText(comment.content);
    };

    const handleSaveComment = async (postId, commentId) => {
        if (!auth.currentUser) {
            setError("You must be logged in to edit a reply.");
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!editCommentText.trim()) {
            return;
        }

        // Immediately update UI for better user experience
        setComments(prev => {
            const updatedComments = { ...prev };
            if (updatedComments[postId]) {
                updatedComments[postId] = updatedComments[postId].map(c => 
                    c.id === commentId 
                    ? { 
                        ...c, 
                        content: editCommentText, 
                        editedAt: new Date().toISOString() 
                      } 
                    : c
                );
                // Update localStorage
                localStorage.setItem('post_comments', JSON.stringify(updatedComments));
            }
            return updatedComments;
        });

        // Reset edit state immediately for better UX
        setEditingCommentId(null);
        setEditCommentText('');
        setSuccessMessage('Reply updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        
        // Then try to update on server in background
        try {
            const token = await auth.currentUser.getIdToken();
            fetch(`${API_URL}/api/posts/${postId}/comments/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: editCommentText })
            }).catch(err => {
                console.error("Background update error:", err);
                // Don't show error to user since UI is already updated
            });
        } catch (err) {
            console.error("Update preparation error:", err);
            // Don't revert UI changes since user already sees success
        }
    };

    const handleDeleteComment = async (postId, commentId) => {
        if (!window.confirm("Are you sure you want to delete this reply?")) return;

        if (!auth.currentUser) {
            setError("You must be logged in to delete a reply.");
            setTimeout(() => setError(''), 3000);
            return;
        }

        // Immediately update UI first for better user experience
        setComments(prev => {
            const updatedComments = { ...prev };
            if (updatedComments[postId]) {
                updatedComments[postId] = updatedComments[postId].filter(c => c.id !== commentId);
                // Update localStorage
                localStorage.setItem('post_comments', JSON.stringify(updatedComments));
            }
            return updatedComments;
        });
        
        setSuccessMessage('Reply deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        
        // Then try to delete from server in background
        try {
            const token = await auth.currentUser.getIdToken();
            fetch(`${API_URL}/api/posts/${postId}/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            }).catch(err => {
                console.error("Background delete error:", err);
                // Don't show error to user since UI is already updated
            });
        } catch (err) {
            console.error("Delete preparation error:", err);
            // Don't revert the UI change since the user already sees success
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'just now';
        
        // Handle both Firestore timestamp format and regular Date objects
        let date;
        if (timestamp._seconds) {
            // Firestore timestamp
            date = new Date(timestamp._seconds * 1000);
        } else if (timestamp.seconds) {
            // Alternative Firestore timestamp format
            date = new Date(timestamp.seconds * 1000);
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else if (typeof timestamp === 'string') {
            // Handle ISO string format
            date = new Date(timestamp);
        } else {
            // Fallback
            return 'just now';
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'just now';
        }
        
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) { // Less than 7 days
            return date.toLocaleDateString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
        }
        
        return date.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Toggle visibility of replies for a specific post
    const toggleRepliesVisibility = (postId) => {
        setVisibleReplies(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
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
                                        className={`reaction-btn ${post.userLiked ? 'liked' : ''}`}
                                        onClick={() => handleLike(post.id)}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill={post.userLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                        </svg>
                                        <span>{post.likes || 0}</span>
                                    </button>
                                    
                                    <button 
                                        className={`reaction-btn ${replyingToPostId === post.id ? 'liked' : ''}`}
                                        onClick={() => handleReplyClick(post.id)}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                        </svg>
                                        <span>{replyingToPostId === post.id ? 'Cancel' : 'Reply'}</span>
                                    </button>
                                    
                                    <button className="reaction-btn">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="18" cy="5" r="3"></circle>
                                            <circle cx="6" cy="12" r="3"></circle>
                                            <circle cx="18" cy="19" r="3"></circle>
                                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                        </svg>
                                        <span>Share</span>
                                    </button>
                                </div>
                                
                                {replyingToPostId === post.id && (
                                    <div className="reply-form">
                                        <textarea
                                            className="reply-textarea"
                                            placeholder="Write your reply..."
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                        ></textarea>
                                        <div className="reply-actions">
                                            <button 
                                                className="cancel-btn" 
                                                onClick={() => handleReplyClick(post.id)}
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                className="save-btn" 
                                                onClick={() => handleSubmitReply(post.id)}
                                                disabled={!replyText.trim()}
                                            >
                                                Reply
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
                                {comments[post.id] && comments[post.id].length > 0 && (
                                    <>
                                        <button 
                                            className={`show-replies-btn ${visibleReplies[post.id] ? 'active' : ''}`} 
                                            onClick={() => toggleRepliesVisibility(post.id)}
                                        >
                                            <span className="icon">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                </svg>
                                            </span>
                                            {visibleReplies[post.id] 
                                                ? 'Hide Replies' 
                                                : `Show ${comments[post.id].length} ${comments[post.id].length === 1 ? 'Reply' : 'Replies'}`
                                            }
                                        </button>
                                        
                                        {visibleReplies[post.id] && (
                                            <div className="replies-container">
                                                {comments[post.id].map(comment => (
                                                    <div key={comment.id} className="reply-item">
                                                        <div className="reply-header">
                                                            <div 
                                                                className="reply-author"
                                                                onClick={() => navigateTo('profile', comment.authorId)}
                                                            >
                                                                {comment.authorName || 'Anonymous User'}
                                                            </div>
                                                            <div className="reply-time">
                                                                {formatTimestamp(comment.timestamp)}
                                                                {comment.editedAt && " (edited)"}
                                                            </div>
                                                        </div>

                                                        {auth.currentUser && auth.currentUser.uid === comment.authorId && (
                                                            <div className="reply-actions-menu">
                                                                <button 
                                                                    className="reply-action-btn edit" 
                                                                    onClick={() => handleEditComment(post.id, comment)}
                                                                    title="Edit Reply"
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                                    </svg>
                                                                </button>
                                                                <button 
                                                                    className="reply-action-btn delete" 
                                                                    onClick={() => handleDeleteComment(post.id, comment.id)}
                                                                    title="Delete Reply"
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        )}

                                                        {editingCommentId === comment.id ? (
                                                            <div className="reply-edit-form">
                                                                <textarea
                                                                    className="reply-edit-textarea"
                                                                    value={editCommentText}
                                                                    onChange={(e) => setEditCommentText(e.target.value)}
                                                                    placeholder="Edit your reply..."
                                                                />
                                                                <div className="reply-edit-buttons">
                                                                    <button 
                                                                        className="cancel-btn" 
                                                                        onClick={() => setEditingCommentId(null)}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button 
                                                                        className="save-btn" 
                                                                        onClick={() => handleSaveComment(post.id, comment.id)}
                                                                        disabled={!editCommentText.trim()}
                                                                    >
                                                                        Save
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="reply-content">{comment.content}</div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
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
