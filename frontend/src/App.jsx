import React, { useState, useEffect } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { API_URL } from './config';
import './App.css';
import './styles/theme.css';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';

export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState('home');
    const [profileUid, setProfileUid] = useState(null);
    const [idToken, setIdToken] = useState('');
    const [pageTransition, setPageTransition] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                setUser(currentUser);
                const token = await currentUser.getIdToken();
                setIdToken(token);
                setPage('home');
            } else {
                setUser(null);
                setIdToken('');
                setPage('login');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const navigateTo = (pageName, uid = null) => {
        // Add page transition effect
        setPageTransition(true);
        setTimeout(() => {
            setPage(pageName);
            setProfileUid(uid);
            setPageTransition(false);
        }, 300);
    };

    const handleLogout = () => {
        signOut(auth).catch(error => console.error("Logout error:", error));
    };

    if (loading) {
        return (
            <div className="loader">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading...</p>
            </div>
        );
    }

    const renderPage = () => {
        const props = { navigateTo, idToken, currentUser: user };
        
        switch (page) {
            case 'home':
                return <HomePage {...props} />;
            case 'profile':
                return <ProfilePage {...props} profileUid={profileUid || (user ? user.uid : null)} />;
            case 'login':
                return <LoginPage navigateTo={navigateTo} />;
            case 'register':
                return <RegisterPage navigateTo={navigateTo} />;
            case 'explore':
                return <div className="coming-soon">Explore feature coming soon!</div>;
            case 'notifications':
                return <div className="coming-soon">Notifications feature coming soon!</div>;
            default:
                return <HomePage {...props} />;
        }
    };

    // Determine whether to show the auth layout or the main app layout
    const isAuthPage = page === 'login' || page === 'register';

    return (
        <div className="app-container">
            {!isAuthPage && (
                <Navbar navigateTo={navigateTo} handleLogout={handleLogout} />
            )}
            
            <div className={`page-container ${pageTransition ? 'page-transition' : ''}`}>
                {renderPage()}
            </div>
        </div>
    );
}