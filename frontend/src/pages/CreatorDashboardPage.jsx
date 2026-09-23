import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, Calendar, CircleDollarSign, Eye, Film, Image as ImageIcon, MessageCircle, RefreshCw, Users, Wallet, Radio } from 'lucide-react';
import api, { monetizationAPI } from '../services/api';
import PostCard from '../components/PostCard';

const num = (value) => Number(value || 0).toLocaleString();

export default function CreatorDashboardPage({ onBack }) {
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/auth/me'),
        monetizationAPI.analytics(30),
      ]);

      const [userResult, analyticsResult] = results;
      if (userResult.status === 'fulfilled') {
        setUser(userResult.value.data?.data || null);
      }
      if (analyticsResult.status === 'fulfilled') {
        setAnalytics(analyticsResult.value.data?.data || null);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Creator dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const intervalId = setInterval(load, 15000);
    return () => clearInterval(intervalId);
  }, [load]);

  const posts = user?.posts || [];
  const videoCount = posts.filter((post) => post.mediaType === 'video').length;
  const imageCount = posts.filter((post) => post.mediaType !== 'video').length;
  const views = posts.reduce((sum, post) => sum + Number(post.viewCount || 0), 0);
  const likes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
  const comments = posts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);
  const periodEarnings = useMemo(() => Number(analytics?.periodEarnings ?? 0), [analytics]);

  const cards = [
    ['Followers', num(user?.followersCount), Users],
    ['Total posts', num(user?.postsCount), BarChart3],
    ['Views', num(views), Eye],
    ['Engagement', num(likes + comments), MessageCircle],
    ['30-day earnings', `$${periodEarnings.toFixed(2)}`, CircleDollarSign],
    ['Balance', `$${Number(user?.earnings || 0).toFixed(2)}`, Wallet],
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 pb-24">
      <header className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-lg">Creator Dashboard</h1>
          <p className="text-[11px] text-gray-400">Dashboard refreshes every 15 seconds</p>
        </div>
        <button onClick={load} className="p-2 rounded-full hover:bg-gray-100" aria-label="Refresh">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs uppercase opacity-80 font-semibold">Creator Channel</p>
          <h2 className="text-xl font-bold mt-1">{user?.channelName || user?.fullName || user?.username}</h2>
          <p className="text-sm opacity-90 mt-1">Channel No: {user?.channelNumber || '—'}</p>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Creator dashboard data
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {cards.map(([label, value, Icon]) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm">
              <Icon className="w-5 h-5 text-purple-500 mb-2" />
              <p className="text-xl font-bold text-gray-800">{loading ? '—' : value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3">Content overview</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-blue-50 p-3 flex items-center gap-2">
              <Film className="w-5 h-5 text-blue-500" />
              <div><b>{num(videoCount)}</b><p className="text-xs text-gray-500">Videos</p></div>
            </div>
            <div className="rounded-xl bg-pink-50 p-3 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-pink-500" />
              <div><b>{num(imageCount)}</b><p className="text-xs text-gray-500">Posts / images</p></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-gray-800">Your latest content</h3>
          </div>
          {posts.length ? (
            <div className="space-y-3">
              {posts.slice(0, 9).map((post) => (
                <div key={post.id} className="border rounded-xl p-3 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                    {post.mediaUrl ? (
                      post.mediaType === 'video'
                        ? <Film className="w-6 h-6 text-gray-500" />
                        : <img src={post.mediaUrl} className="w-full h-full object-cover" alt="" />
                    ) : <MessageCircle className="w-5 h-5 text-gray-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{post.content || 'Untitled content'}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(post.createdAt).toLocaleDateString()} · {num(post.viewCount)} views</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">No content yet.</p>}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-gray-800">My Content — Manage</h3>
              <p className="text-xs text-gray-500 mt-1">Posts, images and videos</p>
            </div>
            <span className="text-xs text-gray-400">{num(posts.length)} items</span>
          </div>
          {posts.length ? (
            <div className="space-y-4">
              {posts.map((post) => <PostCard key={post.id} post={{ ...post, user }} profileMode onChanged={load} />)}
            </div>
          ) : <p className="text-sm text-gray-400">No content to manage.</p>}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
              <Radio className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-800">Live</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase">Coming Soon</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Real-time public livestreaming is being prepared. Live creation is temporarily disabled.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-800">Creator tools</h3>
          <p className="text-xs text-gray-500 mt-1">Analytics, brand collaborations, ads & earnings, monetization and content archive are available here.</p>
        </div>

        {lastUpdated && <p className="text-center text-[11px] text-gray-400">Updated {lastUpdated.toLocaleTimeString()}</p>}
      </div>
    </div>
  );
}
