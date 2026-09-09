import React, { useRef, useState, useEffect } from 'react';
import { X, Image, Video, Radio, RotateCcw, Pencil, Check, RefreshCw, Play, Pause } from 'lucide-react';
import { postAPI, uploadAPI } from '../services/api';

function CreatePostModal({ onClose, onPostCreated }) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaKind, setMediaKind] = useState(null);
  const [uploadStage, setUploadStage] = useState(null);
  const [livePreview, setLivePreview] = useState(false);
  const [liveState, setLiveState] = useState('idle');
  const [cameraError, setCameraError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [imageRotation, setImageRotation] = useState(0);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const loading = uploadStage !== null;

  // Stop camera only when the modal unmounts. The old effect depended on
  // previewUrl, which stopped the live camera every time media selection changed.
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  // Revoke each object URL when it is replaced/unmounted to avoid leaking blobs.
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setLivePreview(false); setLiveState('idle');
  };

  const startLivePreview = async () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Live camera is not supported by this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setLivePreview(true); setLiveState('live');
      requestAnimationFrame(() => { if (videoRef.current) videoRef.current.srcObject = stream; });
    } catch {
      setCameraError('Camera/microphone permission was denied or is unavailable.');
    }
  };

  const pickPhoto = () => photoInputRef.current?.click();
  const pickVideo = () => videoInputRef.current?.click();

  const onFileChosen = (chosenFile, kind) => {
    if (!chosenFile) return;
    const limit = 50 * 1024 * 1024;
    if (chosenFile.size > limit) {
      alert('Please choose a file smaller than 50 MB.');
      return;
    }
    if (kind === 'video') {
      const probeUrl = URL.createObjectURL(chosenFile);
      const probe = document.createElement('video');
      probe.preload = 'metadata';
      probe.onloadedmetadata = () => {
        URL.revokeObjectURL(probeUrl);
        if (probe.duration > 90) {
          alert('Please choose a video that is 90 seconds or shorter.');
          return;
        }
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setFile(chosenFile);
        setMediaKind(kind);
        setPreviewUrl(URL.createObjectURL(chosenFile));
        setImageRotation(0);
        setEditOpen(false);
      };
      probe.src = probeUrl;
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(chosenFile);
    setMediaKind(kind);
    setPreviewUrl(URL.createObjectURL(chosenFile));
    setImageRotation(0);
    setEditOpen(false);
  };

  const clearMedia = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null); setPreviewUrl(null); setMediaKind(null); setEditOpen(false); setImageRotation(0);
    if (photoInputRef.current) photoInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const rotateImage = async () => {
    if (!file || mediaKind !== 'photo' || !previewUrl) return;
    const nextRotation = (imageRotation + 90) % 360;
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const swap = nextRotation % 180 !== 0;
      canvas.width = swap ? img.naturalHeight : img.naturalWidth;
      canvas.height = swap ? img.naturalWidth : img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(nextRotation * Math.PI / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      canvas.toBlob(blob => {
        if (!blob) return;
        const newFile = new File([blob], file.name || 'edited-image.jpg', { type: file.type || 'image/jpeg' });
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setFile(newFile);
        setPreviewUrl(URL.createObjectURL(newFile));
        setImageRotation(nextRotation);
      }, file.type || 'image/jpeg', 0.92);
    };
    img.src = previewUrl;
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
      await postAPI.create({ content: content.trim(), mediaUrl, mediaType });
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
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <button onClick={() => { stopCamera(); onClose(); }} aria-label="Close" disabled={loading}><X className="w-6 h-6 text-gray-600" /></button>
          <h2 className="font-semibold">Create Post</h2>
          <button onClick={handleSubmit} disabled={loading || (!content.trim() && !file)} className="text-purple-600 font-semibold disabled:opacity-50">Post</button>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/95 z-30 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-gray-800">{uploadStage === 'uploading' ? 'Uploading media…' : 'Publishing post…'}</p>
            <p className="text-xs text-gray-500">Please keep this window open.</p>
          </div>
        )}

        <div className="p-4 space-y-4">
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What's on your mind?" className="w-full h-32 resize-none focus:outline-none text-gray-800" />


          {!previewUrl && !livePreview && (
            <div className="grid grid-cols-3 gap-3">
              <button type="button" onClick={pickPhoto} className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-5 hover:bg-gray-50">
                <Image className="w-7 h-7 text-gray-600" /><span className="text-sm font-semibold text-gray-700">Photo</span><span className="text-[11px] text-gray-400">From device</span>
              </button>
              <button type="button" onClick={pickVideo} className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-5 hover:bg-gray-50">
                <Video className="w-7 h-7 text-gray-600" /><span className="text-sm font-semibold text-gray-700">Video</span><span className="text-[11px] text-gray-400">From device</span>
              </button>
              <button type="button" onClick={startLivePreview} className="flex flex-col items-center gap-2 border-2 border-red-300 bg-red-50 rounded-xl py-5 hover:bg-red-100">
                <Radio className="w-7 h-7 text-red-600" /><span className="text-sm font-bold text-red-600">LIVE</span><span className="text-[11px] text-red-500">Camera</span>
              </button>
            </div>
          )}

          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={e => onFileChosen(e.target.files?.[0] || null, 'photo')} />
          <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={e => onFileChosen(e.target.files?.[0] || null, 'video')} />

          {previewUrl && (
            <div className="rounded-xl overflow-hidden border bg-gray-50">
              <div className="relative bg-black min-h-40 flex items-center justify-center">
                {mediaKind === 'video'
                  ? <video key={previewUrl} src={previewUrl} controls playsInline preload="metadata" className="w-full max-h-80 object-contain bg-black" />
                  : <img src={previewUrl} alt="Selected media preview" className="w-full max-h-80 object-contain bg-black" />}
                <div className="absolute top-2 right-2 flex gap-2">
                  <button type="button" onClick={() => setEditOpen(true)} className="p-2 bg-white/90 rounded-full text-gray-800 shadow" aria-label="Edit selected media"><Pencil className="w-4 h-4" /></button>
                  <button type="button" onClick={clearMedia} className="p-2 bg-black/70 rounded-full text-white" aria-label="Remove media"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div className="min-w-0"><p className="text-sm font-semibold truncate">{file?.name}</p><p className="text-xs text-gray-500">{mediaKind === 'video' ? 'Video' : 'Image'} · {(file?.size / 1024 / 1024).toFixed(1)} MB</p></div>
                <button type="button" onClick={mediaKind === 'video' ? pickVideo : pickPhoto} className="flex items-center gap-1 px-3 py-2 rounded-full bg-gray-100 text-sm font-medium"><RefreshCw className="w-4 h-4" />Replace</button>
              </div>
            </div>
          )}

          {editOpen && previewUrl && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div><p className="font-semibold text-gray-900">Edit media</p><p className="text-xs text-gray-500">{mediaKind === 'photo' ? 'Rotate the image before posting.' : 'Preview and control the selected video before posting.'}</p></div>
                <button type="button" onClick={() => setEditOpen(false)} className="p-2 bg-white rounded-full"><Check className="w-4 h-4" /></button>
              </div>
              {mediaKind === 'photo' ? (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={rotateImage} className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-semibold"><RotateCcw className="w-4 h-4" />Rotate 90°</button>
                  <span className="text-xs text-gray-500">Rotation is applied to the uploaded image.</span>
                </div>
              ) : (
                <div className="text-xs text-gray-600 flex items-center gap-2"><Video className="w-4 h-4" />Use the video controls above to review the selected video. Replace it if you need a different file.</div>
              )}
            </div>
          )}

          {livePreview && (
            <div className="border-2 border-red-200 rounded-xl p-4 bg-red-50">
              <div className="flex items-center justify-between gap-3">
                <div><p className="font-bold text-red-600">● LIVE CAMERA</p><p className="text-xs text-gray-500">Camera preview only. A real public multi-user livestream requires a streaming service/server.</p></div>
                <div className="flex gap-2">
                  <button onClick={() => { if (videoRef.current) { if (videoRef.current.paused) { videoRef.current.play(); setLiveState('live'); } else { videoRef.current.pause(); setLiveState('paused'); } } }} className="flex items-center gap-2 px-3 py-2 bg-white border rounded-full text-sm font-semibold">{liveState === 'live' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}{liveState === 'live' ? 'Pause' : 'Resume'}</button>
                  <button onClick={stopCamera} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full"><X className="w-4 h-4" />Stop</button>
                </div>
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
