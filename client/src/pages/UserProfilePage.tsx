import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserById } from '../services/userService';
import { createConversation } from '../services/conversationService';
import { User } from '../types/user';

export const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!id) return;
      try {
        const data = await getUserById(id);
        setProfile(data.user);
      } catch {
        navigate('/search');
      }
      setLoading(false);
    };
    loadProfile();
  }, [id, navigate]);

  const handleMessage = async () => {
    if (!id) return;
    try {
      const data = await createConversation(id);
      navigate(`/chat/${data.conversation._id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  if (loading || !profile) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <div className="chat-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ←
        </button>
        <span>Profile</span>
      </div>
      <div className="user-profile-content">
        <div className="user-profile-avatar">
          {profile.profilePhotoUrl ? (
            <img src={profile.profilePhotoUrl} alt="" />
          ) : (
            <div className="avatar-placeholder large">
              {profile.displayName?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <h2>{profile.displayName || 'Anonymous'}</h2>
        <p className="profile-email">{profile.email}</p>
        {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        <button className="primary-btn" onClick={handleMessage}>
          Send Message
        </button>
      </div>
    </div>
  );
};
