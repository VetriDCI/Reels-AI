import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, Paperclip, Smile, Mic } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

function ChatPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
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
        setMessages((prev) => [...prev, data]);
      }
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
      fetchMessages(selectedChat.id);
      socketRef.current.emit('join_chat', selectedChat.id);
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
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      await api.post(`/chats/${selectedChat.id}/messages`, { content: newMessage });
      const response = await api.get(`/chats/${selectedChat.id}/messages`);
      setMessages(response.data.data);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getOtherParticipant = (chat) => {
    return chat.participants.find(p => p.id !== chat.currentUserId);
  };

  return (
    <div className="pt-20 h-screen flex">
      <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">Messages</h2>
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
                <p className="text-xs text-green-500">🔒 End-to-End Encrypted</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg, index) => (
                <div key={msg.id || index} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-2xl ${msg.senderId === user?.id ? 'bg-purple-600 text-white' : 'bg-white text-gray-800'}`}>
                    <p>{msg.content}</p>
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
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Smile className="w-6 h-6 text-gray-500" />
              </button>
              <button onClick={sendMessage} className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:opacity-90">
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
    </div>
  );
}

export default ChatPage;