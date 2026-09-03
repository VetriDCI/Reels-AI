'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/');
      return;
    }
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const token = localStorage.getItem('admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/api/admin/posts?limit=50`, config);
      setPosts(res.data);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('admin_token');
        router.push('/');
      }
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_URL}/api/admin/posts/${postId}`, config);
      setError('');
      loadPosts();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete post');
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-56 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">All Posts / Reels</h1>

        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

        <div className="bg-white rounded-xl shadow-lg p-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : posts.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No posts yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm border-b">
                  <th className="pb-3">Author</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Content</th>
                  <th className="pb-3">Likes</th>
                  <th className="pb-3">Comments</th>
                  <th className="pb-3">Posted</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post: any) => (
                  <tr key={post.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-semibold text-gray-800">{post.author}</td>
                    <td className="py-3 text-gray-500 capitalize">{post.media_type || 'text'}</td>
                    <td className="py-3 text-gray-500">{(post.content || '').slice(0, 40) || '—'}</td>
                    <td className="py-3 text-gray-500">{post.likes_count}</td>
                    <td className="py-3 text-gray-500">{post.comments_count}</td>
                    <td className="py-3 text-gray-500">{new Date(post.created_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
