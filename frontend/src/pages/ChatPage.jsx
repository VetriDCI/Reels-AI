import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, Paperclip, Smile, Mic, Plus, Search, X, MessageCircle, Check, CheckCheck } from 'lucide-react';
import api, { searchAPI, chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

function ChatPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [inviteNumber, setInviteNumber] = useState('');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [phoneSearching, setPhoneSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const selectedChatRef = useRef(null);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('token') }
    });

    socketRef.current.on('new_message', (data) => {
      if (selectedChatRef.current && data.chatId === selectedChatRef.current.id) {
        setMessages((prev) => prev.some((m) => m.id === data.id) ? prev : [...prev, data]);
        if (data.senderId !== user?.id) {
          api.post(`/chats/${data.chatId}/read`).catch(() => {});
        }
      }
    });

    socketRef.current.on('message_read', ({ chatId, messageIds }) => {
      if (selectedChatRef.current?.id !== chatId) return;
      const ids = new Set(messageIds || []);
      setMessages((prev) => prev.map((m) => ids.has(m.id) ? { ...m, isRead: true } : m));
    });

    fetchChats();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedChat) {
      // Join first so read receipts and new-message events cannot race the fetch.
      socketRef.current?.emit('join_chat', selectedChat.id);
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChats = async () => {
    try {
      const response = await api.get('/chats');
      setChats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await api.get(`/chats/${chatId}/messages`);
      setMessages(response.data.data);
      // Keep the read state in sync for both participants.
      await api.post(`/chats/${chatId}/read`);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content || !selectedChat || sendingRef.current) return;

    sendingRef.current = true;
    setSending(true);
    try {
      const response = await api.post(`/chats/${selectedChat.id}/messages`, { content });
      // Socket.io also broadcasts this message to the sender. Add the API
      // response only as a fallback if the socket event has not arrived yet.
      const sent = response.data.data;
      setMessages((prev) => prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const getOtherParticipant = (chat) => {
    return chat.participants.find(p => p.id !== user?.id) || chat.participants[0];
  };

  const runUserSearch = async (q) => {
    setUserQuery(q);
    if (!q.trim()) { setUserResults([]); return; }
    try {
      const res = await searchAPI.search(q.trim(), 'users');
      setUserResults((res.data.data?.users || []).filter((u) => u.id !== user?.id));
    } catch (err) {
      console.error('User search failed', err);
    }
  };

  const searchByPhone = async () => {
    const q = phoneQuery.trim();
    if (!q) return;
    setPhoneSearching(true);
    try {
      const res = await searchAPI.search(q, 'users');
      const users = (res.data.data?.users || []).filter(u => u.id !== user?.id);
      if (users.length > 0) {
        await startChatWith(users[0]);
        setPhoneQuery('');
      } else {
        setInviteNumber(q);
        alert('No RA Social account found for this mobile number. You can invite them below.');
      }
    } catch (err) {
      console.error('Phone search failed', err);
      alert('Could not search this mobile number.');
    } finally { setPhoneSearching(false); }
  };

  const startChatWith = async (otherUser) => {
    try {
      const res = await chatAPI.createChat(otherUser.id);
      const chat = res.data.data;
      setNewChatOpen(false);
      setUserQuery('');
      setUserResults([]);
      await fetchChats();
      setSelectedChat(chat);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not start chat');
    }
  };

  // For people who don't have the app yet — an invite link opened via
  // WhatsApp (or the device's normal share sheet as a fallback). There's
  // no way to message someone who hasn't signed up without their own
  // account, so this is an invite, not an in-app chat.
  const inviteMessage = `Join me on RA Social! ${window.location.origin}`;

  const inviteViaWhatsApp = () => {
    const digits = inviteNumber.replace(/[^\d+]/g, '');
    const base = digits ? `https://wa.me/${digits.replace(/^\+/, '')}` : 'https://wa.me/';
    window.open(`${base}?text=${encodeURIComponent(inviteMessage)}`, '_blank', 'noopener,noreferrer');
  };

  const inviteViaShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'RA Social', text: inviteMessage });
      else { await navigator.clipboard.writeText(inviteMessage); alert('Invite link copied'); }
    } catch {}
  };

  return (
    <div className="pt-20 h-screen flex">
      <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold">Messages</h2>
          <button onClick={() => setNewChatOpen(true)} aria-label="New chat" className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        {loading ? (
          <div className="text-center py-20">Loading chats...</div>
        ) : (
          <div>
            {chats.map((chat) => {
              const other = getOtherParticipant(chat);
              return (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`flex items-center space-x-3 p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedChat?.id === chat.id ? 'bg-purple-50' : ''
                  }`}
                >
                  <img src={other?.avatarUrl || `https://i.pravatar.cc/150?u=${other?.id}`} alt={other?.username} className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{other?.fullName || other?.username}</h3>
                    <p className="text-sm text-gray-500 truncate">
                      {chat.messages[0]?.content ? 'Click to view messages' : 'Start chatting'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
              <img src={getOtherParticipant(selectedChat)?.avatarUrl || 'https://i.pravatar.cc/150'} alt="User" className="w-10 h-10 rounded-full" />
              <div>
                <h3 className="font-semibold">{getOtherParticipant(selectedChat)?.fullName || getOtherParticipant(selectedChat)?.username}</h3>
                <p className="text-xs text-green-600">● Private chat</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg, index) => (
                <div key={msg.id || index} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-2xl ${msg.senderId === user?.id ? 'bg-purple-600 text-white' : 'bg-white text-gray-800'}`}>
                    <div className="flex items-end gap-2">
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      {msg.senderId === user?.id && (
                        msg.isRead
                          ? <CheckCheck className="w-4 h-4 text-sky-300 shrink-0" aria-label="Read" />
                          : <Check className="w-4 h-4 opacity-70 shrink-0" aria-label="Sent" />
                      )}
                    </div>
                    <p className="text-xs mt-1 opacity-70">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 flex items-center space-x-3">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Paperclip className="w-6 h-6 text-gray-500" />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Smile className="w-6 h-6 text-gray-500" />
              </button>
              <button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Send message">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Send className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700">Select a chat</h3>
              <p className="text-gray-500 mt-2">Choose from your existing conversations</p>
            </div>
          </div>
        )}
      </div>

      {newChatOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-900">New chat</h3>
              <button onClick={() => setNewChatOpen(false)} aria-label="Close"><X className="w-5 h-5 text-gray-600" /></button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Chat with an RA Social user</p>
                <div className="flex gap-2 mb-2">
                  <input
                    value={phoneQuery}
                    onChange={e => setPhoneQuery(e.target.value.replace(/[^0-9+() -]/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && searchByPhone()}
                    placeholder="Mobile number (+91...)"
                    inputMode="tel"
                    className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none"
                  />
                  <button onClick={searchByPhone} disabled={phoneSearching || !phoneQuery.trim()} className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-semibold disabled:opacity-50">
                    {phoneSearching ? '...' : 'Chat'}
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={userQuery}
                    onChange={e => runUserSearch(e.target.value)}
                    placeholder="Or search by username or name..."
                    className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none"
                  />
                </div>
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                  {userResults.map((u) => (
                    <button key={u.id} onClick={() => startChatWith(u)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-left">
                      <img src={u.avatarUrl || `https://i.pravatar.cc/150?u=${u.id}`} alt="" className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{u.fullName || u.username}</p>
                        <p className="text-xs text-gray-500">@{u.username}</p>
                      </div>
                    </button>
                  ))}
                  {userQuery && userResults.length === 0 && (
                    <p className="text-xs text-gray-400 py-2">No users found. They may not be on RA Social yet — invite them below.</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" /> Invite someone who isn't on RA Social
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  If the number belongs to an RA Social account, Chat above opens a private conversation. If not, send an invite link so they can join first:
                </p>
                <input
                  value={inviteNumber}
                  onChange={(e) => setInviteNumber(e.target.value)}
                  placeholder="Phone number (with country code, optional)"
                  className="w-full px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none mb-3"
                />
                <div className="flex gap-2">
                  <button onClick={inviteViaWhatsApp} className="flex-1 py-2 bg-green-500 text-white rounded-full text-sm font-semibold hover:bg-green-600">
                    Invite via WhatsApp
                  </button>
                  <button onClick={inviteViaShare} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold hover:bg-gray-200">
                    Share link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;