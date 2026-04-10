import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUserByUsername, followUser, unfollowUser, getUserPosts, type UserProfile, type Post } from '../api'
import { useAuthStore } from '../store/authStore'
import UserAvatar from '../components/UserAvatar'

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { user: me } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [toggling, setToggling] = useState(false)

  const isMe = me?.username === username

  useEffect(() => {
    if (!username) return
    setLoading(true)
    getUserByUsername(username)
      .then(({ data }) => {
        setProfile(data)
        return getUserPosts(data._id)
      })
      .then(({ data }) => setPosts(data))
      .catch(() => navigate('/feed'))
      .finally(() => setLoading(false))
  }, [username, navigate])

  const handleFollow = async () => {
    if (!profile) return
    setToggling(true)
    try {
      if (following) {
        await unfollowUser(profile._id)
        setFollowing(false)
        setProfile((p) => p ? { ...p, followersCount: p.followersCount - 1 } : p)
      } else {
        await followUser(profile._id)
        setFollowing(true)
        setProfile((p) => p ? { ...p, followersCount: p.followersCount + 1 } : p)
      }
    } catch {
      // ignore
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <div className="app-content">
        <div className="loading-screen" style={{ minHeight: '400px' }}>
          <div className="loading-bar" />
        </div>
      </div>
    )
  }

  if (!profile) return null

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
                className={`follow-btn ${following ? 'following' : ''}`}
                onClick={handleFollow}
                disabled={toggling}
              >
                {following ? 'FOLLOWING' : 'FOLLOW'}
              </button>
              <button
                className="follow-btn"
                style={{ borderColor: 'rgba(0,68,204,0.5)', color: 'rgba(0,180,255,0.8)' }}
                onClick={() => navigate(`/chat`)}
              >
                MESSAGE
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Posts grid */}
      <p className="page-title" style={{ marginTop: '32px' }}>// <span>POSTS</span></p>

      {posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📷</div>
          <p className="empty-state-text">NO POSTS YET</p>
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map((post) => (
            <div key={post._id} className="posts-grid-item">
              {post.imageUrl ? (
                <img src={post.imageUrl} alt={post.caption ?? 'post'} />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  background: 'rgba(13,13,26,0.8)',
                  border: '1px solid rgba(255,153,51,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px',
                }}>
                  <p style={{ fontFamily: "'Rajdhani'", fontSize: '13px', color: 'rgba(224,224,255,0.6)', textAlign: 'center', lineHeight: 1.4 }}>
                    {post.caption?.slice(0, 80)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
