import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { API_URL } from '../config';
import './HashtagPage.css';
import '../styles/theme.css';

const HashtagPage = ({ navigateTo, hashtagName }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hashtagCount, setHashtagCount] = useState(0);

    // --- FIX: Added robust timestamp formatting function ---
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'just now';
        
        let date;
        if (timestamp._seconds) {
            date = new Date(timestamp._seconds * 1000);
        } else if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else if (typeof timestamp === 'string') {
            date = new Date(timestamp);
        } else {
            return 'just now';
        }
        
        if (isNaN(date.getTime())) {
            return 'just now';
        }
        
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        
        return date.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        });
    };


    useEffect(() => {
        if (!hashtagName) return;
        
        const fetchHashtagPosts = async () => {
            try {
                setLoading(true);
                const token = await auth.currentUser.getIdToken();
                
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
                const tagName = part.substring(1);
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

    return (
        <div className="home-page">
            <div className="sidebar">
                <div className="app-branding">
                    <div className="app-logo">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M7 12h10M12 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <span className="app-name">LinkSphere</span>
                    </div>
                    <p className="app-tagline">Connect, Share & Discover</p>
                </div>
                <nav className="sidebar-nav">
                    <button 
                        className="sidebar-link"
                        onClick={() => navigateTo('home')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                        All Posts
                    </button>
                    <button 
                        className="sidebar-link"
                        onClick={() => navigateTo('home')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        Following
                    </button>
                    <button 
                        className="sidebar-link"
                        onClick={() => navigateTo('home')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                            <polyline points="17 6 23 6 23 12"></polyline>
                        </svg>
                        Trending
                    </button>
                </nav>
            </div>
            
            <main className="main-content" style={{ display: 'block', alignContent: 'flex-start' }}>
                {loading ? (
                    <div className="hashtag-loader">
                        <div className="loading-spinner"></div>
                        <p>Loading posts for #{hashtagName}...</p>
                    </div>
                ) : error ? (
                    <div className="hashtag-error">
                        <div className="error-icon">⚠️</div>
                        <h3>Error</h3>
                        <p>{error}</p>
                        <button onClick={() => navigateTo('home')} className="btn-primary">
                            Return Home
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="content-header">
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
                        </div>
                        
                        <div className="feed-container">
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
                                                            {formatTimestamp(post.timestamp)}
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
                    </>
                )}
            </main>
            
            <aside className="trending-sidebar">
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
                
                <div className="trending-card">
                    <h3 className="trending-title">Trending Topics</h3>
                    <ul className="trending-list">
                        <li className="trending-item">
                            <span className="trending-tag">#technology</span>
                            <span className="trending-count">1.2K posts</span>
                        </li>
                        <li className="trending-item">
                            <span className="trending-tag">#programming</span>
                            <span className="trending-count">890 posts</span>
                        </li>
                        <li className="trending-item">
                            <span className="trending-tag">#javascript</span>
                            <span className="trending-count">654 posts</span>
                        </li>
                        <li className="trending-item">
                            <span className="trending-tag">#webdev</span>
                            <span className="trending-count">432 posts</span>
                        </li>
                        <li className="trending-item">
                            <span className="trending-tag">#design</span>
                            <span className="trending-count">321 posts</span>
                        </li>
                    </ul>
                </div>
                
                <div className="sidebar-footer">
                    <div className="footer-links">
                        <a href="#" className="footer-link">About</a>
                        <a href="#" className="footer-link">Accessibility</a>
                        <a href="#" className="footer-link">Help Center</a>
                    </div>
                    <div className="footer-links">
                        <a href="#" className="footer-link">Privacy & Terms</a>
                        <a href="#" className="footer-link">Ad Choices</a>
                        <a href="#" className="footer-link">Advertising</a>
                    </div>
                    <div className="footer-copyright">
                        <span>LinkSphere Corporation © {new Date().getFullYear()}</span>
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default HashtagPage;
