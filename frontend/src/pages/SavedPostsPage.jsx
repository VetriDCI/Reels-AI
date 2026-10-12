import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bookmark, Film, Image as ImageIcon, Trash2, WifiOff } from 'lucide-react';
import { savedPostAPI } from '../services/api';
import { listOffline, removeOffline, saveOffline } from '../utils/offlineSaved';
import PostCard from '../components/PostCard';

// One saved post played from the copy stored on this device (works with no internet).
function OfflineSavedCard({ item, onRemove }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    const url = URL.createObjectURL(item.blob);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [item.blob]);
  const post = item.post;
  const isVideo = post.mediaType === 'video' || item.blob.type.startsWith('video/');
  return <div className="relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="px-4 pt-3 pb-2 text-sm font-semibold text-gray-800">{post.user?.fullName || post.user?.username || 'Saved post'}</div>
    {src && (isVideo
      ? <video src={src} controls playsInline preload="metadata" className="w-full max-h-[70vh] bg-black" />
      : <img src={src} alt={post.content || 'Saved'} className="w-full max-h-[70vh] object-contain bg-black" />)}
    {post.content && <p className="px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap break-words">{post.content}</p>}
    <button onClick={() => onRemove(post.id)} className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 shadow border text-gray-600 hover:text-red-600" aria-label="Remove saved"><Trash2 className="w-4 h-4" /></button>
  </div>;
}

export default function SavedPostsPage({ onBack, searchQuery = '' }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [offlineItems, setOfflineItems] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await savedPostAPI.list();
      const list = r.data?.data || [];
      setItems(list); setOffline(false);
      keepOffline(list);
    } catch (e) {
      console.error('Saved posts load error', e);
      if (!e.response) await showOffline();
    }
    finally { setLoading(false); }
  };
  const showOffline = async () => { setOfflineItems(await listOffline().catch(() => [])); setOffline(true); };
  // Keeps a copy of every saved post on this device, one by one in the background.
  const keepOffline = async (list) => {
    if (navigator.connection?.saveData) return;
    for (const entry of list) { if (entry.post?.mediaUrl) await saveOffline(entry.post).catch(() => {}); }
  };
  useEffect(() => {
    load();
    const goOnline = () => load();
    const goOffline = () => showOffline();
    window.addEventListener('online', goOnline); window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = (offline ? offlineItems : items).filter(x => { const q = String(searchQuery || '').trim().toLowerCase(); const matchesPage = !q || [x.post?.content, x.post?.user?.fullName, x.post?.user?.username, ...(x.post?.hashtags || [])].filter(Boolean).join(' ').toLowerCase().includes(q); return matchesPage && (filter === 'all' || (filter === 'reels' ? x.post?.mediaType === 'video' : x.post?.mediaType !== 'video')); });
  const removeOfflineCopy = async (id) => { await removeOffline(id); setOfflineItems(prev => prev.filter(x => x.post?.id !== id)); };
  const remove = async (id) => { try { await savedPostAPI.remove(id); removeOffline(id); setItems(prev => prev.filter(x => x.post?.id !== id)); } catch (e) { alert(e.response?.data?.message || 'Unable to remove saved post'); } };

  return <div className="min-h-screen bg-gray-50 pb-24">
    <header className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center gap-3">
      <button onClick={onBack} aria-label="Back"><ArrowLeft className="w-5 h-5" /></button>
      <Bookmark className="w-5 h-5 text-purple-600" /><h1 className="font-bold text-lg">Saved</h1>
    </header>
    <div className="px-4 py-3 flex gap-2 overflow-x-auto">
      {[['all','All',Bookmark],['posts','Posts',ImageIcon],['reels','Reels',Film]].map(([key,label,Icon]) => <button key={key} onClick={() => setFilter(key)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${filter === key ? 'bg-purple-600 text-white' : 'bg-white border text-gray-600'}`}><Icon className="w-4 h-4" />{label}</button>)}
    </div>
    {offline && <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"><WifiOff className="w-4 h-4 shrink-0" />You are offline. Showing saved posts stored on this device.</div>}
    {loading ? <div className="py-20 text-center text-gray-400">Loading saved content…</div> : filtered.length === 0 ? <div className="py-20 text-center px-6"><Bookmark className="w-12 h-12 mx-auto text-gray-300" /><p className="font-semibold text-gray-600 mt-3">No saved {filter === 'all' ? 'posts or reels' : filter} yet</p><p className="text-sm text-gray-400 mt-1">{offline ? 'Nothing is stored on this device yet. Open Saved once with internet to keep your saved videos offline.' : 'Use Save to Saved on a post or reel to keep it here.'}</p></div> : <div className="px-4 space-y-4">{filtered.map(item => item.post && (offline ? <OfflineSavedCard key={item.post.id} item={item} onRemove={removeOfflineCopy} /> : <div key={item.post.id} className="relative"><PostCard post={{...item.post, _saved: true}} onLike={() => {}} onChanged={load} /><button onClick={() => remove(item.post.id)} className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 shadow border text-gray-600 hover:text-red-600" aria-label="Remove saved"><Trash2 className="w-4 h-4" /></button></div>))}</div>}
  </div>;
}
