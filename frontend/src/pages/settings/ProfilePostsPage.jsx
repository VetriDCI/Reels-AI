import React, { useEffect, useState } from 'react';
import { ChevronLeft, Film, Image as ImageIcon } from 'lucide-react';
import api from '../../services/api';

export default function ProfilePostsPage({ onBack }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get('/auth/me');
        if (active) setPosts(res.data?.data?.posts || []);
      } catch (error) {
        console.error('Failed to load profile posts:', error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      <div className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} aria-label="Back"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-bold">Posts</h1>
      </div>
      {loading ? (
        <div className="py-20 text-center text-sm text-gray-400">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center text-sm text-gray-400">No posts yet</div>
      ) : (
        <div className="grid grid-cols-3 gap-1 p-1">
          {posts.map((post) => (
            <div key={post.id} className="aspect-square bg-white overflow-hidden flex items-center justify-center">
              {post.mediaUrl && post.mediaType === 'video' ? (
                <div className="relative w-full h-full">
                  <video src={post.mediaUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                  <Film className="absolute top-2 right-2 w-4 h-4 text-white drop-shadow" />
                </div>
              ) : post.mediaUrl ? (
                <img src={post.mediaUrl} alt={post.content || 'Post'} className="w-full h-full object-cover" />
              ) : (
                <div className="p-3 text-xs text-gray-600 text-center"><ImageIcon className="w-5 h-5 mx-auto mb-2 text-gray-300" />{post.content || 'Post'}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
