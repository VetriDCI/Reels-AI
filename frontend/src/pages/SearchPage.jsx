import React, { useState } from 'react';
import { Search, User, FileText, Hash } from 'lucide-react';
import api from '../services/api';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const handleSearch = async () => {
    if (!query) return;

    setLoading(true);
    try {
      const response = await api.get(`/search?query=${query}&type=${activeTab}`);
      setResults(response.data.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'All', icon: Search },
    { id: 'users', label: 'Users', icon: User },
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'hashtags', label: 'Hashtags', icon: Hash }
  ];

  return (
    <div className="pt-6 px-4 min-h-screen">
      <div className="flex items-center space-x-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search users, posts, hashtags..."
            className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !query}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold disabled:opacity-50"
        >
          Search
        </button>
      </div>

      <div className="flex items-center space-x-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap ${
              activeTab === tab.id ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Searching...</p>
        </div>
      )}

      {results && !loading && (
        <div className="space-y-6">
          {(activeTab === 'all' || activeTab === 'users') && results.users && results.users.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Users</h3>
              <div className="space-y-3">
                {results.users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                    <img src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.username} className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <h4 className="font-semibold">{user.fullName || user.username}</h4>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                      {user.bio && <p className="text-sm text-gray-600 truncate">{user.bio}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'posts') && results.posts && results.posts.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Posts</h3>
              <div className="space-y-4">
                {results.posts.map((post) => (
                  <div key={post.id} className="p-4 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center space-x-3 mb-2">
                      <img src={post.user.avatarUrl || `https://i.pravatar.cc/150?u=${post.user.id}`} alt={post.user.username} className="w-8 h-8 rounded-full" />
                      <div>
                        <p className="font-semibold text-sm">{post.user.fullName || post.user.username}</p>
                        <p className="text-xs text-gray-500">@{post.user.username}</p>
                      </div>
                    </div>
                    <p className="text-gray-800">{post.content}</p>
                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                      <span>❤️ {post.likesCount}</span>
                      <span>💬 {post.commentsCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'hashtags') && results.hashtags && results.hashtags.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Hashtags</h3>
              <div className="flex flex-wrap gap-2">
                {results.hashtags.map((tag) => (
                  <div key={tag.id} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full">
                    <span className="font-medium">#{tag.name}</span>
                    <span className="text-sm ml-2">({tag.postsCount} posts)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'all' && !results.users?.length && !results.posts?.length && !results.hashtags?.length && (
            <div className="text-center py-20">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700">No results found</h3>
              <p className="text-gray-500 mt-2">Try searching for something else</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchPage;