import React, { useEffect, useState } from 'react';
import { ChevronLeft, UserPlus, UserCheck } from 'lucide-react';
import api, { followAPI } from '../../services/api';

export default function ConnectionsPage({ type, onBack }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const title = type === 'followers' ? 'Followers' : 'Following';

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/follow/me/${type}`);
      setUsers(res.data?.data?.users || []);
    } catch (error) {
      console.error(`Failed to load ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [type]);

  const toggleFollow = async (id) => {
    try {
      await followAPI.follow(id);
      await load();
    } catch (error) {
      console.error('Failed to update follow:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      <div className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} aria-label="Back"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-bold">{title}</h1>
      </div>
      {loading ? (
        <div className="py-20 text-center text-sm text-gray-400">Loading {title.toLowerCase()}...</div>
      ) : users.length === 0 ? (
        <div className="py-20 text-center text-sm text-gray-400">No {title.toLowerCase()} yet</div>
      ) : (
        <div className="p-4 space-y-2">
          {users.map((u) => (
            <div key={u.id} className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3">
              <img src={u.avatarUrl || `https://i.pravatar.cc/80?u=${u.id}`} alt="" className="w-11 h-11 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{u.fullName || u.username}</p>
                <p className="text-xs text-gray-500 truncate">@{u.username}</p>
              </div>
              {type === 'following' && (
                <button onClick={() => toggleFollow(u.id)} className="px-3 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-600 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Following
                </button>
              )}
              {type === 'followers' && (
                <button onClick={() => toggleFollow(u.id)} className="px-3 py-1.5 rounded-full bg-purple-600 text-white text-xs font-semibold flex items-center gap-1">
                  <UserPlus className="w-3.5 h-3.5" /> Follow
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
