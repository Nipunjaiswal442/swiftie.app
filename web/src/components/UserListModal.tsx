import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import UserAvatar from './UserAvatar'
import FollowButton from './FollowButton'

interface Props {
  userId: Id<'users'>
  initialTab: 'followers' | 'following'
  onClose: () => void
}

/** Followers / following lists for a profile, with follow buttons. */
export default function UserListModal({ userId, initialTab, onClose }: Props) {
  const [tab, setTab] = useState<'followers' | 'following'>(initialTab)
  const lists = useQuery(api.users.getFollowLists, { userId })
  const people = lists ? lists[tab] : undefined

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div className="community-tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
            {(['followers', 'following'] as const).map((t) => (
              <button
                key={t}
                className="community-tab"
                style={tab === t ? { color: 'var(--saffron)', borderBottomColor: 'var(--saffron)' } : {}}
                onClick={() => setTab(t)}
              >
                {t.toUpperCase()} {lists ? `· ${lists[t].length}` : ''}
              </button>
            ))}
          </div>
          <button className="ghost-btn" onClick={onClose}>✕</button>
        </div>

        {people === undefined ? (
          <p className="comment-empty">LOADING…</p>
        ) : people.length === 0 ? (
          <p className="comment-empty">{tab === 'followers' ? 'NO FOLLOWERS YET' : 'NOT FOLLOWING ANYONE YET'}</p>
        ) : (
          <div className="user-list">
            {people.map((u) => (
              <div key={u._id} className="person-card" style={{ clipPath: 'none' }}>
                <div className="person-avatar">
                  <UserAvatar user={u} size={40} />
                  <span className={`online-dot${u.isOnline ? '' : ' off'}`} />
                </div>
                <div className="person-info">
                  {u.username ? (
                    <Link to={`/profile/${u.username}`} className="person-name" onClick={onClose}>{u.displayName}</Link>
                  ) : (
                    <span className="person-name">{u.displayName}</span>
                  )}
                  <div className="person-meta">{u.username ? `@${u.username}` : 'profile not set up yet'}</div>
                </div>
                {!u.isMe && <FollowButton userId={u._id} isFollowing={u.isFollowing} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
