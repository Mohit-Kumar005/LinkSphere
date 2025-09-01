import React, { useState, useEffect } from 'react';
import PostFeed from './PostFeed.jsx';
import { API_URL } from '../config';
import './ProfilePage.css';

const ProfilePage = ({ navigateTo, profileUid }) => {
    const [profileUser, setProfileUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profileUid) return;
        setLoading(true);
        fetch(`${API_URL}/api/users/${profileUid}`)
            .then(res => res.json())
            .then(data => {
                setProfileUser(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching profile:", error);
                setLoading(false);
            });
    }, [profileUid]);
 
    if (loading) {
        return (
            <div className="profile-loader">
                <div className="loading-spinner"></div>
                <p>Loading profile...</p>
            </div>
        );
    }
    
    if (!profileUser) {
        return (
            <div className="profile-error">
                <div className="error-icon">⚠️</div>
                <h3>Profile Not Found</h3>
                <p>Could not load this user's profile.</p>
                <button onClick={() => navigateTo('home')} className="btn-primary">
                    Return Home
                </button>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-hero glass-card animate-fade-in">
                <div className="profile-background"></div>
                <div className="profile-content">
                    <div className="profile-avatar-large">
                        <span className="avatar-text">
                            {profileUser.displayName ? profileUser.displayName[0].toUpperCase() : '?'}
                        </span>
                    </div>
                    <div className="profile-details">
                        <h1 className="profile-name">{profileUser.displayName || 'Unknown User'}</h1>
                        <p className="profile-email">{profileUser.email}</p>
                        <p className="profile-bio">
                            {profileUser.bio || "This user hasn't added a bio yet."}
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="profile-posts-section">
                <div className="posts-header glass-card">
                    <h2>Posts by {profileUser.displayName || 'User'}</h2>
                    <div className="posts-count">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10,9 9,9 8,9"/>
                        </svg>
                        Recent Activity
                    </div>
                </div>
                <PostFeed navigateTo={navigateTo} userId={profileUid} />
            </div>
        </div>
    );
};

export default ProfilePage;
