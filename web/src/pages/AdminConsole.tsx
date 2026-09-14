import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAction, useMutation, useQuery } from 'convex/react'
import type { FunctionReturnType } from 'convex/server'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { MayaAvatar } from './MayaChat'
import UserAvatar from '../components/UserAvatar'
import { clearAdminSession, loadAdminSession } from '../lib/adminSession'
import { errorMessage, formatDateTime, timeAgo } from '../lib/format'

type Tab = 'overview' | 'accounts' | 'feedback' | 'maya' | 'audit'
type Stats = FunctionReturnType<typeof api.admin.stats>
type UserRow = FunctionReturnType<typeof api.admin.listUsers>[number]
type FeedbackRow = FunctionReturnType<typeof api.admin.listFeedback>[number]
type NotificationList = FunctionReturnType<typeof api.admin.listNotifications>
type Notification = NotificationList['items'][number]

const ADMIN_CSS = `
  .admin-shell { min-height: 100vh; position: relative; z-index: 2; padding: 24px; max-width: 1200px; margin: 0 auto; }
  .admin-header {
    display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
    padding: 16px 20px; margin-bottom: 20px;
    background: rgba(var(--surface-rgb),0.85);
    border: 1px solid rgba(255,107,107,0.3);
    clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
  }
  .admin-logo { font-family: var(--font-display); font-weight: 800; letter-spacing: 4px; font-size: calc(18px * var(--font-scale, 1)); color: var(--neon-white); }
  .admin-logo span { color: #ff6b6b; }
  .admin-session { font-family: var(--font-mono); font-size: calc(10px * var(--font-scale, 1)); letter-spacing: 1px; color: var(--text-dim); }
  .admin-tabs { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 20px; border-bottom: 1px solid rgba(var(--fg-rgb),0.08); }
  .admin-tab {
    font-family: var(--font-mono); font-size: calc(11px * var(--font-scale, 1)); letter-spacing: 2px; text-transform: uppercase;
    color: var(--text-dim); background: transparent; border: none; border-bottom: 2px solid transparent;
    padding: 10px 14px; cursor: pointer; margin-bottom: -1px; display: inline-flex; align-items: center; gap: 8px;
  }
  .admin-tab:hover { color: var(--neon-white); }
  .admin-tab.active { color: var(--saffron); border-bottom-color: var(--saffron); }
  .badge { background: #ff6b6b; color: #fff; font-family: var(--font-display); font-size: calc(9px * var(--font-scale, 1)); padding: 2px 6px; border-radius: 10px; }
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(150px, 100%), 1fr)); gap: 12px; margin-bottom: 20px; }
  .stat-tile { padding: 16px; background: rgba(var(--surface-rgb),0.6); border: 1px solid rgba(var(--fg-rgb),0.07); }
  .stat-num { font-family: var(--font-display); font-size: calc(22px * var(--font-scale, 1)); color: var(--saffron); }
  .stat-num.alert { color: #ff6b6b; }
  .stat-num.good { color: var(--neon-green); }
  .stat-label { font-family: var(--font-mono); font-size: calc(9px * var(--font-scale, 1)); letter-spacing: 2px; color: var(--text-dim); text-transform: uppercase; margin-top: 4px; }
  .admin-panel { padding: 20px; background: rgba(var(--surface-rgb),0.6); border: 1px solid rgba(var(--fg-rgb),0.07); margin-bottom: 16px; }
  .admin-panel-title { font-family: var(--font-mono); font-size: calc(10px * var(--font-scale, 1)); letter-spacing: 3px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 14px; }
  .admin-toolbar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 14px; }
  .admin-toolbar .cyber-input { width: 240px; padding: 8px 12px; font-size: calc(13px * var(--font-scale, 1)); }
  .table-wrap { overflow-x: auto; }
  .admin-table { width: 100%; border-collapse: collapse; font-family: var(--font-body); font-size: calc(13px * var(--font-scale, 1)); }
  .admin-table th {
    text-align: left; font-family: var(--font-mono); font-size: calc(9px * var(--font-scale, 1)); letter-spacing: 2px;
    color: var(--text-dim); padding: 8px 10px; border-bottom: 1px solid rgba(var(--fg-rgb),0.08); text-transform: uppercase; white-space: nowrap;
  }
  .admin-table td { padding: 10px; border-bottom: 1px solid rgba(var(--fg-rgb),0.05); vertical-align: middle; color: var(--neon-white); }
  .admin-table tr:hover td { background: rgba(var(--accent-rgb),0.03); }
  .cell-dim { color: var(--text-dim); font-family: var(--font-mono); font-size: calc(10px * var(--font-scale, 1)); letter-spacing: 0.5px; white-space: nowrap; }
  .row-actions { display: flex; gap: 6px; flex-wrap: wrap; }
  .fb-card { padding: 14px 16px; background: rgba(var(--surface-rgb),0.6); border: 1px solid rgba(var(--fg-rgb),0.07); margin-bottom: 10px; }
  .fb-card.open { border-left: 3px solid var(--saffron); }
  .fb-card.report.open { border-left-color: #ff6b6b; }
  .fb-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 6px; }
  .fb-subject { font-family: var(--font-body); font-size: calc(15px * var(--font-scale, 1)); color: var(--neon-white); margin-bottom: 4px; }
  .fb-message { font-family: var(--font-body); font-size: calc(13px * var(--font-scale, 1)); color: rgba(var(--text-rgb),0.7); white-space: pre-wrap; line-height: 1.5; }
  .fb-target { font-family: var(--font-mono); font-size: calc(10px * var(--font-scale, 1)); color: var(--saffron); margin-top: 6px; letter-spacing: 0.5px; }
  .fb-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
  .notif { padding: 16px 18px; background: rgba(var(--surface-rgb),0.6); border: 1px solid rgba(var(--fg-rgb),0.07); margin-bottom: 10px; cursor: pointer; }
  .notif.unread { border-color: rgba(var(--accent2-rgb),0.35); box-shadow: inset 3px 0 0 var(--neon-green); }
  .notif-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .notif-title { font-family: var(--font-display); font-size: calc(12px * var(--font-scale, 1)); letter-spacing: 1.5px; color: var(--neon-white); flex: 1; min-width: 200px; }
  .notif-body { font-family: var(--font-body); font-size: calc(14px * var(--font-scale, 1)); color: rgba(var(--text-rgb),0.85); white-space: pre-wrap; line-height: 1.65; margin-top: 12px; }
  .notif-preview { font-family: var(--font-body); font-size: calc(13px * var(--font-scale, 1)); color: var(--text-dim); margin-top: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .kv { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(180px, 100%), 1fr)); gap: 8px 16px; margin: 12px 0; }
  .kv div { font-family: var(--font-body); font-size: calc(13px * var(--font-scale, 1)); color: var(--neon-white); }
  .kv span { display: block; font-family: var(--font-mono); font-size: calc(9px * var(--font-scale, 1)); letter-spacing: 1.5px; color: var(--text-dim); text-transform: uppercase; }
  .content-row { display: flex; gap: 10px; align-items: flex-start; padding: 8px 0; border-top: 1px solid rgba(var(--fg-rgb),0.05); font-family: var(--font-body); font-size: calc(13px * var(--font-scale, 1)); color: rgba(var(--text-rgb),0.8); }
  .content-row p { flex: 1; margin: 0; white-space: pre-wrap; word-break: break-word; }
  @media (max-width: 768px) {
    .admin-shell { padding: 12px; padding-bottom: calc(12px + env(safe-area-inset-bottom)); }
    .admin-toolbar .cyber-input { width: 100%; }
    .admin-header { padding: 12px 14px; }
    .admin-panel { padding: 14px 12px; }
    /* One swipeable strip beats three stacked rows of tabs. */
    .admin-tabs { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
    .admin-tabs::-webkit-scrollbar { display: none; }
    .admin-tab { white-space: nowrap; flex-shrink: 0; }
    .notif-title { min-width: 0; }
  }
`

const label = (u: { username?: string; displayName: string }) => (u.username ? `@${u.username}` : u.displayName)

// ─── Overview ────────────────────────────────────────────────────────────────
function OverviewTab({ stats, notifications, goTo }: { stats: Stats | undefined; notifications: NotificationList | undefined; goTo: (t: Tab) => void }) {
  if (!stats) return <p className="comment-empty">LOADING…</p>
  const latestDigest = notifications?.items.find((n) => n.kind === 'daily_digest')
  return (
    <>
      <div className="stat-grid">
        <div className="stat-tile"><div className="stat-num">{stats.users.total}</div><div className="stat-label">Accounts</div></div>
        <div className="stat-tile"><div className="stat-num good">{stats.users.online}</div><div className="stat-label">Online now</div></div>
        <div className="stat-tile"><div className="stat-num">{stats.users.newToday}</div><div className="stat-label">New today</div></div>
        <div className="stat-tile"><div className="stat-num">{stats.users.newThisWeek}</div><div className="stat-label">New this week</div></div>
        <div className="stat-tile"><div className="stat-num">{stats.users.withProfile}</div><div className="stat-label">Profiles set up</div></div>
        <div className="stat-tile"><div className={`stat-num${stats.users.suspended ? ' alert' : ''}`}>{stats.users.suspended}</div><div className="stat-label">Suspended</div></div>
        <div className="stat-tile"><div className="stat-num">{stats.content.posts + stats.content.communityPosts}</div><div className="stat-label">Posts</div></div>
        <div className="stat-tile"><div className="stat-num">{stats.content.comments}</div><div className="stat-label">Comments</div></div>
        <div className="stat-tile"><div className="stat-num">{stats.content.postsToday}</div><div className="stat-label">Posts today</div></div>
        <div className="stat-tile"><div className="stat-num">{stats.content.communities}</div><div className="stat-label">Communities</div></div>
        <div className="stat-tile"><div className={`stat-num${stats.feedback.openReports ? ' alert' : ''}`}>{stats.feedback.openReports}</div><div className="stat-label">Open reports</div></div>
        <div className="stat-tile"><div className="stat-num">{stats.feedback.openComplaints}</div><div className="stat-label">Open complaints</div></div>
        <div className="stat-tile"><div className="stat-num">{stats.feedback.openRequests}</div><div className="stat-label">Open requests</div></div>
        <div className="stat-tile"><div className={`stat-num${stats.feedback.openBugs ? ' alert' : ''}`}>{stats.feedback.openBugs}</div><div className="stat-label">Open bugs</div></div>
        <div className="stat-tile"><div className={`stat-num${stats.notifications.unread ? ' good' : ''}`}>{stats.notifications.unread}</div><div className="stat-label">Unread from Maya</div></div>
      </div>

      <div className="admin-panel">
        <p className="admin-panel-title">Latest round-up from Maya</p>
        {latestDigest ? (
          <div className="notif" onClick={() => goTo('maya')} style={{ marginBottom: 0 }}>
            <div className="notif-head">
              <MayaAvatar size={36} />
              <div className="notif-title">{latestDigest.title}</div>
              <span className="cell-dim">{formatDateTime(latestDigest._creationTime)}</span>
            </div>
            <div className="notif-body">{latestDigest.body}</div>
          </div>
        ) : (
          <p className="comment-empty">NO DIGEST YET — MAYA SENDS ONE EVERY MORNING AT 09:00 IST. YOU CAN ALSO ASK FOR ONE NOW FROM THE MAYA TAB.</p>
        )}
      </div>
    </>
  )
}

// ─── Accounts ────────────────────────────────────────────────────────────────
function AccountsTab({ token, onView }: { token: string; onView: (id: Id<'users'>) => void }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'suspended' | 'online'>('all')
  const users = useQuery(api.admin.listUsers, { token, search, status })
  const suspend = useMutation(api.admin.suspendUser)
  const unsuspend = useMutation(api.admin.unsuspendUser)
  const remove = useMutation(api.admin.deleteUser)
  const [error, setError] = useState<string | null>(null)

  const run = async (fn: () => Promise<unknown>) => {
    setError(null)
    try { await fn() } catch (err) { setError(errorMessage(err)) }
  }

  const handleSuspend = (u: UserRow) => {
    const reason = window.prompt(`Suspend ${label(u)}? Enter the reason the user will see:`, 'Violation of community guidelines')
    if (reason === null) return
    run(() => suspend({ token, userId: u._id, reason }))
  }
  const handleDelete = (u: UserRow) => {
    const typed = window.prompt(`Permanently delete ${label(u)} (${u.email}) and ALL their data? Type DELETE to confirm.`)
    if (typed !== 'DELETE') return
    run(() => remove({ token, userId: u._id }))
  }

  return (
    <div className="admin-panel">
      <div className="admin-toolbar">
        <input className="cyber-input" placeholder="Search name, @username or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        {(['all', 'active', 'online', 'suspended'] as const).map((s) => (
          <button key={s} className={`ghost-btn${status === s ? ' active' : ''}`} onClick={() => setStatus(s)}>{s.toUpperCase()}</button>
        ))}
        <span className="cell-dim">{users ? `${users.length} account${users.length === 1 ? '' : 's'}` : 'loading…'}</span>
      </div>
      {error && <p className="error-msg">{error}</p>}
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th><th>Email</th><th>Status</th><th>Joined</th><th>Last seen</th><th>Posts</th><th>Followers</th><th>Reports</th><th>Assessments</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <UserAvatar user={u} size={30} />
                    <div>
                      <div>{u.displayName}</div>
                      <div className="cell-dim">{u.username ? `@${u.username}` : 'no profile yet'}</div>
                    </div>
                  </div>
                </td>
                <td className="cell-dim">{u.email || '—'}</td>
                <td>
                  <span className={`status-chip ${u.status}`}>{u.status}</span>
                  {u.isOnline && <span className="status-chip online" style={{ marginLeft: 4 }}>online</span>}
                </td>
                <td className="cell-dim">{formatDateTime(u.createdAt)}</td>
                <td className="cell-dim">{u.lastSeen ? timeAgo(u.lastSeen) : '—'}</td>
                <td>{u.postsCount}</td>
                <td>{u.followersCount}</td>
                <td style={{ color: u.openReports ? '#ff6b6b' : undefined }}>{u.openReports}</td>
                <td className="cell-dim">{u.assessments.length ? u.assessments.join(' · ').toUpperCase() : '—'}</td>
                <td>
                  <div className="row-actions">
                    <button className="ghost-btn" onClick={() => onView(u._id)}>VIEW</button>
                    {u.status === 'suspended' ? (
                      <button className="ghost-btn" onClick={() => run(() => unsuspend({ token, userId: u._id }))}>UNSUSPEND</button>
                    ) : (
                      <button className="ghost-btn danger" onClick={() => handleSuspend(u)}>SUSPEND</button>
                    )}
                    <button className="ghost-btn danger" onClick={() => handleDelete(u)}>DELETE</button>
                  </div>
                </td>
              </tr>
            ))}
            {users && users.length === 0 && (
              <tr><td colSpan={10} className="comment-empty">NO ACCOUNTS MATCH</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── User detail ─────────────────────────────────────────────────────────────
function UserDetailModal({ token, userId, onClose }: { token: string; userId: Id<'users'>; onClose: () => void }) {
  const user = useQuery(api.admin.getUser, { token, userId })
  const removeContent = useMutation(api.admin.removeContent)
  const suspend = useMutation(api.admin.suspendUser)
  const unsuspend = useMutation(api.admin.unsuspendUser)
  const [error, setError] = useState<string | null>(null)

  const run = async (fn: () => Promise<unknown>) => {
    setError(null)
    try { await fn() } catch (err) { setError(errorMessage(err)) }
  }
  const removeItem = (targetType: 'post' | 'communityPost' | 'comment', targetId: string) => {
    if (!window.confirm('Remove this content permanently?')) return
    run(() => removeContent({ token, targetType, targetId }))
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '760px' }} onClick={(e) => e.stopPropagation()}>
        {user === undefined ? (
          <p className="comment-empty">LOADING…</p>
        ) : user === null ? (
          <p className="comment-empty">USER NO LONGER EXISTS</p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <UserAvatar user={user} size={56} />
              <div style={{ flex: 1 }}>
                <p className="modal-title" style={{ marginBottom: 2 }}>{user.displayName}</p>
                <p className="cell-dim">{user.username ? `@${user.username}` : 'no profile yet'} · {user.email}</p>
              </div>
              <span className={`status-chip ${user.status}`}>{user.status}</span>
              {user.isOnline && <span className="status-chip online">online</span>}
            </div>
            {user.suspendedReason && <p className="error-msg">Suspended: {user.suspendedReason} ({user.suspendedAt ? formatDateTime(user.suspendedAt) : ''})</p>}

            <div className="kv">
              <div><span>Joined</span>{formatDateTime(user.createdAt)}</div>
              <div><span>Last seen</span>{user.lastSeen ? formatDateTime(user.lastSeen) : '—'}</div>
              <div><span>Profile completed</span>{user.profileCompletedAt ? formatDateTime(user.profileCompletedAt) : '—'}</div>
              <div><span>Age / pronouns</span>{user.age ?? '—'} / {user.pronouns || '—'}</div>
              <div><span>Location</span>{user.location || '—'}</div>
              <div><span>Role</span>{user.currentRole || '—'}</div>
              <div><span>Followers / following</span>{user.counts.followers} / {user.counts.following}</div>
              <div><span>Maya messages</span>{user.counts.mayaMessages}</div>
              <div><span>Personality</span>{user.assessments.personality?.toUpperCase() ?? '—'}</div>
              <div><span>Ideology</span>{user.assessments.ideology?.toUpperCase() ?? '—'}</div>
              <div><span>Occupation</span>{user.assessments.occupation?.toUpperCase() ?? '—'}</div>
              <div><span>Communities</span>{user.communities.length ? user.communities.map((c) => `${c.icon} ${c.name}`).join(', ') : '—'}</div>
            </div>
            {user.bio && <p className="fb-message" style={{ marginBottom: 12 }}>“{user.bio}”</p>}
            {user.interests.length > 0 && <p className="cell-dim" style={{ marginBottom: 12 }}>Interests: {user.interests.join(', ')}</p>}

            {user.reportsAgainst.length > 0 && (
              <div className="admin-panel" style={{ borderColor: 'rgba(255,107,107,0.3)' }}>
                <p className="admin-panel-title" style={{ color: '#ff6b6b' }}>Reports against this user ({user.reportsAgainst.length})</p>
                {user.reportsAgainst.map((r) => (
                  <div key={r._id} className="content-row">
                    <span className={`status-chip ${r.status}`}>{r.status}</span>
                    <p>{r.subject} — {r.message}</p>
                    <span className="cell-dim">{formatDateTime(r._creationTime)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="admin-panel">
              <p className="admin-panel-title">Recent content</p>
              {user.recentPosts.length + user.recentCommunityPosts.length + user.recentComments.length === 0 && <p className="comment-empty">NOTHING POSTED YET</p>}
              {user.recentPosts.map((p) => (
                <div key={p._id} className="content-row">
                  <span className="cell-dim">POST</span>
                  <p>{p.text}</p>
                  <span className="cell-dim">♥{p.likes} 💬{p.comments}</span>
                  <button className="ghost-btn danger" onClick={() => removeItem('post', p._id)}>REMOVE</button>
                </div>
              ))}
              {user.recentCommunityPosts.map((p) => (
                <div key={p._id} className="content-row">
                  <span className="cell-dim">BOARD</span>
                  <p>{p.text}</p>
                  <span className="cell-dim">♥{p.likes} 💬{p.comments}</span>
                  <button className="ghost-btn danger" onClick={() => removeItem('communityPost', p._id)}>REMOVE</button>
                </div>
              ))}
              {user.recentComments.map((c) => (
                <div key={c._id} className="content-row">
                  <span className="cell-dim">COMMENT</span>
                  <p>{c.text}</p>
                  <span className="cell-dim">♥{c.likes}</span>
                  <button className="ghost-btn danger" onClick={() => removeItem('comment', c._id)}>REMOVE</button>
                </div>
              ))}
            </div>

            {user.submittedFeedback.length > 0 && (
              <div className="admin-panel">
                <p className="admin-panel-title">Feedback submitted ({user.submittedFeedback.length})</p>
                {user.submittedFeedback.map((f) => (
                  <div key={f._id} className="content-row">
                    <span className={`status-chip ${f.status}`}>{f.type}</span>
                    <p>{f.subject} — {f.message}</p>
                    <span className="cell-dim">{f.source}</span>
                  </div>
                ))}
              </div>
            )}

            {error && <p className="error-msg">{error}</p>}
            <div className="modal-actions">
              {user.status === 'suspended' ? (
                <button className="ghost-btn" onClick={() => run(() => unsuspend({ token, userId }))}>UNSUSPEND</button>
              ) : (
                <button className="danger-btn" onClick={() => {
                  const reason = window.prompt(`Suspend ${label(user)}? Enter the reason the user will see:`, 'Violation of community guidelines')
                  if (reason !== null) run(() => suspend({ token, userId, reason }))
                }}>SUSPEND</button>
              )}
              <button className="ghost-btn" onClick={onClose}>CLOSE</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Reports & feedback ──────────────────────────────────────────────────────
function FeedbackTab({ token, onViewUser }: { token: string; onViewUser: (id: Id<'users'>) => void }) {
  const [status, setStatus] = useState<'open' | 'all' | 'resolved' | 'dismissed'>('open')
  const [source, setSource] = useState<'all' | 'form' | 'report' | 'maya'>('all')
  const rows = useQuery(api.admin.listFeedback, { token, status, source })
  const resolve = useMutation(api.admin.resolveFeedback)
  const removeContent = useMutation(api.admin.removeContent)
  const suspend = useMutation(api.admin.suspendUser)
  const [error, setError] = useState<string | null>(null)

  const run = async (fn: () => Promise<unknown>) => {
    setError(null)
    try { await fn() } catch (err) { setError(errorMessage(err)) }
  }

  const setStatusWithNote = (f: FeedbackRow, next: 'resolved' | 'dismissed' | 'open') => {
    const note = next === 'open' ? null : window.prompt(`Mark as ${next}. Optional note shown to ${f.user?.label ?? 'the user'}:`, f.adminNote ?? '')
    if (next !== 'open' && note === null) return
    run(() => resolve({ token, feedbackId: f._id, status: next, adminNote: note ?? undefined }))
  }

  const sourceLabel = (s: FeedbackRow['source']) => (s === 'maya' ? 'told Maya' : s === 'report' ? '⚑ report' : 'form')

  return (
    <div className="admin-panel">
      <div className="admin-toolbar">
        {(['open', 'all', 'resolved', 'dismissed'] as const).map((s) => (
          <button key={s} className={`ghost-btn${status === s ? ' active' : ''}`} onClick={() => setStatus(s)}>{s.toUpperCase()}</button>
        ))}
        <span className="cell-dim">·</span>
        {(['all', 'report', 'form', 'maya'] as const).map((s) => (
          <button key={s} className={`ghost-btn${source === s ? ' active' : ''}`} onClick={() => setSource(s)}>
            {s === 'maya' ? 'HEARD BY MAYA' : s === 'report' ? 'REPORTS' : s === 'form' ? 'FORMS' : 'ALL SOURCES'}
          </button>
        ))}
        <span className="cell-dim">{rows ? `${rows.length} item${rows.length === 1 ? '' : 's'}` : 'loading…'}</span>
      </div>
      {error && <p className="error-msg">{error}</p>}
      {rows && rows.length === 0 && <p className="comment-empty">NOTHING HERE — BHAL! 🎉</p>}
      {rows?.map((f) => (
        <div key={f._id} className={`fb-card ${f.status}${f.type === 'report' ? ' report' : ''}`}>
          <div className="fb-meta">
            <span className={`status-chip ${f.status}`}>{f.status}</span>
            <span className="status-chip" style={{ color: f.type === 'report' ? '#ff6b6b' : 'var(--neon-white)', borderColor: 'rgba(var(--fg-rgb),0.2)' }}>{f.type}</span>
            <span className="status-chip" style={{ color: 'var(--text-dim)', borderColor: 'rgba(var(--fg-rgb),0.12)' }}>{sourceLabel(f.source)}</span>
            <button className="comment-action" onClick={() => onViewUser(f.userId)} style={{ color: 'var(--saffron)' }}>
              {f.user?.label ?? 'deleted user'}
            </button>
            <span className="cell-dim">{formatDateTime(f._creationTime)}</span>
          </div>
          <div className="fb-subject">{f.subject}</div>
          <div className="fb-message">{f.message}</div>
          {f.targetLabel && (
            <div className="fb-target">
              TARGET: {f.targetLabel} {f.targetExists === false && <span style={{ color: 'var(--text-dim)' }}>(already removed)</span>}
            </div>
          )}
          {f.adminNote && <div className="fb-target" style={{ color: 'var(--neon-green)' }}>NOTE: {f.adminNote}</div>}
          <div className="fb-actions">
            {f.status !== 'resolved' && <button className="ghost-btn" onClick={() => setStatusWithNote(f, 'resolved')}>✔ RESOLVE</button>}
            {f.status !== 'dismissed' && <button className="ghost-btn" onClick={() => setStatusWithNote(f, 'dismissed')}>DISMISS</button>}
            {f.status !== 'open' && <button className="ghost-btn" onClick={() => setStatusWithNote(f, 'open')}>REOPEN</button>}
            {f.targetType && f.targetType !== 'user' && f.targetId && f.targetExists && (
              <button className="ghost-btn danger" onClick={() => {
                if (window.confirm('Remove the reported content permanently?')) run(() => removeContent({ token, targetType: f.targetType as 'post' | 'communityPost' | 'comment', targetId: f.targetId! }))
              }}>REMOVE CONTENT</button>
            )}
            {f.targetType === 'user' && f.targetId && f.targetExists && (
              <>
                <button className="ghost-btn" onClick={() => onViewUser(f.targetId as Id<'users'>)}>VIEW REPORTED USER</button>
                <button className="ghost-btn danger" onClick={() => {
                  const reason = window.prompt('Suspend the reported user? Enter the reason they will see:', f.subject.replace(/^Report:\s*/, ''))
                  if (reason !== null) run(() => suspend({ token, userId: f.targetId as Id<'users'>, reason }))
                }}>SUSPEND USER</button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Maya notifications ──────────────────────────────────────────────────────
function MayaTab({ token, notifications }: { token: string; notifications: NotificationList | undefined }) {
  const generate = useAction(api.admin.generateDigestNow)
  const markRead = useMutation(api.admin.markNotificationRead)
  const markAll = useMutation(api.admin.markAllNotificationsRead)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  const askNow = async () => {
    setBusy(true)
    setError(null)
    try {
      await generate({ token })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const open = (n: Notification) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(n._id)) next.delete(n._id)
      else next.add(n._id)
      return next
    })
    if (!n.readAt) markRead({ token, notificationId: n._id }).catch(() => {})
  }

  const kindChip = (k: Notification['kind']) =>
    k === 'daily_digest' ? 'DAILY ROUND-UP' : k === 'report' ? '⚑ REPORT' : k === 'feedback' ? 'FEEDBACK' : 'SYSTEM'

  return (
    <div className="admin-panel">
      <div className="admin-toolbar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <MayaAvatar size={40} />
          <div>
            <div className="notif-title">MAYA'S NOTIFICATIONS</div>
            <div className="cell-dim">Daily round-up at 09:00 IST · instant pings for reports and feedback · {notifications?.unread ?? 0} unread</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="ghost-btn" onClick={() => markAll({ token }).catch(() => {})}>MARK ALL READ</button>
          <button className="cta-btn" style={{ padding: '10px 20px', fontSize: 'calc(11px * var(--font-scale, 1))', letterSpacing: '2px' }} onClick={askNow} disabled={busy}>
            {busy ? 'MAYA IS WRITING…' : 'ASK MAYA FOR A ROUND-UP NOW'} <span className="cta-arrow">➔</span>
          </button>
        </div>
      </div>
      {error && <p className="error-msg">{error}</p>}
      {notifications === undefined && <p className="comment-empty">LOADING…</p>}
      {notifications && notifications.items.length === 0 && <p className="comment-empty">NO NOTIFICATIONS YET</p>}
      {notifications?.items.map((n) => {
        const isOpen = expanded.has(n._id) || n.kind === 'daily_digest'
        return (
          <div key={n._id} className={`notif${n.readAt ? '' : ' unread'}`} onClick={() => open(n)}>
            <div className="notif-head">
              {n.kind === 'daily_digest' ? <MayaAvatar size={32} /> : <span className={`status-chip ${n.kind === 'report' ? 'suspended' : 'open'}`}>{kindChip(n.kind)}</span>}
              <div className="notif-title">{n.title}</div>
              <span className="cell-dim">{formatDateTime(n._creationTime)}</span>
            </div>
            {isOpen ? <div className="notif-body">{n.body}</div> : <div className="notif-preview">{n.body}</div>}
          </div>
        )
      })}
    </div>
  )
}

// ─── Audit log ───────────────────────────────────────────────────────────────
function AuditTab({ token }: { token: string }) {
  const rows = useQuery(api.admin.auditLog, { token })
  return (
    <div className="admin-panel">
      <p className="admin-panel-title">Last 100 admin actions</p>
      {rows === undefined && <p className="comment-empty">LOADING…</p>}
      {rows && rows.length === 0 && <p className="comment-empty">NOTHING YET</p>}
      {rows?.map((r) => (
        <div key={r._id} className="content-row">
          <span className="cell-dim">{formatDateTime(r._creationTime)}</span>
          <span className="status-chip open">{r.action}</span>
          <p>{r.details ?? ''}</p>
          <span className="cell-dim">{r.adminId}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Shell ───────────────────────────────────────────────────────────────────
export default function AdminConsole() {
  const navigate = useNavigate()
  const [session] = useState(() => loadAdminSession())
  const token = session?.token ?? ''
  const live = useQuery(api.admin.session, token ? { token } : 'skip')
  // Data queries only run while the session is confirmed live, so an expired
  // token never throws from a hook during render.
  const stats = useQuery(api.admin.stats, token && live ? { token } : 'skip')
  const notifications = useQuery(api.admin.listNotifications, token && live ? { token, limit: 100 } : 'skip')
  const logout = useMutation(api.admin.logout)
  const [tab, setTab] = useState<Tab>('overview')
  const [detailUserId, setDetailUserId] = useState<Id<'users'> | null>(null)

  useEffect(() => {
    if (!token || live === null) {
      clearAdminSession()
      navigate('/admin', { replace: true })
    }
  }, [token, live, navigate])

  if (!token || live === undefined) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">SWIFTIE</div>
        <div className="loading-bar" />
      </div>
    )
  }
  if (live === null) return null

  const handleLogout = async () => {
    try { await logout({ token }) } catch { /* session may already be gone */ }
    clearAdminSession()
    navigate('/admin', { replace: true })
  }

  const unread = notifications?.unread ?? stats?.notifications.unread ?? 0
  const openReports = stats?.feedback.openReports ?? 0

  return (
    <>
      <style>{ADMIN_CSS}</style>
      <div className="grid-bg" />
      <div className="tricolour-top">
        <div className="saffron" /><div className="white-bar" /><div className="green-bar" />
      </div>
      <div className="admin-shell">
        <header className="admin-header">
          <div>
            <div className="admin-logo">SWIFTIE <span>// ADMIN</span></div>
            <div className="admin-session">Signed in as {live.adminId} · session until {formatDateTime(live.expiresAt)}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a href="/" className="ghost-btn" style={{ textDecoration: 'none' }}>← APP</a>
            <button className="ghost-btn danger" onClick={handleLogout}>LOGOUT</button>
          </div>
        </header>

        <div className="admin-tabs">
          {([
            ['overview', 'Overview', 0],
            ['accounts', 'Accounts', 0],
            ['feedback', 'Reports & feedback', openReports],
            ['maya', 'Maya', unread],
            ['audit', 'Audit log', 0],
          ] as Array<[Tab, string, number]>).map(([key, name, count]) => (
            <button key={key} className={`admin-tab${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>
              {name}{count > 0 && <span className="badge">{count}</span>}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab stats={stats} notifications={notifications} goTo={setTab} />}
        {tab === 'accounts' && <AccountsTab token={token} onView={setDetailUserId} />}
        {tab === 'feedback' && <FeedbackTab token={token} onViewUser={setDetailUserId} />}
        {tab === 'maya' && <MayaTab token={token} notifications={notifications} />}
        {tab === 'audit' && <AuditTab token={token} />}

        {detailUserId && <UserDetailModal token={token} userId={detailUserId} onClose={() => setDetailUserId(null)} />}
      </div>
    </>
  )
}
