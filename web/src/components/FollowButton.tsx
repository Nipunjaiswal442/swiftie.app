import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { errorMessage } from '../lib/format'

interface Props {
  userId: Id<'users'>
  isFollowing: boolean
  size?: 'sm' | 'md'
  className?: string
}

/** Follow / unfollow toggle used on profiles, the People section and follower lists. */
export default function FollowButton({ userId, isFollowing, size = 'sm', className }: Props) {
  const follow = useMutation(api.users.follow)
  const unfollow = useMutation(api.users.unfollow)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = async () => {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      if (isFollowing) await unfollow({ userId })
      else await follow({ userId })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setPending(false)
    }
  }

  const base = size === 'md' ? `follow-btn ${isFollowing ? 'following' : ''}` : `pill-btn ${isFollowing ? 'following' : ''}`

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
      <button className={`${base} ${className ?? ''}`} onClick={toggle} disabled={pending} title={error ?? undefined}>
        {pending ? '…' : isFollowing ? 'FOLLOWING' : 'FOLLOW'}
      </button>
      {error && <span className="error-msg" style={{ marginTop: 0 }}>{error}</span>}
    </span>
  )
}
