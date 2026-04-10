import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import UserAvatar from '../components/UserAvatar'

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()

  const me = useQuery(api.users.getMe)
  const profile = useQuery(api.users.getByUsername, username ? { username } : 'skip')
  const followUser = useMutation(api.users.follow)
  const unfollowUser = useMutation(api.users.unfollow)
  const startConversation = useMutation(api.messages.getOrCreateConversation)

  const isMe = me?.username === username

  const handleFollow = async () => {
    if (!profile) return
    if (profile.isFollowing) await unfollowUser({ userId: profile._id })
    else await followUser({ userId: profile._id })
  }

  const handleMessage = async () => {
    if (!profile) return
    const convId = await startConversation({ otherUserId: profile._id })
    navigate(`/chat/${convId}`)
  }

  if (profile === undefined) {
    return (
      <div className="app-content">
        <div className="loading-screen" style={{ minHeight: '400px' }}>
          <div className="loading-bar" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="app-content">
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <p className="empty-state-text">USER NOT FOUND</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-content">
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Cover */}
        <div style={{
          height: '160px',
          background: profile.coverPhotoUrl
            ? `url(${profile.coverPhotoUrl}) center/cover`
            : 'linear-gradient(135deg, rgba(255,153,51,0.15), rgba(0,255,65,0.08))',
          borderBottom: '1px solid rgba(255,153,51,0.1)',
        }} />

        <div className="profile-header">
          <div style={{ marginTop: '-40px' }}>
            <UserAvatar user={profile} size={80} />
          </div>
          <h2 className="profile-displayname">{profile.displayName}</h2>
          <p className="profile-username">@{profile.username}</p>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}

          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-num">{profile.postsCount}</div>
              <div className="profile-stat-label">POSTS</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-num">{profile.followersCount}</div>
              <div className="profile-stat-label">FOLLOWERS</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-num">{profile.followingCount}</div>
              <div className="profile-stat-label">FOLLOWING</div>
            </div>
          </div>

          {!isMe && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className={`follow-btn ${profile.isFollowing ? 'following' : ''}`}
                onClick={handleFollow}
              >
                {profile.isFollowing ? 'FOLLOWING' : 'FOLLOW'}
              </button>
              <button
                className="follow-btn"
                style={{ borderColor: 'rgba(0,68,204,0.5)', color: 'rgba(0,180,255,0.8)' }}
                onClick={handleMessage}
              >
                MESSAGE
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Posts section — derive from profile data */}
      <p className="page-title" style={{ marginTop: '32px' }}>
        // <span>POSTS</span>
      </p>
      <div className="empty-state" style={{ padding: '40px 20px' }}>
        <div className="empty-state-icon" style={{ fontSize: '32px' }}>📷</div>
        <p className="empty-state-text" style={{ fontSize: '11px' }}>
          {profile.postsCount === 0 ? 'NO POSTS YET' : `${profile.postsCount} POST${profile.postsCount > 1 ? 'S' : ''}`}
        </p>
      </div>
    </div>
  )
}
