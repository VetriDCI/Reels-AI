import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X, Check, RotateCw, FlipHorizontal, FlipVertical, Crop, SlidersHorizontal,
  Sparkles, Type, Scissors, Volume2, VolumeX, Play, Pause, SunMedium,
  Palette, Droplets, Contrast, Move, ZoomIn, RotateCcw
} from 'lucide-react';

const FILTERS = {
  Original: '',
  Vivid: 'saturate(1.35) contrast(1.08)',
  Warm: 'saturate(1.15) sepia(.16) contrast(1.04)',
  Cool: 'saturate(.92) hue-rotate(10deg) contrast(1.05)',
  'B&W': 'grayscale(1) contrast(1.08)',
  Vintage: 'sepia(.32) saturate(.82) contrast(.96)',
  Cinematic: 'contrast(1.18) saturate(.9) brightness(.98)',
  Fade: 'contrast(.9) saturate(.82) brightness(1.04)',
  Dramatic: 'contrast(1.32) saturate(1.08) brightness(.96)',
};

const ASPECTS = ['free', '1:1', '4:5', '3:4', '16:9', '9:16'];
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

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
  const [sharpen, setSharpen] = useState(0);
  const [vignette, setVignette] = useState(0);
  const [warmth, setWarmth] = useState(0);
  const [tint, setTint] = useState(0);
  const [aspect, setAspect] = useState('free');
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [overlayText, setOverlayText] = useState('');
  const [textSize, setTextSize] = useState(32);
  const [textPosition, setTextPosition] = useState('bottom');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textBackground, setTextBackground] = useState(true);
  const [textStroke, setTextStroke] = useState(0);
  const [textAlign, setTextAlign] = useState('center');
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
  useEffect(() => {
    if (type === 'video' && videoDuration && !end) setEnd(videoDuration);
  }, [type, videoDuration, end]);

  const baseFilter = `${FILTERS[filter] || ''} brightness(${brightness / 100}) contrast(${contrast / 100}) saturate(${saturation / 100}) blur(${blur}px) hue-rotate(${tint}deg) sepia(${Math.max(0, warmth) / 260})`;
  const transform = `rotate(${rotation}deg) scaleX(${flipX ? -zoom : zoom}) scaleY(${flipY ? -zoom : zoom}) translate(${offsetX / Math.max(zoom, .01)}%, ${offsetY / Math.max(zoom, .01)}%)`;

  const reset = () => {
    setRotation(0); setFlipX(false); setFlipY(false); setFilter('Original');
    setBrightness(100); setContrast(100); setSaturation(100); setBlur(0); setSharpen(0);
    setVignette(0); setWarmth(0); setTint(0); setAspect('free'); setZoom(1); setOffsetX(0); setOffsetY(0);
    setOverlayText(''); setTextSize(32); setTextPosition('bottom'); setTextColor('#ffffff');
    setTextBackground(true); setTextStroke(0); setTextAlign('center'); setStart(0); setEnd(videoDuration || 0);
    setSpeed(1); setVolume(1); setError('');
  };

  const getCrop = (w, h) => {
    let cropW = w, cropH = h;
    if (aspect !== 'free') {
      const [aw, ah] = aspect.split(':').map(Number);
      if (w / h > aw / ah) cropW = h * aw / ah;
      else cropH = w * ah / aw;
    }
    const factor = 1 / Math.max(zoom, 1);
    cropW *= factor; cropH *= factor;
    const maxX = Math.max(0, (w - cropW) / 2);
    const maxY = Math.max(0, (h - cropH) / 2);
    const cx = w / 2 + (offsetX / 100) * maxX * 2;
    const cy = h / 2 + (offsetY / 100) * maxY * 2;
    return {
      x: clamp(cx - cropW / 2, 0, Math.max(0, w - cropW)),
      y: clamp(cy - cropH / 2, 0, Math.max(0, h - cropH)),
      w: cropW, h: cropH,
    };
  };

  const drawVignette = (ctx, w, h) => {
    if (!vignette) return;
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .18, w / 2, h / 2, Math.max(w, h) * .72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${clamp(vignette / 100, 0, .85)})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  };

  const drawText = (ctx, w, h) => {
    const text = overlayText.trim();
    if (!text) return;
    ctx.save();
    const size = Number(textSize) || 32;
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = textAlign;
    const x = textAlign === 'left' ? Math.min(40, w * .08) : textAlign === 'right' ? w - Math.min(40, w * .08) : w / 2;
    const y = textPosition === 'top' ? size * 1.7 : textPosition === 'center' ? h / 2 : h - size * 1.8;
    const metrics = ctx.measureText(text);
    const padX = 18, padY = 11;
    const left = textAlign === 'left' ? x - padX : textAlign === 'right' ? x - metrics.width - padX : x - metrics.width / 2 - padX;
    if (textBackground) {
      ctx.fillStyle = 'rgba(0,0,0,.58)';
      ctx.fillRect(left, y - size / 2 - padY, metrics.width + padX * 2, size + padY * 2);
    }
    if (textStroke) {
      ctx.lineWidth = textStroke * 2;
      ctx.strokeStyle = 'rgba(0,0,0,.85)';
      ctx.strokeText(text, x, y);
    }
    ctx.fillStyle = textColor;
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  const prepareCanvas = (sourceW, sourceH) => {
    const crop = getCrop(sourceW, sourceH);
    const ratio = crop.w / crop.h;
    const maxDimension = 2160;
    let outW = Math.min(Math.round(crop.w), maxDimension);
    let outH = Math.round(outW / ratio);
    if (outH > maxDimension) { outH = maxDimension; outW = Math.round(outH * ratio); }
    const rotated = rotation % 180 !== 0;
    const canvasW = rotated ? outH : outW;
    const canvasH = rotated ? outW : outH;
    return { crop, outW, outH, canvasW, canvasH };
  };

  const drawFrame = (ctx, source, sourceW, sourceH, canvasW, canvasH) => {
    const crop = getCrop(sourceW, sourceH);
    const rotated = rotation % 180 !== 0;
    const drawW = rotated ? canvasH : canvasW;
    const drawH = rotated ? canvasW : canvasH;
    ctx.save();
    ctx.filter = `${FILTERS[filter] || ''} brightness(${brightness / 100}) contrast(${contrast / 100}) saturate(${saturation / 100}) blur(${blur}px) hue-rotate(${tint}deg) sepia(${Math.max(0, warmth) / 260})`;
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.drawImage(source, crop.x, crop.y, crop.w, crop.h, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
    ctx.filter = 'none';
    // A portable sharpening fallback: a very subtle high-contrast composite.
    if (sharpen > 0) {
      ctx.save(); ctx.globalAlpha = sharpen / 320; ctx.globalCompositeOperation = 'overlay';
      ctx.drawImage(ctx.canvas, 0, 0, canvasW, canvasH); ctx.restore();
    }
    drawVignette(ctx, canvasW, canvasH);
    drawText(ctx, canvasW, canvasH);
  };

  const imageCanvas = async () => {
    const img = imageRef.current;
    if (!img) throw new Error('Image is not ready');
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('Please wait for the image to finish loading.');
    const { outW, outH, canvasW, canvasH } = prepareCanvas(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas'); canvas.width = canvasW; canvas.height = canvasH;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Image editor could not create a drawing surface.');
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    drawFrame(ctx, img, img.naturalWidth, img.naturalHeight, canvasW, canvasH);
    return await new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(new File([blob], file.name.replace(/\.[^.]+$/, '') + '-edited.jpg', { type: 'image/jpeg', lastModified: Date.now() })) : reject(new Error('Could not export image.')), 'image/jpeg', .95);
    });
  };

  const waitForSeek = (video, time) => new Promise((resolve, reject) => {
    const cleanup = () => { video.removeEventListener('seeked', done); video.removeEventListener('error', fail); };
    const done = () => { cleanup(); resolve(); };
    const fail = () => { cleanup(); reject(new Error('Could not seek to the selected time.')); };
    video.addEventListener('seeked', done, { once: true }); video.addEventListener('error', fail, { once: true });
    try { video.currentTime = time; } catch (e) { cleanup(); reject(e); }
  });

  const videoCanvas = async () => {
    const video = videoRef.current;
    if (!video) throw new Error('Video is not ready');
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream || typeof video.captureStream !== 'function') {
      throw new Error('This browser cannot export edited videos. Chrome/Edge on Android or desktop is recommended.');
    }
    const duration = Number.isFinite(videoDuration) && videoDuration > 0 ? videoDuration : (video.duration || 0);
    if (!duration) throw new Error('Video duration is not ready yet. Please wait a moment and try again.');
    const from = clamp(Number(start) || 0, 0, Math.max(0, duration - .05));
    const to = clamp(Number(end) || duration, from + .05, duration);
    const sourceW = video.videoWidth || 1280, sourceH = video.videoHeight || 720;
    const { outW, outH, canvasW, canvasH } = prepareCanvas(sourceW, sourceH);
    const canvas = canvasRef.current || document.createElement('canvas'); canvas.width = canvasW; canvas.height = canvasH;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Video editor could not create a drawing surface.');
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    const stream = canvas.captureStream(30);
    const source = video.captureStream();
    source.getAudioTracks().forEach(track => stream.addTrack(track));
    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      .find(m => MediaRecorder.isTypeSupported(m)) || '';
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 7000000 } : undefined);
    const chunks = [];
    let animationId = null;
    let stopped = false;
    const done = new Promise((resolve, reject) => {
      recorder.ondataavailable = e => { if (e.data?.size) chunks.push(e.data); };
      recorder.onerror = () => reject(new Error('Video export failed. Please try again.'));
      recorder.onstop = () => resolve();
    });
    const stop = () => { stopped = true; if (animationId != null) cancelAnimationFrame(animationId); if (recorder.state !== 'inactive') recorder.stop(); };

    try {
      setPlaying(true); video.pause(); video.playbackRate = speed; video.volume = volume;
      await waitForSeek(video, from);
      recorder.start(200);
      await video.play();
      const draw = () => {
        if (stopped) return;
        if (video.currentTime >= to || video.ended) { stop(); return; }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawFrame(ctx, video, sourceW, sourceH, canvasW, canvasH);
        animationId = requestAnimationFrame(draw);
      };
      draw();
      await done;
      video.pause();
    } finally {
      if (animationId != null) cancelAnimationFrame(animationId);
      if (recorder.state !== 'inactive') recorder.stop();
      source.getTracks().forEach(track => track.stop()); stream.getTracks().forEach(track => track.stop());
      video.playbackRate = 1; video.volume = 1; setPlaying(false);
    }
    if (!chunks.length) throw new Error('No edited video data was produced. Please try again.');
    const blob = new Blob(chunks, { type: mime || 'video/webm' });
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '-edited.webm', { type: blob.type || 'video/webm', lastModified: Date.now() });
  };

  const apply = async () => {
    if (!file) return;
    setProcessing(true); setError('');
    try {
      const edited = type === 'image' ? await imageCanvas() : await videoCanvas();
      onApply?.(edited);
    } catch (e) { setError(e?.message || 'Could not export the edited media.'); }
    finally { setProcessing(false); setPlaying(false); }
  };

  const seek = value => { const n = Number(value); setStart(Math.min(n, Math.max(0, end - .1))); if (videoRef.current) videoRef.current.currentTime = n; };
  const seekEnd = value => { const n = Number(value); setEnd(Math.max(n, start + .1)); };

  const tabs = type === 'video'
    ? [['video', Scissors], ['adjust', SlidersHorizontal], ['color', Palette], ['filters', Sparkles], ['crop', Crop], ['text', Type]]
    : [['adjust', SlidersHorizontal], ['color', Palette], ['filters', Sparkles], ['crop', Crop], ['text', Type]];

  return (
    <div className="fixed inset-0 z-[180] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-5xl max-h-[96dvh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl">
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
          <button onClick={onClose} disabled={processing} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close"><X /></button>
          <div className="flex-1 min-w-0"><b className="text-base sm:text-lg">{type === 'image' ? 'Pro Photo Editor' : 'Pro Video Editor'}</b><p className="text-xs text-gray-500 truncate">Edit only • nothing is uploaded until you choose Post, Send, Vibe or Save</p></div>
          <button onClick={reset} disabled={processing} className="hidden sm:flex items-center gap-1 text-xs font-semibold text-gray-500 px-3 py-2 rounded-full hover:bg-gray-100"><RotateCcw className="w-4 h-4" />Reset</button>
          <button onClick={apply} disabled={processing} className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold flex items-center gap-1 shadow-lg">{processing ? 'Saving…' : <><Check className="w-4 h-4" />Save edit</>}</button>
        </div>

        <div className="p-3 sm:p-5 grid lg:grid-cols-[1.35fr_.85fr] gap-4">
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden bg-neutral-950 min-h-72 flex items-center justify-center relative">
              {type === 'image' ? (
                <img ref={imageRef} src={url} alt="Editing preview" className="max-h-[58vh] max-w-full object-contain transition-transform" style={{ filter: baseFilter, transform }} />
              ) : (
                <div className="relative w-full flex items-center justify-center"><video ref={videoRef} src={url} controls={false} playsInline className="w-full max-h-[58vh] object-contain" style={{ filter: baseFilter, transform }} onLoadedMetadata={e => { setVideoDuration(e.currentTarget.duration || 0); if (!end) setEnd(e.currentTarget.duration || 0); }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} /><canvas ref={canvasRef} className="hidden" /><button type="button" onClick={() => { const v = videoRef.current; if (!v) return; v.paused ? v.play() : v.pause(); }} className="absolute left-3 bottom-3 w-11 h-11 rounded-full bg-black/70 text-white flex items-center justify-center">{playing ? <Pause /> : <Play />}</button></div>
              )}
              {vignette > 0 && <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle, transparent ${35 + (100 - vignette) * .25}%, rgba(0,0,0,${vignette / 100}) 100%)` }} />}
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-500"><span>{file?.name || 'Media'}</span><span>{file ? `${Math.max(0.01, file.size / 1024 / 1024).toFixed(1)} MB` : ''}</span></div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {tabs.map(([tab, Icon]) => <button key={tab} onClick={() => setActiveTab(tab)} className={`px-2 py-2 rounded-xl text-[11px] font-semibold border ${activeTab === tab ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600'}`}><Icon className="w-4 h-4 mx-auto mb-1" />{tab[0].toUpperCase() + tab.slice(1)}</button>)}
            </div>

            {activeTab === 'video' && type === 'video' && <section className="space-y-4 rounded-2xl border p-4">
              <div><label className="text-xs font-bold">Trim start · {start.toFixed(1)}s</label><input type="range" min="0" max={Math.max(videoDuration, .1)} step=".1" value={start} onChange={e => seek(e.target.value)} className="w-full" /></div>
              <div><label className="text-xs font-bold">Trim end · {end.toFixed(1)}s</label><input type="range" min=".1" max={Math.max(videoDuration, .1)} step=".1" value={end || videoDuration || .1} onChange={e => seekEnd(e.target.value)} className="w-full" /></div>
              <div><p className="text-xs font-bold mb-2">Speed</p><div className="flex gap-2 flex-wrap">{[.5,.75,1,1.25,1.5,2].map(v => <button key={v} onClick={() => setSpeed(v)} className={`px-3 py-2 rounded-full border text-xs ${speed === v ? 'bg-purple-600 text-white' : ''}`}>{v}×</button>)}</div></div>
              <div><div className="flex items-center justify-between"><span className="text-xs font-bold">Volume</span><span className="text-xs text-gray-500">{Math.round(volume * 100)}%</span></div><div className="flex items-center gap-2"><Volume2 className="w-4 h-4" /><input type="range" min="0" max="1" step=".05" value={volume} onChange={e => setVolume(Number(e.target.value))} className="flex-1" /><button onClick={() => setVolume(v => v ? 0 : 1)} className="p-2">{volume ? <Volume2 /> : <VolumeX />}</button></div></div>
            </section>}

            {activeTab === 'adjust' && <section className="space-y-4 rounded-2xl border p-4">
              {[["Brightness", brightness, setBrightness, 40, 180, SunMedium],["Contrast", contrast, setContrast, 40, 180, Contrast],["Saturation", saturation, setSaturation, 0, 200, Droplets],["Blur", blur, setBlur, 0, 10, Sparkles],["Sharpen", sharpen, setSharpen, 0, 100, SlidersHorizontal],["Vignette", vignette, setVignette, 0, 100, Sparkles]].map(([label,val,setter,min,max,Icon]) => <label key={label} className="block text-xs font-semibold"><span className="flex justify-between"><span className="flex gap-1 items-center"><Icon className="w-3.5 h-3.5" />{label}</span><span>{Math.round(val)}</span></span><input type="range" min={min} max={max} step={label === 'Blur' ? .5 : 1} value={val} onChange={e => setter(Number(e.target.value))} className="w-full" /></label>)}
              <div className="flex gap-2 flex-wrap pt-1"><button onClick={() => setRotation(r => (r + 90) % 360)} className="px-3 py-2 border rounded-full text-xs flex items-center gap-1"><RotateCw className="w-4 h-4" />Rotate</button><button onClick={() => setFlipX(v => !v)} className="px-3 py-2 border rounded-full text-xs flex items-center gap-1"><FlipHorizontal className="w-4 h-4" />Flip H</button><button onClick={() => setFlipY(v => !v)} className="px-3 py-2 border rounded-full text-xs flex items-center gap-1"><FlipVertical className="w-4 h-4" />Flip V</button></div>
            </section>}

            {activeTab === 'color' && <section className="space-y-4 rounded-2xl border p-4">
              <p className="text-xs text-gray-500">Fine color controls are previewed live and baked into the saved edit.</p>
              <label className="block text-xs font-semibold">Warmth <input type="range" min="0" max="100" value={warmth} onChange={e => setWarmth(Number(e.target.value))} className="w-full" /></label>
              <label className="block text-xs font-semibold">Tint <input type="range" min="-30" max="30" value={tint} onChange={e => setTint(Number(e.target.value))} className="w-full" /></label>
              <div className="grid grid-cols-3 gap-2"><button onClick={() => { setBrightness(108); setContrast(108); setSaturation(112); }} className="p-3 rounded-xl border text-xs font-semibold">Auto enhance</button><button onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); setWarmth(0); setTint(0); }} className="p-3 rounded-xl border text-xs font-semibold">Neutral</button><button onClick={() => { setBrightness(96); setContrast(118); setSaturation(108); setVignette(24); }} className="p-3 rounded-xl border text-xs font-semibold">Cinematic</button></div>
            </section>}

            {activeTab === 'filters' && <section className="rounded-2xl border p-4"><div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{Object.keys(FILTERS).map(name => <button key={name} onClick={() => setFilter(name)} className={`rounded-xl overflow-hidden border ${filter === name ? 'ring-2 ring-purple-500' : ''}`}><div className="h-16 bg-gradient-to-br from-purple-300 via-pink-300 to-orange-200" style={{ filter: FILTERS[name] }} /><span className="block p-2 text-xs font-semibold">{name}</span></button>)}</div></section>}

            {activeTab === 'crop' && <section className="space-y-4 rounded-2xl border p-4">
              <div><p className="text-xs font-bold mb-2">Aspect ratio</p><div className="flex gap-2 flex-wrap">{ASPECTS.map(a => <button key={a} onClick={() => setAspect(a)} className={`px-3 py-2 rounded-full border text-xs ${aspect === a ? 'bg-purple-600 text-white' : ''}`}>{a === 'free' ? 'Original' : a}</button>)}</div></div>
              <label className="block text-xs font-semibold"><span className="flex justify-between"><span className="flex items-center gap-1"><ZoomIn className="w-3.5 h-3.5" />Zoom</span><span>{zoom.toFixed(2)}×</span></span><input type="range" min="1" max="3" step=".01" value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-full" /></label>
              <div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold"><span className="flex items-center gap-1"><Move className="w-3.5 h-3.5" />Horizontal</span><input type="range" min="-100" max="100" value={offsetX} onChange={e => setOffsetX(Number(e.target.value))} className="w-full" /></label><label className="text-xs font-semibold"><span className="flex items-center gap-1"><Move className="w-3.5 h-3.5" />Vertical</span><input type="range" min="-100" max="100" value={offsetY} onChange={e => setOffsetY(Number(e.target.value))} className="w-full" /></label></div>
              <button onClick={() => { setZoom(1); setOffsetX(0); setOffsetY(0); }} className="text-xs font-semibold text-purple-600">Center crop</button>
            </section>}

            {activeTab === 'text' && <section className="space-y-3 rounded-2xl border p-4">
              <textarea value={overlayText} onChange={e => setOverlayText(e.target.value)} maxLength={160} placeholder="Add text, title, caption or watermark…" className="w-full border rounded-xl p-3 text-sm" />
              <div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold">Size<input type="range" min="14" max="96" value={textSize} onChange={e => setTextSize(Number(e.target.value))} className="w-full" /></label><label className="text-xs font-semibold">Position<select value={textPosition} onChange={e => setTextPosition(e.target.value)} className="w-full mt-1 border rounded-lg p-2"><option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option></select></label></div>
              <div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold">Align<select value={textAlign} onChange={e => setTextAlign(e.target.value)} className="w-full mt-1 border rounded-lg p-2"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label><label className="text-xs font-semibold">Text color<div className="mt-1 flex items-center gap-2 border rounded-lg p-1"><input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-9 h-8" /><span className="text-xs">{textColor}</span></div></label></div>
              <div className="flex gap-2 flex-wrap"><button onClick={() => setTextBackground(v => !v)} className={`px-3 py-2 rounded-full border text-xs ${textBackground ? 'bg-gray-900 text-white' : ''}`}>Background</button>{[0,1,2,3].map(v => <button key={v} onClick={() => setTextStroke(v)} className={`px-3 py-2 rounded-full border text-xs ${textStroke === v ? 'bg-gray-900 text-white' : ''}`}>Stroke {v}</button>)}</div>
            </section>}

            {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}
            {processing && <div className="rounded-xl bg-purple-50 border border-purple-100 text-purple-700 text-xs p-3">Processing your edit locally. Keep this editor open until Save edit finishes.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MediaEditor;
