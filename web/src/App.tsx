import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { exchangeFirebaseToken, getMe } from './api'
import { useAuthStore } from './store/authStore'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Feed from './pages/Feed'
import Chat from './pages/Chat'
import ChatThread from './pages/ChatThread'
import Profile from './pages/Profile'

import Nav from './components/Nav'
import ProtectedRoute from './components/ProtectedRoute'

import './theme.css'
import './pages/Landing.css'

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="grid-bg" />
      <div className="scanlines" />
      <div className="ambient-glow" />
      <Nav />
      <div className="app-layout">
        {children}
      </div>
    </>
  )
}

export default function App() {
  const { setUser, setToken, setLoading, token } = useAuthStore()

  // Sync Firebase auth state on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // We already have a JWT — just fetch profile
        if (token) {
          try {
            const { data } = await getMe()
            setUser(data)
          } catch {
            // JWT expired — re-exchange
            try {
              const idToken = await firebaseUser.getIdToken(true)
              const { data } = await exchangeFirebaseToken(idToken)
              setToken(data.token)
              setUser(data.user)
            } catch {
              setToken(null)
              setUser(null)
            }
          }
        }
      } else {
        setToken(null)
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Protected app routes — wrapped in AppLayout with Nav */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Onboarding />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Feed />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Chat />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ChatThread />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:username"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Profile />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
