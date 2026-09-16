import React, { useEffect, useRef, useState } from 'react';
import { Bell, Film, Search as SearchIcon, RefreshCw, Heart, MessageSquare, Send, Volume2, VolumeX, X } from 'lucide-react';
import { postAPI } from '../services/api';

export default function ReelsPage({ onNotifications, unreadNotificationCount, onSearch, initialPostId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [muted, setMuted] = useState(true);
  const [commentPost, setCommentPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentText, setCommentText] = useState('');

  const containerRef = useRef(null);
  const videoRefs = useRef({});
  const viewedRef = useRef(new Set());

  const load = async () => {
    try {
      const res = await postAPI.getFeed(1, 50);
      const posts = res.data?.data || [];
      // Reels contains normal video reels plus explicitly marked Creator Ads.
      // Normal image/text posts stay on Home/feed; only Creator Ads are mixed into Reels.
      const reels = posts.filter(post => post?.mediaType === 'video' || post?.isCreatorAd === true);
      setItems(reels);
      if (initialPostId) setTimeout(() => document.getElementById(`reel-post-${initialPostId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e) { console.error('Failed to load reels feed', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (initialPostId && items.length) setTimeout(() => document.getElementById(`reel-post-${initialPostId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100); }, [initialPostId, items]);

  // Autoplay the reel that's in view, pause the rest, and record a view once per post.
  useEffect(() => {
    const root = containerRef.current;
    if (!root || !items.length) return undefined;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const id = entry.target.getAttribute('data-post-id');
        const video = videoRefs.current[id];
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          if (video) video.play().catch(() => {});
          if (!viewedRef.current.has(id)) { viewedRef.current.add(id); postAPI.view(id).catch(() => {}); }
        } else if (video) {
          video.pause();
        }
      });
    }, { root, threshold: [0, 0.6, 1] });
    root.querySelectorAll('[data-post-id]').forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [items]);

  const refresh = () => { setRefreshing(true); load(); };

  const handleLike = async (postId) => {
    try {
      const res = await postAPI.like(postId);
      const liked = Boolean(res.data?.data?.liked);
      setItems(prev => prev.map(p => p.id === postId ? { ...p, _liked: liked, likesCount: Math.max(0, Number(p.likesCount || 0) + (liked ? 1 : -1)) } : p));
    } catch (e) { console.error('Failed to like post', e); }
  };

  const togglePlay = (id) => {
    const video = videoRefs.current[id];
    if (!video) return;
    if (video.paused) video.play().catch(() => {}); else video.pause();
  };

  const openComments = async (post) => {
    setCommentPost(post); setCommentLoading(true); setComments([]);
    try { const res = await postAPI.getById(post.id); setComments(res.data.data.comments || []); } catch { setComments([]); } finally { setCommentLoading(false); }
  };
  const addComment = async () => {
    const text = commentText.trim(); if (!text || !commentPost) return;
    try {
      const res = await postAPI.addComment(commentPost.id, text);
      setComments(prev => [res.data.data, ...prev]);
      setItems(prev => prev.map(p => p.id === commentPost.id ? { ...p, commentsCount: Number(p.commentsCount || 0) + 1 } : p));
      setCommentText('');
    } catch (e) { alert(e.response?.data?.message || 'Failed to add comment'); }
  };
  const share = async (post) => {
    const url = `${window.location.origin}/?post=${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: 'RA Social post', text: post.content || 'Check this reel', url });
      else { await navigator.clipboard.writeText(url); alert('Link copied'); }
    } catch {}
  };

  if (loading) return <div className="h-[100dvh] bg-black flex items-center justify-center text-white">Loading reels…</div>;

  return (
    <div className="relative h-[100dvh] bg-black overflow-hidden">
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 py-3 bg-gradient-to-b from-black/70 to-transparent text-white">
        <div className="flex items-center gap-2 font-extrabold"><Film className="w-5 h-5" />RA Social</div>
        <button onClick={() => onSearch('')} className="flex-1 max-w-md mx-auto flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-2 text-left text-sm text-white/80"><SearchIcon className="w-5 h-5 shrink-0" /><span className="truncate">Search people, posts or hashtags</span></button>
        <button onClick={refresh} aria-label="Refresh" className="p-1"><RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} /></button>
        <button onClick={onNotifications} aria-label="Notifications" className="relative p-1"><Bell className="w-5 h-5" />{unreadNotificationCount > 0 && <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] rounded-full bg-red-500 text-[9px] leading-[16px] text-center font-bold">{unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}</span>}</button>
      </div>

      {!items.length ? (
        <div className="h-full flex items-center justify-center text-center text-gray-400 px-6">
          <div><Film className="w-12 h-12 mx-auto mb-3" /><p>No reels yet</p></div>
        </div>
      ) : (
        <div ref={containerRef} className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
          {items.map((post) => (
            <div id={`reel-post-${post.id}`} key={post.id} data-post-id={post.id} className="relative h-[100dvh] w-full snap-start snap-always flex items-center justify-center bg-black">
              {post.mediaType === 'video' ? (
                <video
                  ref={(el) => { if (el) videoRefs.current[post.id] = el; }}
                  src={post.mediaUrl}
                  className="h-full w-full object-contain bg-black"
                  loop
                  playsInline
                  muted={muted}
                  onClick={() => togglePlay(post.id)}
                />
              ) : (
                <img src={post.mediaUrl} alt="" className="h-full w-full object-contain bg-black" />
              )}

              {post.isCreatorAd && <span className="absolute top-16 left-4 z-20 text-[10px] font-bold uppercase tracking-wide bg-yellow-400 text-black px-2 py-0.5 rounded-full">Sponsored</span>}

              {post.mediaType === 'video' && (
                <button onClick={() => setMuted(m => !m)} aria-label="Toggle sound" className="absolute top-16 right-4 z-20 p-2 rounded-full bg-black/40 text-white">
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              )}

              <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-5 text-white">
                <button onClick={() => handleLike(post.id)} className="flex flex-col items-center gap-1">
                  <span className={`p-2 rounded-full bg-black/30 ${post._liked ? 'text-red-500' : ''}`}><Heart className="w-6 h-6" fill={post._liked ? 'currentColor' : 'none'} /></span>
                  <span className="text-xs font-semibold">{post.likesCount || 0}</span>
                </button>
                <button onClick={() => openComments(post)} className="flex flex-col items-center gap-1">
                  <span className="p-2 rounded-full bg-black/30"><MessageSquare className="w-6 h-6" /></span>
                  <span className="text-xs font-semibold">{post.commentsCount || 0}</span>
                </button>
                <button onClick={() => share(post)} className="flex flex-col items-center gap-1">
                  <span className="p-2 rounded-full bg-black/30"><Send className="w-6 h-6" /></span>
                  <span className="text-xs font-semibold">Share</span>
                </button>
              </div>

              <div className="absolute left-0 right-16 bottom-6 z-20 px-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <img src={post.user?.avatarUrl || `https://i.pravatar.cc/80?u=${post.user?.id}`} alt="" className="w-9 h-9 rounded-full object-cover border border-white/40" />
                  <span className="font-semibold text-sm">{post.user?.fullName || post.user?.username}</span>
                </div>
                {post.content && <p className="text-sm leading-snug line-clamp-3 whitespace-pre-wrap break-words">{post.content}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {commentPost && (
        <div className="absolute inset-0 z-40 bg-black/50 flex items-end" onClick={() => setCommentPost(null)}>
          <div className="bg-white w-full max-h-[70vh] rounded-t-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b"><b>Comments</b><button onClick={() => setCommentPost(null)}><X className="w-5 h-5" /></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {commentLoading && <p className="text-sm text-gray-400 text-center">Loading comments…</p>}
              {!commentLoading && comments.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No comments yet.</p>}
              {comments.map(c => (
                <div key={c.id} className="rounded-xl bg-gray-50 p-3">
                  <div className="flex items-start gap-2">
                    <img src={c.user?.avatarUrl || `https://i.pravatar.cc/80?u=${c.user?.id}`} className="w-8 h-8 rounded-full" alt="" />
                    <div className="flex-1">
                      <b className="text-sm">{c.user?.fullName || c.user?.username}</b>
                      <p className="text-sm text-gray-700 mt-1 break-words">{c.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t flex gap-2">
              <input autoFocus value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} placeholder="Write a comment…" className="flex-1 border rounded-full px-4 py-2 text-sm outline-none" />
              <button onClick={addComment} className="p-2 rounded-full bg-purple-600 text-white"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
