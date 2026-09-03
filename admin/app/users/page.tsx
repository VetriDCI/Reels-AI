'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Download, Plus, MoreVertical } from 'lucide-react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewUser, setViewUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('joined');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/');
      return;
    }
    loadUsers();
  }, [statusFilter, sortBy]);

  async function loadUsers() {
    try {
      const token = localStorage.getItem('admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(
        `${API_URL}/api/admin/users?limit=100&status=${statusFilter}&sort=${sortBy}`,
        config
      );
      setUsers(res.data);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('admin_token');
        router.push('/');
      }
      setError('Failed to load users');
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
      setError('');
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user status');
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusCounts = {
    all: users.length,
    active: users.filter(u => u.status === 'active').length,
    blocked: users.filter(u => u.status === 'blocked').length,
    pending: users.filter(u => u.status === 'pending').length,
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-56 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Users Management</h1>
          <p className="text-gray-500">Manage and monitor all platform users</p>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or UPI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="joined">Newest</option>
              <option value="earnings">Top Earners</option>
              <option value="active">Most Active</option>
            </select>
            <button className="px-4 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition flex items-center gap-2 font-medium">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {/* Status Pills */}
          <div className="flex gap-4 flex-wrap">
            {Object.entries(statusCounts).map(([status, count]: any) => (
              <div key={status} className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-50 rounded-full">
                <span className="font-semibold text-gray-700 capitalize">{status}</span>
                <span className="ml-2 text-gray-500">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">User</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">UPI</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Earnings</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Joined</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user: any) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {(user.full_name?.split(' ') || []).map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{user.full_name || user.username}</div>
                            <div className="text-xs text-gray-500">{user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.upi || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          user.status === 'active' ? 'bg-green-100 text-green-700' :
                          user.status === 'blocked' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">₹{user.earnings?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewUser(user)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleBlockUser(user.id, user.status)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition font-medium"
                          >
                            {user.status === 'blocked' ? 'Unblock' : 'Block'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {viewUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {(viewUser.full_name?.split(' ') || []).map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{viewUser.full_name || viewUser.username}</h3>
                <p className="text-sm text-gray-500">{viewUser.id}</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6 pb-6 border-b">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Email</p>
                <p className="text-gray-800 font-medium">{viewUser.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Status</p>
                <p className={`text-sm font-bold ${viewUser.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{viewUser.status}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Earnings</p>
                <p className="text-lg font-bold text-gray-900">₹{viewUser.earnings?.toLocaleString() || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Joined</p>
                <p className="text-gray-800">{new Date(viewUser.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setViewUser(null)}
                className="flex-1 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium text-gray-700"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleBlockUser(viewUser.id, viewUser.status);
                  setViewUser(null);
                }}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
              >
                {viewUser.status === 'blocked' ? 'Unblock' : 'Block'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
