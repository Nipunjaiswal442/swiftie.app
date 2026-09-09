import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import UserAvatar from './UserAvatar'
import CommentsPanel from './CommentsPanel'
import ReportButton from './ReportModal'
import { errorMessage, timeAgo } from '../lib/format'

export interface PostAuthor {
  _id?: Id<'users'>
  displayName: string
  username?: string
  profilePhotoUrl?: string
  isOnline?: boolean
}

export interface FeedPostData {
  _id: Id<'posts'>
  _creationTime: number
  caption?: string
  imageUrl?: string
  likesCount: number
  commentsCount: number
  likedByMe?: boolean
  isMine?: boolean
  author: PostAuthor | null
}

interface Props {
  post: FeedPostData
  /** open the comment thread immediately */
  defaultOpen?: boolean
}

/** A personal-feed post with like, comment, report and (for the author) delete. */
export default function PostCard({ post, defaultOpen = false }: Props) {
  const likePost = useMutation(api.posts.like)
  const unlikePost = useMutation(api.posts.unlike)
  const removePost = useMutation(api.posts.remove)
  const [showComments, setShowComments] = useState(defaultOpen)
  const [error, setError] = useState<string | null>(null)

  const author = post.author
  const profileHref = author?.username ? `/profile/${author.username}` : undefined

  const toggleLike = async () => {
    try {
      if (post.likedByMe) await unlikePost({ postId: post._id })
      else await likePost({ postId: post._id })
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const del = async () => {
    if (!window.confirm('Delete this post? Its likes and comments go with it.')) return
    try {
      await removePost({ postId: post._id })
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="card post-card">
      <div className="post-header">
        {profileHref ? (
          <Link to={profileHref} style={{ display: 'flex' }}>
            <UserAvatar user={author} size={44} />
          </Link>
        ) : (
          <UserAvatar user={author} size={44} />
        )}
        <div className="post-author-info">
          <div className="post-author-name">
            {profileHref ? (
              <Link to={profileHref} style={{ color: 'inherit', textDecoration: 'none' }}>{author?.displayName}</Link>
            ) : (
              author?.displayName ?? 'Deleted user'
            )}
          </div>
          <div className="post-author-username">@{author?.username ?? '...'} · {timeAgo(post._creationTime)}</div>
        </div>
        {post.isMine ? (
          <button className="ghost-btn danger" onClick={del} title="Delete post">✕ DELETE</button>
        ) : (
          <ReportButton targetType="post" targetId={post._id} targetLabel={author?.username ? `post by @${author.username}` : undefined} />
        )}
      </div>

      {post.imageUrl && <img src={post.imageUrl} alt="post" className="post-image" />}
      {post.caption && <p className="post-caption">{post.caption}</p>}

      <div className="post-actions">
        <button className={`post-action-btn${post.likedByMe ? ' liked' : ''}`} onClick={toggleLike}>
          {post.likedByMe ? '🧡' : '🤍'} {post.likesCount} LIKE{post.likesCount === 1 ? '' : 'S'}
        </button>
        <button className={`post-action-btn${showComments ? ' liked' : ''}`} onClick={() => setShowComments((v) => !v)}>
          💬 {post.commentsCount} COMMENT{post.commentsCount === 1 ? '' : 'S'}
        </button>
      </div>
      {error && <p className="error-msg">{error}</p>}

      {showComments && <CommentsPanel postId={post._id} />}
    </div>
  )
}
