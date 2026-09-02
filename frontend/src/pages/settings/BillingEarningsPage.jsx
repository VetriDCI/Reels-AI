import React from 'react';
import { ChevronLeft, Wallet, Landmark } from 'lucide-react';

export default function BillingEarningsPage({ user, onBack }) {
  const earnings = user?.earnings || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-blue-100">
      <div className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={onBack}><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-bold">Billing, Ads & Earnings</h1>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4 text-center">
          <p className="text-sm text-gray-500">Total Balance</p>
          <p className="text-3xl font-bold text-gray-800 mb-3">${earnings.toFixed(2)}</p>
          <span className="inline-block px-4 py-1 rounded-full bg-pink-100 text-pink-600 text-sm font-semibold">
            {earnings > 0 ? 'Ready to payout' : 'No balance yet'}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <p className="text-sm text-gray-500 mb-2">Payout Details</p>
          <div className="flex items-center gap-3 py-2">
            <Wallet className="w-6 h-6 text-pink-500" />
            <div>
              <p className="text-xs text-gray-400">Current Balance</p>
              <p className="font-bold text-gray-800">${earnings.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2 border-t border-gray-100 mt-2 pt-3">
            <Landmark className="w-6 h-6 text-purple-500" />
            <div>
              <p className="text-xs text-gray-400">Linked Bank</p>
              <p className="font-bold text-gray-800">Not linked yet</p>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 mb-4">
          ⚠️ Real payouts (e.g. via Razorpay) aren't wired up on the backend yet, and no bank account is linked. This is a preview of the screen only.
        </div>

        <button disabled className="w-full py-3 rounded-xl bg-gray-300 text-white font-semibold cursor-not-allowed">
          Withdraw Earnings (not available yet)
        </button>
      </div>
    </div>
  );
}
