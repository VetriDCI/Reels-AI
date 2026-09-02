import React from 'react';
import { ChevronLeft, DollarSign } from 'lucide-react';

export default function AdRevenuePage({ user, onBack }) {
  const earnings = user?.earnings || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-blue-100">
      <div className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack}><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="text-lg font-bold">Ad Revenue Analytics</h1>
        </div>
        <p className="text-sm opacity-90">Total Revenue</p>
        <p className="text-3xl font-bold">${earnings.toFixed(2)}</p>
      </div>

      <div className="p-4">
        <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 mb-4">
          ⚠️ There's no ads/monetization engine live yet — this reflects your account's earnings field (currently ${earnings.toFixed(2)}), which will only grow once a real ad-revenue or brand-deal system is connected.
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-blue-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-800">${earnings.toFixed(2)}</p>
            <p className="text-sm text-gray-500">Ready for payout</p>
          </div>
        </div>
      </div>
    </div>
  );
}
