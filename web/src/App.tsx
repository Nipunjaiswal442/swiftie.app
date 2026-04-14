import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react'
import { useFirebaseAuth } from './useFirebaseAuth'

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
import CommunityPage from './pages/CommunityPage'

import Nav from './components/Nav'
import ProtectedRoute from './components/ProtectedRoute'

import './theme.css'
import './pages/Landing.css'

// Public deployment URL — safe to hardcode as fallback
const convex = new ConvexReactClient(
  import.meta.env.VITE_CONVEX_URL ?? 'https://adamant-quail-564.convex.cloud'
)

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

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        <Route path="/onboarding" element={
          <ProtectedRoute><AppLayout><Onboarding /></AppLayout></ProtectedRoute>
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
        <Route path="/community/:slug" element={
          <ProtectedRoute><AppLayout><CommunityPage /></AppLayout></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useFirebaseAuth}>
      <Router />
    </ConvexProviderWithAuth>
  )
}
