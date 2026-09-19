import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Check, RotateCw, FlipHorizontal, FlipVertical, Crop, SlidersHorizontal, Sparkles, Type, Gauge, Scissors, Volume2, VolumeX, Play, Pause } from 'lucide-react';

const FILTERS = {
  Original: '',
  Vivid: 'saturate(1.35) contrast(1.08)',
  Warm: 'saturate(1.15) sepia(.16) contrast(1.04)',
  Cool: 'saturate(.95) hue-rotate(10deg) contrast(1.05)',
  'B&W': 'grayscale(1) contrast(1.08)',
  Vintage: 'sepia(.32) saturate(.8) contrast(.96)',
  Cinematic: 'contrast(1.18) saturate(.9) brightness(.98)',
};

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const fileExt = (type) => type === 'video' ? 'webm' : 'jpg';

function MediaEditor({ file, mediaType, onApply, onClose }) {
  const type = mediaType || (file?.type?.startsWith('video/') ? 'video' : 'image');
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [filter, setFilter] = useState('Original');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [aspect, setAspect] = useState('free');
  const [overlayText, setOverlayText] = useState('');
  const [textSize, setTextSize] = useState(32);
  const [textPosition, setTextPosition] = useState('bottom');
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [activeTab, setActiveTab] = useState(type === 'video' ? 'video' : 'adjust');
  const [processing, setProcessing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [error, setError] = useState('');
  const imageRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const url = useMemo(() => file ? URL.createObjectURL(file) : '', [file]);

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => { if (type === 'video' && videoDuration && !end) setEnd(videoDuration); }, [type, videoDuration, end]);

  const filterString = `${FILTERS[filter] || ''} brightness(${brightness / 100}) contrast(${contrast / 100}) saturate(${saturation / 100}) blur(${blur}px)`;
  const transform = `rotate(${rotation}deg) scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})`;

  const reset = () => {
    setRotation(0); setFlipX(false); setFlipY(false); setFilter('Original'); setBrightness(100); setContrast(100); setSaturation(100); setBlur(0);
    setAspect('free'); setOverlayText(''); setTextSize(32); setTextPosition('bottom'); setStart(0); setEnd(videoDuration || 0); setSpeed(1); setVolume(1); setError('');
  };

  const drawText = (ctx, w, h) => {
    if (!overlayText.trim()) return;
    ctx.save();
    ctx.font = `700 ${textSize}px system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const y = textPosition === 'top' ? textSize * 1.5 : textPosition === 'center' ? h / 2 : h - textSize * 1.6;
    const metrics = ctx.measureText(overlayText.trim());
    const pad = 18;
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect((w - metrics.width) / 2 - pad, y - textSize / 2 - 10, metrics.width + pad * 2, textSize + 20);
    ctx.fillStyle = '#fff';
    ctx.fillText(overlayText.trim(), w / 2, y);
    ctx.restore();
  };

  const imageCanvas = async () => {
    const img = imageRef.current;
    if (!img) throw new Error('Image is not ready');
    const naturalW = img.naturalWidth || img.width;
    const naturalH = img.naturalHeight || img.height;
    let cropW = naturalW, cropH = naturalH;
    if (aspect !== 'free') {
      const [aw, ah] = aspect.split(':').map(Number);
      if (naturalW / naturalH > aw / ah) cropW = Math.round(naturalH * aw / ah);
      else cropH = Math.round(naturalW * ah / aw);
    }
    const rotated = rotation % 180 !== 0;
    const outW = rotated ? cropH : cropW;
    const outH = rotated ? cropW : cropH;
    const canvas = document.createElement('canvas'); canvas.width = outW; canvas.height = outH;
    const ctx = canvas.getContext('2d');
    ctx.filter = filterString;
    ctx.translate(outW / 2, outH / 2); ctx.rotate(rotation * Math.PI / 180); ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.drawImage(img, (naturalW - cropW) / 2, (naturalH - cropH) / 2, cropW, cropH, -cropW / 2, -cropH / 2, cropW, cropH);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'none'; drawText(ctx, outW, outH);
    return await new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(new File([b], file.name.replace(/\.[^.]+$/, '') + '-edited.jpg', { type: 'image/jpeg', lastModified: Date.now() })) : reject(new Error('Could not export image')), 'image/jpeg', .94));
  };

  const videoCanvas = async () => {
    const video = videoRef.current;
    if (!video) throw new Error('Video is not ready');
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream || typeof video.captureStream !== 'function') {
      throw new Error('This browser cannot export edited videos. Try Chrome or another browser with video recording support.');
    }
    const duration = Number.isFinite(videoDuration) && videoDuration > 0 ? videoDuration : (video.duration || 0);
    if (!duration) throw new Error('Video duration is not ready yet. Please wait a moment and try again.');

    const from = clamp(Number(start) || 0, 0, Math.max(0, duration - 0.05));
    const requestedEnd = Number(end) || duration;
    const to = clamp(requestedEnd, from + 0.05, duration);
    if (to <= from) throw new Error('Please choose a valid trim range.');

    const canvas = canvasRef.current || document.createElement('canvas');
    const baseW = video.videoWidth || 1280;
    const baseH = video.videoHeight || 720;
    const rotated = rotation % 180 !== 0;
    canvas.width = rotated ? baseH : baseW;
    canvas.height = rotated ? baseW : baseH;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Video editor could not create a drawing surface.');

    const stream = canvas.captureStream(30);
    const source = video.captureStream();
    source.getAudioTracks().forEach(track => stream.addTrack(track));
    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      .find(type => MediaRecorder.isTypeSupported(type)) || '';
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 6000000 } : undefined);
    const chunks = [];
    let animationId = null;
    let stopped = false;

    const stopAll = () => {
      if (animationId != null) cancelAnimationFrame(animationId);
      if (recorder.state !== 'inactive') recorder.stop();
    };

    const done = new Promise((resolve, reject) => {
      recorder.ondataavailable = e => { if (e.data?.size) chunks.push(e.data); };
      recorder.onerror = () => reject(new Error('Video export failed. Please try again.'));
      recorder.onstop = () => resolve();
    });

    try {
      setPlaying(true);
      video.pause();
      video.playbackRate = speed;
      video.volume = volume;

      await new Promise((resolve, reject) => {
        const onSeeked = () => { cleanup(); resolve(); };
        const onError = () => { cleanup(); reject(new Error('Could not seek to the selected start time.')); };
        const cleanup = () => {
          video.removeEventListener('seeked', onSeeked);
          video.removeEventListener('error', onError);
        };
        video.addEventListener('seeked', onSeeked, { once: true });
        video.addEventListener('error', onError, { once: true });
        try { video.currentTime = from; } catch (e) { cleanup(); reject(e); }
      });

      recorder.start(200);
      await video.play();

      const draw = () => {
        if (stopped) return;
        if (video.currentTime >= to || video.ended) {
          stopped = true;
          stopAll();
          return;
        }
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = filterString;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        ctx.drawImage(video, -baseW / 2, -baseH / 2, baseW, baseH);
        ctx.restore();
        ctx.filter = 'none';
        drawText(ctx, canvas.width, canvas.height);
        animationId = requestAnimationFrame(draw);
      };
      draw();
      await done;
      video.pause();
    } finally {
      if (animationId != null) cancelAnimationFrame(animationId);
      if (recorder.state !== 'inactive') recorder.stop();
      source.getTracks().forEach(track => track.stop());
      stream.getTracks().forEach(track => track.stop());
      video.playbackRate = 1;
      video.volume = 1;
      setPlaying(false);
    }

    if (!chunks.length) throw new Error('No edited video data was produced. Please try again.');
    const blob = new Blob(chunks, { type: mime || 'video/webm' });
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '-edited.webm', {
      type: blob.type || 'video/webm',
      lastModified: Date.now()
    });
  };

  const apply = async () => {
    if (!file) return;
    setProcessing(true); setError('');
    try { const edited = type === 'image' ? await imageCanvas() : await videoCanvas(); onApply?.(edited); }
    catch (e) { setError(e.message || 'Could not export the edited media.'); }
    finally { setProcessing(false); setPlaying(false); }
  };

  const seek = (value) => { const n = Number(value); setStart(Math.min(n, Math.max(0, end - .1))); if (videoRef.current) videoRef.current.currentTime = n; };
  const seekEnd = (value) => { const n = Number(value); setEnd(Math.max(n, start + .1)); };

  return <div className="fixed inset-0 z-[180] bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div className="w-full max-w-3xl max-h-[94dvh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl">
      <div className="sticky top-0 z-20 bg-white border-b px-4 py-3 flex items-center gap-3"><button onClick={onClose} disabled={processing} className="p-2 rounded-full hover:bg-gray-100"><X /></button><div className="flex-1"><b>{type === 'image' ? 'Edit Photo' : 'Edit Video'}</b><p className="text-xs text-gray-500">Professional tools • changes are applied before upload</p></div><button onClick={reset} disabled={processing} className="text-xs font-semibold text-gray-500">Reset</button><button onClick={apply} disabled={processing} className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold flex items-center gap-1">{processing ? 'Exporting…' : <><Check className="w-4 h-4" />Apply</>}</button></div>
      <div className="p-4 space-y-4">
        <div className="rounded-2xl overflow-hidden bg-black min-h-64 flex items-center justify-center">
          {type === 'image' ? <img ref={imageRef} src={url} alt="Editing preview" className="max-h-[48vh] max-w-full object-contain" style={{ filter: filterString, transform }} /> : <div className="relative w-full"><video ref={videoRef} src={url} controls={false} playsInline className="w-full max-h-[48vh] object-contain" style={{ filter: filterString, transform }} onLoadedMetadata={e => { setVideoDuration(e.currentTarget.duration || 0); if (!end) setEnd(e.currentTarget.duration || 0); }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} /><canvas ref={canvasRef} className="hidden" /><button type="button" onClick={() => { const v = videoRef.current; if (!v) return; if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); } }} className="absolute left-3 bottom-3 w-11 h-11 rounded-full bg-black/65 text-white flex items-center justify-center">{playing ? <Pause /> : <Play />}</button></div>}
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {(type === 'video' ? ['video','adjust','filters','text'] : ['adjust','filters','crop','text']).map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`px-2 py-2 rounded-xl text-xs font-semibold border ${activeTab === tab ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600'}`}>{tab === 'video' ? <Scissors className="w-4 h-4 mx-auto mb-1" /> : tab === 'adjust' ? <SlidersHorizontal className="w-4 h-4 mx-auto mb-1" /> : tab === 'filters' ? <Sparkles className="w-4 h-4 mx-auto mb-1" /> : tab === 'crop' ? <Crop className="w-4 h-4 mx-auto mb-1" /> : <Type className="w-4 h-4 mx-auto mb-1" />}{tab[0].toUpperCase()+tab.slice(1)}</button>)}
        </div>

        {activeTab === 'video' && type === 'video' && <section className="space-y-4"><div><label className="text-sm font-semibold">Trim start · {start.toFixed(1)}s</label><input type="range" min="0" max={Math.max(videoDuration, .1)} step="0.1" value={start} onChange={e => seek(e.target.value)} className="w-full" /></div><div><label className="text-sm font-semibold">Trim end · {end.toFixed(1)}s</label><input type="range" min="0.1" max={Math.max(videoDuration, .1)} step="0.1" value={end || videoDuration || .1} onChange={e => seekEnd(e.target.value)} className="w-full" /></div><div className="flex gap-2 flex-wrap">{[.5,1,1.25,1.5,2].map(v => <button key={v} onClick={() => setSpeed(v)} className={`px-3 py-2 rounded-full border text-sm ${speed===v?'bg-purple-600 text-white':''}`}>{v}×</button>)}</div><div className="flex items-center gap-3"><Volume2 className="w-4 h-4" /><input type="range" min="0" max="1" step=".05" value={volume} onChange={e => setVolume(Number(e.target.value))} className="flex-1" /><button onClick={() => setVolume(v => v ? 0 : 1)} className="p-2">{volume ? <Volume2 /> : <VolumeX />}</button></div></section>}

        {activeTab === 'adjust' && <section className="space-y-4"><div className="grid grid-cols-3 gap-2">{[['Brightness',brightness,setBrightness],['Contrast',contrast,setContrast],['Saturation',saturation,setSaturation]].map(([label,val,setter]) => <label key={label} className="text-xs font-semibold">{label}<input type="range" min="40" max="180" value={val} onChange={e=>setter(Number(e.target.value))} className="w-full" /></label>)}</div><label className="text-xs font-semibold">Blur<input type="range" min="0" max="8" step=".5" value={blur} onChange={e=>setBlur(Number(e.target.value))} className="w-full" /></label><div className="flex gap-2 flex-wrap"><button onClick={()=>setRotation(r=>(r+90)%360)} className="px-3 py-2 border rounded-full text-sm flex items-center gap-1"><RotateCw className="w-4 h-4"/>Rotate</button><button onClick={()=>setFlipX(v=>!v)} className="px-3 py-2 border rounded-full text-sm flex items-center gap-1"><FlipHorizontal className="w-4 h-4"/>Flip H</button><button onClick={()=>setFlipY(v=>!v)} className="px-3 py-2 border rounded-full text-sm flex items-center gap-1"><FlipVertical className="w-4 h-4"/>Flip V</button></div></section>}

        {activeTab === 'filters' && <section><div className="grid grid-cols-3 sm:grid-cols-6 gap-2">{Object.keys(FILTERS).map(name => <button key={name} onClick={()=>setFilter(name)} className={`rounded-xl overflow-hidden border ${filter===name?'ring-2 ring-purple-500':''}`}><div className="h-16 bg-gradient-to-br from-purple-300 via-pink-300 to-orange-200" style={{filter:FILTERS[name]}} /><span className="block p-2 text-xs font-semibold">{name}</span></button>)}</div></section>}

        {activeTab === 'crop' && <section><p className="text-sm font-semibold mb-2">Aspect ratio</p><div className="flex gap-2 flex-wrap">{['free','1:1','4:5','16:9','9:16'].map(a=><button key={a} onClick={()=>setAspect(a)} className={`px-4 py-2 rounded-full border ${aspect===a?'bg-purple-600 text-white':''}`}>{a === 'free' ? 'Original' : a}</button>)}</div><p className="text-xs text-gray-500 mt-2">Center crop is applied when you export.</p></section>}

        {activeTab === 'text' && <section className="space-y-3"><textarea value={overlayText} onChange={e=>setOverlayText(e.target.value)} maxLength={120} placeholder="Add text overlay…" className="w-full border rounded-xl p-3" /><div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold">Text size<input type="range" min="16" max="72" value={textSize} onChange={e=>setTextSize(Number(e.target.value))} className="w-full" /></label><label className="text-xs font-semibold">Position<select value={textPosition} onChange={e=>setTextPosition(e.target.value)} className="w-full mt-1 border rounded-lg p-2"><option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option></select></label></div></section>}

        {error && <div className="rounded-xl bg-red-50 text-red-700 text-sm p-3">{error}</div>}
      </div>
    </div>
  </div>;
}
export default MediaEditor;
