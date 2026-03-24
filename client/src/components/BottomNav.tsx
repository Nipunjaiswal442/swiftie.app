import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/', label: 'Chats', icon: '💬' },
  { path: '/search', label: 'Search', icon: '🔍' },
  { path: '/profile', label: 'Profile', icon: '👤' },
];

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          className={`nav-tab ${location.pathname === tab.path ? 'active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};
