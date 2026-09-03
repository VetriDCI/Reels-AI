'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, FileText, Video, Wallet, TrendingUp, AlertTriangle } from 'lucide-react';
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
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/');
      return;
    }
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const token = localStorage.getItem('admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [statsRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/stats`, config),
        axios.get(`${API_URL}/api/admin/users?limit=5`, config),
      ]);
      
      setStats(statsRes.data);
      setRecentUsers(usersRes.data);
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

  function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('admin_token');
      window.location.href = '/';
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-56 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-56 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <StatCard icon={<Users className="w-6 h-6" />} label="Total Users" value={stats.totalUsers.toLocaleString()} change="+12%" color="blue" />
        <StatCard icon={<FileText className="w-6 h-6" />} label="Total Posts" value={stats.totalPosts.toLocaleString()} change="+8%" color="green" />
        <StatCard icon={<Video className="w-6 h-6" />} label="Total Reels" value={stats.totalReels.toLocaleString()} change="+24%" color="purple" />
        <StatCard icon={<Wallet className="w-6 h-6" />} label="Pending Payouts" value={`₹${stats.pendingPayouts.toLocaleString()}`} change="-5%" color="yellow" />
        <StatCard icon={<TrendingUp className="w-6 h-6" />} label="Active Users" value={stats.activeUsers.toLocaleString()} change="+15%" color="green" />
        <StatCard icon={<AlertTriangle className="w-6 h-6" />} label="Reported Content" value={stats.reportedContent.toLocaleString()} change="+3%" color="red" />
      </div>

      {/* Recent Users Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Users</h2>
          <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition">View All</button>
        </div>
        {actionError && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{actionError}</div>
        )}
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-500 text-sm border-b">
              <th className="pb-3">User</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Earnings</th>
              <th className="pb-3">Joined</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((user: any) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                      {(user.full_name?.split(' ') || []).map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{user.full_name || user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${user.status === 'active' || user.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-3 font-semibold text-gray-800">₹{user.earnings?.toLocaleString() || 0}</td>
                <td className="py-3 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="py-3">
                  <button
                    onClick={() => alert(`${user.full_name || user.username}\nEmail: ${user.email}\nStatus: ${user.status}\nEarnings: ₹${user.earnings || 0}`)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg mr-2 hover:bg-blue-200 transition"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleBlockUser(user.id, user.status)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                  >
                    {user.status === 'blocked' ? 'Unblock' : 'Block'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, change, color }: any) {
  const colors: any = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>{icon}</div>
        <span className={`text-sm font-semibold ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{change}</span>
      </div>
      <div className="text-3xl font-bold mb-1 text-gray-800">{value}</div>
      <div className="text-gray-500 text-sm">{label}</div>
    </div>
  );
}