import { useRef, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { storage } from '../firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import UserAvatar from '../components/UserAvatar'
import PostCard from '../components/PostCard'
import { errorMessage } from '../lib/format'

export default function Feed() {
  const me = useQuery(api.users.getMe)
  const posts = useQuery(api.posts.getFeed)
  const createPost = useMutation(api.posts.create)

  const [caption, setCaption] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePost = async () => {
    if (!caption.trim() && !imageFile) return
    setPosting(true)
    setError(null)
    try {
      let imageUrl: string | undefined
      if (imageFile && me) {
        const storageRef = ref(storage, `posts/${me._id}/${Date.now()}_${imageFile.name}`)
        const snap = await uploadBytes(storageRef, imageFile)
        imageUrl = await getDownloadURL(snap.ref)
      }
      await createPost({ caption: caption.trim() || undefined, imageUrl })
      setCaption('')
      setImageFile(null)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="app-content">
      <p className="page-title">// <span>FEED</span></p>

      {/* Create post */}
      <div className="card create-post-card">
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <UserAvatar user={me ?? null} size={40} />
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
                    background: 'none', border: '1px solid rgba(var(--accent-rgb),0.2)',
                    color: 'var(--text-dim)', padding: '8px 16px',
                    fontFamily: 'var(--font-mono)', fontSize: 'calc(11px * var(--font-scale, 1))',
                    letterSpacing: '1px', cursor: 'pointer', transition: 'all 0.3s'
                  }}
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
                style={{ padding: '10px 28px', fontSize: 'calc(13px * var(--font-scale, 1))', letterSpacing: '2px' }}
                onClick={handlePost}
                disabled={posting || (!caption.trim() && !imageFile)}
              >
                {posting ? 'POSTING...' : 'POST'} <span className="cta-arrow">➔</span>
              </button>
            </div>
            {error && <p className="error-msg">{error}</p>}
          </div>
        </div>
      </div>

      {/* Feed */}
      {posts === undefined ? (
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
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
