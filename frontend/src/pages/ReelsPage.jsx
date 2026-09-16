import React, { useEffect, useState } from 'react';
import { Bell, Film, Image as ImageIcon, Search as SearchIcon, RefreshCw } from 'lucide-react';
import { postAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

export default function ReelsPage({ onNotifications, unreadNotificationCount, onSearch, initialPostId }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await postAPI.getFeed(1, 50);
      const posts = res.data?.data || [];
      setItems(posts);
      if (initialPostId) setTimeout(() => document.getElementById(`reel-post-${initialPostId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e) { console.error('Failed to load reels/content feed', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (initialPostId && items.length) setTimeout(() => document.getElementById(`reel-post-${initialPostId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100); }, [initialPostId, items]);

  const refresh = () => { setRefreshing(true); load(); };

  const handleLike = async (postId) => {
    try {
      const res = await postAPI.like(postId);
      const liked = Boolean(res.data?.data?.liked);
      setItems(prev => prev.map(p => p.id === postId ? { ...p, _liked: liked, likesCount: Math.max(0, Number(p.likesCount || 0) + (liked ? 1 : -1)) } : p));
    } catch (e) { console.error('Failed to like post', e); }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading content…</div>;

  return <div className="min-h-screen bg-gray-50 pb-24">
    <header className="sticky top-0 z-40 bg-black text-white px-4 py-3 flex items-center gap-3 shadow-md">
      <div className="flex items-center gap-2 font-extrabold"><Film className="w-5 h-5" />RA Social</div>
      <button onClick={() => onSearch('')} className="flex-1 max-w-md mx-auto flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-2 text-left text-sm text-white/80"><SearchIcon className="w-5 h-5 shrink-0" /><span className="truncate">Search people, posts or hashtags</span></button>
      <button onClick={refresh} aria-label="Refresh" className="p-1"><RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} /></button>
      <button onClick={onNotifications} aria-label="Notifications" className="relative p-1"><Bell className="w-5 h-5" />{unreadNotificationCount > 0 && <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] rounded-full bg-red-500 text-[9px] leading-[16px] text-center font-bold">{unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}</span>}</button>
    </header>

    <div className="px-4 py-3 bg-white border-b"><p className="font-bold text-gray-800">Reels & Posts</p><p className="text-xs text-gray-500 mt-0.5">Videos, images, text posts and other content from RA Social users</p></div>

    {!items.length ? <div className="py-24 text-center text-gray-400"><ImageIcon className="w-12 h-12 mx-auto mb-3" /><p>No posts yet</p></div> : <div className="max-w-2xl mx-auto px-3 py-4 space-y-4">{items.map(post => <div id={`reel-post-${post.id}`} key={post.id}><PostCard post={post} onLike={() => handleLike(post.id)} /></div>)}</div>}
  </div>;
}
