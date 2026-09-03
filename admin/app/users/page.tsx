'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewUser, setViewUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/');
      return;
    }
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const token = localStorage.getItem('admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/api/admin/users?limit=100`, config);
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-56 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">All Users</h1>

        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

        <div className="bg-white rounded-xl shadow-lg p-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No users yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm border-b">
                  <th className="pb-3">User</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Earnings</th>
                  <th className="pb-3">Joined</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-semibold text-gray-800">{user.full_name || user.username}</td>
                    <td className="py-3 text-gray-500">{user.email}</td>
                    <td className="py-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${user.status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-gray-800">₹{user.earnings || 0}</td>
                    <td className="py-3 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <button
                        onClick={() => setViewUser(user)}
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
          )}
        </div>
      </div>

      {viewUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-3">{viewUser.full_name || viewUser.username}</h3>
            <p className="text-sm text-gray-600 mb-1">Email: {viewUser.email}</p>
            <p className="text-sm text-gray-600 mb-1">Status: {viewUser.status}</p>
            <p className="text-sm text-gray-600 mb-1">Earnings: ₹{viewUser.earnings || 0}</p>
            <p className="text-sm text-gray-600 mb-4">Joined: {new Date(viewUser.created_at).toLocaleDateString()}</p>
            <button
              onClick={() => setViewUser(null)}
              className="w-full py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
