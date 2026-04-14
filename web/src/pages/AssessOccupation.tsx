import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { OCCUPATION_QUESTIONS, scoreOccupation } from '../data/occupationQuestions'

export default function AssessOccupation() {
  const navigate = useNavigate()
  const completeAssessment = useMutation(api.assessments.completeAssessment)

  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const answered = Object.keys(answers).length
  const total = OCCUPATION_QUESTIONS.length
  const progress = Math.round((answered / total) * 100)
  const allAnswered = answered === total

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async () => {
    if (!allAnswered) {
      setError(`Please answer all ${total} questions before submitting.`)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const { scores, matchKey } = scoreOccupation(answers)
      await completeAssessment({
        section: 'occupation',
        scores: {
          TECH: scores.TECH, DESIGN: scores.DESIGN, ART: scores.ART, SCI: scores.SCI,
          HUM: scores.HUM, WRITE: scores.WRITE, COM: scores.COM, HEALTH: scores.HEALTH,
        },
        matchKey,
      })
      navigate('/discover')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const SCALE_LABELS = ['Strongly\nDisagree', 'Disagree', 'Neutral', 'Agree', 'Strongly\nAgree']

  const CAT_LABELS: Record<string, { label: string; color: string }> = {
    TECH:   { label: 'Technology',          color: 'var(--neon-green)' },
    DESIGN: { label: 'Design',              color: 'var(--saffron)' },
    ART:    { label: 'Arts & Creative',     color: '#FF6B9D' },
    SCI:    { label: 'Science & Research',  color: '#00BFFF' },
    HUM:    { label: 'Humanities',          color: '#C9A84C' },
    WRITE:  { label: 'Writing',             color: 'var(--white-pure)' },
    COM:    { label: 'Commerce & Business', color: '#7B68EE' },
    HEALTH: { label: 'Health & Wellness',   color: '#00CBA4' },
  }

  return (
    <div className="assess-page">
      <style>{`
        .assess-page { max-width: 760px; margin: 0 auto; padding: 40px 24px 80px; }
        .assess-header { margin-bottom: 40px; text-align: center; }
        .assess-label { font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: var(--neon-green); margin-bottom: 12px; opacity: 0.8; }
        .assess-title { font-family: 'Orbitron', sans-serif; font-weight: 700; font-size: clamp(20px, 3vw, 28px); letter-spacing: 4px; color: var(--neon-white); margin-bottom: 12px; }
        .assess-sub { font-size: 14px; color: var(--text-dim); line-height: 1.6; }
        .progress-bar-wrap { margin: 24px 0; background: rgba(255,255,255,0.06); border: 1px solid rgba(0,255,65,0.12); height: 6px; border-radius: 3px; overflow: hidden; }
        .progress-bar-fill { height: 100%; background: linear-gradient(90deg, var(--neon-green), #00BFFF); transition: width 0.3s ease; border-radius: 3px; }
        .progress-text { font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 2px; color: var(--text-dim); text-align: right; margin-top: 6px; }
        .dim-section-header { margin: 36px 0 16px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .dim-section-label { font-family: 'Share Tech Mono', monospace; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; }
        .questions-list { display: flex; flex-direction: column; gap: 20px; }
        .question-card { padding: 24px; background: rgba(13,13,26,0.6); border: 1px solid rgba(0,255,65,0.08); transition: border-color 0.3s; }
        .question-card.answered { border-color: rgba(0,255,65,0.22); }
        .question-num { font-family: 'Share Tech Mono', monospace; font-size: 10px; letter-spacing: 2px; color: var(--text-dim); margin-bottom: 10px; }
        .question-text { font-family: 'Rajdhani', sans-serif; font-size: 16px; color: var(--neon-white); margin-bottom: 20px; line-height: 1.5; }
        .scale-row { display: flex; gap: 8px; justify-content: space-between; align-items: flex-start; }
        .scale-option { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; }
        .scale-option input[type="radio"] { display: none; }
        .scale-dot { width: 36px; height: 36px; border-radius: 50%; border: 2px solid rgba(0,255,65,0.2); background: transparent; transition: all 0.2s; display: flex; align-items: center; justify-content: center; font-family: 'Share Tech Mono', monospace; font-size: 12px; color: var(--text-dim); }
        .scale-option:hover .scale-dot { border-color: var(--neon-green); color: var(--neon-green); }
        .scale-option input:checked ~ .scale-dot { background: var(--neon-green); border-color: var(--neon-green); color: var(--bg-dark); box-shadow: 0 0 12px rgba(0,255,65,0.35); }
        .scale-label-text { font-family: 'Share Tech Mono', monospace; font-size: 9px; letter-spacing: 0.5px; color: var(--text-dim); text-align: center; white-space: pre-line; line-height: 1.3; }
        .assess-submit-row { margin-top: 48px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .assess-error { font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 1px; color: #ff4444; text-align: center; }
        .assess-submit-btn { display: inline-flex; align-items: center; gap: 12px; padding: 16px 48px; font-family: 'Orbitron', sans-serif; font-weight: 700; font-size: 14px; letter-spacing: 4px; text-transform: uppercase; color: var(--bg-dark); background: linear-gradient(135deg, var(--neon-green), #00BFFF); border: none; cursor: pointer; clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px)); transition: all 0.3s; }
        .assess-submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .assess-submit-btn:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 0 24px rgba(0,255,65,0.3); }
        @media (max-width: 600px) { .scale-dot { width: 28px; height: 28px; font-size: 10px; } .scale-label-text { font-size: 8px; } }
      `}</style>

      <div className="assess-header">
        <p className="assess-label">// SECTION_03 — OCCUPATION</p>
        <h1 className="assess-title">INTERESTS & OCCUPATION</h1>
        <p className="assess-sub">
          30 questions · 8 categories · ~8 minutes<br />
          Answer based on what genuinely interests and energises you.
        </p>
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="progress-text">{answered} / {total} ANSWERED</p>
      </div>

      <div className="questions-list">
        {OCCUPATION_QUESTIONS.map((q, idx) => {
          const prevCat = idx > 0 ? OCCUPATION_QUESTIONS[idx - 1].category : null
          const showHeader = q.category !== prevCat
          const catInfo = CAT_LABELS[q.category]

          return (
            <div key={q.id}>
              {showHeader && (
                <div className="dim-section-header">
                  <span className="dim-section-label" style={{ color: catInfo.color }}>
                    {catInfo.label} questions
                  </span>
                </div>
              )}
              <div className={`question-card${answers[q.id] !== undefined ? ' answered' : ''}`}>
                <p className="question-num">Q{String(idx + 1).padStart(2, '0')} — {q.category}</p>
                <p className="question-text">{q.text}</p>
                <div className="scale-row">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <label key={val} className="scale-option">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={val}
                        checked={answers[q.id] === val}
                        onChange={() => handleAnswer(q.id, val)}
                      />
                      <div className="scale-dot">{val}</div>
                      <span className="scale-label-text">{SCALE_LABELS[val - 1]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="assess-submit-row">
        {error && <p className="assess-error">{error}</p>}
        <button
          className="assess-submit-btn"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'CALCULATING...' : 'GET MY RESULT ➔'}
        </button>
        {!allAnswered && (
          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '1px' }}>
            {total - answered} question{total - answered !== 1 ? 's' : ''} remaining
          </p>
        )}
      </div>
    </div>
  )
}
