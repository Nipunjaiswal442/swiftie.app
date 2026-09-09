import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConvexProviderWithAuth, ConvexReactClient, useConvexAuth, useQuery } from 'convex/react'
import { useFirebaseAuth } from './useFirebaseAuth'
import { api } from '../convex/_generated/api'
import { applyAppearance, loadLocalAppearance, normalizeAppearance, saveLocalAppearance } from './appearance'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Feed from './pages/Feed'
import Chat from './pages/Chat'
import ChatThread from './pages/ChatThread'
import Profile from './pages/Profile'
import MayaChat from './pages/MayaChat'
import Discover from './pages/Discover'
import AssessPersonality from './pages/AssessPersonality'
import AssessIdeology from './pages/AssessIdeology'
import AssessOccupation from './pages/AssessOccupation'
import CommunityChatThread from './pages/CommunityChatThread'
import CommunityPage from './pages/CommunityPage'
import Explore from './pages/Explore'
import ApplyToCommunity from './pages/ApplyToCommunity'
import CreateCommunity from './pages/CreateCommunity'
import Settings from './pages/Settings'
import AdminLogin from './pages/AdminLogin'
import AdminConsole from './pages/AdminConsole'

import Nav from './components/Nav'
import ProtectedRoute from './components/ProtectedRoute'
import PresenceBeacon from './components/PresenceBeacon'

import './theme.css'
import './pages/Landing.css'

// Public deployment URL — safe to hardcode as fallback
const convex = new ConvexReactClient(
  import.meta.env.VITE_CONVEX_URL ?? 'https://adamant-quail-564.convex.cloud'
)

/**
 * Applies the saved appearance (palette / text size / font / motion) on load,
 * then keeps it in sync with the signed-in user's saved preferences.
 */
function AppearanceSync() {
  const { isAuthenticated } = useConvexAuth()
  const me = useQuery(api.users.getMe, isAuthenticated ? {} : 'skip')
  const serverPrefs = JSON.stringify(me?.prefs ?? null)

  useEffect(() => {
    applyAppearance(loadLocalAppearance())
  }, [])

  useEffect(() => {
    if (!me?.prefs) return
    const next = normalizeAppearance(me.prefs)
    applyAppearance(next)
    saveLocalAppearance(next)
  }, [serverPrefs]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="grid-bg" />
      <div className="scanlines" />
      <div className="ambient-glow" />
      <PresenceBeacon />
      <Nav />
      <div className="app-layout">
        {children}
      </div>
    </>
  )
}

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Profile is created before anything else is reachable */}
        <Route path="/onboarding" element={
          <ProtectedRoute allowIncompleteProfile><AppLayout><Onboarding /></AppLayout></ProtectedRoute>
        } />
        <Route path="/feed" element={
          <ProtectedRoute><AppLayout><Feed /></AppLayout></ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute><AppLayout><Chat /></AppLayout></ProtectedRoute>
        } />
        <Route path="/chat/:id" element={
          <ProtectedRoute><AppLayout><ChatThread /></AppLayout></ProtectedRoute>
        } />
        <Route path="/chat/community/:slug" element={
          <ProtectedRoute><AppLayout><CommunityChatThread /></AppLayout></ProtectedRoute>
        } />
        <Route path="/profile/:username" element={
          <ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>
        } />
        <Route path="/maya" element={
          <ProtectedRoute><AppLayout><MayaChat /></AppLayout></ProtectedRoute>
        } />
        <Route path="/discover" element={
          <ProtectedRoute><AppLayout><Discover /></AppLayout></ProtectedRoute>
        } />
        <Route path="/assess/personality" element={
          <ProtectedRoute><AppLayout><AssessPersonality /></AppLayout></ProtectedRoute>
        } />
        <Route path="/assess/ideology" element={
          <ProtectedRoute><AppLayout><AssessIdeology /></AppLayout></ProtectedRoute>
        } />
        <Route path="/assess/occupation" element={
          <ProtectedRoute><AppLayout><AssessOccupation /></AppLayout></ProtectedRoute>
        } />
        <Route path="/community/:slug" element={
          <ProtectedRoute><AppLayout><CommunityPage /></AppLayout></ProtectedRoute>
        } />
        <Route path="/explore" element={
          <ProtectedRoute><AppLayout><Explore /></AppLayout></ProtectedRoute>
        } />
        <Route path="/explore/apply/:slug" element={
          <ProtectedRoute><AppLayout><ApplyToCommunity /></AppLayout></ProtectedRoute>
        } />
        <Route path="/community/create" element={
          <ProtectedRoute><AppLayout><CreateCommunity /></AppLayout></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>
        } />

        {/* Admin console — its own ID/password login, independent of Google sign-in */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/console" element={<AdminConsole />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useFirebaseAuth}>
      <AppearanceSync />
      <Router />
    </ConvexProviderWithAuth>
  )
}
