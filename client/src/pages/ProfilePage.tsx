import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateMe } from '../services/userService';
import { PhotoUploader } from '../components/PhotoUploader';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [photoUrl, setPhotoUrl] = useState(user?.profilePhotoUrl || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMe({ displayName, bio });
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
    setSaving(false);
  };

  const storageUsedMB = ((user?.storageUsedBytes || 0) / (1024 * 1024)).toFixed(1);

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>Profile</h1>
      </div>

      <div className="profile-content">
        <PhotoUploader
          currentPhotoUrl={photoUrl}
          onPhotoUpdate={(url) => setPhotoUrl(url)}
        />

        {editing ? (
          <div className="profile-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself"
                rows={3}
              />
            </div>
            <div className="profile-actions">
              <button className="primary-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="secondary-btn" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-info">
            <h2>{user?.displayName || 'No name set'}</h2>
            <p className="profile-email">{user?.email}</p>
            <p className="profile-bio">{user?.bio || 'No bio yet'}</p>
            <button className="secondary-btn" onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          </div>
        )}

        <div className="storage-info">
          <span>Storage: {storageUsedMB} / 100 MB</span>
          <div className="storage-bar">
            <div
              className="storage-fill"
              style={{ width: `${Math.min((user?.storageUsedBytes || 0) / 104857600 * 100, 100)}%` }}
            />
          </div>
        </div>

        <button className="logout-btn" onClick={logout}>
          Sign Out
        </button>
      </div>
    </div>
  );
};
