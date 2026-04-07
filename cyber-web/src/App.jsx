import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { Home, Compass, PlusSquare, Bell, User, MessageSquare } from 'lucide-react';
import Landing from './pages/Landing';
import Feed from './pages/Feed';
import Explore from './pages/Explore';
import PostDrop from './pages/PostDrop';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Chat from './pages/Chat';

/** Route guard: redirects to landing if no JWT token is present */
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('swiftie_token');
  return token ? children : <Navigate to="/" replace />;
}

function AppContent() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isChat = location.pathname.startsWith('/chat/');

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
        <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
        <Route path="/drop" element={<ProtectedRoute><PostDrop /></ProtectedRoute>} />
        <Route path="/activity" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/chat/:conversationId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!isLanding && !isChat && (
        <nav className="bottom-nav">
          <NavLink to="/feed" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <Home /> <span>Feed</span>
          </NavLink>
          <NavLink to="/explore" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <Compass /> <span>Explore</span>
          </NavLink>
          <NavLink to="/drop" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <PlusSquare /> <span>Drop</span>
          </NavLink>
          <NavLink to="/messages" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <MessageSquare /> <span>Chat</span>
          </NavLink>
          <NavLink to="/activity" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <Bell /> <span>Activity</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <User /> <span>Profile</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
