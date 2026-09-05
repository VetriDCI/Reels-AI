import React, { useEffect, useState } from 'react';
import { Heart, MessageSquare, Share2, Trash2, Send, X, Eye, Download, MoreHorizontal, Link2, Flag, Play, ExternalLink } from 'lucide-react';
import { postAPI, followAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { downloadMedia } from '../utils/download';

function PostCard({ post, onLike, onOpenReel }) {
  const { user } = useAuth();
  const [commentOpen, setCommentOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [following, setFollowing] = useState(false);
  const [views, setViews] = useState(post.viewCount || 0);

  useEffect(() => {
    setViews(post.viewCount || 0);
  }, [post.viewCount]);

  const handleFollow = async () => {
    if (!post.user?.id || post.user.id === user?.id) return;
    try {
      const res = await followAPI.follow(post.user.id);
      setFollowing(Boolean(res.data.data.following));
    } catch (err) { console.error('Failed to follow', err); }
  };

  const recordView = async () => {
    try {
      const res = await postAPI.view(post.id);
      if (typeof res.data.data?.viewCount === 'number') setViews(res.data.data.viewCount);
    } catch (err) { console.debug('View count unavailable', err); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try { await postAPI.delete(post.id); window.location.reload(); }
    catch (error) { alert(error.response?.data?.message || 'Failed to delete post'); }
  };

  const loadComments = async () => {
    setCommentOpen(true);
    setCommentLoading(true);
    try {
      const res = await postAPI.getById(post.id);
      setComments(res.data.data.comments || []);
    } catch (e) {
      console.error(e);
      setComments([]);
    } finally { setCommentLoading(false); }
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
      else { await navigator.clipboard.writeText(url); }
      setSharing(true); setTimeout(() => setSharing(false), 1200);
    } catch {}
  };

  const handleDownload = async () => {
    if (!post.mediaUrl || downloading) return;
    setDownloading(true);
    const ext = post.mediaType === 'video' ? 'mp4' : 'jpg';
    const result = await downloadMedia(post.mediaUrl, `ra-social-${post.id}.${ext}`, postAPI.download(post.id));
    if (!result.success && result.error) console.warn(result.error);
    setDownloading(false);
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/?post=${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Post link copied');
    } catch { window.prompt('Copy this link:', url); }
    setMenuOpen(false);
  };

  const openMedia = () => {
    if (post.mediaUrl) window.open(post.mediaUrl, '_blank', 'noopener,noreferrer');
    setMenuOpen(false);
  };

  const reportPost = () => {
    alert('Post reported. Our team will review it shortly.');
    setMenuOpen(false);
  };

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3 min-w-0">
          <img src={post.user?.avatarUrl || `https://i.pravatar.cc/150?u=${post.user?.id}`} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate">{post.user?.fullName || post.user?.username}</h3>
              {post.user?.id !== user?.id && (
                <button onClick={handleFollow} className={`px-4 py-1.5 rounded-full text-sm font-semibold ${following ? 'bg-gray-100 text-gray-600' : 'bg-purple-600 text-white'}`}>
                  {following ? 'Joined' : 'Join'}
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500">@{post.user?.username}</p>
          </div>
        </div>
        {user?.id === post.user?.id && (
          <button onClick={handleDelete} className="p-2 hover:bg-red-50 rounded-full text-gray-500 hover:text-red-600 shrink-0" aria-label="Delete post">
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {post.content && <div className="px-4 pb-3"><p className="text-gray-800 whitespace-pre-wrap break-words">{post.content}</p>
        {post.hashtags?.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{post.hashtags.map((tag,i)=><span key={i} className="text-purple-600 text-sm font-medium">#{String(tag).replace(/^#/,'')}</span>)}</div>}
      </div>}

      {post.mediaUrl && <div className="px-4 pb-3">
        {post.mediaType === 'video' ? (
          <button type="button" onClick={() => { recordView(); onOpenReel?.(post); }} className="relative w-full max-h-[70vh] rounded-lg bg-black overflow-hidden block" aria-label="Open video in Reels">
            <video src={post.mediaUrl} playsInline preload="metadata" muted controls={false} className="w-full max-h-[70vh] object-contain bg-black pointer-events-none" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" />
              </span>
            </span>
          </button>
        ) : (
          <button type="button" onClick={recordView} className="block w-full text-left">
            <img src={post.mediaUrl} alt="Post media" loading="lazy" className="w-full max-h-[70vh] object-contain rounded-lg bg-gray-100" onError={e => {e.currentTarget.alt='Media unavailable';}} />
          </button>
        )}
      </div>}

      <div className="flex items-center gap-3 px-4 py-3 border-t overflow-x-auto">
        <button onClick={recordView} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 shrink-0" aria-label="Views">
          <Eye className="w-6 h-6" /><span>{views.toLocaleString()}</span>
        </button>
        <button onClick={onLike} className="flex items-center gap-1.5 text-gray-600 hover:text-red-500 shrink-0" aria-label="Like">
          <Heart className="w-6 h-6" /><span>{post.likesCount || 0}</span>
        </button>
        <button onClick={loadComments} className="flex items-center gap-1.5 text-gray-600 hover:text-blue-500 shrink-0" aria-label="Comments">
          <MessageSquare className="w-6 h-6" /><span>{post.commentsCount || 0}</span>
        </button>
        <button onClick={share} className="flex items-center gap-1.5 text-gray-600 hover:text-green-500 shrink-0" aria-label="Share">
          <Share2 className="w-6 h-6" /><span className="hidden sm:inline text-xs">{sharing ? 'Copied' : 'Share'}</span>
        </button>
        {post.mediaUrl && (
          <button onClick={handleDownload} disabled={downloading} aria-label="Download" className="flex items-center gap-1.5 text-gray-600 hover:text-purple-600 disabled:opacity-50 shrink-0">
            <Download className="w-6 h-6" /><span className="hidden sm:inline text-xs">{downloading ? 'Saving…' : 'Download'}</span>
          </button>
        )}
        <div className="relative shrink-0">
          <button onClick={() => setMenuOpen(v => !v)} aria-label="More options" className="p-1 text-gray-600 hover:text-gray-900">
            <MoreHorizontal className="w-6 h-6" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-[60] w-52 bg-white rounded-xl shadow-2xl border py-1">
              {post.mediaUrl && <button onClick={() => {
                try {
                  const saved = JSON.parse(localStorage.getItem('ra_social_saved_posts') || '[]');
                  const next = saved.includes(post.id) ? saved : [...saved, post.id];
                  localStorage.setItem('ra_social_saved_posts', JSON.stringify(next));
                  alert('Saved to app');
                } catch {}
                setMenuOpen(false);
              }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><Download className="w-4 h-4" />Save to app</button>}
              {post.mediaUrl && <button onClick={openMedia} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><ExternalLink className="w-4 h-4" />Open media</button>}
              <button onClick={copyLink} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><Link2 className="w-4 h-4" />Copy link</button>
              <button onClick={reportPost} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"><Flag className="w-4 h-4" />Report</button>
            </div>
          )}
        </div>
      </div>

      {commentOpen && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setCommentOpen(false)}>
          <div className="bg-white w-full sm:max-w-lg max-h-[75vh] rounded-t-2xl sm:rounded-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <b className="text-gray-900">Comments</b>
              <button onClick={() => setCommentOpen(false)} aria-label="Close comments"><X className="w-5 h-5 text-gray-600" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {commentLoading && <p className="text-sm text-gray-400 text-center py-6">Loading comments…</p>}
              {!commentLoading && comments.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No comments yet. Be the first!</p>}
              {comments.map(c=><div key={c.id} className="text-sm bg-gray-50 rounded-lg p-3 text-gray-800"><b>{c.user?.fullName || c.user?.username}</b><div className="mt-1">{c.content}</div></div>)}
            </div>
            <div className="flex gap-2 p-4 border-t">
              <input autoFocus value={comment} onChange={e=>setComment(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addComment()} placeholder="Write a comment..." className="flex-1 border rounded-full px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
              <button onClick={addComment} className="p-2 rounded-full bg-purple-600 text-white" aria-label="Send comment"><Send className="w-4 h-4"/></button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
export default PostCard;
