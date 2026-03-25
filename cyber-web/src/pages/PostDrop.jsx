import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PostDrop({ profile, addPost }) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const navigate = useNavigate();

  const handlePost = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    addPost({
      id: Math.random().toString(),
      author: {
        name: profile.name,
        handle: profile.handle,
        avatar: "https://i.pravatar.cc/150?5"
      },
      content,
      category,
      likes: 0,
      timeAgo: 'Just now'
    });
    
    navigate('/');
  };

  return (
    <div className="page-container">
      <h1 className="page-header">
        <span className="neon-saffron">// NEW</span>
        <span className="neon-green"> DROP</span>
      </h1>
      
      <form onSubmit={handlePost} className="cyber-card">
        <textarea 
          placeholder="What's happening in the sprawl?"
          rows="5"
          value={content}
          onChange={e => setContent(e.target.value)}
        ></textarea>
        
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option>General</option>
          <option>Tech</option>
          <option>Gigs</option>
          <option>Art</option>
        </select>
        
        <button type="submit" className="primary" disabled={!content.trim()}>
          Broadcast
        </button>
      </form>
    </div>
  );
}
