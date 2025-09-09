import React, { useState, useRef, useEffect } from 'react';
import { auth } from '../firebase';
import { API_URL } from '../config';
import './Navbar.css';

const Navbar = ({ navigateTo, handleLogout }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState({
        users: [],
        hashtags: []
    });
    const [isSearching, setIsSearching] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const searchRef = useRef(null);
    const menuRef = useRef(null);

    const handleSearch = async (query) => {
        setSearchQuery(query);
        setSearchError(null);
        
        if (query.trim().length < 2) {
            setSearchResults({ users: [], hashtags: [] });
            return;
        }

        try {
            const token = await auth.currentUser.getIdToken();
            
            // Check if the query starts with # for hashtag search
            if (query.startsWith('#')) {
                const hashtagQuery = query.substring(1); // Remove # from query
                const response = await fetch(`${API_URL}/api/posts/search/hashtag?q=${hashtagQuery}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    if (response.status === 404) {
                        // No results found - not an error
                        setSearchResults({ users: [], hashtags: [] });
                        return;
                    }
                    const errorText = await response.text();
                    throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
                }
                
                const data = await response.json();
                setSearchResults({ users: [], hashtags: data });
            } else {
                // Regular user search
                const response = await fetch(`${API_URL}/api/users/search?q=${query}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    if (response.status === 404) {
                        // No results found - not an error
                        setSearchResults({ users: [], hashtags: [] });
                        return;
                    }
                    const errorText = await response.text();
                    throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
                }
                
                const data = await response.json();
                setSearchResults({ users: data, hashtags: [] });
            }
        } catch (error) {
            console.error('Search failed:', error);
            setSearchError('Search failed. Please try again.');
            setSearchResults({ users: [], hashtags: [] });
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearching(false);
            }
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchInputKeyDown = (e) => {
        // Auto-add hashtag symbol when user types space after #
        if (e.key === ' ' && searchQuery.endsWith('#')) {
            e.preventDefault();
            setSearchQuery(searchQuery);
        }
        
        // Handle Enter key to navigate to first result
        if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
            e.preventDefault();
            
            if (searchQuery.startsWith('#') && searchResults.hashtags.length > 0) {
                handleSearchSubmit('hashtag', searchResults.hashtags[0]);
            } else if (searchResults.users.length > 0) {
                handleSearchSubmit('user', searchResults.users[0]);
            } else if (searchQuery.startsWith('#') && searchQuery.length > 1) {
                // Search for hashtag even if no results
                handleSearchSubmit('hashtag', { name: searchQuery.substring(1) });
            }
        }
    };

    const handleSearchSubmit = (type, item) => {
        if (type === 'user') {
            navigateTo('profile', item.id);
        } else if (type === 'hashtag') {
            navigateTo('hashtag', item.name);
        }
        setIsSearching(false);
        setSearchQuery('');
    };

    return (
        <header className="navbar">
            <div className="navbar-container">
                <div className="navbar-left">
                    <div className="navbar-logo" onClick={() => navigateTo('home')}>
                        <div className="logo-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M7 12h10M12 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <span>LinkSphere</span>
                    </div>

                    <nav className="navbar-nav desktop-only">
                        <button 
                            className="nav-link active" 
                            onClick={() => navigateTo('home')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                            Home
                        </button>
                        <button 
                            className="nav-link" 
                            onClick={() => navigateTo('explore')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                            </svg>
                            Explore
                        </button>
                        <button 
                            className="nav-link" 
                            onClick={() => navigateTo('notifications')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                            Notifications
                        </button>
                    </nav>
                </div>

                <div className="navbar-center" ref={searchRef}>
                    <div className="search-container">
                        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search users or #hashtags..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onKeyDown={handleSearchInputKeyDown}
                            onFocus={() => setIsSearching(true)}
                        />
                        {isSearching && (
                            <div className="search-results">
                                {searchError && (
                                    <div className="search-error">{searchError}</div>
                                )}
                                
                                {searchResults.users.length > 0 && (
                                    <>
                                        <div className="search-section-header">Users</div>
                                        {searchResults.users.map(user => (
                                            <div
                                                key={user.id}
                                                className="search-result-item"
                                                onClick={() => handleSearchSubmit('user', user)}
                                            >
                                                <div className="user-avatar">
                                                    {user.name ? user.name[0].toUpperCase() : '?'}
                                                </div>
                                                <div className="user-info">
                                                    <span className="user-name">{user.name}</span>
                                                    <span className="user-email">{user.email}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                                
                                {searchResults.hashtags.length > 0 && (
                                    <>
                                        <div className="search-section-header">Hashtags</div>
                                        {searchResults.hashtags.map(hashtag => (
                                            <div
                                                key={hashtag.name}
                                                className="search-result-item hashtag-item"
                                                onClick={() => handleSearchSubmit('hashtag', hashtag)}
                                            >
                                                <div className="hashtag-icon">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M4 9h16M4 15h16M10 3v18M14 3v18" />
                                                    </svg>
                                                </div>
                                                <div className="hashtag-info">
                                                    <span className="hashtag-name">#{hashtag.name}</span>
                                                    <span className="hashtag-count">{hashtag.count} posts</span>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {searchQuery.trim().length >= 2 && !searchError && 
                                  searchResults.users.length === 0 && 
                                  searchResults.hashtags.length === 0 && (
                                    <div className="search-no-results">
                                        <p>No results found for "{searchQuery}"</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="navbar-right">
                    <button 
                        className="btn btn-icon desktop-only"
                        onClick={() => navigateTo('profile', auth.currentUser.uid)} 
                        aria-label="Profile"
                    >
                        <div className="navbar-avatar">
                            {auth.currentUser?.displayName ? auth.currentUser.displayName[0].toUpperCase() : '?'}
                        </div>
                    </button>
                    
                    <button 
                        className="btn btn-icon desktop-only"
                        onClick={handleLogout} 
                        aria-label="Logout"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                    </button>
                    
                    <button 
                        className="mobile-menu-button mobile-only" 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Menu"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            
            {isMenuOpen && (
                <div className="mobile-menu" ref={menuRef}>
                    <nav className="mobile-nav">
                        <button 
                            className="mobile-nav-link" 
                            onClick={() => {
                                navigateTo('home');
                                setIsMenuOpen(false);
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                            Home
                        </button>
                        <button 
                            className="mobile-nav-link" 
                            onClick={() => {
                                navigateTo('explore');
                                setIsMenuOpen(false);
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                            </svg>
                            Explore
                        </button>
                        <button 
                            className="mobile-nav-link" 
                            onClick={() => {
                                navigateTo('profile', auth.currentUser.uid);
                                setIsMenuOpen(false);
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Profile
                        </button>
                        <button 
                            className="mobile-nav-link logout" 
                            onClick={() => {
                                handleLogout();
                                setIsMenuOpen(false);
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            Logout
                        </button>
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Navbar;
