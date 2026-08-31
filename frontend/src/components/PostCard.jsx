import React from 'react';
import { Heart, MessageSquare, Share2, MoreHorizontal, Trash2 } from 'lucide-react';
import { postAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function PostCard({ post, onLike }) {
  const { user } = useAuth();

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await postAPI.delete(post.id);
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <img src={post.user.avatarUrl || `https://i.pravatar.cc/150?u=${post.user.id}`} alt={post.user.username} className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h3 className="font-semibold text-gray-900">{post.user.fullName || post.user.username}</h3>
            <p className="text-sm text-gray-500">@{post.user.username}</p>
          </div>
        </div>
        {user?.id === post.user.id && (
          <button onClick={handleDelete} className="p-2 hover:bg-red-50 rounded-full text-gray-500 hover:text-red-600">
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="px-4 pb-3">
        <p className="text-gray-800">{post.content}</p>
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {post.hashtags.map((tag, index) => (
              <span key={index} className="text-purple-600 text-sm font-medium">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {post.mediaUrl && (
        <div className="px-4 pb-3">
          <img src={post.mediaUrl} alt="Post media" className="w-full h-64 object-cover rounded-lg" />
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          <button onClick={onLike} className="flex items-center space-x-2 text-gray-600 hover:text-red-500">
            <Heart className="w-6 h-6" />
            <span className="text-sm">{post.likesCount || 0}</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500">
            <MessageSquare className="w-6 h-6" />
            <span className="text-sm">{post.commentsCount || 0}</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-600 hover:text-green-500">
            <Share2 className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PostCard;