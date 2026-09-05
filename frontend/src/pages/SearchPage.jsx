import React, { useState } from 'react';
import { Search, User, FileText, Hash, X } from 'lucide-react';
import api from '../services/api';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const handleSearch = async (requestedTab = activeTab) => {
    const q = query.trim();
    if (!q) { setResults(null); return; }
    setLoading(true);
    try {
      const response = await api.get(`/search?query=${encodeURIComponent(q)}&type=${requestedTab}`);
      setResults(response.data.data || {});
    } catch (error) {
      console.error('Search failed:', error);
      setResults({ users: [], posts: [], hashtags: [] });
    } finally { setLoading(false); }
  };

  const clearSearch = () => { setQuery(''); setResults(null); };

  const tabs = [
    { id: 'all', label: 'All', icon: Search },
    { id: 'users', label: 'Users', icon: User },
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'hashtags', label: 'Hashtags', icon: Hash }
  ];

  const hasQuery = Boolean(query.trim());

  return (
    <div className="pt-6 px-4 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search"
              className="w-full pl-10 pr-10 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {query && <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-label="Clear search"><X className="w-5 h-5" /></button>}
          </div>
          <button onClick={handleSearch} disabled={loading || !hasQuery} className="px-5 py-3 bg-purple-600 text-white rounded-full font-semibold disabled:opacity-40">
            {loading ? '...' : 'Search'}
          </button>
        </div>

        {hasQuery && (
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); handleSearch(tab.id); }} className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap ${activeTab === tab.id ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                <tab.icon className="w-4 h-4" /><span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {loading && <div className="text-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto" /></div>}

        {results && !loading && (
          <div className="space-y-6 mt-5">
            {(activeTab === 'all' || activeTab === 'users') && results.users?.length > 0 && (
              <section><h3 className="font-semibold text-lg mb-3">Users</h3><div className="space-y-2">
                {results.users.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                    <img src={u.avatarUrl || `https://i.pravatar.cc/150?u=${u.id}`} alt="" className="w-11 h-11 rounded-full object-cover" />
                    <div className="min-w-0 flex-1"><h4 className="font-semibold truncate">{u.fullName || u.username}</h4><p className="text-sm text-gray-500">@{u.username}</p></div>
                  </div>
                ))}
              </div></section>
            )}

            {(activeTab === 'all' || activeTab === 'posts') && results.posts?.length > 0 && (
              <section><h3 className="font-semibold text-lg mb-3">Posts</h3><div className="space-y-4">
                {results.posts.map(post => (
                  <div key={post.id} className="p-4 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center gap-3 mb-2"><img src={post.user?.avatarUrl || `https://i.pravatar.cc/150?u=${post.user?.id}`} alt="" className="w-8 h-8 rounded-full" /><div><p className="font-semibold text-sm">{post.user?.fullName || post.user?.username}</p><p className="text-xs text-gray-500">@{post.user?.username}</p></div></div>
                    {post.content && <p className="text-gray-800">{post.content}</p>}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500"><span>♥ {post.likesCount || 0}</span><span>💬 {post.commentsCount || 0}</span><span>◉ {post.viewCount || 0}</span></div>
                  </div>
                ))}
              </div></section>
            )}

            {(activeTab === 'all' || activeTab === 'hashtags') && results.hashtags?.length > 0 && (
              <section><h3 className="font-semibold text-lg mb-3">Hashtags</h3><div className="flex flex-wrap gap-2">
                {results.hashtags.map(tag => <div key={tag.id} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full"><span className="font-medium">#{tag.name}</span><span className="text-sm ml-2">({tag.postsCount})</span></div>)}
              </div></section>
            )}

            {!results.users?.length && !results.posts?.length && !results.hashtags?.length && <div className="text-center py-20 text-gray-500">No results found</div>}
          </div>
        )}
      </div>
    </div>
  );
}
export default SearchPage;
