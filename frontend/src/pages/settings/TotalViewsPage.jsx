import React, { useEffect, useState } from 'react';
import { monetizationAPI } from '../../services/api';
import { ChevronLeft, Film, Users, Clock } from 'lucide-react';

export default function TotalViewsPage({ user, onBack }) {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setError(''); setLoading(true); const r = await monetizationAPI.analytics(30); setAnalytics(r.data?.data || null); } catch (e) { setError(e.response?.data?.message || 'Failed to load view analytics'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const posts = user?.posts || [];
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0);
  const totalViews = Number(analytics?.totalViews ?? posts.reduce((sum, p) => sum + Number(p.viewCount || 0), 0));
  const avgViews = Number(analytics?.averageViewsPerPost ?? (posts.length ? totalViews / posts.length : 0));

  const cards = [
    { label: 'Total Views', value: totalViews.toLocaleString(), icon: Film, note: 'recorded post views' },
    { label: 'Average Views / Post', value: avgViews.toLocaleString(undefined, { maximumFractionDigits: 1 }), icon: Users, note: 'based on recorded views' },
    { label: 'Total Engagement', value: (totalLikes + totalComments).toLocaleString(), icon: Clock, note: 'likes + comments' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-blue-100">
      <div className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={onBack}><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-bold">Total Views Analytics</h1>
      </div>
      <div className="p-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 mb-4 text-sm flex justify-between"><span>{error}</span><button onClick={load} className="font-semibold underline">Retry</button></div>}
        {loading && <div className="bg-white rounded-xl p-4 text-sm text-gray-500 mb-4">Loading real view analytics...</div>}
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl p-5 shadow-sm mb-3 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-blue-400 flex items-center justify-center">
              <c.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{c.value}</p>
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="text-xs text-gray-400">{c.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
