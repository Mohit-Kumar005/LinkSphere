import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import './auth.css';

const LoginPage = ({ navigateTo }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigateTo('home');
        } catch (err) {
            setError('Invalid email or password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
 
    return (
        <div className="auth-container">
            <div className="auth-card animate-scale-in">
                <div className="auth-header">
                    <div className="auth-logo">
                        <div className="logo-icon">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M7 12h10M12 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <h1 className="text-gradient">LinkSphere</h1>
                    </div>
                    <h2>Welcome Back</h2>
                    <p>Sign in to connect with your network</p>
                </div>
                
                <form onSubmit={handleLogin} className="auth-form">
                    <div className="input-group">
                        <div className="input-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                <polyline points="22,6 12,13 2,6"/>
                            </svg>
                        </div>
                        <input 
                            type="email" 
                            placeholder="Enter your email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                            disabled={isLoading}
                        />
                    </div>
                    
                    <div className="input-group">
                        <div className="input-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <circle cx="12" cy="16" r="1"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                        </div>
                        <input 
                            type="password" 
                            placeholder="Enter your password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                            disabled={isLoading}
                        />
                    </div>
                    
                    {error && <div className="error-message animate-slide-up">{error}</div>}
                    
                    <button type="submit" className="auth-button" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <div className="button-spinner"></div>
                                Signing in...
                            </>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                    <polyline points="10,17 15,12 10,7"/>
                                    <line x1="15" y1="12" x2="3" y2="12"/>
                                </svg>
                                Sign In
                            </>
                        )}
                    </button>
                </form>
                
                <div className="auth-footer">
                    <p>New to LinkSphere?</p>
                    <button 
                        onClick={() => navigateTo('register')} 
                        className="link-button"
                        disabled={isLoading}
                    >
                        Create an account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
