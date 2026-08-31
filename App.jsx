import React, { useState } from 'react';
import { Home, Film, Plus, Sparkles, MessageCircle, User, Search, Bell, Heart, MessageSquare, Share2, MoreHorizontal } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const posts = [
    {
      id: 1,
      user: {
        name: 'Dev Collective',
        username: '@devcollective',
        avatar: 'https://i.pravatar.cc/150?img=12'
      },
      content: 'Just shipped React hooks demo — watch how state management works in this 45s breakdown ↓',
      media: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      likes: 1247,
      comments: 89,
      shares: 34,
      hashtags: ['#devcollective', '#buildinpublic', '#pwa'],
      time: '2h ago'
    },
    {
      id: 2,
      user: {
        name: 'Sarah Chen',
        username: '@sarahchen',
        avatar: 'https://i.pravatar.cc/150?img=5'
      },
      content: 'Building in public day 47: Added dark mode toggle and improved performance by 40% 🚀',
      media: null,
      likes: 892,
      comments: 56,
      shares: 12,
      hashtags: ['#buildinpublic', '#webdev'],
      time: '4h ago'
    }
  ];

  const reels = [
    {
      id: 1,
      user: {
        name: 'Tech Daily',
        username: '@techdaily',
        avatar: 'https://i.pravatar.cc/150?img=8'
      },
      video: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800',
      likes: 15420,
      comments: 234,
      description: '5 VS Code extensions you need in 2026 💻',
      hashtags: ['#vscode', '#productivity']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <TopBar />

      {/* Main Content */}
      <main className="pb-20">
        {activeTab === 'home' && <HomeFeed posts={posts} />}
        {activeTab === 'reels' && <ReelsFeed reels={reels} />}
        {activeTab === 'ai' && <AIFeatures />}
        {activeTab === 'chat' && <ChatPage />}
        {activeTab === 'me' && <ProfilePage />}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <CreatePostModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Bottom Navigation */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        setShowCreateModal={setShowCreateModal}
      />
    </div>
  );
}

// Top Bar Component
function TopBar() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        {/* App Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">RA</span>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            RA Social
          </h1>
        </div>

        {/* Search Bar */}
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

        {/* Notification Bell */}
        <button className="relative p-2 hover:bg-gray-100 rounded-full">
          <Bell className="w-6 h-6 text-gray-700" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}

// Bottom Navigation Component
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
            {!item.isSpecial && (
              <span className="text-xs mt-1">{item.label}</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

// Home Feed Component
function HomeFeed({ posts }) {
  return (
    <div className="pt-20 px-4 space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

// Post Card Component
function PostCard({ post }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <img
            src={post.user.avatar}
            alt={post.user.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{post.user.name}</h3>
            <p className="text-sm text-gray-500">{post.user.username} · {post.time}</p>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <MoreHorizontal className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-800">{post.content}</p>
        {post.hashtags && (
          <div className="mt-2 flex flex-wrap gap-2">
            {post.hashtags.map((tag, index) => (
              <span key={index} className="text-purple-600 text-sm font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Post Media */}
      {post.media && (
        <div className="px-4 pb-3">
          <img
            src={post.media}
            alt="Post media"
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          <button className="flex items-center space-x-2 text-gray-600 hover:text-red-500">
            <Heart className="w-6 h-6" />
            <span className="text-sm">{post.likes}</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500">
            <MessageSquare className="w-6 h-6" />
            <span className="text-sm">{post.comments}</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-600 hover:text-green-500">
            <Share2 className="w-6 h-6" />
            <span className="text-sm">{post.shares}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Reels Feed Component
function ReelsFeed({ reels }) {
  return (
    <div className="pt-20 space-y-4">
      {reels.map((reel) => (
        <div key={reel.id} className="relative h-[70vh] bg-black">
          <img
            src={reel.video}
            alt="Reel"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center space-x-3 mb-3">
              <img
                src={reel.user.avatar}
                alt={reel.user.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h3 className="font-semibold text-white">{reel.user.name}</h3>
                <p className="text-sm text-gray-300">{reel.user.username}</p>
              </div>
            </div>
            <p className="text-white mb-2">{reel.description}</p>
            <div className="flex flex-wrap gap-2">
              {reel.hashtags.map((tag, index) => (
                <span key={index} className="text-purple-400 text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="absolute right-4 bottom-20 space-y-6">
            <button className="flex flex-col items-center text-white">
              <Heart className="w-8 h-8" />
              <span className="text-sm mt-1">{reel.likes}</span>
            </button>
            <button className="flex flex-col items-center text-white">
              <MessageSquare className="w-8 h-8" />
              <span className="text-sm mt-1">{reel.comments}</span>
            </button>
            <button className="flex flex-col items-center text-white">
              <Share2 className="w-8 h-8" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// AI Features Component
function AIFeatures() {
  return (
    <div className="pt-20 px-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Features</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white">
          <Sparkles className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">AI Caption</h3>
          <p className="text-sm opacity-90 mt-1">Generate captions</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
          <Sparkles className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">AI Edit</h3>
          <p className="text-sm opacity-90 mt-1">Enhance photos</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 text-white">
          <Sparkles className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">AI Translate</h3>
          <p className="text-sm opacity-90 mt-1">Auto translation</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white">
          <Sparkles className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">AI Insights</h3>
          <p className="text-sm opacity-90 mt-1">Analytics</p>
        </div>
      </div>
    </div>
  );
}

// Chat Page Component
function ChatPage() {
  const chats = [
    {
      id: 1,
      user: {
        name: 'Priya Sharma',
        avatar: 'https://i.pravatar.cc/150?img=9',
        lastMessage: 'Hey! Did you see the new feature?',
        time: '2m ago',
        unread: 2
      }
    },
    {
      id: 2,
      user: {
        name: 'Rahul Verma',
        avatar: 'https://i.pravatar.cc/150?img=11',
        lastMessage: 'Let\'s meet tomorrow',
        time: '1h ago',
        unread: 0
      }
    }
  ];

  return (
    <div className="pt-20 px-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Messages</h2>
      <div className="space-y-4">
        {chats.map((chat) => (
          <div key={chat.id} className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm">
            <img
              src={chat.user.avatar}
              alt={chat.user.name}
              className="w-12 h-12 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{chat.user.name}</h3>
                <span className="text-xs text-gray-500">{chat.user.time}</span>
              </div>
              <p className="text-sm text-gray-600 truncate">{chat.user.lastMessage}</p>
            </div>
            {chat.user.unread > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {chat.user.unread}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Profile Page Component
function ProfilePage() {
  return (
    <div className="pt-20 px-4">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
        <div className="flex flex-col items-center">
          <img
            src="https://i.pravatar.cc/150?img=12"
            alt="Profile"
            className="w-24 h-24 rounded-full mb-4"
          />
          <h2 className="text-xl font-bold text-gray-900">Your Name</h2>
          <p className="text-gray-500">@yourusername</p>
          <p className="text-gray-600 mt-2 text-center">
            Educator | Developer | Building in public 🚀
          </p>
          <div className="flex items-center space-x-6 mt-4">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">247</p>
              <p className="text-sm text-gray-500">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">12.5K</p>
              <p className="text-sm text-gray-500">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">892</p>
              <p className="text-sm text-gray-500">Following</p>
            </div>
          </div>
          <button className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold">
            Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}

// Create Post Modal Component
function CreatePostModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <button onClick={onClose} className="text-gray-600">Cancel</button>
          <h2 className="font-semibold">Create Post</h2>
          <button className="text-purple-600 font-semibold">Post</button>
        </div>
        <div className="p-4 space-y-4">
          <textarea
            placeholder="What's on your mind?"
            className="w-full h-32 resize-none focus:outline-none text-gray-800"
          />
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 text-purple-600">
              <Film className="w-6 h-6" />
              <span>Reel</span>
            </button>
            <button className="flex items-center space-x-2 text-purple-600">
              <Sparkles className="w-6 h-6" />
              <span>AI Caption</span>
            </button>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-600">Tap to add a title for your live stream...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;