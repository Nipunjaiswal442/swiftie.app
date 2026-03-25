import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, PlusSquare, Bell, User } from 'lucide-react';
import Landing from './pages/Landing';
import Feed from './pages/Feed';
import Explore from './pages/Explore';
import PostDrop from './pages/PostDrop';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import { useState } from 'react';
import { initialPosts, initialProfile, initialUsers, initialNotifications } from './store';

function AppContent() {
  const [posts, setPosts] = useState(initialPosts);
  const [users, setUsers] = useState(initialUsers);
  const [profile] = useState(initialProfile);
  const [notifications] = useState(initialNotifications);
  const location = useLocation();

  const isLanding = location.pathname === '/';

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/feed" element={<Feed posts={posts} />} />
        <Route path="/explore" element={<Explore users={users} setUsers={setUsers} />} />
        <Route path="/drop" element={<PostDrop profile={profile} addPost={(newPost) => setPosts([newPost, ...posts])} />} />
        <Route path="/activity" element={<Notifications notifications={notifications} />} />
        <Route path="/profile" element={<Profile profile={profile} myPosts={posts.filter(p => p.author.name === profile.name)} />} />
      </Routes>
      
      {!isLanding && (
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
