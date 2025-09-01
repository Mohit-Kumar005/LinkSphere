import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';
import './HomePage.css';
import '../styles/theme.css';

const HomePage = ({ navigateTo, idToken }) => {
    const [postFeedKey, setPostFeedKey] = useState(Date.now());
    const [activeTab, setActiveTab] = useState('all');
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (auth.currentUser) {
            setUser({
                displayName: auth.currentUser.displayName,
                email: auth.currentUser.email,
                uid: auth.currentUser.uid
            });
        }
    }, []);

    const handlePostCreated = () => {
        setPostFeedKey(Date.now());
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
                        <span className="app-name">Nexus</span>
                    </div>
                    <p className="app-tagline">Connect, Share, Discover</p>
                </div>
                <div className="profile-card">
                    <div className="profile-header">
                        <div className="profile-avatar">
                            {user?.displayName ? user.displayName[0].toUpperCase() : '?'}
                        </div>
                        <h3 className="profile-name">{user?.displayName || 'User'}</h3>
                        <p className="profile-email">{user?.email}</p>
                    </div>
                    <div className="profile-actions">
                        <button 
                            className="btn btn-outline btn-block"
                            onClick={() => navigateTo('profile', user?.uid)}
                        >
                            View Profile
                        </button>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    <button 
                        className={`sidebar-link ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                        All Posts
                    </button>
                    <button 
                        className={`sidebar-link ${activeTab === 'following' ? 'active' : ''}`}
                        onClick={() => setActiveTab('following')}
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
                        className={`sidebar-link ${activeTab === 'trending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('trending')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                            <polyline points="17 6 23 6 23 12"></polyline>
                        </svg>
                        Trending
                    </button>
                </nav>
            </div>
            
            <main className="main-content">
                <div className="content-header">
                    <h1 className="content-title">Home Feed</h1>
                </div>
                
                <div className="post-composer">
                    <CreatePost idToken={idToken} onPostCreated={handlePostCreated} />
                </div>
                
                <div className="feed-container">
                    <PostFeed key={postFeedKey} navigateTo={navigateTo} />
                </div>
            </main>
            
            <aside className="trending-sidebar">
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
                
                <div className="suggestions-card">
                    <h3 className="suggestions-title">Suggested Users</h3>
                    <ul className="suggestions-list">
                        <li className="suggestion-item">
                            <div className="suggestion-avatar">J</div>
                            <div className="suggestion-info">
                                <span className="suggestion-name">John Doe</span>
                                <span className="suggestion-username">@johndoe</span>
                            </div>
                            <button className="btn btn-sm btn-outline follow-btn">Follow</button>
                        </li>
                        <li className="suggestion-item">
                            <div className="suggestion-avatar">S</div>
                            <div className="suggestion-info">
                                <span className="suggestion-name">Sarah Smith</span>
                                <span className="suggestion-username">@sarahsmith</span>
                            </div>
                            <button className="btn btn-sm btn-outline follow-btn">Follow</button>
                        </li>
                        <li className="suggestion-item">
                            <div className="suggestion-avatar">R</div>
                            <div className="suggestion-info">
                                <span className="suggestion-name">Robert Johnson</span>
                                <span className="suggestion-username">@robertj</span>
                            </div>
                            <button className="btn btn-sm btn-outline follow-btn">Follow</button>
                        </li>
                    </ul>
                </div>
            </aside>
        </div>
    );
};

export default HomePage;
