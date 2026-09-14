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
      ...((myBySection as any).custom  ?? []).map((c: any) => c._id),
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
          border-bottom: 1px solid rgba(var(--fg-rgb),0.05);
        }
        .explore-section-label {
          font-family: var(--font-mono);
          font-size: calc(10px * var(--font-scale, 1));
          letter-spacing: 3px;
          color: var(--text-dim);
        }
        .explore-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
          gap: 12px;
          margin-bottom: 8px;
        }
        .explore-community-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 16px;
          background: rgba(var(--surface-rgb),0.5);
          border: 1px solid rgba(var(--fg-rgb),0.06);
          clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%);
          transition: border-color 0.2s, background 0.2s;
        }
        .explore-community-card:hover {
          background: rgba(var(--surface-rgb),0.8);
          border-color: rgba(var(--accent-rgb),0.15);
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
          font-size: calc(20px * var(--font-scale, 1));
          flex-shrink: 0;
          background: rgba(var(--accent-rgb),0.06);
          border: 1px solid rgba(var(--accent-rgb),0.15);
        }
        .explore-card-name {
          font-family: var(--font-display);
          font-size: calc(11px * var(--font-scale, 1));
          font-weight: 600;
          letter-spacing: 2px;
          color: var(--neon-white);
          margin-bottom: 4px;
        }
        .explore-card-meta {
          font-family: var(--font-mono);
          font-size: calc(9px * var(--font-scale, 1));
          letter-spacing: 1px;
          color: var(--text-dim);
        }
        .explore-card-desc {
          font-family: var(--font-body);
          font-size: calc(13px * var(--font-scale, 1));
          color: rgba(var(--text-rgb),0.55);
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .explore-apply-btn {
          align-self: flex-end;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: calc(9px * var(--font-scale, 1));
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
          font-family: var(--font-mono);
          font-size: calc(10px * var(--font-scale, 1));
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
        background: 'rgba(var(--accent2-rgb),0.04)',
        border: '1px solid rgba(var(--accent2-rgb),0.12)',
        fontFamily: "var(--font-mono)", fontSize: 'calc(11px * var(--font-scale, 1))',
        letterSpacing: '1.5px', color: 'rgba(var(--accent2-rgb),0.65)',
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
                <span style={{ fontSize: 'calc(16px * var(--font-scale, 1))' }}>{icon}</span>
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
                            {community.memberCount} member{community.memberCount !== 1 ? 's' : ''}
                            {community.matchKey ? <>{' · '}<span style={{ color }}>{community.matchKey.toUpperCase()}</span></> : ''}
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
