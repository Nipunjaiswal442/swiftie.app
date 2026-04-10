import { Navigate } from 'react-router-dom'
import { useConvexAuth } from 'convex/react'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const { isLoading, isAuthenticated } = useConvexAuth()

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">SWIFTIE</div>
        <div className="loading-bar" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
