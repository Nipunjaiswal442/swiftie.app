import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types/user';

interface Props {
  user: User;
}

export const UserCard: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="user-card" onClick={() => navigate(`/user/${user._id}`)}>
      <div className="user-card-avatar">
        {user.profilePhotoUrl ? (
          <img src={user.profilePhotoUrl} alt="" />
        ) : (
          <div className="avatar-placeholder">
            {user.displayName?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
      </div>
      <div className="user-card-info">
        <span className="user-card-name">{user.displayName || user.email}</span>
        {user.bio && <p className="user-card-bio">{user.bio}</p>}
      </div>
    </div>
  );
};
