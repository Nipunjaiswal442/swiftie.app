import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { errorMessage } from '../lib/format'

export type ReportTargetType = 'user' | 'post' | 'communityPost' | 'comment'

const REASONS = [
  'Spam or scam',
  'Harassment or bullying',
  'Hate speech or discrimination',
  'Inappropriate or explicit content',
  'Impersonation or fake account',
  'Misinformation',
  'Something else',
]

interface ModalProps {
  targetType: ReportTargetType
  targetId: string
  targetLabel?: string
  onClose: () => void
}

export function ReportModal({ targetType, targetId, targetLabel, onClose }: ModalProps) {
  const report = useMutation(api.feedback.report)
  const [reason, setReason] = useState(REASONS[0])
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const noun = targetType === 'communityPost' ? 'community post' : targetType

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await report({ targetType, targetId, reason, details: details.trim() || undefined })
      setDone(true)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <p className="modal-title">⚑ REPORT {noun.toUpperCase()}</p>
        <p className="modal-sub">
          {targetLabel ? `${targetLabel} · ` : ''}Reports go straight to the Swiftie team. Maya includes every one in her daily round-up.
        </p>

        {done ? (
          <>
            <p className="success-msg">✔ Thanks — your report has been sent.</p>
            <div className="modal-actions">
              <button className="ghost-btn" onClick={onClose}>CLOSE</button>
            </div>
          </>
        ) : (
          <>
            <div className="radio-list">
              {REASONS.map((r) => (
                <label key={r}>
                  <input type="radio" name="report-reason" checked={reason === r} onChange={() => setReason(r)} />
                  {r}
                </label>
              ))}
            </div>
            <div className="form-group" style={{ marginTop: '16px', marginBottom: 0 }}>
              <label className="cyber-label" htmlFor="report-details">DETAILS <span style={{ color: 'var(--text-dim)' }}>(OPTIONAL)</span></label>
              <textarea
                id="report-details"
                className="cyber-input"
                placeholder="Anything that helps us understand what happened…"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={2000}
                style={{ minHeight: '80px' }}
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <div className="modal-actions">
              <button className="ghost-btn" onClick={onClose} disabled={submitting}>CANCEL</button>
              <button className="danger-btn" onClick={submit} disabled={submitting}>
                {submitting ? 'SENDING…' : 'SEND REPORT'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

interface ButtonProps extends Omit<ModalProps, 'onClose'> {
  compact?: boolean
  className?: string
}

/** A small ⚑ button that opens the report modal. */
export default function ReportButton({ compact, className, ...target }: ButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        className={className ?? (compact ? 'comment-action danger' : 'ghost-btn danger')}
        onClick={() => setOpen(true)}
        title="Report"
      >
        ⚑{compact ? '' : ' REPORT'}
      </button>
      {open && <ReportModal {...target} onClose={() => setOpen(false)} />}
    </>
  )
}
