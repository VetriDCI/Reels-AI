import React, { useRef, useState } from 'react';
import { Sparkles, X, Image, Video, Radio, RotateCcw } from 'lucide-react';
import { postAPI, uploadAPI, aiAPI } from '../services/api';

function CreatePostModal({ onClose, onPostCreated }) {
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaKind, setMediaKind] = useState(null); // 'photo' | 'video'
  const [uploadStage, setUploadStage] = useState(null); // null | 'uploading' | 'publishing'
  const [aiLoading, setAiLoading] = useState(false);
  const [livePreview, setLivePreview] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const loading = uploadStage !== null;

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

  // Opens the device's own picker (Photos / Gallery / Files) — no
  // `capture` attribute, so it goes to local storage, not straight to camera.
  const pickPhoto = () => photoInputRef.current?.click();
  const pickVideo = () => videoInputRef.current?.click();

  const onFileChosen = (chosenFile, kind) => {
    if (!chosenFile) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(chosenFile);
    setMediaKind(kind);
    setPreviewUrl(URL.createObjectURL(chosenFile));
  };

  const clearMedia = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setMediaKind(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
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
    setUploadStage('uploading');
    try {
      let mediaUrl = null;
      let mediaType = 'text';
      if (file) {
        const upload = await uploadAPI.media(file);
        mediaUrl = upload.data.data.url;
        mediaType = upload.data.data.mediaType;
      }
      setUploadStage('publishing');
      await postAPI.create({ content: content.trim(), mediaUrl, mediaType, hashtags });
      onPostCreated?.();
      stopCamera();
      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
      alert(error.response?.data?.message || 'Failed to create post. Check your backend and Cloudinary settings.');
      setUploadStage(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <button onClick={() => { stopCamera(); onClose(); }} aria-label="Close" disabled={loading}><X className="w-6 h-6 text-gray-600" /></button>
          <h2 className="font-semibold">Create Post</h2>
          <button onClick={handleSubmit} disabled={loading || (!content.trim() && !file)} className="text-purple-600 font-semibold disabled:opacity-50">
            Post
          </button>
        </div>

        {/* Full-modal loading overlay — real progress, not just a label swap */}
        {loading && (
          <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            <p className="text-sm font-medium text-gray-700">
              {uploadStage === 'uploading' ? 'Uploading your media...' : 'Publishing post...'}
            </p>
          </div>
        )}

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

          {/* Upload options — always visible together: Photo / Video / Live */}
          {!previewUrl && !livePreview && (
            <div className="grid grid-cols-3 gap-3">
              <button onClick={pickPhoto} className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-4 hover:bg-gray-50">
                <Image className="w-6 h-6 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">Photo</span>
              </button>
              <button onClick={pickVideo} className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-4 hover:bg-gray-50">
                <Video className="w-6 h-6 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">Video</span>
              </button>
              <button onClick={startLivePreview} className="flex flex-col items-center gap-2 border-2 border-dashed border-red-300 rounded-lg py-4 hover:bg-red-50">
                <Radio className="w-6 h-6 text-red-500" />
                <span className="text-xs font-medium text-red-600">Live</span>
              </button>
            </div>
          )}

          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={e => onFileChosen(e.target.files?.[0] || null, 'photo')} />
          <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={e => onFileChosen(e.target.files?.[0] || null, 'video')} />

          {/* Selected media preview, with a way to remove/reselect (lightweight "edit") */}
          {previewUrl && (
            <div className="relative rounded-lg overflow-hidden bg-black">
              {mediaKind === 'video'
                ? <video src={previewUrl} controls playsInline className="w-full max-h-80 object-contain bg-black" />
                : <img src={previewUrl} alt="Selected" className="w-full max-h-80 object-contain bg-black" />}
              <div className="absolute top-2 right-2 flex gap-2">
                <button onClick={mediaKind === 'video' ? pickVideo : pickPhoto} className="p-2 bg-black/60 rounded-full text-white" aria-label="Choose a different file">
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button onClick={clearMedia} className="p-2 bg-black/60 rounded-full text-white" aria-label="Remove media">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {livePreview && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-3">
                <div><p className="font-semibold">Live</p><p className="text-xs text-gray-500">Camera preview; a real multi-user live broadcast needs a streaming server.</p></div>
                <button onClick={stopCamera} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full"><Video className="w-4 h-4" />Stop</button>
              </div>
              <video ref={videoRef} autoPlay muted playsInline className="mt-3 w-full max-h-80 rounded-lg bg-black object-cover" />
              {cameraError && <p className="text-sm text-red-600 mt-2">{cameraError}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default CreatePostModal;
