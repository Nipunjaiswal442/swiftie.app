interface UserLike {
  displayName?: string
  username?: string
  profilePhotoUrl?: string
}

interface Props {
  user: UserLike | null | undefined
  size?: number
}

export default function UserAvatar({ user, size = 40 }: Props) {
  if (user?.profilePhotoUrl) {
    return (
      <img
        src={user.profilePhotoUrl}
        alt={user.displayName ?? 'user'}
        className="user-avatar"
        style={{ width: size, height: size }}
      />
    )
  }

  const initials = user
    ? (user.displayName || user.username || '?')
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')
    : '?'

  return (
    <div
      className="user-avatar-placeholder"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  )
}
