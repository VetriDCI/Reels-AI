import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Home, Film, Plus, Sparkles, MessageCircle, User, Search, Bell, X, Heart, MessageSquare, Share2, MoreHorizontal } from 'lucide-react';
import { postAPI, aiAPI } from './services/api';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import NotificationsPage from './pages/NotificationsPage';
import ChatPage from './pages/ChatPage';

// Components
import CreatePostModal from './components/CreatePostModal';
import PostCard from './components/PostCard';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [posts, setPosts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [feedRefresh, setFeedRefresh] = useState(0);


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
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar logout={logout} />
      
      <main className="pb-20">
        {activeTab === 'home' && <HomeFeed posts={posts} setPosts={setPosts} refreshKey={feedRefresh} />}
        {activeTab === 'reels' && <ReelsFeed />}
        {activeTab === 'ai' && <AIFeatures />}
        {activeTab === 'chat' && <ChatPage />}
        {activeTab === 'me' && <ProfilePage />}
      </main>

      {showCreateModal && (
        <CreatePostModal onClose={() => setShowCreateModal(false)} onPostCreated={() => setFeedRefresh((prev) => prev + 1)} />
      )}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} setShowCreateModal={setShowCreateModal} />
    </div>
  );
}

function TopBar({ logout }) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">RA</span>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            RA Social
          </h1>
        </div>

        <div className="flex-1 mx-4 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search posts, users, hashtags..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button className="relative p-2 hover:bg-gray-100 rounded-full">
            <Bell className="w-6 h-6 text-gray-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button onClick={logout} className="text-sm text-gray-600 hover:text-red-600">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

function BottomNav({ activeTab, setActiveTab, setShowCreateModal }) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'reels', icon: Film, label: 'Reels' },
    { id: 'create', icon: Plus, label: 'Create', isSpecial: true },
    { id: 'ai', icon: Sparkles, label: 'AI' },
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
    { id: 'me', icon: User, label: 'Me' }
  ];

  const handleNavClick = (itemId) => {
    if (itemId === 'create') {
      setShowCreateModal(true);
    } else {
      setActiveTab(itemId);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`flex flex-col items-center p-2 ${
              item.isSpecial 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-3 -mt-4 shadow-lg' 
                : activeTab === item.id 
                  ? 'text-purple-600' 
                  : 'text-gray-500'
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

function HomeFeed({ posts, setPosts, refreshKey }) {
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
          <PostCard key={post.id} post={post} onLike={() => handleLike(post.id)} />
        ))
      )}
    </div>
  );
}

function ReelsFeed() {
  return (
    <div className="pt-20 px-4">
      <div className="text-center py-20">
        <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Reels Coming Soon</h2>
        <p className="text-gray-500 mt-2">Start creating short videos!</p>
      </div>
    </div>
  );
}

function AIFeatures() {
  const [activeFeature, setActiveFeature] = useState(null);
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const features = [
    { id: 'caption', name: 'AI Caption', icon: Sparkles, color: 'from-purple-500 to-pink-500', description: 'Generate catchy captions' },
    { id: 'translate', name: 'AI Translate', icon: Sparkles, color: 'from-blue-500 to-cyan-500', description: 'Translate to any language' },
    { id: 'moderate', name: 'Content Safety', icon: Sparkles, color: 'from-green-500 to-emerald-500', description: 'Check content guidelines' },
    { id: 'chat', name: 'AI Assistant', icon: Sparkles, color: 'from-orange-500 to-red-500', description: 'Chat with AI helper' }
  ];

  const handleSubmit = async () => {
    if (!inputText) return;
    
    setLoading(true);
    try {
      let response;
      
      switch (activeFeature) {
        case 'caption':
          response = await aiAPI.generateCaption({ context: inputText });
          setResult(response.data.data.caption);
          break;
        case 'translate':
          response = await aiAPI.translate({ text: inputText, targetLanguage: 'ta' });
          setResult(response.data.data.translatedText);
          break;
        case 'moderate':
          response = await aiAPI.moderate({ content: inputText });
          setResult(response.data.data.isSafe ? '✅ Safe to post' : '⚠️ ' + response.data.data.reason);
          break;
        case 'chat':
          response = await aiAPI.chat({ message: inputText });
          setResult(response.data.data.response);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('AI feature error:', error);
      setResult('Failed to process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 px-4 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Features</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        {features.map((feature) => (
          <button
            key={feature.id}
            onClick={() => setActiveFeature(feature.id)}
            className={`bg-gradient-to-br ${feature.color} rounded-xl p-6 text-white text-left transition-transform hover:scale-105`}
          >
            <feature.icon className="w-8 h-8 mb-3" />
            <h3 className="font-semibold text-lg">{feature.name}</h3>
            <p className="text-sm opacity-90 mt-1">{feature.description}</p>
          </button>
        ))}
      </div>

      {activeFeature && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-semibold mb-4">{features.find(f => f.id === activeFeature)?.name}</h3>
          
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter your text here..."
            className="w-full h-32 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          
          <button
            onClick={handleSubmit}
            disabled={loading || !inputText}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Generate'}
          </button>

          {result && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Result:</h4>
              <p className="text-gray-700">{result}</p>
            </div>
          )}
        </div>
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