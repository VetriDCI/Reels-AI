import React, { useRef, useState } from 'react';
import { Sparkles, X, Image, Video, Radio } from 'lucide-react';
import { postAPI, uploadAPI, aiAPI } from '../services/api';

function CreatePostModal({ onClose, onPostCreated }) {
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [livePreview, setLivePreview] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setLivePreview(false);
  };

  const startLivePreview = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setLivePreview(true);
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch {
      setCameraError('Camera/microphone permission was denied or is unavailable.');
    }
  };

  const handleGenerateCaption = async () => {
    if (!content.trim()) return;
    setAiLoading(true);
    try {
      const response = await aiAPI.generateCaption({ context: content });
      if (response.data.success) setContent(response.data.data.caption);
    } catch (error) { console.error(error); }
    finally { setAiLoading(false); }
  };

  const handleGenerateHashtags = async () => {
    if (!content.trim()) return;
    setAiLoading(true);
    try {
      const response = await aiAPI.generateHashtags({ content });
      if (response.data.success) setHashtags(response.data.data.hashtags || []);
    } catch (error) { console.error(error); }
    finally { setAiLoading(false); }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !file) return;
    setLoading(true);
    try {
      let mediaUrl = null;
      let mediaType = 'text';
      if (file) {
        const upload = await uploadAPI.media(file);
        mediaUrl = upload.data.data.url;
        mediaType = upload.data.data.mediaType;
      }
      await postAPI.create({ content: content.trim(), mediaUrl, mediaType, hashtags });
      onPostCreated?.();
      stopCamera();
      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
      alert(error.response?.data?.message || 'Failed to create post. Check your backend and Cloudinary settings.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <button onClick={() => { stopCamera(); onClose(); }} aria-label="Close"><X className="w-6 h-6 text-gray-600" /></button>
          <h2 className="font-semibold">Create Post</h2>
          <button onClick={handleSubmit} disabled={loading || (!content.trim() && !file)} className="text-purple-600 font-semibold disabled:opacity-50">
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>

        <div className="p-4 space-y-4">
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="What's on your mind?" className="w-full h-32 resize-none focus:outline-none text-gray-800" />

          <div className="flex flex-wrap gap-2">
            <button onClick={handleGenerateCaption} disabled={aiLoading || !content.trim()} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm disabled:opacity-50">
              <Sparkles className="w-4 h-4" />{aiLoading ? 'Generating...' : 'AI Caption'}
            </button>
            <button onClick={handleGenerateHashtags} disabled={aiLoading || !content.trim()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm disabled:opacity-50">
              <Sparkles className="w-4 h-4" />AI Hashtags
            </button>
          </div>

          {hashtags.length > 0 && <div className="flex flex-wrap gap-2">{hashtags.map((tag, i) => <span key={i} className="text-purple-600 text-sm font-medium">#{String(tag).replace(/^#/, '')}</span>)}</div>}

          <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center block cursor-pointer hover:bg-gray-50">
            <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">{file ? file.name : 'Add photo or video'}</p>
            <input type="file" accept="image/*,video/*" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between gap-3">
              <div><p className="font-semibold">Live</p><p className="text-xs text-gray-500">Camera preview; a real multi-user live broadcast needs a streaming server.</p></div>
              {!livePreview
                ? <button onClick={startLivePreview} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full"><Radio className="w-4 h-4" />Start</button>
                : <button onClick={stopCamera} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full"><Video className="w-4 h-4" />Stop</button>}
            </div>
            {livePreview && <video ref={videoRef} autoPlay muted playsInline className="mt-3 w-full max-h-80 rounded-lg bg-black object-cover" />}
            {cameraError && <p className="text-sm text-red-600 mt-2">{cameraError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
export default CreatePostModal;
