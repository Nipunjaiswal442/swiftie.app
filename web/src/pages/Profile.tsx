import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import UserAvatar from '../components/UserAvatar'
import PostCard from '../components/PostCard'
import FollowButton from '../components/FollowButton'
import ReportButton from '../components/ReportModal'
import UserListModal from '../components/UserListModal'
import { labelFor, OCCUPATION_SCORE_LABELS, SCORE_PAIRS, SECTION_META } from '../data/resultLabels'
import { errorMessage, formatDate } from '../lib/format'

type Section = 'personality' | 'ideology' | 'occupation'
const SECTION_ORDER: Section[] = ['personality', 'ideology', 'occupation']

/** Two-sided bar for E/I-style pairs. */
function PairBar({ left, right, leftLabel, rightLabel, color }: { left: number; right: number; leftLabel: string; rightLabel: string; color: string }) {
  const total = left + right
  const pct = total === 0 ? 50 : Math.round((left / total) * 100)
  const leftWins = pct >= 50
  const label: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 'calc(9px * var(--font-scale, 1))', letterSpacing: '1px' }
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ ...label, color: leftWins ? color : 'var(--text-dim)' }}>{leftLabel.toUpperCase()} {pct}%</span>
        <span style={{ ...label, color: leftWins ? 'var(--text-dim)' : color }}>{100 - pct}% {rightLabel.toUpperCase()}</span>
      </div>
      <div style={{ height: '6px', background: 'rgba(var(--fg-rgb),0.08)', display: 'flex' }}>
        <div style={{ width: `${pct}%`, background: leftWins ? color : 'rgba(var(--fg-rgb),0.25)', transition: 'width 0.4s' }} />
        <div style={{ flex: 1, background: leftWins ? 'rgba(var(--fg-rgb),0.25)' : color }} />
      </div>
    </div>
  )
}

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()

  const me = useQuery(api.users.getMe)
  const profile = useQuery(api.users.getByUsername, username ? { username } : 'skip')
  const posts = useQuery(api.posts.getByUser, profile ? { userId: profile._id } : 'skip')
  const results = useQuery(api.assessments.getResultsForUser, profile ? { userId: profile._id } : 'skip')
  const startConversation = useMutation(api.messages.getOrCreateConversation)

  const [listTab, setListTab] = useState<'followers' | 'following' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isMe = !!profile && me?._id === profile._id

  const handleMessage = async () => {
    if (!profile) return
    try {
      const convId = await startConversation({ otherUserId: profile._id })
      navigate(`/chat/${convId}`)
    } catch (err) {
      setError(errorMessage(err))
    }
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
    background: 'rgba(var(--accent-rgb),0.08)',
    border: '1px solid rgba(var(--accent-rgb),0.25)',
    clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'calc(10px * var(--font-scale, 1))',
    letterSpacing: '1px',
    color: 'var(--saffron)',
  }
  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    background: 'rgba(var(--surface-rgb),0.6)',
    border: '1px solid',
    clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'calc(10px * var(--font-scale, 1))',
    letterSpacing: '1.5px',
  }
  const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 'calc(10px * var(--font-scale, 1))', letterSpacing: '1px', color: 'var(--text-dim)' }

  const resultBySection = new Map((results ?? []).map((r) => [r.section, r]))
  const missingSections = SECTION_ORDER.filter((s) => !resultBySection.has(s))

  return (
    <div className="app-content">
      {/* Cover photo */}
      <div style={{
        height: '140px',
        background: profile.coverPhotoUrl
          ? `url(${profile.coverPhotoUrl}) center/cover`
          : 'linear-gradient(135deg, rgba(var(--accent-rgb),0.12), rgba(var(--accent2-rgb),0.06))',
        borderBottom: '1px solid rgba(var(--accent-rgb),0.08)',
        marginBottom: '0',
      }} />

      {/* Profile header card */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '20px',
        padding: '20px 24px 22px',
        background: 'rgba(var(--accent-rgb),0.03)',
        border: '1px solid rgba(var(--accent-rgb),0.13)',
        clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
        marginBottom: '24px',
        position: 'relative',
        marginTop: '-40px',
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <UserAvatar user={profile} size={72} />
          <span className={`online-dot${profile.isOnline ? '' : ' off'}`} style={{ bottom: 4, right: 4 }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'calc(17px * var(--font-scale, 1))', letterSpacing: '2px', color: 'var(--neon-white)', margin: 0 }}>
              {profile.displayName}
            </h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'calc(12px * var(--font-scale, 1))', color: 'rgba(var(--accent3-rgb),0.75)', letterSpacing: '1px' }}>
              @{profile.username}
            </span>
            {profile.isOnline ? (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'calc(9px * var(--font-scale, 1))', letterSpacing: '2px', color: 'var(--neon-green)', textShadow: '0 0 8px var(--neon-green)' }}>● ONLINE</span>
            ) : profile.lastSeen ? (
              <span style={mono}>LAST SEEN {formatDate(profile.lastSeen).toUpperCase()}</span>
            ) : null}
            {profile.followsMe && !isMe && <span className="status-chip active">FOLLOWS YOU</span>}
            {profile.status === 'suspended' && <span className="status-chip suspended">SUSPENDED</span>}
          </div>

          {(profile.currentRole || profile.location || profile.pronouns) && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'calc(11px * var(--font-scale, 1))', color: 'rgba(var(--fg-rgb),0.55)', margin: '0 0 8px', letterSpacing: '0.5px' }}>
              {[profile.currentRole, profile.location, profile.pronouns].filter(Boolean).join(' · ')}
            </p>
          )}

          {profile.bio && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'calc(14px * var(--font-scale, 1))', color: 'rgba(var(--text-rgb),0.75)', margin: '0 0 10px', lineHeight: 1.5 }}>
              {profile.bio}
            </p>
          )}

          {profile.interests && profile.interests.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {profile.interests.map((tag) => (
                <span key={tag} style={tagChipStyle}>{tag}</span>
              ))}
            </div>
          )}

          {(profile.personalityResult || profile.ideologyResult || profile.occupationResult) && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {profile.personalityResult && (
                <span style={{ ...badgeStyle, borderColor: 'rgba(var(--accent-rgb),0.4)', color: 'var(--saffron)' }}>
                  🧠 {profile.personalityResult.toUpperCase()}
                </span>
              )}
              {profile.ideologyResult && (
                <span style={{ ...badgeStyle, borderColor: 'rgba(var(--fg-rgb),0.25)', color: 'var(--white-pure)' }}>
                  ⚐ {profile.ideologyResult.toUpperCase()}
                </span>
              )}
              {profile.occupationResult && (
                <span style={{ ...badgeStyle, borderColor: 'rgba(var(--accent2-rgb),0.3)', color: 'var(--neon-green)' }}>
                  🔧 {profile.occupationResult.toUpperCase()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats + action buttons */}
      <div className="card" style={{ padding: '16px 24px' }}>
        <div className="profile-stats" style={{ marginBottom: '16px' }}>
          <div className="profile-stat">
            <div className="profile-stat-num">{profile.postsCount}</div>
            <div className="profile-stat-label">POSTS</div>
          </div>
          <button className="profile-stat" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setListTab('followers')}>
            <div className="profile-stat-num">{profile.followersCount}</div>
            <div className="profile-stat-label">FOLLOWERS</div>
          </button>
          <button className="profile-stat" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setListTab('following')}>
            <div className="profile-stat-num">{profile.followingCount}</div>
            <div className="profile-stat-label">FOLLOWING</div>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {isMe ? (
            <>
              <Link to="/settings#profile" className="follow-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>EDIT PROFILE</Link>
              <Link to="/settings" className="ghost-btn" style={{ textDecoration: 'none' }}>⚙ SETTINGS</Link>
            </>
          ) : (
            <>
              <FollowButton userId={profile._id} isFollowing={profile.isFollowing} size="md" />
              <button
                className="follow-btn"
                style={{ borderColor: 'rgba(var(--accent3-deep-rgb),0.5)', color: 'rgba(var(--accent3-rgb),0.8)' }}
                onClick={handleMessage}
              >
                MESSAGE
              </button>
              <ReportButton targetType="user" targetId={profile._id} targetLabel={`@${profile.username}`} />
            </>
          )}
        </div>
        {error && <p className="error-msg">{error}</p>}
      </div>

      {/* Assessment insights — filled in automatically after each assessment */}
      <p className="page-title" style={{ marginTop: '32px' }}>// <span>ASSESSMENT INSIGHTS</span></p>
      {results === undefined ? (
        <p style={mono}>LOADING…</p>
      ) : results.length === 0 ? (
        <div className="empty-state" style={{ padding: '32px 20px' }}>
          <div className="empty-state-icon" style={{ fontSize: 'calc(32px * var(--font-scale, 1))' }}>🧭</div>
          <p className="empty-state-text" style={{ fontSize: 'calc(11px * var(--font-scale, 1))' }}>
            {isMe ? 'TAKE AN ASSESSMENT — RESULTS APPEAR HERE AUTOMATICALLY' : 'NO ASSESSMENTS COMPLETED YET'}
          </p>
          {isMe && <Link to="/discover" className="tab-empty-link" style={{ display: 'inline-block', marginTop: '12px' }}>GO TO DISCOVER →</Link>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '14px' }}>
          {SECTION_ORDER.map((section) => {
            const r = resultBySection.get(section)
            if (!r) return null
            const meta = SECTION_META[section]
            const label = labelFor(section, r.matchKey)
            return (
              <div key={section} className="card" style={{ padding: '18px 20px' }}>
                <p style={{ ...mono, marginBottom: '6px' }}>{meta.icon} {meta.label} · {formatDate(r.completedAt).toUpperCase()}</p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'calc(15px * var(--font-scale, 1))', letterSpacing: '2px', color: meta.color, margin: '0 0 4px' }}>
                  {r.matchKey.toUpperCase()} · {label.title.toUpperCase()}
                </h3>
                {label.blurb && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 'calc(13px * var(--font-scale, 1))', color: 'rgba(var(--text-rgb),0.7)', margin: '0 0 14px', lineHeight: 1.5 }}>
                    {label.blurb}
                  </p>
                )}
                {section === 'occupation' ? (
                  (() => {
                    const entries = Object.entries(r.scores).sort((a, b) => b[1] - a[1])
                    const max = Math.max(1, ...entries.map((e) => e[1]))
                    return entries.slice(0, 5).map(([key, value]) => (
                      <div key={key} style={{ marginBottom: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ ...mono, color: 'var(--neon-white)' }}>{(OCCUPATION_SCORE_LABELS[key] ?? key).toUpperCase()}</span>
                          <span style={mono}>{value}</span>
                        </div>
                        <div style={{ height: '5px', background: 'rgba(var(--fg-rgb),0.08)' }}>
                          <div style={{ width: `${Math.round((value / max) * 100)}%`, height: '100%', background: meta.color }} />
                        </div>
                      </div>
                    ))
                  })()
                ) : (
                  SCORE_PAIRS[section].map(([lk, ll, rk, rl]) => (
                    <PairBar key={lk} left={r.scores[lk] ?? 0} right={r.scores[rk] ?? 0} leftLabel={ll} rightLabel={rl} color={meta.color} />
                  ))
                )}
                {r.community && (
                  <Link to={`/community/${r.community.slug}`} className="tab-empty-link" style={{ display: 'inline-block', marginTop: '10px' }}>
                    {r.community.icon} {r.community.name.toUpperCase()} →
                  </Link>
                )}
              </div>
            )
          })}
          {isMe && missingSections.length > 0 && (
            <div className="card" style={{ padding: '18px 20px', borderStyle: 'dashed' }}>
              <p style={{ ...mono, marginBottom: '10px' }}>STILL TO COMPLETE</p>
              {missingSections.map((s) => (
                <Link key={s} to={`/assess/${s}`} className="tab-empty-link" style={{ display: 'block', marginTop: '6px' }}>
                  {SECTION_META[s].icon} TAKE THE {SECTION_META[s].label} ASSESSMENT →
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Posts */}
      <p className="page-title" style={{ marginTop: '32px' }}>// <span>POSTS</span></p>
      {posts === undefined ? (
        <p style={mono}>LOADING…</p>
      ) : posts.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-state-icon" style={{ fontSize: 'calc(32px * var(--font-scale, 1))' }}>📷</div>
          <p className="empty-state-text" style={{ fontSize: 'calc(11px * var(--font-scale, 1))' }}>NO POSTS YET</p>
        </div>
      ) : (
        <div className="feed-container">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}

      {listTab && <UserListModal userId={profile._id} initialTab={listTab} onClose={() => setListTab(null)} />}
    </div>
  )
}
