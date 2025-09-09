import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { API_URL } from '../config';
import './HashtagPage.css';

const HashtagPage = ({ navigateTo, hashtagName }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hashtagCount, setHashtagCount] = useState(0);

    useEffect(() => {
        if (!hashtagName) return;
        
        const fetchHashtagPosts = async () => {
            try {
                setLoading(true);
                const token = await auth.currentUser.getIdToken();
                console.log(`Fetching posts for hashtag: #${hashtagName}`);
                
                const response = await fetch(`${API_URL}/api/posts/hashtag/${hashtagName}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch hashtag posts');
                }
                
                const data = await response.json();
                setPosts(data);
                setHashtagCount(data.length);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching hashtag posts:', err);
                setError('Failed to load posts. Please try again later.');
                setLoading(false);
            }
        };
        
        fetchHashtagPosts();
    }, [hashtagName]);

    const handleAuthorClick = (authorId) => {
        navigateTo('profile', authorId);
    };

    const renderPostContent = (content) => {
        return content.split(/(#[a-zA-Z0-9_]+)/g).map((part, index) => {
            if (part.startsWith('#')) {
                const tagName = part.substring(1); // Remove # from the tag
                return (
                    <span 
                        key={index}
                        className="hashtag-link"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigateTo('hashtag', tagName);
                        }}
                    >
                        {part}
                    </span>
                );
            }
            return <span key={index}>{part}</span>;
        });
    };

    if (loading) {
        return (
            <div className="hashtag-loader">
                <div className="loading-spinner"></div>
                <p>Loading posts for #{hashtagName}...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="hashtag-error">
                <div className="error-icon">⚠️</div>
                <h3>Error</h3>
                <p>{error}</p>
                <button onClick={() => navigateTo('home')} className="btn-primary">
                    Return Home
                </button>
            </div>
        );
    }

    return (
        <div className="hashtag-container">
            <div className="hashtag-hero">
                <div className="hashtag-background">
                    <div className="hashtag-pattern"></div>
                </div>
                <div className="hashtag-content">
                    <div className="hashtag-avatar">
                        <span className="hashtag-symbol">#</span>
                    </div>
                    <div className="hashtag-details">
                        <h1 className="hashtag-name">#{hashtagName}</h1>
                        <div className="hashtag-stats">
                            <div className="hashtag-stat">
                                <span className="stat-value">{hashtagCount}</span>
                                <span className="stat-label">posts</span>
                            </div>
                        </div>
                        <p className="hashtag-description">
                            Explore posts tagged with #{hashtagName}
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="hashtag-posts-section">
                <div className="posts-header">
                    <h2>Recent #{hashtagName} posts</h2>
                    <div className="posts-filter">
                        <button className="filter-btn active">Recent</button>
                        <button className="filter-btn">Popular</button>
                    </div>
                </div>
                
                <div className="hashtag-posts">
                    {posts.length > 0 ? (
                        posts.map((post) => (
                            <div key={post.id} className="post-card">
                                <div className="post-header">
                                    <div className="post-author" onClick={() => handleAuthorClick(post.authorId)}>
                                        <div className="author-avatar">
                                            {post.authorName ? post.authorName[0].toUpperCase() : '?'}
                                        </div>
                                        <div className="author-info">
                                            <span className="author-name">{post.authorName}</span>
                                            <span className="post-time">
                                                {post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : 'Just now'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="post-content">
                                    {renderPostContent(post.content)}
                                </div>
                                <div className="post-actions">
                                    <button className="post-action-btn">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                        </svg>
                                        <span>{post.likes || 0}</span>
                                    </button>
                                    <button className="post-action-btn">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                        <span>{post.commentCount || 0}</span>
                                    </button>
                                    <button className="post-action-btn">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="18" cy="5" r="3"></circle>
                                            <circle cx="6" cy="12" r="3"></circle>
                                            <circle cx="18" cy="19" r="3"></circle>
                                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                        </svg>
                                        <span>{post.shareCount || 0}</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-posts">
                            <div className="empty-icon">🔍</div>
                            <h3>No Posts Found</h3>
                            <p>Be the first to post with #{hashtagName}</p>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="hashtag-related">
                <h3>Related Hashtags</h3>
                <div className="related-tags">
                    <button className="related-tag" onClick={() => navigateTo('hashtag', 'javascript')}>
                        #javascript
                    </button>
                    <button className="related-tag" onClick={() => navigateTo('hashtag', 'programming')}>
                        #programming
                    </button>
                    <button className="related-tag" onClick={() => navigateTo('hashtag', 'webdev')}>
                        #webdev
                    </button>
                    <button className="related-tag" onClick={() => navigateTo('hashtag', 'technology')}>
                        #technology
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HashtagPage;
