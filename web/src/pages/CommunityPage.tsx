import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

export default function CommunityPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const community = useQuery(api.communities.getOne, { slug: slug ?? '' })
  const isMember = useQuery(api.communities.isMember, {
    communityId: community?._id ?? ('' as any),
  })
  const feed = useQuery(api.communityPosts.getFeed, {
    communityId: community?._id ?? ('' as any),
  })

  const joinMutation = useMutation(api.communities.join)
  const leaveMutation = useMutation(api.communities.leave)
  const createPost = useMutation(api.communityPosts.create)
  const likePost = useMutation(api.communityPosts.like)

  const [postContent, setPostContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const feedEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when feed loads
  useEffect(() => {
    if (feed && feed.length > 0) {
      feedEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [feed?.length])

  if (community === undefined) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-dim)', letterSpacing: '2px' }}>
        LOADING...
      </div>
    )
  }

  if (community === null) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--saffron)', letterSpacing: '4px', marginBottom: '16px' }}>COMMUNITY NOT FOUND</p>
        <button onClick={() => navigate('/discover')} className="back-btn-community">← DISCOVER</button>
      </div>
    )
  }

  const sectionColor = {
    personality: 'var(--saffron)',
    ideology: 'var(--white-pure)',
    occupation: 'var(--neon-green)',
  }[community.section] ?? 'var(--saffron)'

  const handleJoin = async () => {
    await joinMutation({ communityId: community._id })
  }

  const handleLeave = async () => {
    await leaveMutation({ communityId: community._id })
  }

  const handlePost = async () => {
    if (!postContent.trim()) return
    setPosting(true)
    setPostError(null)
    try {
      await createPost({ communityId: community._id, content: postContent.trim() })
      setPostContent('')
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Failed to post.')
    } finally {
      setPosting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handlePost()
    }
  }

  return (
    <div className="community-page">
      <style>{`
        .community-page {
          max-width: 760px;
          margin: 0 auto;
          padding: 40px 24px 80px;
        }
        .back-btn-community {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          letter-spacing: 3px;
          color: var(--text-dim);
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          margin-bottom: 28px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: color 0.2s;
          text-transform: uppercase;
        }
        .back-btn-community:hover { color: var(--saffron); }
        .community-header {
          padding: 28px 24px;
          background: rgba(13,13,26,0.7);
          border: 1px solid rgba(255,153,51,0.15);
          margin-bottom: 32px;
          clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
        }
        .community-header-top {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;
        }
        .community-header-icon { font-size: 40px; flex-shrink: 0; }
        .community-header-info { flex: 1; }
        .community-header-section {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 3px;
          color: var(--text-dim);
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .community-header-name {
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          font-size: clamp(16px, 2.5vw, 22px);
          letter-spacing: 3px;
          margin: 0 0 6px;
        }
        .community-header-members {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          letter-spacing: 1px;
          color: var(--text-dim);
        }
        .community-header-desc {
          font-family: 'Rajdhani', sans-serif;
          font-size: 14px;
          color: rgba(224,224,255,0.5);
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .community-join-area {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .btn-join-community,
        .btn-leave-community {
          padding: 8px 24px;
          font-family: 'Orbitron', sans-serif;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
        }
        .btn-join-community {
          color: var(--bg-dark);
        }
        .btn-join-community:hover { opacity: 0.85; transform: translateY(-1px); }
        .btn-leave-community {
          background: transparent;
          color: var(--text-dim);
          border: 1px solid rgba(255,255,255,0.1);
          clip-path: none;
        }
        .btn-leave-community:hover { color: #ff6b6b; border-color: rgba(255,107,107,0.3); }

        /* Feed */
        .feed-section { margin-bottom: 32px; }
        .feed-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 3px;
          color: var(--text-dim);
          text-transform: uppercase;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .feed-empty {
          padding: 40px 0;
          text-align: center;
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: var(--text-dim);
          letter-spacing: 2px;
        }
        .feed-posts { display: flex; flex-direction: column; gap: 16px; }
        .post-card {
          padding: 20px;
          background: rgba(13,13,26,0.5);
          border: 1px solid rgba(255,255,255,0.06);
          transition: border-color 0.3s;
        }
        .post-card:hover { border-color: rgba(255,153,51,0.12); }
        .post-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .post-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255,153,51,0.15);
          border: 1px solid rgba(255,153,51,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Orbitron', sans-serif;
          font-size: 11px;
          color: var(--saffron);
          flex-shrink: 0;
        }
        .post-author {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          letter-spacing: 1px;
          color: var(--neon-white);
        }
        .post-content {
          font-family: 'Rajdhani', sans-serif;
          font-size: 15px;
          color: rgba(224,224,255,0.8);
          line-height: 1.6;
          margin-bottom: 12px;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .post-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .post-like-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.08);
          color: var(--text-dim);
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 1px;
          padding: 4px 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .post-like-btn:hover { border-color: rgba(255,153,51,0.4); color: var(--saffron); }

        /* Composer */
        .composer-section { margin-top: 32px; }
        .composer-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 3px;
          color: var(--text-dim);
          text-transform: uppercase;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .composer-textarea {
          width: 100%;
          min-height: 100px;
          padding: 16px;
          background: rgba(13,13,26,0.7);
          border: 1px solid rgba(255,153,51,0.15);
          color: var(--neon-white);
          font-family: 'Rajdhani', sans-serif;
          font-size: 15px;
          line-height: 1.5;
          resize: vertical;
          outline: none;
          transition: border-color 0.3s;
          box-sizing: border-box;
        }
        .composer-textarea:focus { border-color: rgba(255,153,51,0.4); }
        .composer-textarea::placeholder { color: var(--text-dim); }
        .composer-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .composer-hint {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 1px;
          color: var(--text-dim);
        }
        .composer-error {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: #ff4444;
          width: 100%;
          margin-bottom: 6px;
        }
        .composer-submit {
          padding: 10px 28px;
          font-family: 'Orbitron', sans-serif;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
        }
        .composer-submit:disabled { opacity: 0.4; cursor: not-allowed; }
        .composer-submit:not(:disabled):hover { opacity: 0.85; transform: translateY(-1px); }
        .non-member-notice {
          padding: 20px;
          background: rgba(13,13,26,0.4);
          border: 1px dashed rgba(255,255,255,0.08);
          text-align: center;
          font-family: 'Rajdhani', sans-serif;
          font-size: 14px;
          color: var(--text-dim);
          line-height: 1.5;
        }
      `}</style>

      {/* Back button */}
      <button className="back-btn-community" onClick={() => navigate('/discover')}>
        ← DISCOVER
      </button>

      {/* Community Header */}
      <div className="community-header">
        <div className="community-header-top">
          <span className="community-header-icon">{community.icon}</span>
          <div className="community-header-info">
            <p className="community-header-section">{community.section.toUpperCase()} / {community.matchKey.toUpperCase()}</p>
            <h1 className="community-header-name" style={{ color: sectionColor }}>
              {community.name}
            </h1>
            <span className="community-header-members">
              {community.memberCount} member{community.memberCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <p className="community-header-desc">{community.description}</p>
        <div className="community-join-area">
          {isMember ? (
            <button className="btn-leave-community" onClick={handleLeave}>
              LEAVE COMMUNITY
            </button>
          ) : (
            <button
              className="btn-join-community"
              style={{ background: sectionColor === 'var(--white-pure)' ? 'rgba(255,255,255,0.9)' : sectionColor, color: 'var(--bg-dark)' }}
              onClick={handleJoin}
            >
              JOIN COMMUNITY
            </button>
          )}
        </div>
      </div>

      {/* Post Composer — only for members */}
      {isMember && (
        <div className="composer-section">
          <p className="composer-label">// POST TO COMMUNITY</p>
          {postError && <p className="composer-error">{postError}</p>}
          <textarea
            className="composer-textarea"
            placeholder="Share something with the community..."
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={2000}
          />
          <div className="composer-footer">
            <span className="composer-hint">⌘ + Enter to post · {2000 - postContent.length} chars left</span>
            <button
              className="composer-submit"
              style={{ background: sectionColor === 'var(--white-pure)' ? 'rgba(255,255,255,0.9)' : sectionColor, color: 'var(--bg-dark)' }}
              onClick={handlePost}
              disabled={posting || !postContent.trim()}
            >
              {posting ? 'POSTING...' : 'POST ➔'}
            </button>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="feed-section">
        <p className="feed-label">// COMMUNITY FEED</p>

        {!isMember && (
          <div className="non-member-notice">
            Join this community to see posts and participate in discussions.
          </div>
        )}

        {isMember && (
          <>
            {feed === undefined && (
              <p className="feed-empty">LOADING FEED...</p>
            )}
            {feed && feed.length === 0 && (
              <p className="feed-empty">No posts yet — be the first to share something!</p>
            )}
            {feed && feed.length > 0 && (
              <div className="feed-posts">
                {[...feed].reverse().map((post) => (
                  <div key={post._id} className="post-card">
                    <div className="post-meta">
                      <div className="post-avatar">
                        {(post.author.displayName ?? 'U')[0].toUpperCase()}
                      </div>
                      <span className="post-author">
                        {post.author.username ? `@${post.author.username}` : post.author.displayName}
                      </span>
                    </div>
                    <p className="post-content">{post.content}</p>
                    <div className="post-actions">
                      <button
                        className="post-like-btn"
                        onClick={() => likePost({ postId: post._id })}
                      >
                        ♥ {post.likesCount}
                      </button>
                    </div>
                  </div>
                ))}
                <div ref={feedEndRef} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
