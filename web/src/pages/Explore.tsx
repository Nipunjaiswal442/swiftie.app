import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../convex/_generated/api'

const SECTION_CONFIG = {
  personality: { label: 'PERSONALITY', color: 'var(--saffron)', icon: '🧠' },
  ideology:    { label: 'IDEOLOGY',    color: 'var(--white-pure)', icon: '⚐' },
  occupation:  { label: 'OCCUPATION',  color: 'var(--neon-green)', icon: '🔧' },
} as const

export default function Explore() {
  const allCommunities = useQuery(api.communities.getAll, {})
  const myBySection = useQuery(api.communities.getMyCommunitiesBySection)

  // Compute non-member communities, grouped by section
  let grouped: { personality: any[]; ideology: any[]; occupation: any[] } | null = null

  if (allCommunities && myBySection) {
    const myIds = new Set<string>([
      ...(myBySection.personality ?? []).map((c: any) => c._id),
      ...(myBySection.ideology    ?? []).map((c: any) => c._id),
      ...(myBySection.occupation  ?? []).map((c: any) => c._id),
    ])
    const nonMember = allCommunities.filter((c: any) => !myIds.has(c._id))
    grouped = {
      personality: nonMember.filter((c: any) => c.section === 'personality'),
      ideology:    nonMember.filter((c: any) => c.section === 'ideology'),
      occupation:  nonMember.filter((c: any) => c.section === 'occupation'),
    }
  }

  const loading = allCommunities === undefined || myBySection === undefined

  return (
    <div className="app-content">
      <style>{`
        .explore-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 28px 0 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .explore-section-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 3px;
          color: var(--text-dim);
        }
        .explore-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 12px;
          margin-bottom: 8px;
        }
        .explore-community-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 16px;
          background: rgba(13,13,26,0.5);
          border: 1px solid rgba(255,255,255,0.06);
          clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%);
          transition: border-color 0.2s, background 0.2s;
        }
        .explore-community-card:hover {
          background: rgba(13,13,26,0.8);
          border-color: rgba(255,153,51,0.15);
        }
        .explore-card-top {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .explore-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
          background: rgba(255,153,51,0.06);
          border: 1px solid rgba(255,153,51,0.15);
        }
        .explore-card-name {
          font-family: 'Orbitron', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          color: var(--neon-white);
          margin-bottom: 4px;
        }
        .explore-card-meta {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          letter-spacing: 1px;
          color: var(--text-dim);
        }
        .explore-card-desc {
          font-family: 'Rajdhani', sans-serif;
          font-size: 13px;
          color: rgba(224,224,255,0.55);
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .explore-apply-btn {
          align-self: flex-end;
          font-family: 'Orbitron', sans-serif;
          font-weight: 600;
          font-size: 9px;
          letter-spacing: 2px;
          padding: 7px 16px;
          background: transparent;
          border: 1px solid;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%);
          transition: opacity 0.2s, background 0.2s;
        }
        .explore-apply-btn:hover { opacity: 0.8; }
        .explore-empty {
          padding: '16px';
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 1.5px;
          color: var(--text-dim);
        }
        @media (max-width: 600px) {
          .explore-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <p className="page-title">// <span>EXPLORE COMMUNITIES</span></p>

      <div style={{
        padding: '10px 16px', marginBottom: '8px',
        background: 'rgba(0,255,65,0.04)',
        border: '1px solid rgba(0,255,65,0.12)',
        fontFamily: "'Share Tech Mono'", fontSize: '11px',
        letterSpacing: '1.5px', color: 'rgba(0,255,65,0.65)',
      }}>
        Communities you haven't joined yet — apply to explore new perspectives.
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}>
          <div className="loading-bar" />
        </div>
      ) : (
        (['personality', 'ideology', 'occupation'] as const).map((section) => {
          const { label, color, icon } = SECTION_CONFIG[section]
          const list = grouped?.[section] ?? []
          return (
            <div key={section}>
              <div className="explore-section-header">
                <span style={{ fontSize: '16px' }}>{icon}</span>
                <span className="explore-section-label" style={{ color }}>// {label}</span>
              </div>
              {list.length === 0 ? (
                <p className="explore-empty">You're in all {label.toLowerCase()} communities!</p>
              ) : (
                <div className="explore-grid">
                  {list.map((community: any) => (
                    <div key={community._id} className="explore-community-card">
                      <div className="explore-card-top">
                        <div className="explore-icon">{community.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="explore-card-name">{community.name}</div>
                          <div className="explore-card-meta">
                            {community.memberCount} member{community.memberCount !== 1 ? 's' : ''} ·{' '}
                            <span style={{ color }}>{community.matchKey.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                      <p className="explore-card-desc">{community.description}</p>
                      <Link
                        to={`/explore/apply/${community.slug}`}
                        className="explore-apply-btn"
                        style={{ color, borderColor: `${color}66` }}
                      >
                        APPLY TO JOIN →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
