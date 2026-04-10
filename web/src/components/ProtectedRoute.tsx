import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const { token, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">SWIFTIE</div>
        <div className="loading-bar" />
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
