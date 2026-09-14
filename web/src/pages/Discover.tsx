import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import UserAvatar from '../components/UserAvatar'
import FollowButton from '../components/FollowButton'
import { timeAgo } from '../lib/format'

type Section = 'personality' | 'ideology' | 'occupation'

interface SectionConfig {
  key: Section
  label: string
  number: string
  color: string
  borderColor: string
  glowColor: string
  icon: string
  assessRoute: string
  assessLabel: string
}

const SECTIONS: SectionConfig[] = [
  {
    key: 'personality',
    label: 'PERSONALITY',
    number: 'SECTION_01',
    color: 'var(--saffron)',
    borderColor: 'rgba(var(--accent-rgb),0.3)',
    glowColor: 'rgba(var(--accent-rgb),0.15)',
    icon: '🧠',
    assessRoute: '/assess/personality',
    assessLabel: 'Take Personality Assessment',
  },
  {
    key: 'ideology',
    label: 'IDEOLOGY',
    number: 'SECTION_02',
    color: 'var(--white-pure)',
    borderColor: 'rgba(var(--fg-rgb),0.2)',
    glowColor: 'rgba(var(--fg-rgb),0.06)',
    icon: '⚐',
    assessRoute: '/assess/ideology',
    assessLabel: 'Take Ideology Assessment',
  },
  {
    key: 'occupation',
    label: 'OCCUPATION',
    number: 'SECTION_03',
    color: 'var(--neon-green)',
    borderColor: 'rgba(var(--accent2-rgb),0.3)',
    glowColor: 'rgba(var(--accent2-rgb),0.1)',
    icon: '🔧',
    assessRoute: '/assess/occupation',
    assessLabel: 'Take Occupation Assessment',
  },
]

function SectionColumn({ section }: { section: SectionConfig }) {
  const navigate = useNavigate()
  const result = useQuery(api.assessments.getMyResult, { section: section.key })
  const communities = useQuery(api.communities.getRecommended, { section: section.key })
  const joinMutation = useMutation(api.communities.join)
  const leaveMutation = useMutation(api.communities.leave)

  const handleJoin = async (communityId: Id<'communities'>) => {
    await joinMutation({ communityId })
  }
  const handleLeave = async (communityId: Id<'communities'>) => {
    await leaveMutation({ communityId })
  }

  return (
    <div
      className="discover-column"
      style={{ '--col-color': section.color, '--col-border': section.borderColor, '--col-glow': section.glowColor } as React.CSSProperties}
    >
      <div className="discover-col-header">
        <span className="discover-col-num">{section.number}</span>
        <span className="discover-col-icon">{section.icon}</span>
        <h2 className="discover-col-title" style={{ color: section.color }}>{section.label}</h2>
        {result && (
          <div className="discover-match-badge" style={{ borderColor: section.borderColor }}>
            <span style={{ color: section.color, fontFamily: "var(--font-mono)", fontSize: 'calc(11px * var(--font-scale, 1))', letterSpacing: '2px' }}>
              MATCHED: {result.matchKey.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {!result && (
        <div className="discover-assess-card" style={{ borderColor: section.borderColor }}>
          <p className="discover-assess-text">
            Complete your {section.label.toLowerCase()} assessment to get matched to communities.
          </p>
          <button
            className="discover-assess-btn"
            style={{ background: section.color === 'var(--white-pure)' ? 'rgba(var(--fg-rgb),0.9)' : section.color }}
            onClick={() => navigate(section.assessRoute)}
          >
            {section.assessLabel} ➔
          </button>
        </div>
      )}

      <div className="discover-community-list">
        {communities?.map((community) => (
          <CommunityCard
            key={community._id}
            community={community}
            sectionColor={section.color}
            borderColor={section.borderColor}
            onJoin={handleJoin}
            onLeave={handleLeave}
          />
        ))}
        {communities && communities.length === 0 && (
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 'calc(11px * var(--font-scale, 1))', color: 'var(--text-dim)', padding: '20px 0' }}>
            No communities yet — check back soon.
          </p>
        )}
      </div>
    </div>
  )
}

interface CommunityCardProps {
  community: {
    _id: Id<'communities'>
    slug: string
    name: string
    description: string
    icon: string
    memberCount: number
  }
  sectionColor: string
  borderColor: string
  onJoin: (id: Id<'communities'>) => void
  onLeave: (id: Id<'communities'>) => void
}

function CommunityCard({ community, sectionColor, borderColor, onJoin, onLeave }: CommunityCardProps) {
  const navigate = useNavigate()
  const isMember = useQuery(api.communities.isMember, { communityId: community._id })

  return (
    <div
      className="community-card"
      style={{ borderColor: isMember ? borderColor : 'rgba(var(--fg-rgb),0.06)' }}
    >
      <div className="community-card-top">
        <span className="community-card-icon">{community.icon}</span>
        <div className="community-card-info">
          <h3
            className="community-card-name"
            style={{ color: isMember ? sectionColor : 'var(--neon-white)', cursor: 'pointer' }}
            onClick={() => navigate(`/community/${community.slug}`)}
          >
            {community.name}
          </h3>
          <span className="community-card-members">
            {community.memberCount} member{community.memberCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      <p className="community-card-desc">{community.description}</p>
      <div className="community-card-actions">
        <button
          className="community-view-btn"
          onClick={() => navigate(`/community/${community.slug}`)}
        >
          VIEW
        </button>
        {isMember ? (
          <button
            className="community-leave-btn"
            onClick={() => onLeave(community._id)}
          >
            LEAVE
          </button>
        ) : (
          <button
            className="community-join-btn"
            style={{ background: sectionColor === 'var(--white-pure)' ? 'rgba(var(--fg-rgb),0.9)' : sectionColor }}
            onClick={() => onJoin(community._id)}
          >
            JOIN
          </button>
        )}
      </div>
    </div>
  )
}

// ─── People on Swiftie: everyone who has signed in, online first ─────────────
const PEOPLE_PREVIEW = 12

function PeopleSection() {
  const data = useQuery(api.users.listPeople, { limit: 200 })
  const [filter, setFilter] = useState<'all' | 'online' | 'following'>('all')
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  const needle = search.trim().toLowerCase()
  const people = (data?.people ?? []).filter((p) => {
    if (filter === 'online' && !p.isOnline) return false
    if (filter === 'following' && !p.isFollowing) return false
    if (!needle) return true
    return (p.username ?? '').includes(needle) || p.displayName.toLowerCase().includes(needle) || (p.location ?? '').toLowerCase().includes(needle)
  })
  const visible = showAll ? people : people.slice(0, PEOPLE_PREVIEW)

  return (
    <section className="people-section">
      <div className="people-header">
        <div>
          <p className="discover-page-label" style={{ marginBottom: '4px' }}>// PEOPLE ON SWIFTIE</p>
          <p className="people-sub">
            {data ? `${data.total} member${data.total === 1 ? '' : 's'} have signed in · ${data.onlineCount} online now` : 'Loading members…'}
          </p>
        </div>
        <div className="people-controls">
          <input
            className="cyber-input people-search"
            placeholder="Search people…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {(['all', 'online', 'following'] as const).map((f) => (
            <button key={f} className={`ghost-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'online' ? '● ' : ''}{f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {data === undefined ? (
        <p className="comment-empty">LOADING…</p>
      ) : visible.length === 0 ? (
        <p className="comment-empty">{filter === 'online' ? 'NOBODY ELSE IS ONLINE RIGHT NOW' : 'NO ONE MATCHES THAT SEARCH'}</p>
      ) : (
        <div className="people-grid">
          {visible.map((p) => (
            <div key={p._id} className={`person-card${p.isOnline ? ' online' : ''}`}>
              <div className="person-avatar">
                {p.username ? (
                  <Link to={`/profile/${p.username}`}><UserAvatar user={p} size={44} /></Link>
                ) : (
                  <UserAvatar user={p} size={44} />
                )}
                <span className={`online-dot${p.isOnline ? '' : ' off'}`} />
              </div>
              <div className="person-info">
                {p.username ? (
                  <Link to={`/profile/${p.username}`} className="person-name">{p.displayName}</Link>
                ) : (
                  <span className="person-name">{p.displayName}</span>
                )}
                <div className="person-meta">
                  {p.username ? `@${p.username}` : 'setting up profile'}
                  {' · '}
                  {p.isOnline ? 'online' : p.lastSeen ? `seen ${timeAgo(p.lastSeen).toLowerCase()} ago` : 'signed in'}
                </div>
                {(p.personalityResult || p.ideologyResult || p.occupationResult || p.location) && (
                  <div className="person-badges">
                    {p.personalityResult && <span className="mini-badge">🧠 {p.personalityResult.toUpperCase()}</span>}
                    {p.ideologyResult && <span className="mini-badge">⚐ {p.ideologyResult.toUpperCase()}</span>}
                    {p.occupationResult && <span className="mini-badge">🔧 {p.occupationResult.toUpperCase()}</span>}
                    {p.location && <span className="mini-badge" style={{ color: 'var(--text-dim)', borderColor: 'rgba(var(--fg-rgb),0.12)' }}>📍 {p.location}</span>}
                  </div>
                )}
              </div>
              <FollowButton userId={p._id} isFollowing={p.isFollowing} />
            </div>
          ))}
        </div>
      )}

      {people.length > PEOPLE_PREVIEW && (
        <div style={{ textAlign: 'center', marginTop: '14px' }}>
          <button className="ghost-btn" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'SHOW FEWER' : `SHOW ALL ${people.length}`}
          </button>
        </div>
      )}
    </section>
  )
}

export default function Discover() {
  return (
    <div className="discover-page">
      <style>{`
        .discover-page {
          max-width: 1300px;
          margin: 0 auto;
          padding: 40px 24px 80px;
        }
        .discover-header {
          margin-bottom: 48px;
          text-align: center;
        }
        .discover-page-label {
          font-family: var(--font-mono);
          font-size: calc(11px * var(--font-scale, 1));
          letter-spacing: 4px;
          text-transform: uppercase;
          color: var(--saffron);
          margin-bottom: 12px;
        }
        .discover-page-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: calc(clamp(22px, 3.5vw, 34px) * var(--font-scale, 1));
          letter-spacing: 6px;
          color: var(--neon-white);
          margin-bottom: 12px;
        }
        .discover-page-sub {
          font-size: calc(14px * var(--font-scale, 1));
          color: var(--text-dim);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }
        .discover-columns {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr));
          gap: 28px;
          align-items: start;
        }
        .discover-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .discover-col-header {
          padding: 20px 24px;
          background: rgba(var(--surface-rgb),0.7);
          border: 1px solid var(--col-border, rgba(var(--accent-rgb),0.2));
          display: flex;
          flex-direction: column;
          gap: 6px;
          clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
        }
        .discover-col-num {
          font-family: var(--font-mono);
          font-size: calc(10px * var(--font-scale, 1));
          letter-spacing: 3px;
          color: var(--text-dim);
        }
        .discover-col-icon { font-size: calc(28px * var(--font-scale, 1)); }
        .discover-col-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: calc(18px * var(--font-scale, 1));
          letter-spacing: 4px;
          margin: 0;
        }
        .discover-match-badge {
          margin-top: 8px;
          padding: 4px 10px;
          border: 1px solid;
          display: inline-block;
          width: fit-content;
          background: rgba(0,0,0,0.3);
        }
        .discover-assess-card {
          padding: 24px;
          background: rgba(var(--surface-rgb),0.5);
          border: 1px dashed;
          text-align: center;
        }
        .discover-assess-text {
          font-family: var(--font-body);
          font-size: calc(14px * var(--font-scale, 1));
          color: var(--text-dim);
          margin-bottom: 16px;
          line-height: 1.5;
        }
        .discover-assess-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: calc(11px * var(--font-scale, 1));
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--on-accent);
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
        }
        .discover-assess-btn:hover { transform: translateY(-2px); opacity: 0.9; }
        .discover-community-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .community-card {
          padding: 18px 20px;
          background: rgba(var(--surface-rgb),0.55);
          border: 1px solid;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .community-card:hover {
          box-shadow: 0 0 20px rgba(var(--accent-rgb),0.06);
        }
        .community-card-top {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 10px;
        }
        .community-card-icon { font-size: calc(24px * var(--font-scale, 1)); flex-shrink: 0; margin-top: 2px; }
        .community-card-info { flex: 1; min-width: 0; }
        .community-card-name {
          font-family: var(--font-display);
          font-size: calc(13px * var(--font-scale, 1));
          letter-spacing: 2px;
          margin: 0 0 4px;
          transition: color 0.2s;
        }
        .community-card-name:hover { opacity: 0.8; }
        .community-card-members {
          font-family: var(--font-mono);
          font-size: calc(10px * var(--font-scale, 1));
          letter-spacing: 1px;
          color: var(--text-dim);
        }
        .community-card-desc {
          font-size: calc(12px * var(--font-scale, 1));
          color: var(--text-dim);
          line-height: 1.5;
          margin-bottom: 14px;
        }
        .community-card-actions {
          display: flex;
          gap: 8px;
        }
        .community-view-btn,
        .community-join-btn,
        .community-leave-btn {
          padding: 6px 16px;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: calc(10px * var(--font-scale, 1));
          letter-spacing: 2px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
        }
        .community-view-btn {
          background: transparent;
          color: var(--text-dim);
          border: 1px solid rgba(var(--fg-rgb),0.1);
          clip-path: none;
        }
        .community-view-btn:hover { color: var(--neon-white); border-color: rgba(var(--fg-rgb),0.3); }
        .community-join-btn { color: var(--on-accent); }
        .community-join-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .community-leave-btn {
          background: transparent;
          color: var(--text-dim);
          border: 1px solid rgba(var(--fg-rgb),0.1);
          clip-path: none;
        }
        .community-leave-btn:hover { color: #ff6b6b; border-color: rgba(255,107,107,0.3); }
        .people-section {
          margin: 0 auto 44px;
          padding: 24px;
          background: rgba(var(--surface-rgb),0.45);
          border: 1px solid rgba(var(--accent2-rgb),0.15);
          clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
        }
        .people-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }
        .people-sub {
          font-family: var(--font-mono);
          font-size: calc(11px * var(--font-scale, 1));
          letter-spacing: 1px;
          color: var(--text-dim);
        }
        .people-controls { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .people-search { width: 200px; padding: 8px 12px; font-size: calc(13px * var(--font-scale, 1)); }
        @media (max-width: 768px) {
          .discover-columns { grid-template-columns: 1fr; }
          .people-search { width: 100%; }
        }
      `}</style>

      {/* Explore nudge */}
      <div style={{ textAlign: 'right', marginBottom: '20px' }}>
        <Link to="/explore" style={{
          fontFamily: "var(--font-mono)",
          fontSize: 'calc(11px * var(--font-scale, 1))',
          letterSpacing: '2px',
          color: 'var(--neon-green)',
          textDecoration: 'none',
          transition: 'opacity 0.2s',
        }}>
          Want to explore other communities? → EXPLORE
        </Link>
      </div>

      <div className="discover-header">
        <p className="discover-page-label">// DISCOVER</p>
        <h1 className="discover-page-title">FIND YOUR TRIBE</h1>
        <p className="discover-page-sub">
          Three independent lenses. Complete any assessment to unlock matched communities.
        </p>
      </div>

      <PeopleSection />

      <div className="discover-columns">
        {SECTIONS.map((section) => (
          <SectionColumn key={section.key} section={section} />
        ))}
      </div>
    </div>
  )
}
