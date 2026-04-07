import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../services/api';

export default function PostDrop() {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      await createPost({ caption: content.trim(), category });
      navigate('/feed');
    } catch (err) {
      console.error('Post failed', err);
      setError('Failed to broadcast. Try again.');
    } finally {
      setLoading(false);
    }
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
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={loading}
        >
          <option>General</option>
          <option>Tech</option>
          <option>Gigs</option>
          <option>Art</option>
        </select>

        {error && (
          <p style={{ color: '#ff4444', fontSize: '0.85rem', marginBottom: '8px' }}>{error}</p>
        )}

        <button type="submit" className="primary" disabled={!content.trim() || loading}>
          {loading ? 'Broadcasting...' : 'Broadcast'}
        </button>
      </form>
    </div>
  );
}
