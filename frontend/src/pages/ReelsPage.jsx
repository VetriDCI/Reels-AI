import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Download, MoreHorizontal, Eye, Bell, Search as SearchIcon } from 'lucide-react';
import { postAPI, followAPI } from '../services/api';

export default function ReelsPage() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [videoErrors, setVideoErrors] = useState({});
  const containerRef = useRef(null);

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    try {
      const res = await postAPI.getFeed(1, 30);
      const videos = (res.data.data || []).filter((p) => p.mediaType === 'video' && p.mediaUrl);
      setReels(videos);
    } catch (err) {
      console.error('Failed to load reels', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await postAPI.like(postId);
      setReels((prev) =>
        prev.map((r) => {
          if (r.id !== postId) return r;
          const liked = !r._liked;
          return { ...r, _liked: liked, likesCount: (r.likesCount || 0) + (liked ? 1 : -1) };
        })
      );
    } catch (err) {
      console.error('Failed to like', err);
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const idx = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
    setCurrent(idx);
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading reels...</div>;
  }

  if (reels.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-2 px-6 text-center">
        <p className="text-lg font-bold">No reels yet</p>
        <p className="text-sm text-gray-400">Post a video from Home to see it here.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-screen w-full bg-black overflow-y-scroll snap-y snap-mandatory"
    >
      {reels.map((reel, i) => (
        <div key={reel.id} className="relative h-screen w-full snap-start flex items-center justify-center bg-black">
          <video
            src={reel.mediaUrl}
            className="h-full w-full object-cover"
            loop
            muted
            playsInline
            autoPlay={i === current}
            controls
            onError={() => setVideoErrors(prev => ({ ...prev, [reel.id]: true }))}
          />
          {videoErrors[reel.id] && <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 rounded-xl bg-black/80 p-4 text-center text-sm text-red-300">This video could not be loaded. The media URL may have expired.</div>}

          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 text-white bg-gradient-to-b from-black/60 to-transparent pb-8">
            <span className="font-bold text-lg flex items-center gap-1">
              <span className="text-pink-400">▶</span> RA Social
            </span>
            <div className="flex items-center gap-4">
              <SearchIcon className="w-5 h-5" />
              <Bell className="w-5 h-5" />
            </div>
          </div>

          <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 text-white">
            <div className="flex flex-col items-center gap-1">
              <Eye className="w-6 h-6" />
              <span className="text-xs">{((reel.likesCount || 0) * 8).toLocaleString()}</span>
            </div>
            <button onClick={() => handleLike(reel.id)} className="flex flex-col items-center gap-1">
              <Heart className={`w-7 h-7 ${reel._liked ? 'fill-pink-500 text-pink-500' : ''}`} />
              <span className="text-xs">{reel.likesCount || 0}</span>
            </button>
            <div className="flex flex-col items-center gap-1">
              <MessageCircle className="w-6 h-6" />
              <span className="text-xs">{reel.commentsCount || 0}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Share2 className="w-6 h-6" />
              <span className="text-xs">Share</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Download className="w-6 h-6" />
              <span className="text-xs">Save</span>
            </div>
            <MoreHorizontal className="w-6 h-6" />
          </div>

          <div className="absolute left-4 right-20 bottom-8 text-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center text-xs font-bold">
                {(reel.user?.fullName?.[0] || reel.user?.username?.[0] || 'U').toUpperCase()}
              </div>
              <span className="font-semibold text-sm">{reel.user?.fullName || reel.user?.username}</span>
              <button className="px-3 py-1 bg-blue-500 rounded-full text-xs font-semibold">Follow</button>
            </div>
            <p className="text-sm">{reel.content}</p>
            {reel.hashtags?.length > 0 && (
              <p className="text-xs text-blue-300 mt-1">{reel.hashtags.map((h) => `#${h}`).join(' ')}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
