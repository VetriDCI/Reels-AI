import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Send, Paperclip, Smile, Plus, Search, X, MessageCircle, Check, CheckCheck, ArrowLeft, Camera, ImagePlus, Trash2, ChevronLeft, ChevronRight, Clock3, Reply, Forward, Pin, MoreVertical } from 'lucide-react';
import api, { searchAPI, chatAPI, vibeAPI, userSafetyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
const EMOJIS = ['😀','😂','😍','🥰','😎','👍','❤️','🔥','🎉','👏','🙏','😊','😢','😮','🤝','✨'];

const formatRemaining = (expiresAt) => {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m left`;
};

function VibeViewer({ vibes, index, userId, onClose, onDelete }) {
  const vibe = vibes[index];
  const [remaining, setRemaining] = useState(vibe ? formatRemaining(vibe.expiresAt) : '');
  useEffect(() => {
    if (!vibe) return undefined;
    setRemaining(formatRemaining(vibe.expiresAt));
    const id = setInterval(() => setRemaining(formatRemaining(vibe.expiresAt)), 30000);
    return () => clearInterval(id);
  }, [vibe?.id, vibe?.expiresAt]);
  if (!vibe) return null;
  return (
    <div className="fixed inset-0 z-[140] bg-black flex items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 z-20 p-3 rounded-full bg-white/10 text-white"><X /></button>
      <div className="absolute top-4 left-4 right-16 z-10 text-white">
        <div className="h-1 bg-white/30 rounded-full"><div className="h-full bg-white w-full" /></div>
        <div className="mt-3 flex items-center gap-3"><img src={vibe.user?.avatarUrl || `https://i.pravatar.cc/80?u=${vibe.userId}`} className="w-9 h-9 rounded-full object-cover" alt="" /><div><b>{vibe.user?.fullName || vibe.user?.username}</b><p className="text-xs text-white/70">@{vibe.user?.username} · {remaining}</p></div></div>
      </div>
      {index > 0 && <button onClick={() => window.dispatchEvent(new CustomEvent('ra-vibe-prev'))} className="absolute left-3 p-3 rounded-full bg-white/10 text-white z-10"><ChevronLeft /></button>}
      <div className="w-full h-full flex items-center justify-center p-4 md:p-12">
        {vibe.mediaType === 'video' ? <video src={vibe.mediaUrl} controls autoPlay playsInline className="max-w-full max-h-full object-contain rounded-xl" /> : <img src={vibe.mediaUrl} alt={vibe.caption || 'Vibe'} className="max-w-full max-h-full object-contain rounded-xl" />}
      </div>
      {index < vibes.length - 1 && <button onClick={() => window.dispatchEvent(new CustomEvent('ra-vibe-next'))} className="absolute right-3 p-3 rounded-full bg-white/10 text-white z-10"><ChevronRight /></button>}
      {vibe.caption && <div className="absolute bottom-8 left-1/2 -translate-x-1/2 max-w-[90%] bg-black/60 text-white px-4 py-2 rounded-xl text-sm text-center">{vibe.caption}</div>}
      {vibe.userId === userId && <button onClick={() => onDelete(vibe.id)} className="absolute bottom-5 right-5 p-3 rounded-full bg-red-600 text-white"><Trash2 className="w-5 h-5" /></button>}
    </div>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]), [selectedChat, setSelectedChat] = useState(null), [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(''), [loading, setLoading] = useState(true), [newChatOpen, setNewChatOpen] = useState(false);
  const [userQuery, setUserQuery] = useState(''), [userResults, setUserResults] = useState([]), [phoneQuery, setPhoneQuery] = useState(''), [inviteNumber, setInviteNumber] = useState('');
  const [phoneSearching, setPhoneSearching] = useState(false), [sending, setSending] = useState(false), [emojiOpen, setEmojiOpen] = useState(false), [userSearchLoading, setUserSearchLoading] = useState(false);
  const [galleryFile, setGalleryFile] = useState(null), [messageMenu, setMessageMenu] = useState(null), [replyingTo, setReplyingTo] = useState(null), [forwardingMessage, setForwardingMessage] = useState(null), [deletingMessage, setDeletingMessage] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]), [typingUserId, setTypingUserId] = useState(null);
  const [safetyOpen, setSafetyOpen] = useState(false), [safety, setSafety] = useState({ blocked: false, muted: false, restricted: false });
  const [vibes, setVibes] = useState([]), [vibeComposerOpen, setVibeComposerOpen] = useState(false), [vibeFile, setVibeFile] = useState(null), [vibeCaption, setVibeCaption] = useState(''), [vibeUploading, setVibeUploading] = useState(false), [vibeViewerIndex, setVibeViewerIndex] = useState(null);
  const sendingRef = useRef(false), socketRef = useRef(null), selectedChatRef = useRef(null), endRef = useRef(null), galleryRef = useRef(null), vibeRef = useRef(null), typingTimerRef = useRef(null);

  const other = (chat) => chat?.participants?.find(p => p.id !== user?.id) || chat?.participants?.[0];
  const otherUser = selectedChat ? other(selectedChat) : null;
  const otherOnline = !!otherUser && onlineUserIds.includes(otherUser.id);
  const ownVibe = useMemo(() => vibes.find(v => v.userId === user?.id), [vibes, user?.id]);
  const otherVibes = useMemo(() => vibes.filter(v => v.userId !== user?.id), [vibes, user?.id]);

  useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);
  useEffect(() => {
    if (!otherUser?.id) { setSafety({ blocked: false, muted: false, restricted: false }); setSafetyOpen(false); return; }
    userSafetyAPI.status(otherUser.id).then(r => setSafety(r.data.data || {})).catch(() => setSafety({ blocked: false, muted: false, restricted: false }));
    setSafetyOpen(false);
  }, [otherUser?.id]);

  const fetchChats = async () => { try { const r = await chatAPI.getChats(); setChats(r.data.data || []); } catch (e) { console.error('Get chats failed', e); } finally { setLoading(false); } };
  const fetchMessages = async (id) => { try { const r = await chatAPI.getMessages(id); setMessages(r.data.data || []); await api.post(`/chats/${id}/read`); } catch (e) { console.error('Get messages failed', e); } };
  const fetchVibes = async () => { try { const r = await vibeAPI.getAll(); setVibes(r.data.data || []); } catch (e) { console.error('Get vibes failed', e); } };

  useEffect(() => {
    const socket = io(SOCKET_URL, { auth: { token: localStorage.getItem('token') }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect_error', e => console.warn('Chat socket unavailable:', e.message));
    socket.on('new_message', data => {
      if (selectedChatRef.current?.id !== data.chatId) return;
      setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data]);
      if (data.senderId !== user?.id) api.post(`/chats/${data.chatId}/read`).catch(() => {});
    });
    socket.on('message_read', ({ chatId, messageIds }) => {
      if (selectedChatRef.current?.id !== chatId) return;
      const ids = new Set(messageIds || []); setMessages(prev => prev.map(m => ids.has(m.id) ? { ...m, isRead: true } : m));
    });
    socket.on('message_hidden', ({ chatId, messageId, userId }) => { if (selectedChatRef.current?.id === chatId && userId === user?.id) setMessages(prev => prev.filter(m => m.id !== messageId)); });
    socket.on('message_deleted', ({ chatId, messageId }) => { if (selectedChatRef.current?.id === chatId) setMessages(prev => prev.filter(m => m.id !== messageId)); });
    socket.on('message_pin_changed', ({ chatId, messageId, pinned }) => { if (selectedChatRef.current?.id === chatId) setMessages(prev => prev.map(m => m.id === messageId ? { ...m, pinned } : m)); });
    socket.on('presence_snapshot', ({ userIds }) => setOnlineUserIds(userIds || []));
    socket.on('user_presence', ({ userId, online }) => setOnlineUserIds(prev => online ? [...new Set([...prev, userId])] : prev.filter(id => id !== userId)));
    socket.on('typing', ({ chatId, userId, isTyping }) => { if (selectedChatRef.current?.id === chatId && userId !== user?.id) setTypingUserId(isTyping ? userId : null); });
    fetchChats(); fetchVibes();
    return () => { if (typingTimerRef.current) clearTimeout(typingTimerRef.current); socket.disconnect(); };
  }, [user?.id]);

  useEffect(() => { if (!selectedChat) { setMessages([]); return; } socketRef.current?.emit('join_chat', selectedChat.id); fetchMessages(selectedChat.id); setTypingUserId(null); }, [selectedChat?.id]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    const prev = () => setVibeViewerIndex(i => i == null ? i : Math.max(0, i - 1));
    const next = () => setVibeViewerIndex(i => i == null ? i : Math.min(vibes.length - 1, i + 1));
    window.addEventListener('ra-vibe-prev', prev); window.addEventListener('ra-vibe-next', next);
    return () => { window.removeEventListener('ra-vibe-prev', prev); window.removeEventListener('ra-vibe-next', next); };
  }, [vibes.length]);

  const emitTyping = (isTyping) => {
    if (!selectedChat || !socketRef.current) return;
    socketRef.current.emit('typing', { chatId: selectedChat.id, isTyping });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (isTyping) typingTimerRef.current = setTimeout(() => socketRef.current?.emit('typing', { chatId: selectedChat.id, isTyping: false }), 1800);
  };
  const uploadAttachment = async (file) => { const form = new FormData(); form.append('file', file); const r = await api.post('/posts/upload', form); return r.data.data.url; };
  const sendReply = async () => {
    if (!selectedChat || !replyingTo) return; const content = newMessage.trim(); if (!content && !galleryFile) return;
    try { const mediaUrl = galleryFile ? await uploadAttachment(galleryFile) : null; const r = await chatAPI.sendMessage(selectedChat.id, content, mediaUrl, replyingTo.id); setMessages(prev => prev.some(m => m.id === r.data.data.id) ? prev : [...prev, r.data.data]); setNewMessage(''); setGalleryFile(null); setReplyingTo(null); fetchChats(); } catch (e) { alert(e.response?.data?.message || 'Failed to send reply'); }
  };
  const sendMessage = async () => {
    emitTyping(false); if (replyingTo) return sendReply();
    const content = newMessage.trim(); if ((!content && !galleryFile) || !selectedChat || sendingRef.current) return;
    sendingRef.current = true; setSending(true);
    try { const mediaUrl = galleryFile ? await uploadAttachment(galleryFile) : null; const r = await chatAPI.sendMessage(selectedChat.id, content, mediaUrl); setMessages(prev => prev.some(m => m.id === r.data.data.id) ? prev : [...prev, r.data.data]); setNewMessage(''); setGalleryFile(null); setEmojiOpen(false); fetchChats(); }
    catch (e) { alert(e.response?.data?.message || 'Failed to send message'); } finally { sendingRef.current = false; setSending(false); }
  };
  const deleteMessage = async (message, mode) => {
    if (!selectedChat || deletingMessage) return; if (!window.confirm(mode === 'everyone' ? 'Delete this message for everyone?' : 'Delete this message for you?')) return;
    setDeletingMessage(true); try { if (mode === 'everyone') await chatAPI.deleteForEveryone(selectedChat.id, message.id); else await chatAPI.deleteForMe(selectedChat.id, message.id); setMessages(prev => prev.filter(m => m.id !== message.id)); setMessageMenu(null); fetchChats(); } catch (e) { alert(e.response?.data?.message || 'Failed to delete message'); } finally { setDeletingMessage(false); }
  };
  const togglePin = async (message) => { try { const r = await chatAPI.pin(selectedChat.id, message.id); setMessages(prev => prev.map(m => m.id === message.id ? { ...m, pinned: r.data.data.pinned } : m)); setMessageMenu(null); } catch (e) { alert(e.response?.data?.message || 'Failed to pin message'); } };
  const forwardTo = async target => { try { await chatAPI.forward(selectedChat.id, forwardingMessage.id, target.id); setForwardingMessage(null); setMessageMenu(null); fetchChats(); } catch (e) { alert(e.response?.data?.message || 'Failed to forward message'); } };
  const toggleSafety = async action => { if (!otherUser?.id) return; try { const r = await userSafetyAPI.toggle(otherUser.id, action); const key = action === 'block' ? 'blocked' : action === 'mute' ? 'muted' : 'restricted'; setSafety(v => ({ ...v, [key]: r.data.data.enabled })); setSafetyOpen(false); if (action === 'block' && r.data.data.enabled) setSelectedChat(null); } catch (e) { alert(e.response?.data?.message || 'Could not update setting'); } };
  const startChatWith = async u => { try { const r = await chatAPI.createChat(u.id); setNewChatOpen(false); setUserResults([]); setUserQuery(''); await fetchChats(); setSelectedChat(r.data.data); } catch (e) { alert(e.response?.data?.message || 'Could not start chat'); } };
  const runUserSearch = async q => { setUserQuery(q); if (!q.trim()) { setUserResults([]); return; } setUserSearchLoading(true); try { const r = await searchAPI.search(q.trim(), 'users'); setUserResults((r.data.data?.users || []).filter(u => u.id !== user?.id)); } catch { setUserResults([]); } finally { setUserSearchLoading(false); } };
  const searchByPhone = async () => { const q = phoneQuery.trim(); if (!q) return; setPhoneSearching(true); try { const r = await searchAPI.search(q, 'users'); const us = (r.data.data?.users || []).filter(u => u.id !== user?.id); if (us[0]) { await startChatWith(us[0]); setPhoneQuery(''); } else { setInviteNumber(q); alert('No RA Social account found. You can invite them.'); } } finally { setPhoneSearching(false); } };
  const inviteViaWhatsApp = () => { const digits = inviteNumber.replace(/\D/g, ''); if (!digits) return alert('Enter a mobile number'); window.open(`https://wa.me/${digits}?text=${encodeURIComponent(`Join me on RA Social! ${window.location.origin}`)}`, '_blank', 'noopener,noreferrer'); };
  const galleryChanged = e => { const f = e.target.files?.[0]; if (f) setGalleryFile(f); e.target.value = ''; };
  const appendEmoji = e => setNewMessage(v => v + e);
  const publishVibe = async () => { if (!vibeFile || vibeUploading) return; setVibeUploading(true); try { const data = await uploadAttachment(vibeFile); const mediaType = vibeFile.type.startsWith('video/') ? 'video' : 'image'; const r = await vibeAPI.create({ mediaUrl: data, mediaType, caption: vibeCaption }); setVibes(prev => [r.data.data, ...prev.filter(v => v.userId !== user?.id)]); setVibeComposerOpen(false); setVibeFile(null); setVibeCaption(''); } catch (e) { alert(e.response?.data?.message || 'Failed to post Vibe'); } finally { setVibeUploading(false); } };
  const deleteVibe = async id => { try { await vibeAPI.delete(id); setVibes(prev => prev.filter(v => v.id !== id)); setVibeViewerIndex(null); } catch (e) { alert(e.response?.data?.message || 'Failed to delete Vibe'); } };

  return <div className="pt-16 h-[100dvh] flex overflow-hidden bg-white">
    <section className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-[340px] shrink-0 flex-col border-r border-gray-200 min-h-0`}>
      <div className="p-4 border-b flex items-center justify-between shrink-0"><h2 className="text-xl font-bold">Messages</h2><button onClick={() => setNewChatOpen(true)} className="p-2 bg-purple-600 text-white rounded-full"><Plus className="w-5 h-5" /></button></div>
      <div className="border-b bg-white px-3 py-3 shrink-0"><div className="flex items-start gap-3 overflow-x-auto pb-1">
        <button onClick={() => { setVibeFile(null); setVibeCaption(''); setVibeComposerOpen(true); }} className="shrink-0 w-16 text-center"><div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400"><div className="w-full h-full rounded-full bg-white p-[2px]"><div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center relative overflow-hidden">{ownVibe ? <img src={ownVibe.mediaUrl} alt="Your Vibe" className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-gray-500" />}<span className="absolute right-0 bottom-0 bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-white"><Plus className="w-3 h-3" /></span></div></div></div><span className="block text-xs font-semibold mt-1 truncate">Vibes</span></button>
        {otherVibes.map(v => <button key={v.id} onClick={() => setVibeViewerIndex(vibes.findIndex(x => x.id === v.id))} className="shrink-0 w-16 text-center"><div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600"><img src={v.mediaUrl} alt="" className="w-full h-full rounded-full object-cover border-2 border-white" /></div><span className="block text-xs mt-1 truncate">{v.user?.fullName || v.user?.username}</span></button>)}
      </div><div className="mt-1 flex items-center gap-1 text-[11px] text-gray-400"><Clock3 className="w-3 h-3" /> Vibes disappear automatically after 24 hours</div></div>
      <div className="p-3 border-b bg-white shrink-0"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={userQuery} onChange={e => runUserSearch(e.target.value)} placeholder="Search chat users" className="w-full bg-gray-100 rounded-full pl-9 pr-9 py-2.5 text-sm outline-none" />{userQuery && <button onClick={() => runUserSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-4 h-4" /></button>}</div></div>
      {userQuery.trim() && <div className="border-b max-h-64 overflow-y-auto bg-white shrink-0">{userSearchLoading ? <div className="p-4 text-sm text-gray-400">Searching users...</div> : userResults.length ? userResults.map(u => <button key={u.id} onClick={() => startChatWith(u)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50"><img src={u.avatarUrl || `https://i.pravatar.cc/80?u=${u.id}`} className="w-10 h-10 rounded-full object-cover" alt="" /><span className="min-w-0"><b className="block text-sm truncate">{u.fullName || u.username}</b><small className="block text-gray-500 truncate">@{u.username}</small></span></button>) : <div className="p-4 text-sm text-gray-400">No users found</div>}</div>}
      <div className="flex-1 min-h-0 overflow-y-auto">{loading ? <div className="text-center py-20 text-gray-400">Loading chats...</div> : chats.length ? chats.map(c => { const o = other(c); return <button key={c.id} onClick={() => setSelectedChat(c)} className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 ${selectedChat?.id === c.id ? 'bg-purple-50' : ''}`}><div className="relative shrink-0"><img src={o?.avatarUrl || `https://i.pravatar.cc/150?u=${o?.id}`} className="w-12 h-12 rounded-full object-cover" alt="" />{onlineUserIds.includes(o?.id) && <span className="absolute right-0 bottom-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-white" />}</div><div className="min-w-0"><h3 className="font-semibold truncate">{o?.fullName || o?.username}</h3><p className="text-sm text-gray-500 truncate">{c.messages?.[0]?.content || 'Start chatting'}</p></div></button>; }) : <div className="p-8 text-center text-sm text-gray-400">No chats yet. Tap + to start a conversation.</div>}</div>
    </section>
    <section className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 min-h-0 flex-col h-full`}>
      {selectedChat ? <>
        <header className="h-16 shrink-0 border-b flex items-center gap-3 px-3 md:px-4 bg-white"><button onClick={() => setSelectedChat(null)} className="md:hidden p-2 rounded-full hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></button><div className="relative"><img src={otherUser?.avatarUrl || 'https://i.pravatar.cc/150'} className="w-9 h-9 rounded-full object-cover" alt="" />{otherOnline && <span className="absolute right-0 bottom-0 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-white" />}</div><div className="min-w-0 flex-1"><h3 className="font-semibold truncate">{otherUser?.fullName || otherUser?.username}</h3><p className="text-xs text-gray-500">{typingUserId ? 'typing...' : otherOnline ? 'Online' : 'Private chat'}</p></div><div className="relative"><button onClick={() => setSafetyOpen(v => !v)} className="p-2 rounded-full hover:bg-gray-100" title="Safety"><MoreVertical className="w-5 h-5" /></button>{safetyOpen && <div className="absolute right-0 top-10 z-50 w-52 bg-white border rounded-xl shadow-lg p-1 text-sm"><button onClick={() => toggleSafety('mute')} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100">{safety.muted ? 'Unmute notifications' : 'Mute notifications'}</button><button onClick={() => toggleSafety('restrict')} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100">{safety.restricted ? 'Unrestrict user' : 'Restrict user'}</button><button onClick={() => toggleSafety('block')} className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600">{safety.blocked ? 'Unblock user' : 'Block user'}</button></div>}</div></header>
        <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4 space-y-2 bg-gray-50">{messages.map((m, i) => { const mine = m.senderId === user?.id; return <div key={m.id || i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`relative max-w-[82%] sm:max-w-[70%] px-3 py-2 rounded-2xl ${mine ? 'bg-purple-600 text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md shadow-sm'}`}>{m.pinned && <div className="text-[10px] mb-1 opacity-70 flex items-center gap-1"><Pin className="w-3 h-3" /> Pinned</div>}{m.replyTo && <div className="text-[10px] opacity-70 border-l-2 pl-2 mb-1 truncate">Replying to {m.replyTo.content || 'media'}</div>}<div className="flex items-end gap-2"><div className="min-w-0">{m.mediaUrl && (/(mp4|webm|mov|m4v)(?:[?#].*)?$/i.test(m.mediaUrl) ? <video src={m.mediaUrl} controls playsInline className="block mb-1 max-w-[220px] max-h-56 rounded-lg" /> : <a href={m.mediaUrl} target="_blank" rel="noreferrer"><img src={m.mediaUrl} alt="Attachment" className="block mb-1 max-w-[220px] max-h-56 rounded-lg object-contain" /></a>)}{m.content && <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>}</div>{mine && (m.isRead ? <CheckCheck className="w-4 h-4 text-sky-200 shrink-0" /> : <Check className="w-4 h-4 opacity-70 shrink-0" />)}</div><div className="flex items-center justify-end gap-2 mt-1"><span className="text-[10px] opacity-70">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><button onClick={() => setMessageMenu(messageMenu === m.id ? null : m.id)} className="opacity-60 hover:opacity-100"><MoreVertical className="w-3 h-3" /></button></div>{messageMenu === m.id && <div className="absolute right-2 bottom-8 z-40 bg-white text-gray-800 border rounded-xl shadow-lg p-1 w-40 text-xs"><button onClick={() => { setReplyingTo(m); setMessageMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-100 flex gap-2"><Reply className="w-3 h-3" /> Reply</button><button onClick={() => togglePin(m)} className="w-full text-left px-3 py-2 hover:bg-gray-100 flex gap-2"><Pin className="w-3 h-3" /> {m.pinned ? 'Unpin' : 'Pin'}</button><button onClick={() => { setForwardingMessage(m); setMessageMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-100 flex gap-2"><Forward className="w-3 h-3" /> Forward</button><button onClick={() => deleteMessage(m, 'me')} className="w-full text-left px-3 py-2 hover:bg-gray-100">Delete for me</button>{mine && <button onClick={() => deleteMessage(m, 'everyone')} className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600">Delete for everyone</button>}</div>}</div></div>; })}<div ref={endRef} /></div>
        {replyingTo && <div className="px-3 py-2 bg-white border-t text-xs flex items-center gap-2"><Reply className="w-4 h-4" /><span className="truncate flex-1">Replying to: {replyingTo.content || 'media'}</span><button onClick={() => setReplyingTo(null)}><X className="w-4 h-4" /></button></div>}
        {emojiOpen && <div className="px-3 pt-2 bg-white border-t flex flex-wrap gap-1">{EMOJIS.map(e => <button key={e} onClick={() => appendEmoji(e)} className="text-2xl p-1">{e}</button>)}</div>}
        {galleryFile && <div className="px-3 pt-2 bg-white text-xs text-gray-500">Attachment: {galleryFile.name}</div>}
        <footer className="shrink-0 p-2 md:p-3 border-t bg-white"><div className="flex items-center gap-1.5 max-w-4xl mx-auto"><button onClick={() => galleryRef.current?.click()} className="p-2 rounded-full hover:bg-gray-100"><Paperclip className="w-5 h-5 text-gray-500" /></button><input ref={galleryRef} type="file" accept="image/*,video/*" className="hidden" onChange={galleryChanged} /><button onClick={() => setEmojiOpen(v => !v)} className="p-2 rounded-full hover:bg-gray-100"><Smile className="w-5 h-5 text-gray-500" /></button><input value={newMessage} onChange={e => { setNewMessage(e.target.value); emitTyping(true); }} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Type a message..." className="flex-1 min-w-0 px-3 md:px-4 py-2.5 bg-gray-100 rounded-full outline-none text-sm" /><button onClick={sendMessage} disabled={sending || (!newMessage.trim() && !galleryFile)} className="shrink-0 p-3 bg-purple-600 text-white rounded-full disabled:opacity-50"><Send className="w-5 h-5" /></button></div></footer>
      </> : <div className="flex-1 items-center justify-center hidden md:flex text-center"><div><MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-3" /><h3 className="text-xl font-semibold text-gray-700">Select a chat</h3><p className="text-gray-500 mt-1">Choose a conversation</p></div></div>}
    </section>
    {newChatOpen && <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center"><div className="bg-white w-full sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"><div className="p-4 border-b flex justify-between"><b>New chat</b><button onClick={() => setNewChatOpen(false)}><X /></button></div><div className="p-4 space-y-4"><div className="flex gap-2"><input value={phoneQuery} onChange={e => setPhoneQuery(e.target.value)} placeholder="Mobile number (+91...)" inputMode="tel" className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm" /><button onClick={searchByPhone} disabled={phoneSearching} className="px-4 rounded-full bg-green-500 text-white text-sm">{phoneSearching ? '...' : 'Chat'}</button></div><div className="border-t pt-4"><input value={inviteNumber} onChange={e => setInviteNumber(e.target.value)} placeholder="Number to invite" className="w-full bg-gray-100 rounded-full px-4 py-2 text-sm mb-2" /><button onClick={inviteViaWhatsApp} className="w-full py-2 bg-green-500 text-white rounded-full text-sm font-semibold">Invite via WhatsApp</button></div></div></div></div>}
    {forwardingMessage && <div className="fixed inset-0 z-[110] bg-black/50 flex items-end sm:items-center justify-center"><div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[80dvh] overflow-y-auto"><div className="p-4 border-b flex justify-between"><b>Forward message</b><button onClick={() => setForwardingMessage(null)}><X /></button></div><div className="p-2">{chats.filter(c => c.id !== selectedChat?.id).map(c => <button key={c.id} onClick={() => forwardTo(c)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50"><img src={other(c)?.avatarUrl || `https://i.pravatar.cc/80?u=${other(c)?.id}`} className="w-10 h-10 rounded-full" alt="" /><span>{other(c)?.fullName || other(c)?.username}</span></button>)}</div></div></div>}
    {vibeComposerOpen && <div className="fixed inset-0 z-[130] bg-black/50 flex items-end sm:items-center justify-center p-4"><div className="bg-white w-full sm:max-w-md rounded-3xl overflow-hidden"><div className="p-4 border-b flex justify-between"><div><b>Post Vibe</b><p className="text-xs text-gray-500">Photo or video · 24 hours</p></div><button onClick={() => setVibeComposerOpen(false)}><X /></button></div><div className="p-4 space-y-4">{vibeFile ? (vibeFile.type.startsWith('video/') ? <video src={URL.createObjectURL(vibeFile)} controls className="max-h-[55vh] max-w-full mx-auto" /> : <img src={URL.createObjectURL(vibeFile)} alt="Preview" className="max-h-[55vh] max-w-full mx-auto object-contain" />) : <button onClick={() => vibeRef.current?.click()} className="w-full h-52 rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50 flex flex-col items-center justify-center gap-2 text-purple-700"><ImagePlus className="w-10 h-10" /><b>Add photo or video</b></button>}<input ref={vibeRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setVibeFile(f); e.target.value = ''; }} /><input value={vibeCaption} onChange={e => setVibeCaption(e.target.value)} maxLength={300} placeholder="Add a caption (optional)" className="w-full px-4 py-3 rounded-xl bg-gray-100" /><div className="flex gap-2"><button onClick={() => vibeRef.current?.click()} className="flex-1 py-3 rounded-xl border font-semibold">Choose media</button><button onClick={publishVibe} disabled={!vibeFile || vibeUploading} className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-semibold disabled:opacity-50">{vibeUploading ? 'Posting...' : 'Post Vibe'}</button></div></div></div></div>}
    {vibeViewerIndex !== null && <VibeViewer vibes={vibes} index={vibeViewerIndex} userId={user?.id} onClose={() => setVibeViewerIndex(null)} onDelete={deleteVibe} />}
  </div>;
}
