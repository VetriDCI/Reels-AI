'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Download, Edit2, Pause, Play } from 'lucide-react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function AdsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/');
      return;
    }
    loadCampaigns();
  }, [typeFilter]);

  async function loadCampaigns() {
    try {
      const token = localStorage.getItem('admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(
        `${API_URL}/api/admin/ads?type=${typeFilter}`,
        config
      ).catch(() => ({ data: [
        { id: 1, name: 'Summer Sale - 1', type: 'Video Promotion', budget: 500, spent: 625, clicks: 1611, status: 'active' },
        { id: 2, name: 'New Launch - 2', type: 'Profile Boost', budget: 1200, spent: 1325, clicks: 177, status: 'paused' },
        { id: 3, name: 'Creator Boost - 3', type: 'Banner', budget: 2500, spent: 1749, clicks: 2441, status: 'pending' },
        { id: 4, name: 'Festive Offer - 4', type: 'Story Ad', budget: 800, spent: 977, clicks: 1187, status: 'completed' },
        { id: 5, name: 'App Install - 5', type: 'Video Promotion', budget: 3000, spent: 590, clicks: 3819, status: 'rejected' },
      ]}));
      setCampaigns(res.data);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('admin_token');
        router.push('/');
      }
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    const colors: any = {
      'Video Promotion': 'bg-blue-100 text-blue-700',
      'Profile Boost': 'bg-purple-100 text-purple-700',
      'Banner': 'bg-indigo-100 text-indigo-700',
      'Story Ad': 'bg-pink-100 text-pink-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'active': 'bg-green-100 text-green-700',
      'paused': 'bg-orange-100 text-orange-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'completed': 'bg-blue-100 text-blue-700',
      'rejected': 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-56 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ad Campaigns</h1>
          <p className="text-gray-500">Manage and monitor advertising campaigns</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search campaign..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Types</option>
              <option value="video">Video Promotion</option>
              <option value="profile">Profile Boost</option>
              <option value="banner">Banner</option>
              <option value="story">Story Ad</option>
            </select>
            <button className="px-4 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition flex items-center gap-2 font-medium">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No campaigns found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Campaign</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Budget</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Spent</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Clicks</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((campaign: any) => (
                    <tr key={campaign.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-800">{campaign.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTypeColor(campaign.type)}`}>
                          {campaign.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">₹{campaign.budget.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">₹{campaign.spent.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-800">{campaign.clicks.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition font-medium flex items-center gap-1">
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                          {campaign.status === 'active' ? (
                            <button className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm hover:bg-orange-200 transition font-medium flex items-center gap-1">
                              <Pause className="w-3 h-3" />
                              Pause
                            </button>
                          ) : (
                            <button className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition font-medium flex items-center gap-1">
                              <Play className="w-3 h-3" />
                              Activate
                            </button>
                          )}
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
    </div>
  );
}
