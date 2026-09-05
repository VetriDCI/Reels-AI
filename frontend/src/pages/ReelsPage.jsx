import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Download, MoreHorizontal, Eye, Bell, Search as SearchIcon, X, Send, Link2, Flag, ExternalLink } from 'lucide-react';
import { postAPI, followAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { downloadMedia } from '../utils/download';

export default function ReelsPage({ onNotifications, onSearch, initialPostId }) {
  const { user: currentUser } = useAuth();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [videoErrors, setVideoErrors] = useState({});
  const [sharedId, setSharedId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [menuForId, setMenuForId] = useState(null);
  const [commentReel, setCommentReel] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [views, setViews] = useState({});
  const containerRef = useRef(null);
  const itemRefs = useRef({});
  const videoRefs = useRef({});

  useEffect(() => { loadReels(); }, []);

  useEffect(() => {
    if (!initialPostId || reels.length === 0) return;
    const idx = reels.findIndex(r => r.id === initialPostId);
    if (idx < 0) return;
    setCurrent(idx);
    setTimeout(() => itemRefs.current[initialPostId]?.scrollIntoView({ behavior: 'auto', block: 'start' }), 50);
  }, [initialPostId, reels]);

  useEffect(() => {
    // Also support a shared ?post=<id> URL.
    const id = new URLSearchParams(window.location.search).get('post');
    if (!initialPostId && id && reels.length) {
      const idx = reels.findIndex(r => r.id === id);
      if (idx >= 0) {
        setCurrent(idx);
        setTimeout(() => itemRefs.current[id]?.scrollIntoView({ behavior: 'auto', block: 'start' }), 50);
      }
    }
  }, [reels, initialPostId]);

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([id, video]) => {
      if (!video) return;
      const shouldPlay = reels[current]?.id === id;
      if (shouldPlay) {
        video.play().catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
    const active = reels[current];
    if (active) recordView(active.id);
  }, [current, reels]);

  const loadReels = async () => {
    try {
      const res = await postAPI.getFeed(1, 50);
      const videos = (res.data.data || []).filter(p => p.mediaType === 'video' && p.mediaUrl);
      setReels(videos);
      const initialViews = {};
      videos.forEach(v => { initialViews[v.id] = v.viewCount || 0; });
      setViews(initialViews);
    } catch (err) { console.error('Failed to load reels', err); }
    finally { setLoading(false); }
  };

  const recordView = async (postId) => {
    try {
      const res = await postAPI.view(postId);
      if (typeof res.data.data?.viewCount === 'number') {
        setViews(prev => ({ ...prev, [postId]: res.data.data.viewCount }));
      }
    } catch (err) { console.debug('View count unavailable', err); }
  };

  const handleLike = async (postId) => {
    try {
      const res = await postAPI.like(postId);
      const liked = Boolean(res.data.data?.liked);
      setReels(prev => prev.map(r => r.id === postId ? {
        ...r, _liked: liked, likesCount: Math.max(0, (r.likesCount || 0) + (liked ? 1 : -1))
      } : r));
    } catch (err) { console.error('Failed to like', err); }
  };

  const handleFollow = async (userId, postId) => {
    if (!userId || userId === currentUser?.id) return;
    try {
      const res = await followAPI.follow(userId);
      setReels(prev => prev.map(r => r.id === postId ? { ...r, _following: Boolean(res.data.data.following) } : r));
    } catch (err) { console.error('Failed to follow', err); }
  };

  const handleShare = async (reel) => {
    const url = `${window.location.origin}/?post=${reel.id}`;
    try {
      if (navigator.share) await navigator.share({ title: 'RA Social reel', text: reel.content || 'Check this reel', url });
      else await navigator.clipboard.writeText(url);
      setSharedId(reel.id);
      setTimeout(() => setSharedId(null), 1500);
    } catch {}
  };

  const handleDownload = async (reel) => {
    if (downloadingId) return;
    setDownloadingId(reel.id);
    const result = await downloadMedia(reel.mediaUrl, `ra-social-reel-${reel.id}.mp4`, postAPI.download(reel.id));
    if (!result.success && result.error) alert(`Download could not start: ${result.error}`);
    setDownloadingId(null);
  };

  const openComments = async (reel) => {
    setCommentReel(reel);
    setComments([]);
    setCommentLoading(true);
    try {
      const res = await postAPI.getById(reel.id);
      setComments(res.data.data.comments || []);
    } catch (err) { console.error('Failed to load comments', err); }
    finally { setCommentLoading(false); }
  };

  const addComment = async () => {
    if (!commentText.trim() || !commentReel) return;
    try {
      const res = await postAPI.addComment(commentReel.id, commentText.trim());
      setComments(prev => [res.data.data, ...prev]);
      setCommentText('');
      setReels(prev => prev.map(r => r.id === commentReel.id ? { ...r, commentsCount: (r.commentsCount || 0) + 1 } : r));
    } catch (err) { alert(err.response?.data?.message || 'Failed to add comment'); }
  };

  const copyLink = async (reel) => {
    const url = `${window.location.origin}/?post=${reel.id}`;
    try { await navigator.clipboard.writeText(url); alert('Reel link copied'); }
    catch { window.prompt('Copy this link:', url); }
    setMenuForId(null);
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const idx = Math.max(0, Math.min(reels.length - 1, Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight)));
    setCurrent(idx);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading reels...</div>;
  if (reels.length === 0) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-2 px-6 text-center"><p className="text-lg font-bold">No reels yet</p><p className="text-sm text-gray-400">Post a video from Home to see it here.</p></div>;

  return (
    <div ref={containerRef} onScroll={handleScroll} className="h-screen w-full bg-black overflow-y-scroll snap-y snap-mandatory">
      {reels.map((reel, i) => (
        <div key={reel.id} ref={el => { itemRefs.current[reel.id] = el; }} className="relative h-screen w-full snap-start flex items-center justify-center bg-black">
          <video
            ref={el => { videoRefs.current[reel.id] = el; }}
            src={reel.mediaUrl}
            className="h-full w-full object-contain"
            loop muted playsInline preload={i === current ? 'auto' : 'metadata'}
            controls={i === current}
            onPlay={() => recordView(reel.id)}
            onError={() => setVideoErrors(prev => ({ ...prev, [reel.id]: true }))}
          />
          {videoErrors[reel.id] && <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 rounded-xl bg-black/80 p-4 text-center text-sm text-red-300">This video could not be loaded.</div>}

          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 text-white bg-gradient-to-b from-black/60 to-transparent pb-8 pointer-events-none">
            <span className="font-bold text-lg">RA Social</span>
            <div className="flex items-center gap-4 pointer-events-auto">
              <button onClick={onSearch} aria-label="Search"><SearchIcon className="w-5 h-5" /></button>
              <button onClick={onNotifications} aria-label="Notifications"><Bell className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="absolute right-3 bottom-32 flex flex-col items-center gap-4 text-white">
            <div className="flex flex-col items-center gap-1"><Eye className="w-6 h-6" /><span className="text-xs">{(views[reel.id] || 0).toLocaleString()}</span></div>
            <button onClick={() => handleLike(reel.id)} className="flex flex-col items-center gap-1"><Heart className={`w-7 h-7 ${reel._liked ? 'fill-pink-500 text-pink-500' : ''}`} /><span className="text-xs">{reel.likesCount || 0}</span></button>
            <button onClick={() => openComments(reel)} className="flex flex-col items-center gap-1"><MessageCircle className="w-6 h-6" /><span className="text-xs">{reel.commentsCount || 0}</span></button>
            <button onClick={() => handleShare(reel)} className="flex flex-col items-center gap-1"><Share2 className="w-6 h-6" /><span className="text-xs">{sharedId === reel.id ? 'Copied!' : 'Share'}</span></button>
            <button onClick={() => handleDownload(reel)} disabled={downloadingId === reel.id} className="flex flex-col items-center gap-1 disabled:opacity-50"><Download className="w-6 h-6" /><span className="text-xs">{downloadingId === reel.id ? 'Saving...' : 'Download'}</span></button>
            <div className="relative">
              <button onClick={() => setMenuForId(menuForId === reel.id ? null : reel.id)} aria-label="More options"><MoreHorizontal className="w-6 h-6" /></button>
              {menuForId === reel.id && (
                <div className="absolute right-8 bottom-0 z-[60] w-48 bg-white rounded-xl shadow-2xl py-1 text-gray-800">
                  <button onClick={() => handleDownload(reel)} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"><Download className="w-4 h-4" />Download</button>
                  <button onClick={() => copyLink(reel)} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"><Link2 className="w-4 h-4" />Copy link</button>
                  <button onClick={() => { window.open(reel.mediaUrl, '_blank', 'noopener,noreferrer'); setMenuForId(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"><ExternalLink className="w-4 h-4" />Open media</button>
                  <button onClick={() => setMenuForId(null)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><Flag className="w-4 h-4" />Report</button>
                </div>
              )}
            </div>
          </div>

          <div className="absolute left-4 right-20 bottom-8 text-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center text-xs font-bold">{(reel.user?.fullName?.[0] || reel.user?.username?.[0] || 'U').toUpperCase()}</div>
              <span className="font-semibold text-sm">{reel.user?.fullName || reel.user?.username}</span>
              {reel.user?.id !== currentUser?.id && <button onClick={() => handleFollow(reel.user?.id, reel.id)} className="px-3 py-1 bg-blue-500 rounded-full text-xs font-semibold">{reel._following ? 'Following' : 'Follow'}</button>}
            </div>
            <p className="text-sm">{reel.content}</p>
            {reel.hashtags?.length > 0 && <p className="text-xs text-blue-300 mt-1">{reel.hashtags.map(h => `#${h}`).join(' ')}</p>}
          </div>
        </div>
      ))}

      {commentReel && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setCommentReel(null)}>
          <div className="bg-white w-full sm:max-w-lg max-h-[75vh] rounded-t-2xl sm:rounded-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b"><b className="text-gray-900">Comments</b><button onClick={() => setCommentReel(null)} aria-label="Close"><X className="w-5 h-5 text-gray-600" /></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {commentLoading && <p className="text-sm text-gray-400 text-center py-6">Loading comments...</p>}
              {!commentLoading && comments.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No comments yet. Be the first!</p>}
              {comments.map(c => <div key={c.id} className="text-sm bg-gray-50 rounded-lg p-3 text-gray-800"><b>{c.user?.fullName || c.user?.username}</b><div className="mt-1">{c.content}</div></div>)}
            </div>
            <div className="flex gap-2 p-4 border-t"><input autoFocus value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} placeholder="Write a comment..." className="flex-1 border rounded-full px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500" /><button onClick={addComment} className="p-2 rounded-full bg-purple-600 text-white" aria-label="Send comment"><Send className="w-4 h-4" /></button></div>
          </div>
        </div>
      )}
    </div>
  );
}
