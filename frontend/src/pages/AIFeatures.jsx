import React, { useEffect, useRef, useState } from 'react';
import {
  Plus, Send, Image as ImageIcon, Video, FileText,
  MessageSquare, Trash2, X, Sparkles, Loader2,
  Bot, User as UserIcon, History, Clock3
} from 'lucide-react';
import { aiAPI } from '../services/aiApi';

const MAX_FILES = 6;

function AIFeatures() {
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await aiAPI.history();
      setConversations(res.data?.data?.conversations || []);
    } catch (error) {
      console.error('AI history error:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleHistory = () => setHistoryOpen((open) => !open);

  const newChat = () => {
    setConversationId(null);
    setMessages([]);
    setInputText('');
    setAttachments([]);
    setHistoryOpen(false);
  };

  const openConversation = async (id) => {
    try {
      const res = await aiAPI.getConversation(id);
      const data = res.data?.data?.conversation;
      if (!data) return;
      setConversationId(data.id);
      setMessages(data.messages || []);
      setAttachments([]);
      setHistoryOpen(false);
    } catch (error) {
      console.error('Open AI conversation error:', error);
    }
  };

  const deleteConversation = async (id, event) => {
    event.stopPropagation();
    try {
      await aiAPI.deleteConversation(id);
      setConversations((items) => items.filter((item) => item.id !== id));
      if (conversationId === id) newChat();
    } catch (error) {
      console.error('Delete AI conversation error:', error);
    }
  };

  const handleFiles = async (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (!selected.length) return;

    const files = selected.slice(0, MAX_FILES - attachments.length);
    if (!files.length) return;

    setUploading(true);
    try {
      const res = await aiAPI.upload(files);
      const uploaded = res.data?.data?.files || [];
      setAttachments((prev) => [...prev, ...uploaded].slice(0, MAX_FILES));
    } catch (error) {
      console.error('AI upload error:', error);
      alert(error.response?.data?.message || 'Could not upload attachment.');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    const message = inputText.trim();
    if ((!message && !attachments.length) || sending || uploading) return;

    const outgoing = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: message || 'Please analyze the attached file(s).',
      attachments,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, outgoing]);
    setInputText('');
    setAttachments([]);
    setSending(true);

    try {
      const res = await aiAPI.chat({ message, conversationId, attachments });
      const data = res.data?.data;
      setConversationId(data.conversationId);
      setMessages((prev) => [...prev, {
        id: data.messageId || `ai-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        model: data.model,
        createdAt: new Date().toISOString()
      }]);
      await loadHistory();
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: error.response?.data?.message || 'AI could not respond right now. Please try again.'
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const fileIcon = (mime) => {
    if (mime?.startsWith('image/')) return <ImageIcon size={16} />;
    if (mime?.startsWith('video/')) return <Video size={16} />;
    return <FileText size={16} />;
  };

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-b from-white to-purple-50/40 flex flex-col">
      <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)] relative overflow-hidden">
        {/* Old-style top AI bar: left history toggle, title, right new-chat action */}
        <header className="h-16 bg-white border-b flex items-center px-3 md:px-5 gap-3 shrink-0 z-30">
          <button
            onClick={toggleHistory}
            className={`w-11 h-11 rounded-full border flex items-center justify-center shrink-0 transition ${historyOpen ? 'bg-purple-50 border-purple-300 text-purple-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            aria-label={historyOpen ? 'Close AI history' : 'Open AI history'}
            title={historyOpen ? 'Close history' : 'History'}
          >
            {historyOpen ? <X size={22} /> : <History size={22} />}
          </button>

          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center shrink-0">
            <Bot size={21} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-900 truncate">RA Social AI</div>
            <div className="text-[11px] text-green-600 truncate">Advanced AI • automatic language • multimodal</div>
          </div>
          <button
            onClick={newChat}
            className="w-11 h-11 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-sm shrink-0"
            title="New chat"
            aria-label="New chat"
          >
            <Plus size={23} />
          </button>
        </header>

        {/* Left history drawer: click History again or X to close */}
        {historyOpen && (
          <>
            <button
              className="absolute inset-0 bg-black/20 z-20 cursor-default"
              onClick={() => setHistoryOpen(false)}
              aria-label="Close history"
            />
            <aside className="absolute left-0 top-0 bottom-0 z-40 w-[300px] max-w-[86vw] bg-white border-r border-gray-200 shadow-xl flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="font-bold text-gray-900 flex items-center gap-2">
                  <Clock3 size={20} /> AI History
                </div>
                <button onClick={() => setHistoryOpen(false)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center" aria-label="Close history">
                  <X size={19} />
                </button>
              </div>

              <div className="p-3">
                <button
                  onClick={newChat}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-sm"
                >
                  <Plus size={19} /> New Chat
                </button>
              </div>

              <div className="px-3 pb-4 flex-1 overflow-y-auto">
                {loadingHistory ? (
                  <div className="p-4 text-sm text-gray-400 flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading history...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-sm text-gray-400">No AI chats yet.</div>
                ) : (
                  conversations.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => openConversation(item.id)}
                      className={`w-full text-left group flex items-center gap-2 p-3 rounded-xl mb-1 ${conversationId === item.id ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
                    >
                      <MessageSquare size={17} className="text-gray-500 shrink-0" />
                      <span className="flex-1 truncate text-sm text-gray-700">{item.title}</span>
                      <span
                        onClick={(e) => deleteConversation(item.id, e)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="Delete chat"
                      >
                        <Trash2 size={15} />
                      </span>
                    </button>
                  ))
                )}
              </div>
            </aside>
          </>
        )}

        {/* Chat */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0">
          <section className="flex-1 overflow-y-auto px-4 py-6">
            {messages.length === 0 ? (
              <div className="max-w-2xl mx-auto text-center pt-12 md:pt-16">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
                  <Sparkles size={30} />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-5">What can I help you with?</h1>
                <p className="text-gray-500 mt-2">Ask anything. Use the <b>+</b> button beside the message box to attach photos, videos and files, or use <b>History</b> on the left to continue an old AI chat.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 text-left">
                  {['Analyze this photo', 'Explain something deeply', 'Help me create content'].map((text) => (
                    <button key={text} onClick={() => setInputText(text)} className="p-4 rounded-xl bg-white border hover:border-purple-300 hover:shadow-sm text-sm text-gray-700">
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-5">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.role !== 'user' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center shrink-0"><Bot size={16} /></div>}
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === 'user' ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-br-md' : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-bl-md'}`}>
                      {message.attachments?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {message.attachments.map((file, index) => (
                            <a key={`${file.url}-${index}`} href={file.url} target="_blank" rel="noreferrer" className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${message.role === 'user' ? 'bg-white/15' : 'bg-gray-100'}`}>
                              {fileIcon(file.mimeType)}<span className="max-w-32 truncate">{file.name}</span>
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap break-words text-[15px] leading-6">{message.content}</div>
                      {message.model && <div className="mt-2 text-[10px] opacity-50">{message.model}</div>}
                    </div>
                    {message.role === 'user' && <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center shrink-0"><UserIcon size={16} /></div>}
                  </div>
                ))}
                {sending && <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center"><Bot size={16} /></div><div className="bg-white border rounded-2xl px-4 py-3"><Loader2 className="animate-spin text-purple-600" size={20} /></div></div>}
                <div ref={messagesEndRef} />
              </div>
            )}
          </section>

          {/* Message composer: + is directly beside send */}
          <div className="bg-white border-t px-3 md:px-6 py-3 shrink-0">
            <div className="max-w-3xl mx-auto">
              {attachments.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {attachments.map((file, index) => (
                    <div key={`${file.url}-${index}`} className="relative shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-xs">
                      {fileIcon(file.mimeType)}<span className="max-w-32 truncate">{file.name}</span>
                      <button onClick={() => removeAttachment(index)} className="text-gray-500 hover:text-red-500" aria-label={`Remove ${file.name}`}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2 border rounded-2xl p-2 shadow-sm focus-within:border-purple-400 bg-white">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || attachments.length >= MAX_FILES}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center disabled:opacity-40 shrink-0"
                  title="Attach photos, videos or files"
                  aria-label="Attach photos, videos or files"
                >
                  <Plus size={23} />
                </button>
                <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.txt,.json,.csv,.md" onChange={handleFiles} className="hidden" />
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder={uploading ? 'Uploading files...' : 'Message RA Social AI...'}
                  className="flex-1 resize-none outline-none bg-transparent px-2 py-2 max-h-32"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || uploading || (!inputText.trim() && !attachments.length)}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center disabled:opacity-40 shrink-0"
                  title="Send"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="text-[10px] text-gray-400 text-center mt-2">+ attachments up to {MAX_FILES} files • AI may make mistakes</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AIFeatures;
