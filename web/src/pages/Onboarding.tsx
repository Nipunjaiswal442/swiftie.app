import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import ProfileForm from '../components/ProfileForm'

/**
 * Step one after signing in: create the profile. Everything else (feed,
 * communities, assessments) is gated on this in ProtectedRoute, and every
 * assessment result is added to this profile automatically.
 */
export default function Onboarding() {
  const navigate = useNavigate()
  const location = useLocation()
  const me = useQuery(api.users.getMe)

  const from = (location.state as { from?: string } | null)?.from
  const destination = from && from !== '/onboarding' && from !== '/feed' ? from : '/discover'
  const hasProfile = !!me?.username

  if (me === undefined || me === null) {
    return (
      <div className="onboarding-container">
        <div className="loading-bar" />
      </div>
    )
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <p className="section-label visible" style={{ marginBottom: '8px' }}>
          {hasProfile ? '// UPDATE YOUR IDENTITY' : '// SETUP YOUR IDENTITY'}
        </p>
        <h2 className="onboarding-title">{hasProfile ? 'EDIT PROFILE' : 'INITIALIZE PROFILE'}</h2>
        <p className="onboarding-sub">
          {hasProfile
            ? 'Update your handle and presence on Swiftie.'
            : 'Choose your handle first — your assessment results will be added to this profile automatically.'}
        </p>

        <ProfileForm
          me={me}
          mode={hasProfile ? 'edit' : 'create'}
          submitLabel={hasProfile ? 'SAVE PROFILE' : 'ENTER SWIFTIE'}
          onSaved={() => navigate(hasProfile ? `/profile/${me.username}` : destination, { replace: true })}
        />
      </div>
    </div>
  )
}
