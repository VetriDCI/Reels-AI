import React, { useEffect, useState } from 'react';
import { monetizationAPI } from '../../services/api';
import { ChevronLeft, UserPlus, TrendingUp, Star } from 'lucide-react';

export default function FollowersAnalyticsPage({ user, onBack }) {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setError(''); setLoading(true); const r = await monetizationAPI.analytics(30); setAnalytics(r.data?.data || null); } catch (e) { setError(e.response?.data?.message || 'Failed to load analytics'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const followers = user?.followersCount || 0;
  const following = user?.followingCount || 0;

  const cards = [
    { label: 'Total Followers', value: followers, icon: UserPlus },
    { label: 'Total Following', value: following, icon: TrendingUp },
    { label: 'Engagement Ratio', value: followers > 0 ? `${Math.min(100, Math.round((following / followers) * 100))}%` : '—', icon: Star },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-blue-100">
      <div className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={onBack}><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-bold">Followers & Joins Analytics</h1>
      </div>
      <div className="p-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-3 text-sm flex justify-between"><span>{error}</span><button onClick={load} className="font-semibold underline">Retry</button></div>}
        {loading ? <div className="bg-white rounded-2xl p-5 text-center text-gray-500">Loading analytics...</div> : cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl p-5 shadow-sm mb-3 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-blue-400 flex items-center justify-center">
              <c.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{c.value}</p>
              <p className="text-sm text-gray-500">{c.label}</p>
            </div>
          </div>
        ))}
        <div className="bg-white rounded-2xl p-5 shadow-sm mt-3"><h2 className="font-bold text-gray-800">Content engagement</h2><div className="grid grid-cols-2 gap-3 mt-3"><div><p className="text-xl font-bold">{Number(analytics?.totalViews || 0).toLocaleString()}</p><p className="text-xs text-gray-500">Views</p></div><div><p className="text-xl font-bold">{Number(analytics?.engagement || 0).toLocaleString()}</p><p className="text-xs text-gray-500">Engagement</p></div></div></div>
      </div>
    </div>
  );
}
