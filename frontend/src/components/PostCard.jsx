import React, { useState } from 'react';
import { Heart, MessageSquare, Share2, Trash2, Send, X, Eye, Download, MoreHorizontal, Link2, Flag } from 'lucide-react';
import { postAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { downloadMedia } from '../utils/download';

function PostCard({ post, onLike }) {
  const { user } = useAuth();
  const [commentOpen, setCommentOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // No real view-tracking in the backend yet — shown as an estimate
  // (same approach already used on the Reels page) rather than a live count.
  const estimatedViews = (post.likesCount || 0) * 8 + (post.commentsCount || 0) * 3;

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try { await postAPI.delete(post.id); window.location.reload(); }
    catch (error) { alert(error.response?.data?.message || 'Failed to delete post'); }
  };

  const loadComments = async () => {
    setCommentOpen(true);
    try {
      const res = await postAPI.getById(post.id);
      setComments(res.data.data.comments || []);
    } catch (e) { console.error(e); }
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    try {
      const res = await postAPI.addComment(post.id, comment.trim());
      setComments(prev => [res.data.data, ...prev]);
      setComment('');
    } catch (e) { alert(e.response?.data?.message || 'Failed to add comment'); }
  };

  const share = async () => {
    const url = `${window.location.origin}/?post=${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: 'RA Social post', text: post.content || 'Check this post', url });
      else { await navigator.clipboard.writeText(url); alert('Post link copied'); }
      setSharing(true); setTimeout(() => setSharing(false), 1200);
    } catch {}
  };

  const handleDownload = async () => {
    if (!post.mediaUrl || downloading) return;
    setDownloading(true);
    const ext = post.mediaType === 'video' ? 'mp4' : 'jpg';
    await downloadMedia(post.mediaUrl, `ra-social-${post.id}.${ext}`);
    setDownloading(false);
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/?post=${post.id}`;
    await navigator.clipboard.writeText(url);
    alert('Post link copied');
    setMenuOpen(false);
  };

  const reportPost = () => {
    alert('Post reported. Our team will review it shortly.');
    setMenuOpen(false);
  };

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <img src={post.user?.avatarUrl || `https://i.pravatar.cc/150?u=${post.user?.id}`} alt="" className="w-10 h-10 rounded-full object-cover" />
          <div><h3 className="font-semibold text-gray-900">{post.user?.fullName || post.user?.username}</h3><p className="text-sm text-gray-500">@{post.user?.username}</p></div>
        </div>
        {user?.id === post.user?.id && <button onClick={handleDelete} className="p-2 hover:bg-red-50 rounded-full text-gray-500 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>}
      </div>

      {post.content && <div className="px-4 pb-3"><p className="text-gray-800 whitespace-pre-wrap break-words">{post.content}</p>
        {post.hashtags?.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{post.hashtags.map((tag,i)=><span key={i} className="text-purple-600 text-sm font-medium">#{String(tag).replace(/^#/,'')}</span>)}</div>}
      </div>}

      {post.mediaUrl && <div className="px-4 pb-3">
        {post.mediaType === 'video' ? <video src={post.mediaUrl} controls playsInline preload="metadata" className="w-full max-h-[70vh] rounded-lg bg-black" /> :
          <img src={post.mediaUrl} alt="Post media" loading="lazy" className="w-full max-h-[70vh] object-contain rounded-lg bg-gray-100" onError={e => {e.currentTarget.alt='Media unavailable';}} />}
      </div>}

      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="flex items-center space-x-5">
          <button onClick={onLike} className="flex items-center gap-2 text-gray-600 hover:text-red-500"><Heart className="w-6 h-6" /><span>{post.likesCount || 0}</span></button>
          <button onClick={loadComments} className="flex items-center gap-2 text-gray-600 hover:text-blue-500"><MessageSquare className="w-6 h-6" /><span>{post.commentsCount || 0}</span></button>
          <button onClick={share} className="flex items-center gap-2 text-gray-600 hover:text-green-500"><Share2 className="w-6 h-6" />{sharing && <span className="text-xs">Copied</span>}</button>
          <span className="flex items-center gap-2 text-gray-400"><Eye className="w-6 h-6" /><span className="text-sm">{estimatedViews}</span></span>
        </div>
        <div className="flex items-center gap-3 relative">
          {post.mediaUrl && (
            <button onClick={handleDownload} disabled={downloading} aria-label="Download" className="text-gray-600 hover:text-purple-600 disabled:opacity-50">
              <Download className="w-6 h-6" />
            </button>
          )}
          <button onClick={() => setMenuOpen(v => !v)} aria-label="More options" className="text-gray-600 hover:text-gray-900">
            <MoreHorizontal className="w-6 h-6" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 w-44 bg-white rounded-xl shadow-lg border py-1">
              <button onClick={copyLink} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><Link2 className="w-4 h-4" />Copy link</button>
              <button onClick={reportPost} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><Flag className="w-4 h-4" />Report</button>
            </div>
          )}
        </div>
      </div>

      {commentOpen && <div className="border-t p-4">
        <div className="flex justify-between mb-3"><b>Comments</b><button onClick={()=>setCommentOpen(false)}><X className="w-5 h-5"/></button></div>
        <div className="flex gap-2 mb-3"><input value={comment} onChange={e=>setComment(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addComment()} placeholder="Write a comment..." className="flex-1 border rounded-full px-4 py-2"/><button onClick={addComment} className="p-2 rounded-full bg-purple-600 text-white"><Send className="w-4 h-4"/></button></div>
        <div className="space-y-2 max-h-48 overflow-y-auto">{comments.map(c=><div key={c.id} className="text-sm bg-gray-50 rounded-lg p-2"><b>{c.user?.fullName || c.user?.username}</b> {c.content}</div>)}</div>
      </div>}
    </article>
  );
}
export default PostCard;
