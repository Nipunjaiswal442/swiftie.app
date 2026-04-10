import React, { useState, useEffect } from 'react';
import { useUserSearch } from '../hooks/useUserSearch';
import { UserCard } from '../components/UserCard';

export const UserSearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const { results, loading, search } = useUserSearch();

  useEffect(() => {
    const debounce = setTimeout(() => {
      search(query);
    }, 300);
    return () => clearTimeout(debounce);
  }, [query, search]);

  return (
    <div className="search-page">
      <div className="page-header">
        <h1>Find People</h1>
      </div>
      <div className="search-bar">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email..."
        />
      </div>
      <div className="search-results">
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
          </div>
        ) : results.length === 0 && query.length >= 2 ? (
          <div className="empty-state">
            <p>No users found</p>
          </div>
        ) : (
          results.map((user) => <UserCard key={user._id} user={user} />)
        )}
      </div>
    </div>
  );
};
