import React, { useState, useRef } from 'react';
import { auth } from '../firebase';
import { API_URL } from '../config';
import './CreatePost.css';

const CreatePost = ({ idToken, onPostCreated }) => {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [charCount, setCharCount] = useState(0);
    const [contentWithHashtags, setContentWithHashtags] = useState([]);
    const textareaRef = useRef(null);
    
    const MAX_CHARS = 280;

    const handleContentChange = (e) => {
        const text = e.target.value;
        setContent(text);
        setCharCount(text.length);
        
        // Parse content for hashtags to preview
        if (text) {
            // Split by hashtags and regular text
            const parts = text.split(/(#[a-zA-Z0-9_]+)/g).filter(Boolean);
            setContentWithHashtags(parts);
        } else {
            setContentWithHashtags([]);
        }
    };

    const handlePost = async (e) => {
        e.preventDefault();
        
        if (content.trim() === '') {
            return;
        }
        
        if (content.length > MAX_CHARS) {
            setError(`Post cannot exceed ${MAX_CHARS} characters`);
            return;
        }
        
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${API_URL}/api/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ content })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create post');
            }
            
            setContent('');
            setCharCount(0);
            setContentWithHashtags([]);
            setSuccess('Post created successfully!');
            
            setTimeout(() => {
                setSuccess('');
            }, 3000);
            
            onPostCreated();
        } catch (err) {
            setError(err.message);
            
            setTimeout(() => {
                setError('');
            }, 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getCharCountClass = () => {
        if (charCount > MAX_CHARS) return 'danger';
        if (charCount > MAX_CHARS * 0.9) return 'warning';
        return '';
    };

    const remainingChars = MAX_CHARS - charCount;

    return (
        <div className="composer-card">
            <div className="composer-header">
                <div className="user-avatar composer-avatar">
                    {auth.currentUser?.displayName ? auth.currentUser.displayName[0].toUpperCase() : '?'}
                </div>
                <div className="composer-placeholder" onClick={() => textareaRef.current.focus()}>
                    What's on your mind?
                </div>
            </div>
            
            <form onSubmit={handlePost}>
                <div className="composer-content">
                    <textarea
                        ref={textareaRef}
                        className="composer-textarea"
                        placeholder="Share your thoughts with the world..."
                        value={content}
                        onChange={handleContentChange}
                        disabled={isSubmitting}
                        maxLength={MAX_CHARS + 10} // Give a little flexibility but still prevent excessive input
                    />
                    
                    {contentWithHashtags.length > 0 && (
                        <div className="content-preview">
                            {contentWithHashtags.map((part, index) => (
                                part.startsWith('#') ? (
                                    <span key={index} className="hashtag-preview">{part}</span>
                                ) : (
                                    <span key={index}>{part}</span>
                                )
                            ))}
                        </div>
                    )}
                </div>
                
                {error && <div className="composer-error">{error}</div>}
                {success && <div className="composer-success">{success}</div>}
                
                <div className="composer-footer">
                    <div className="composer-actions">
                        <button type="button" className="action-btn" title="Add Photo">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                        </button>
                        <button type="button" className="action-btn" title="Add Poll">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="8" y1="6" x2="21" y2="6"></line>
                                <line x1="8" y1="12" x2="21" y2="12"></line>
                                <line x1="8" y1="18" x2="21" y2="18"></line>
                                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                <line x1="3" y1="18" x2="3.01" y2="18"></line>
                            </svg>
                        </button>
                        <button type="button" className="action-btn" title="Add Emoji">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                                <line x1="15" y1="9" x2="15.01" y2="9"></line>
                            </svg>
                        </button>
                        <button type="button" className="action-btn" title="Add Hashtag" onClick={() => setContent(prev => prev + '#')}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 9h16M4 15h16M10 3v18M14 3v18" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="composer-submit">
                        <div className={`char-count ${getCharCountClass()}`}>
                            {remainingChars < 0 ? `${Math.abs(remainingChars)} over limit` : `${remainingChars} left`}
                        </div>
                        <button 
                            type="submit" 
                            className="post-btn"
                            disabled={isSubmitting || content.trim() === '' || charCount > MAX_CHARS}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="btn-spinner"></span>
                                    Posting...
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                    Post
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreatePost;
