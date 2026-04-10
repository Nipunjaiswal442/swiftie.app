import { useEffect, useState, useRef } from 'react'
import { getFeed, createPost, likePost, unlikePost, type Post } from '../api'
import { useAuthStore } from '../store/authStore'
import UserAvatar from '../components/UserAvatar'
import { storage } from '../firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export default function Feed() {
  const { user } = useAuthStore()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [caption, setCaption] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [posting, setPosting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadFeed()
  }, [])

  const loadFeed = async () => {
    try {
      const { data } = await getFeed()
      setPosts(data.posts)
    } catch {
      // keep empty
    } finally {
      setLoading(false)
    }
  }

  const handlePost = async () => {
    if (!caption.trim() && !imageFile) return
    setPosting(true)
    try {
      const fd = new FormData()
      if (caption.trim()) fd.append('caption', caption)
      if (imageFile) {
        const storageRef = ref(storage, `posts/${user!._id}/${Date.now()}_${imageFile.name}`)
        const snap = await uploadBytes(storageRef, imageFile)
        const url = await getDownloadURL(snap.ref)
        fd.append('imageUrl', url)
      }
      const { data } = await createPost(fd)
      setPosts((prev) => [data, ...prev])
      setCaption('')
      setImageFile(null)
    } catch {
      // silently fail for now
    } finally {
      setPosting(false)
    }
  }

  const handleLike = async (post: Post) => {
    setPosts((prev) =>
      prev.map((p) =>
        p._id === post._id
          ? { ...p, likedByMe: !p.likedByMe, likesCount: p.likedByMe ? p.likesCount - 1 : p.likesCount + 1 }
          : p
      )
    )
    try {
      if (post.likedByMe) await unlikePost(post._id)
      else await likePost(post._id)
    } catch {
      // revert on error
      setPosts((prev) =>
        prev.map((p) =>
          p._id === post._id
            ? { ...p, likedByMe: post.likedByMe, likesCount: post.likesCount }
            : p
        )
      )
    }
  }

  return (
    <div className="app-content">
      <p className="page-title">// <span>FEED</span></p>

      {/* Create post */}
      <div className="card create-post-card">
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <UserAvatar user={user} size={40} />
          <div style={{ flex: 1 }}>
            <textarea
              className="create-post-input"
              placeholder="What's on your mind? Share with the world..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
            />
            <div className="create-post-actions">
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: 'none', border: '1px solid rgba(255,153,51,0.2)',
                    color: 'var(--text-dim)', padding: '8px 16px',
                    fontFamily: "'Share Tech Mono'", fontSize: '11px',
                    letterSpacing: '1px', cursor: 'pointer', transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = 'rgba(255,153,51,0.5)')}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = 'rgba(255,153,51,0.2)')}
                >
                  📎 {imageFile ? imageFile.name.slice(0, 20) + '...' : 'ATTACH IMAGE'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <button
                className="cta-btn"
                style={{ padding: '10px 28px', fontSize: '13px', letterSpacing: '2px' }}
                onClick={handlePost}
                disabled={posting || (!caption.trim() && !imageFile)}
              >
                {posting ? 'POSTING...' : 'POST'} <span className="cta-arrow">➔</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}>
          <div className="loading-bar" />
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📡</div>
          <p className="empty-state-text">NO TRANSMISSIONS YET — BE THE FIRST TO POST</p>
        </div>
      ) : (
        <div className="feed-container" style={{ marginTop: '24px' }}>
          {posts.map((post) => (
            <div key={post._id} className="card post-card">
              <div className="post-header">
                <UserAvatar user={post.author} size={44} />
                <div className="post-author-info">
                  <div className="post-author-name">{post.author.displayName}</div>
                  <div className="post-author-username">@{post.author.username}</div>
                </div>
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: '10px', color: 'var(--text-dim)' }}>
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              {post.imageUrl && (
                <img src={post.imageUrl} alt="post" className="post-image" />
              )}
              {post.caption && <p className="post-caption">{post.caption}</p>}
              <div className="post-actions">
                <button
                  className={`post-action-btn${post.likedByMe ? ' liked' : ''}`}
                  onClick={() => handleLike(post)}
                >
                  {post.likedByMe ? '🧡' : '🤍'} {post.likesCount} LIKES
                </button>
                <button className="post-action-btn">
                  💬 {post.commentsCount} COMMENTS
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
