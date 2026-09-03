'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function PayoutsPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) router.push('/');
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-56 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Payouts</h1>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm mb-6 flex gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>
              Creator payouts aren't built into the backend yet — there's no Payout/earnings-request
              system implemented. This section will populate once that feature (e.g. Razorpay Payouts
              integration) is added on the backend.
            </span>
          </div>
          <p className="text-center text-gray-500 py-10">No payouts system connected yet.</p>
        </div>
      </div>
    </div>
  );
}
