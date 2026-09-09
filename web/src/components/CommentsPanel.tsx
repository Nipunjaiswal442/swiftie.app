import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import type { FunctionReturnType } from 'convex/server'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import UserAvatar from './UserAvatar'
import ReportButton from './ReportModal'
import { errorMessage, timeAgo } from '../lib/format'

type AnyPostId = Id<'posts'> | Id<'communityPosts'>
type CommentList = FunctionReturnType<typeof api.comments.list>
type TopComment = CommentList[number]
type Reply = TopComment['replies'][number]

interface Props {
  postId: AnyPostId
  /** false for non-members of a community board: they can read but not write */
  canComment?: boolean
  placeholder?: string
}

/**
 * Threaded comments under a feed post or a community post: comment, reply,
 * like a comment, delete your own, report someone else's.
 */
export default function CommentsPanel({ postId, canComment = true, placeholder }: Props) {
  const comments = useQuery(api.comments.list, { postId })
  const add = useMutation(api.comments.add)
  const like = useMutation(api.comments.like)
  const unlike = useMutation(api.comments.unlike)
  const remove = useMutation(api.comments.remove)

  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: Id<'comments'>; username: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const submit = async () => {
    const content = text.trim()
    if (!content || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await add({ postId, content, parentId: replyTo?.id })
      setText('')
      setReplyTo(null)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const toggleLike = async (c: { _id: Id<'comments'>; likedByMe: boolean }) => {
    try {
      if (c.likedByMe) await unlike({ commentId: c._id })
      else await like({ commentId: c._id })
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const del = async (commentId: Id<'comments'>) => {
    if (!window.confirm('Delete this comment?')) return
    try {
      await remove({ commentId })
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const startReply = (threadId: Id<'comments'>, username: string | undefined, displayName: string) => {
    const handle = username ?? displayName
    setReplyTo({ id: threadId, username: handle })
    setText((t) => (t.startsWith(`@${handle} `) ? t : `@${handle} ${t}`))
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const renderComment = (c: TopComment | Reply, threadId: Id<'comments'>, isReply: boolean) => {
    const author = c.author
    const name = author?.displayName ?? 'Deleted user'
    const profileHref = author?.username ? `/profile/${author.username}` : undefined
    return (
      <div key={c._id} className={`comment${isReply ? ' reply' : ''}`}>
        <UserAvatar user={author} size={isReply ? 24 : 30} />
        <div className="comment-body">
          <div className="comment-head">
            {profileHref ? (
              <Link to={profileHref} className="comment-author">@{author!.username}</Link>
            ) : (
              <span className="comment-author">{name}</span>
            )}
            <span className="comment-time">{timeAgo(c._creationTime)}</span>
          </div>
          <p className="comment-text">{c.content}</p>
          <div className="comment-actions">
            <button className={`comment-action${c.likedByMe ? ' liked' : ''}`} onClick={() => toggleLike(c)}>
              {c.likedByMe ? '♥' : '♡'} {c.likesCount}
            </button>
            {canComment && (
              <button className="comment-action" onClick={() => startReply(threadId, author?.username, name)}>
                ↩ REPLY
              </button>
            )}
            {c.isMine ? (
              <button className="comment-action danger" onClick={() => del(c._id)}>DELETE</button>
            ) : (
              <ReportButton compact targetType="comment" targetId={c._id} targetLabel={`comment by ${author?.username ? '@' + author.username : name}`} />
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="comments-panel">
      {comments === undefined ? (
        <p className="comment-empty">LOADING COMMENTS…</p>
      ) : comments.length === 0 ? (
        <p className="comment-empty">NO COMMENTS YET — START THE CONVERSATION</p>
      ) : (
        comments.map((c) => (
          <div key={c._id}>
            {renderComment(c, c._id, false)}
            {c.replies.map((r) => renderComment(r, c._id, true))}
          </div>
        ))
      )}

      {canComment ? (
        <>
          {replyTo && (
            <div className="comment-replying">
              REPLYING TO @{replyTo.username}
              <button className="comment-action" onClick={() => { setReplyTo(null); setText('') }}>✕ CANCEL</button>
            </div>
          )}
          <div className="comment-form">
            <textarea
              ref={inputRef}
              className="comment-input"
              placeholder={placeholder ?? 'Write a comment… (Enter to send, Shift+Enter for a new line)'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              maxLength={1000}
              disabled={submitting}
            />
            <button className="comment-submit" onClick={submit} disabled={!text.trim() || submitting}>
              {submitting ? '…' : replyTo ? 'REPLY' : 'COMMENT'}
            </button>
          </div>
        </>
      ) : (
        <p className="comment-empty">JOIN THE COMMUNITY TO COMMENT</p>
      )}
      {error && <p className="error-msg">{error}</p>}
    </div>
  )
}
