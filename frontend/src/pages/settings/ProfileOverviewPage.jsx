import React, { useState } from 'react';
import { ChevronLeft, Edit3 } from 'lucide-react';
import api from '../../services/api';

export default function ProfileOverviewPage({ user, onBack, onUpdated }) {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      await api.put('/auth/profile', { fullName, bio });
      setMsg('Saved successfully!');
      onUpdated?.();
    } catch {
      setMsg('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-blue-100">
      <div className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={onBack}><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-bold">Profile Overview</h1>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-bold text-lg">Edit Creator Info</h2>
          </div>

          <label className="text-sm text-gray-500 block mb-1">Display Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border-2 border-pink-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-pink-400"
          />

          <label className="text-sm text-gray-500 block mb-1">Bio Description</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full border-2 border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-400"
          />
        </div>

        {msg && <p className="text-center text-sm mt-4 text-green-600">{msg}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-blue-500 text-white font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
