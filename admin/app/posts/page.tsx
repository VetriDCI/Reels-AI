'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Trash2, Check, X } from 'lucide-react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function ReelsPage() {
  const router = useRouter();
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReel, setSelectedReel] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/');
      return;
    }
    loadReels();
  }, [statusFilter]);

  async function loadReels() {
    try {
      const token = localStorage.getItem('admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(
        `${API_URL}/api/admin/posts?limit=50&status=${statusFilter}`,
        config
      );
      setReels(res.data);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('admin_token');
        router.push('/');
      }
      setError('Failed to load reels');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(reelId: string) {
    if (!confirm('Delete this reel? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_URL}/api/admin/posts/${reelId}`, config);
      setError('');
      loadReels();
      setSelectedReel(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete reel');
    }
  }

  const filteredReels = reels.filter(reel =>
    reel.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reel.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusCounts = {
    all: reels.length,
    approved: reels.filter(r => r.status === 'approved').length,
    pending: reels.filter(r => r.status === 'pending').length,
    rejected: reels.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-56 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reels Management</h1>
          <p className="text-gray-500">Moderate and manage all reels content</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title or creator..."
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
              <option value="approved">Approved</option>
              <option value="pending">Pending Review</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Status Counters */}
          <div className="flex gap-4 flex-wrap">
            {Object.entries(statusCounts).map(([status, count]: any) => (
              <div key={status} className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                <span className="font-semibold text-purple-700 capitalize">{status}</span>
                <span className="ml-2 text-purple-500">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

        {/* Reels Grid */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : filteredReels.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No reels found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Title (Thumbnail)</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Creator</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Views</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Likes</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Comments</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Posted</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReels.map((reel: any) => (
                    <tr key={reel.id} className="border-b hover:bg-gray-50 transition cursor-pointer" onClick={() => setSelectedReel(reel)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-300 rounded flex items-center justify-center text-white font-bold">▶</div>
                          <div className="text-sm font-semibold text-gray-800 max-w-xs truncate">
                            {reel.content?.slice(0, 40) || 'Untitled'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{reel.author || 'Unknown'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-800">{reel.views?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{reel.likes_count || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{reel.comments_count || 0}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          reel.status === 'approved' ? 'bg-green-100 text-green-700' :
                          reel.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {reel.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(reel.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(reel.id);
                          }}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reel Detail Modal */}
      {selectedReel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Reel Details</h3>
            
            <div className="space-y-4 mb-6 pb-6 border-b">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Title/Content</p>
                <p className="text-gray-800 font-medium line-clamp-2">{selectedReel.content || 'Untitled'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Creator</p>
                <p className="text-gray-800">{selectedReel.author || 'Unknown'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Views</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedReel.views?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Engagement</p>
                  <p className="text-2xl font-bold text-gray-900">{(selectedReel.likes_count || 0) + (selectedReel.comments_count || 0)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Likes</p>
                  <p className="text-gray-800 font-medium">{selectedReel.likes_count || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Comments</p>
                  <p className="text-gray-800 font-medium">{selectedReel.comments_count || 0}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Status</p>
                <p className={`text-sm font-bold ${
                  selectedReel.status === 'approved' ? 'text-green-600' :
                  selectedReel.status === 'pending' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>{selectedReel.status || 'pending'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Posted</p>
                <p className="text-gray-800">{new Date(selectedReel.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedReel(null)}
                className="flex-1 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium text-gray-700"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDelete(selectedReel.id);
                }}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
