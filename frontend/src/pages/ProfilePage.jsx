import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Camera, Edit2, X } from 'lucide-react';

function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await authAPI.updateProfile({ fullName, bio });
      updateUser(response.data.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFullName(user?.fullName || '');
    setBio(user?.bio || '');
    setIsEditing(false);
  };

  return (
    <div className="pt-20 px-4 min-h-screen">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <img
              src={user?.avatarUrl || `https://i.pravatar.cc/150?u=${user?.id}`}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover"
            />
            <button className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {isEditing ? (
            <div className="w-full space-y-3">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a short bio..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
              <div className="flex items-center justify-center space-x-3 mt-4">
                <button onClick={handleCancel} className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full">
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full disabled:opacity-50"
                >
                  <span>{loading ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900">{user?.fullName || user?.username}</h2>
              <p className="text-gray-500">@{user?.username}</p>
              <p className="text-gray-600 mt-2 text-center">{user?.bio || 'No bio yet'}</p>

              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:opacity-90"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </>
          )}

          <div className="flex items-center space-x-6 mt-6">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{user?.postsCount || 0}</p>
              <p className="text-sm text-gray-500">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{user?.followersCount || 0}</p>
              <p className="text-sm text-gray-500">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{user?.followingCount || 0}</p>
              <p className="text-sm text-gray-500">Following</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}

export default ProfilePage;