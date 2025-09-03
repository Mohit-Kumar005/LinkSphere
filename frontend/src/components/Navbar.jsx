import React, { useState, useRef, useEffect } from 'react';
import { auth } from '../firebase';
import { API_URL } from '../config';
import './Navbar.css';

const Navbar = ({ navigateTo, handleLogout }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const searchRef = useRef(null);
    const menuRef = useRef(null);

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const token = await auth.currentUser.getIdToken();
            const response = await fetch(`${API_URL}/api/users/search?q=${query}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Search failed:', error);
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
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => setIsSearching(true)}
                        />
                        {isSearching && searchResults.length > 0 && (
                            <div className="search-results">
                                {searchResults.map(user => (
                                    <div
                                        key={user.id}
                                        className="search-result-item"
                                        onClick={() => {
                                            navigateTo('profile', user.id);
                                            setIsSearching(false);
                                            setSearchQuery('');
                                        }}
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
