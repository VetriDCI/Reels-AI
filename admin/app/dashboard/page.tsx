'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, FileText, Video, Wallet, TrendingUp, AlertTriangle, Activity, MessageCircle, BarChart3 } from 'lucide-react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalReels: 0,
    pendingPayouts: 0,
    activeUsers: 0,
    reportedContent: 0,
    totalEarnings: 0,
    totalViews: 1413300,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentReels, setRecentReels] = useState([]);
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/');
      return;
    }
    loadDashboard();
  }, [dateRange]);

  async function loadDashboard() {
    try {
      const token = localStorage.getItem('admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [statsRes, usersRes, reelsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/stats?range=${dateRange}`, config).catch(() => ({ data: stats })),
        axios.get(`${API_URL}/api/admin/users?limit=6`, config).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/admin/posts?limit=4&type=video`, config).catch(() => ({ data: [] })),
      ]);
      
      setStats(statsRes.data);
      setRecentUsers(usersRes.data);
      setRecentReels(reelsRes.data);
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('admin_token');
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleBlockUser(userId: string, currentStatus: string) {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    if (!confirm(`Are you sure you want to ${newStatus === 'blocked' ? 'block' : 'unblock'} this user?`)) return;

    try {
      const token = localStorage.getItem('admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.patch(`${API_URL}/api/admin/users/${userId}/status`, { status: newStatus }, config);
      setActionError('');
      loadDashboard();
    } catch (error: any) {
      setActionError(error.response?.data?.error || 'Failed to update user status');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-56 flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <div className="flex-1 ml-56 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back! Here's your platform overview</p>
          </div>
          <div className="flex gap-2">
            {['Today', 'Week', 'Month', 'Year'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range.toLowerCase())}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  dateRange === range.toLowerCase()
                    ? 'bg-cyan-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={<Users className="w-6 h-6" />} 
            label="Total Users" 
            value={stats.totalUsers.toLocaleString()} 
            change="+12%" 
            trend="up"
            color="blue" 
          />
          <StatCard 
            icon={<FileText className="w-6 h-6" />} 
            label="Total Posts" 
            value={stats.totalPosts.toLocaleString()} 
            change="+8%" 
            trend="up"
            color="green" 
          />
          <StatCard 
            icon={<Video className="w-6 h-6" />} 
            label="Total Reels" 
            value={stats.totalReels.toLocaleString()} 
            change="+24%" 
            trend="up"
            color="purple" 
          />
          <StatCard 
            icon={<BarChart3 className="w-6 h-6" />} 
            label="Total Views" 
            value={`${(stats.totalViews / 1000).toFixed(1)}K`} 
            change="+23%" 
            trend="up"
            color="orange" 
          />
          <StatCard 
            icon={<Wallet className="w-6 h-6" />} 
            label="Pending Payouts" 
            value={`₹${stats.pendingPayouts.toLocaleString()}`} 
            change="-5%" 
            trend="down"
            color="yellow" 
          />
          <StatCard 
            icon={<TrendingUp className="w-6 h-6" />} 
            label="Active Users" 
            value={stats.activeUsers.toLocaleString()} 
            change="+15%" 
            trend="up"
            color="indigo" 
          />
          <StatCard 
            icon={<AlertTriangle className="w-6 h-6" />} 
            label="Reported Content" 
            value={stats.reportedContent.toLocaleString()} 
            change="+3%" 
            trend="up"
            color="red" 
          />
          <StatCard 
            icon={<Activity className="w-6 h-6" />} 
            label="Total Earnings" 
            value={`₹${stats.totalEarnings.toLocaleString()}`} 
            change="+18%" 
            trend="up"
            color="emerald" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Recent Users</h2>
              <a href="/users" className="text-cyan-500 hover:text-cyan-600 font-medium text-sm">View All →</a>
            </div>
            {actionError && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{actionError}</div>
            )}
            <div className="space-y-3">
              {recentUsers.slice(0, 5).map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {(user.full_name?.split(' ') || []).map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{user.full_name || user.username}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Reels */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Recent Reels</h2>
              <a href="/posts" className="text-cyan-500 hover:text-cyan-600 font-medium text-sm">View All →</a>
            </div>
            <div className="space-y-3">
              {recentReels.slice(0, 5).map((reel: any) => (
                <div key={reel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 text-sm truncate">{reel.title || reel.content?.slice(0, 30) || 'Untitled'}</div>
                    <div className="text-xs text-gray-500">{reel.author || 'Unknown'} • {reel.views || 0} views</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                    reel.status === 'approved' ? 'bg-green-100 text-green-700' : 
                    reel.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {reel.status || 'pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, change, trend, color }: any) {
  const colors: any = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    orange: 'bg-orange-100 text-orange-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>{icon}</div>
        <span className={`text-sm font-bold flex items-center gap-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {change}
          <span>{trend === 'up' ? '↑' : '↓'}</span>
        </span>
      </div>
      <div className="text-3xl font-bold mb-1 text-gray-900">{value}</div>
      <div className="text-gray-500 text-sm font-medium">{label}</div>
    </div>
  );
}
