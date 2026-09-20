import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Home, Film, Plus, Sparkles, MessageCircle, User, Search, Bell } from 'lucide-react';
import { postAPI, notificationAPI } from './services/api';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import OtpVerificationPage from './pages/OtpVerificationPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import TwoFactorLoginPage from './pages/TwoFactorLoginPage';
import SearchPage from './pages/SearchPage';
import PublicProfilePage from './pages/PublicProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import ChatPage from './pages/ChatPage';
import ReelsPage from './pages/ReelsPage';
import AIFeatures from './pages/AIFeatures';
import MePage from './pages/MePage';
import SavedPostsPage from './pages/SavedPostsPage';
import DraftsPage from './pages/DraftsPage';
import HashtagPage from './pages/HashtagPage';
import ReportHistoryPage from './pages/ReportHistoryPage';
import WatchHistoryPage from './pages/WatchHistoryPage';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSource, setSearchSource] = useState('home');
  const [publicProfileId, setPublicProfileId] = useState(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [savedReturnTab, setSavedReturnTab] = useState('me');
  const [draftToEdit, setDraftToEdit] = useState(null);
  const [hashtagName, setHashtagName] = useState('');
  const [reportHistory, setReportHistory] = useState(false);
  const historyReadyRef = useRef(false);
  const suppressHistoryRef = useRef(false);

  // Keep the app's tab navigation in the browser history so Android/iOS
  // hardware back returns to the previous in-app screen instead of leaving
  // the SPA.
  const navigateTab = (nextTab, options = {}) => {
    const tab = nextTab || 'home';
    setActiveTab(tab);
    if (!historyReadyRef.current) return;
    if (options.replace) {
      window.history.replaceState({ ...(window.history.state || {}), raTab: tab }, '', window.location.href);
    } else if (!suppressHistoryRef.current) {
      window.history.pushState({ ...(window.history.state || {}), raTab: tab }, '', window.location.href);
    }
  };

  useEffect(() => {
    const initial = window.history.state?.raTab || 'home';
    window.history.replaceState({ ...(window.history.state || {}), raTab: initial }, '', window.location.href);
    historyReadyRef.current = true;
    const onPopState = (event) => {
      const previous = event.state?.raTab || 'home';
      suppressHistoryRef.current = true;
      setShowCreateModal(false);
      setDraftToEdit(null);
      setActiveTab(previous);
      window.setTimeout(() => { suppressHistoryRef.current = false; }, 0);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!historyReadyRef.current || suppressHistoryRef.current) return;
    const current = window.history.state?.raTab;
    if (current !== activeTab) {
      window.history.pushState({ ...(window.history.state || {}), raTab: activeTab }, '', window.location.href);
    }
  }, [activeTab]);

  const openSearch = (query = '') => {
    setSearchSource(activeTab === 'search' ? 'home' : activeTab);
    setSearchQuery(query.trim());
    navigateTab('search');
  };

  const openProfile = (id) => { setPublicProfileId(id); navigateTab('public-profile'); };

  const openHashtag = (name) => { setHashtagName(String(name || '').replace(/^#/, '')); navigateTab('hashtag'); };

  const openReel = (post) => {
    setReelTarget(post);
    navigateTab('reels');
  };

  useEffect(() => {
    const refreshUnreadNotifications = async () => {
      try {
        const response = await notificationAPI.getNotifications();
        setUnreadNotificationCount(Number(response.data?.data?.unreadCount || 0));
      } catch (error) {
        console.error('Failed to fetch notification count:', error);
      }
    };

    refreshUnreadNotifications();
    const handleNotificationUpdate = () => refreshUnreadNotifications();
    window.addEventListener('ra:notifications-updated', handleNotificationUpdate);
    const intervalId = window.setInterval(refreshUnreadNotifications, 30000);
    return () => {
      window.removeEventListener('ra:notifications-updated', handleNotificationUpdate);
      window.clearInterval(intervalId);
    };
  }, []);

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
      navigateTab('reels');
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
        <Route path="/2fa-login" element={<TwoFactorLoginPage />} />
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
          onNotifications={() => navigateTab('notifications')}
          unreadNotificationCount={unreadNotificationCount}
          onSearch={openSearch}
          onProfile={() => navigateTab('me')}
        />
      )}

      <main className={isFullScreenTab ? '' : 'pb-20'}>
        {activeTab === 'home' && <HomeFeed posts={posts} setPosts={setPosts} refreshKey={feedRefresh} onOpenReel={openReel} />}
        {activeTab === 'reels' && <ReelsPage onNotifications={() => navigateTab('notifications')} unreadNotificationCount={unreadNotificationCount} onSearch={openSearch} initialPostId={reelTarget?.id} />}
        {activeTab === 'ai' && <AIFeatures />}
        {activeTab === 'chat' && <ChatPage />}
        {activeTab === 'me' && <MePage onLogout={logout} onOpenReportHistory={() => navigateTab('report-history')} onBack={() => navigateTab('home')} onOpenDrafts={() => navigateTab('drafts')} />}
        {activeTab === 'notifications' && <NotificationsPage />}
        {activeTab === 'search' && <SearchPage initialQuery={searchQuery} onBack={() => navigateTab(searchSource || 'home')} onOpenProfile={openProfile} onOpenHashtag={openHashtag} />}
        {activeTab === 'saved' && <SavedPostsPage onBack={() => navigateTab(savedReturnTab)} />}
        {activeTab === 'drafts' && <DraftsPage userId={user?.id} onBack={() => navigateTab('me')} onEdit={(draft) => { setDraftToEdit(draft); setShowCreateModal(true); navigateTab('home'); }} />}
        {activeTab === 'report-history' && <ReportHistoryPage onBack={() => navigateTab('me')} />}
        {activeTab === 'watch-history' && <WatchHistoryPage onBack={() => navigateTab('me')} />}
        {activeTab === 'hashtag' && <HashtagPage name={hashtagName} onBack={() => navigateTab(searchSource || 'home')} onOpenReel={openReel} />}
        {activeTab === 'public-profile' && <PublicProfilePage userId={publicProfileId} onBack={() => navigateTab(searchSource || 'home')} />}
      </main>

      {showCreateModal && (
        <CreatePostModal userId={user?.id} isCreator={Boolean(user?.channelNumber)} initialDraft={draftToEdit} onClose={() => { setShowCreateModal(false); setDraftToEdit(null); }} onDraftSaved={() => {}} onPostCreated={() => setFeedRefresh((prev) => prev + 1)} />
      )}

      <BottomNav activeTab={activeTab} setActiveTab={navigateTab} setShowCreateModal={setShowCreateModal} isFullScreenTab={isFullScreenTab} />
      {activeTab === 'me' && (
        <button onClick={() => openSearch('')} aria-label="Search" className="fixed right-4 top-4 z-[70] w-11 h-11 rounded-full bg-white/95 shadow-lg border flex items-center justify-center">
          <Search className="w-5 h-5 text-gray-700" />
        </button>
      )}
      <InstallPrompt />
    </div>
  );
}

function TopBar({ logout, onNotifications, unreadNotificationCount, onSearch, onProfile }) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="shrink-0 text-left font-extrabold text-lg tracking-tight text-gray-900 whitespace-nowrap"
          aria-label="RA Social"
        >
          RA Social
        </div>
        <button onClick={onSearch} className="relative flex-1 text-left min-w-0" aria-label="Search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <span className="block w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm text-gray-500">Search</span>
        </button>
        <button onClick={onNotifications} aria-label="Notifications" className="relative p-2 hover:bg-gray-100 rounded-full shrink-0">
          <Bell className="w-6 h-6 text-gray-700" />
          {unreadNotificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] font-bold text-center ring-2 ring-white">
              {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
            </span>
          )}
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
    <div className="pt-20 px-4 pb-4 space-y-4">
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;