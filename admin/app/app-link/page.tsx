'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function AppLinkPage() {
  const router = useRouter();
  const [appData, setAppData] = useState({
    users: 30,
    reels: 18,
    payments: 18,
    chats: 14,
    ads: 12,
    settings: 1,
    broadcasts: 3,
    storage: 72,
  });
  const [syncStatus, setSyncStatus] = useState([
    { status: '✓ Reading playcircle_* localStorage keys and merging with admin dataset', type: 'success' },
    { status: '✓ Auto-merge imported users from app side', type: 'success' },
    { status: '✓ Export CSV includes filtered data only', type: 'success' },
    { status: '⚠ Clear localStorage to reset imported mock data', type: 'warning' },
  ]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/');
      return;
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-56 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">App Link</h1>
          <p className="text-gray-500">View linked data counts and sync status</p>
        </div>

        {/* Linked Data Counts */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">App Link + Linked Data Counts</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Object.entries(appData).map(([key, count]: any) => (
              <div key={key} className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:shadow-lg transition">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg mb-3">
                  P
                </div>
                <div className="font-semibold text-gray-600 text-sm capitalize mb-1">playcircle_{key}</div>
                <div className="text-3xl font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-500 mt-1">{key === 'storage' ? 'MB' : 'records'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sync Status */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Sync Status</h2>
          
          <div className="space-y-3">
            {syncStatus.map((item: any, idx: number) => (
              <div key={idx} className={`p-4 rounded-lg flex items-start gap-3 ${
                item.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className={`mt-1 font-bold ${item.type === 'success' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {item.status.split(' ')[0]}
                </div>
                <div className={item.type === 'success' ? 'text-green-700' : 'text-yellow-700'}>
                  {item.status.substring(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
