import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Home, Film, Plus, Sparkles, MessageCircle, User, Search, Bell, Send } from 'lucide-react';
import { postAPI, aiAPI } from './services/api';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import OtpVerificationPage from './pages/OtpVerificationPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SearchPage from './pages/SearchPage';
import NotificationsPage from './pages/NotificationsPage';
import ChatPage from './pages/ChatPage';
import ReelsPage from './pages/ReelsPage';
import MePage from './pages/MePage';
import { applyInterfacePrefs } from './pages/settings/InterfaceAccessibilityPage';

// Components
import CreatePostModal from './components/CreatePostModal';
import PostCard from './components/PostCard';
import InstallPrompt from './components/InstallPrompt';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [posts, setPosts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [feedRefresh, setFeedRefresh] = useState(0);
  const [reelTarget, setReelTarget] = useState(null);

  const openReel = (post) => {
    setReelTarget(post);
    setActiveTab('reels');
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ra_social_interface'));
      if (saved) applyInterfacePrefs(saved);
    } catch {
      /* no saved prefs yet */
    }
  }, []);

  useEffect(() => {
    const postId = new URLSearchParams(window.location.search).get('post');
    if (postId) {
      setReelTarget({ id: postId });
      setActiveTab('reels');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<OtpVerificationPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const isFullScreenTab = activeTab === 'reels' || activeTab === 'me';
  const hideTopBar = isFullScreenTab || activeTab === 'search';

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideTopBar && (
        <TopBar
          logout={logout}
          onNotifications={() => setActiveTab('notifications')}
          onSearch={() => setActiveTab('search')}
          onProfile={() => setActiveTab('me')}
        />
      )}

      <main className={isFullScreenTab ? '' : 'pb-20'}>
        {activeTab === 'home' && <HomeFeed posts={posts} setPosts={setPosts} refreshKey={feedRefresh} onOpenReel={openReel} />}
        {activeTab === 'reels' && <ReelsPage onNotifications={() => setActiveTab('notifications')} onSearch={() => setActiveTab('search')} initialPostId={reelTarget?.id} />}
        {activeTab === 'ai' && <AIChatFeature />}
        {activeTab === 'chat' && <ChatPage />}
        {activeTab === 'me' && <MePage onLogout={logout} onBack={() => setActiveTab('home')} />}
        {activeTab === 'notifications' && <NotificationsPage />}
        {activeTab === 'search' && <SearchPage />}
      </main>

      {showCreateModal && (
        <CreatePostModal onClose={() => setShowCreateModal(false)} onPostCreated={() => setFeedRefresh((prev) => prev + 1)} />
      )}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} setShowCreateModal={setShowCreateModal} isFullScreenTab={isFullScreenTab} />
      <InstallPrompt />
    </div>
  );
}

function TopBar({ logout, onNotifications, onSearch, onProfile }) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onSearch} className="relative flex-1 text-left" aria-label="Search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <span className="block w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm text-gray-500">Search</span>
        </button>
        <button onClick={onNotifications} aria-label="Notifications" className="relative p-2 hover:bg-gray-100 rounded-full shrink-0">
          <Bell className="w-6 h-6 text-gray-700" />
        </button>
        <button onClick={onProfile} aria-label="My Profile" className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0">
          <User className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

function BottomNav({ activeTab, setActiveTab, setShowCreateModal, isFullScreenTab }) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'reels', icon: Film, label: 'Reels' },
    { id: 'create', icon: Plus, label: 'Create', isSpecial: true },
    { id: 'ai', icon: Sparkles, label: 'AI' },
    { id: 'chat', icon: MessageCircle, label: 'Chat' }
  ];

  const handleNavClick = (itemId) => {
    if (itemId === 'create') {
      setShowCreateModal(true);
    } else {
      setActiveTab(itemId);
    }
  };

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 ${isFullScreenTab ? 'bg-black/40 backdrop-blur-sm' : 'bg-white border-t border-gray-200'}`}>
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`flex flex-col items-center p-2 ${
              item.isSpecial 
                ? 'bg-gradient-to-r from-pink-500 to-blue-500 rounded-full p-3 -mt-4 shadow-lg' 
                : activeTab === item.id 
                  ? (isFullScreenTab ? 'text-white' : 'text-pink-600')
                  : (isFullScreenTab ? 'text-gray-300' : 'text-gray-500')
            }`}
          >
            <item.icon className={`w-6 h-6 ${item.isSpecial ? 'text-white' : ''}`} />
            {!item.isSpecial && <span className="text-xs mt-1">{item.label}</span>}
          </button>
        ))}
      </div>
    </nav>
  );
}

function HomeFeed({ posts, setPosts, refreshKey, onOpenReel }) {
  const fetchPosts = async () => {
    try {
      const response = await postAPI.getFeed();
      setPosts(response.data.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [refreshKey]);

  const handleLike = async (postId) => {
    try {
      await postAPI.like(postId);
      fetchPosts();
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  return (
    <div className="pt-20 px-4 space-y-4">
      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500">No posts yet. Be the first to post!</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} onLike={() => handleLike(post.id)} onOpenReel={onOpenReel} />
        ))
      )}
    </div>
  );
}

function AIChatFeature() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Vanakkam! I'm Super AI ✨ Ask me for reel ideas, Tamil captions, or growth tips." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const suggestions = ['Create viral reel idea', 'Tamil caption for my post', 'Trending hashtags', 'Growth tips'];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setInput('');
    setLoading(true);
    try {
      const res = await aiAPI.chat({ message: msg });
      setMessages((prev) => [...prev, { role: 'ai', text: res.data.data.response }]);
    } catch (err) {
      const detail = err.response?.data?.message || 'Please try again in a moment.';
      setMessages((prev) => [...prev, { role: 'ai', text: `⚠️ Sorry, I couldn't respond. ${detail}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-16 pb-4 flex flex-col h-screen bg-gradient-to-b from-pink-50 to-blue-50">
      <div className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-4 py-3 flex items-center gap-2 fixed top-0 left-0 right-0 z-40">
        <Sparkles className="w-5 h-5" />
        <span className="font-bold">Super AI</span>
        <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded-full">● Online</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-br-sm'
                  : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-400 px-4 py-3 rounded-2xl shadow-sm text-sm">Typing...</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="px-3 py-2 bg-white border border-pink-200 rounded-full text-xs font-medium text-pink-600"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="px-4 pb-24 pt-2">
        <div className="flex items-center gap-2 bg-white rounded-full shadow-sm px-4 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask Super AI..."
            className="flex-1 outline-none text-sm"
          />
          <button onClick={() => sendMessage()} disabled={loading} className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 flex items-center justify-center">
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;