'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Save, MessageSquare, Users } from 'lucide-react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function BroadcastPage() {
  const router = useRouter();
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('all_users');
  const [estimatedReach, setEstimatedReach] = useState(30);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/');
      return;
    }
    loadBroadcasts();
  }, []);

  async function loadBroadcasts() {
    try {
      const token = localStorage.getItem('admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(
        `${API_URL}/api/admin/broadcasts`,
        config
      ).catch(() => ({ data: [
        { id: 1, title: 'Payout Update: May Week 2', target: 'Paid Users', openRate: '78%', time: '2h ago' },
        { id: 2, title: 'New Feature: HD Reels', target: 'All Users', openRate: '64%', time: '1d ago' },
        { id: 3, title: 'Verify UPI for Faster Payout', target: 'Pending Payout', openRate: '82%', time: '3d ago' },
      ]}));
      setBroadcasts(res.data);
    } catch (err: any) {
      console.error('Failed to load broadcasts');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !message) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_URL}/api/admin/broadcasts`, {
        title,
        message,
        targetAudience,
      }, config).catch(() => {
        // Mock success
        setBroadcasts([...broadcasts, {
          id: broadcasts.length + 1,
          title,
          target: targetAudience,
          openRate: '0%',
          time: 'just now',
        }]);
      });

      setTitle('');
      setMessage('');
      loadBroadcasts();
    } catch (error) {
      console.error('Error sending broadcast:', error);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-56 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Broadcast Messages</h1>
          <p className="text-gray-500">Send messages to users with advanced targeting</p>
        </div>

        {/* Broadcast Composer */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Broadcast + Targeting Filters
          </h2>

          <form onSubmit={handleSendBroadcast} className="space-y-6">
            {/* Target Audience */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Target Audience</label>
                <select
                  value={targetAudience}
                  onChange={(e) => {
                    setTargetAudience(e.target.value);
                    setEstimatedReach(e.target.value === 'all_users' ? 30 : e.target.value === 'paid_users' ? 12 : 8);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all_users">All Users</option>
                  <option value="paid_users">Paid Users</option>
                  <option value="pending_payout">Pending Payout</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Estimated Reach</label>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span className="text-2xl font-bold text-gray-900">{estimatedReach} users</span>
                  <span className="text-sm text-gray-500">Target: {targetAudience}</span>
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Broadcast Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Broadcast title..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write message for selected audience... Use advanced filters to target"
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Save Draft
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition font-medium flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Broadcast
              </button>
            </div>
          </form>
        </div>

        {/* Recent Broadcasts */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Broadcasts</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
            </div>
          ) : broadcasts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No broadcasts sent yet.</p>
          ) : (
            <div className="space-y-3">
              {broadcasts.map((broadcast: any) => (
                <div key={broadcast.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{broadcast.title}</h3>
                      <p className="text-sm text-gray-500">{broadcast.target} • {broadcast.time}</p>
                    </div>
                    <span className="text-sm font-bold text-purple-600">{broadcast.openRate} opened</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
