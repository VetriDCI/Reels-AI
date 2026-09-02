import React, { useState } from 'react';
import { ChevronLeft, Lock, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

export default function AccountSecurityPage({ onBack }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [twoFA, setTwoFA] = useState(() => localStorage.getItem('ra_social_2fa') === 'true');

  const handleUpdate = async () => {
    setError('');
    setMsg('');
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setMsg('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const toggle2FA = () => {
    const next = !twoFA;
    setTwoFA(next);
    localStorage.setItem('ra_social_2fa', String(next));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-blue-100">
      <div className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={onBack}><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-bold">Account & Security</h1>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-5 h-5 text-pink-500" />
            <h2 className="font-bold">Change Password</h2>
          </div>
          {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-3">{error}</div>}
          {msg && <div className="bg-green-50 text-green-600 text-sm px-3 py-2 rounded-lg mb-3">{msg}</div>}
          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-3"
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-3"
          />
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-blue-500 text-white font-semibold disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-purple-500" />
            <h2 className="font-bold">Two-Factor Authentication</h2>
          </div>
          <p className="text-sm text-gray-500 mb-3">Add an extra layer of security to your account.</p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">SMS Authentication</span>
            <button
              onClick={toggle2FA}
              className={`w-12 h-7 rounded-full transition ${twoFA ? 'bg-gradient-to-r from-pink-500 to-blue-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition ${twoFA ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <p className="text-xs text-gray-400">
            ⚠️ This is a preference toggle only — no SMS provider is connected yet, so it isn't enforced at login.
          </p>
        </div>
      </div>
    </div>
  );
}
