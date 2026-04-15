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

  // Shared style fragments
  const tagChipStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '3px 10px',
    background: 'rgba(255,153,51,0.08)',
    border: '1px solid rgba(255,153,51,0.25)',
    clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%)',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '10px',
    letterSpacing: '1px',
    color: 'var(--saffron)',
  }
  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    background: 'rgba(13,13,26,0.6)',
    border: '1px solid',
    clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '10px',
    letterSpacing: '1.5px',
  }

  return (
    <div className="app-content">
      {/* Cover photo */}
      <div style={{
        height: '140px',
        background: profile.coverPhotoUrl
          ? `url(${profile.coverPhotoUrl}) center/cover`
          : 'linear-gradient(135deg, rgba(255,153,51,0.12), rgba(0,255,65,0.06))',
        borderBottom: '1px solid rgba(255,153,51,0.08)',
        marginBottom: '0',
      }} />

      {/* Maya-style profile header card */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '20px',
        padding: '20px 24px 22px',
        background: 'rgba(255,153,51,0.03)',
        border: '1px solid rgba(255,153,51,0.13)',
        clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
        marginBottom: '24px',
        position: 'relative',
        marginTop: '-40px',
      }}>
        {/* Avatar with online dot */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <UserAvatar user={profile} size={72} />
          {profile.isOnline && (
            <span style={{
              position: 'absolute', bottom: 4, right: 4,
              width: '12px', height: '12px', borderRadius: '50%',
              background: '#00ff41',
              boxShadow: '0 0 8px #00ff41, 0 0 16px rgba(0,255,65,0.4)',
              border: '2px solid var(--bg-dark)',
            }} />
          )}
        </div>

        {/* Info column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + username + online row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <h2 style={{
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 700,
              fontSize: '17px',
              letterSpacing: '2px',
              color: 'var(--neon-white)',
              margin: 0,
            }}>
              {profile.displayName}
            </h2>
            <span style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '12px',
              color: 'rgba(0,180,255,0.75)',
              letterSpacing: '1px',
            }}>
              @{profile.username}
            </span>
            {profile.isOnline && (
              <span style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '9px',
                letterSpacing: '2px',
                color: '#00ff41',
                textShadow: '0 0 8px #00ff41',
              }}>● ONLINE</span>
            )}
          </div>

          {/* Role / location / pronouns subline */}
          {((profile as any).currentRole || (profile as any).location || (profile as any).pronouns) && (
            <p style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '11px',
              color: 'rgba(255,255,255,0.55)',
              margin: '0 0 8px',
              letterSpacing: '0.5px',
            }}>
              {[(profile as any).currentRole, (profile as any).location, (profile as any).pronouns]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}

          {/* Bio */}
          {profile.bio && (
            <p style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '14px',
              color: 'rgba(224,224,255,0.75)',
              margin: '0 0 10px',
              lineHeight: 1.5,
            }}>
              {profile.bio}
            </p>
          )}

          {/* Interest tag chips */}
          {(profile as any).interests && (profile as any).interests.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {(profile as any).interests.map((tag: string) => (
                <span key={tag} style={tagChipStyle}>{tag}</span>
              ))}
            </div>
          )}

          {/* Assessment result badges */}
          {((profile as any).personalityResult || (profile as any).ideologyResult || (profile as any).occupationResult) && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(profile as any).personalityResult && (
                <span style={{ ...badgeStyle, borderColor: 'rgba(255,153,51,0.4)', color: 'var(--saffron)' }}>
                  🧠 {(profile as any).personalityResult.toUpperCase()}
                </span>
              )}
              {(profile as any).ideologyResult && (
                <span style={{ ...badgeStyle, borderColor: 'rgba(255,255,255,0.25)', color: 'var(--white-pure)' }}>
                  ⚐ {(profile as any).ideologyResult.toUpperCase()}
                </span>
              )}
              {(profile as any).occupationResult && (
                <span style={{ ...badgeStyle, borderColor: 'rgba(0,255,65,0.3)', color: 'var(--neon-green)' }}>
                  🔧 {(profile as any).occupationResult.toUpperCase()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats + action buttons */}
      <div className="card" style={{ padding: '16px 24px' }}>
        <div className="profile-stats" style={{ marginBottom: isMe ? 0 : '16px' }}>
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

      {/* Posts section */}
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
