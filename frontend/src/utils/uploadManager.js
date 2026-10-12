// Background post upload: keeps running while the user moves around the app.
// Progress is shown by <UploadProgress /> (mounted once in App.jsx).
import { postAPI, uploadAPI } from '../services/api';

let currentJob = null;
let jobSeq = 0;
const listeners = new Set();
const emit = () => listeners.forEach((listener) => listener(currentJob ? { ...currentJob } : null));
const patch = (id, changes) => { if (currentJob && currentJob.id === id) { currentJob = { ...currentJob, ...changes }; emit(); } };

export const subscribeUpload = (listener) => { listeners.add(listener); listener(currentJob ? { ...currentJob } : null); return () => listeners.delete(listener); };
export const isUploading = () => Boolean(currentJob && (currentJob.status === 'uploading' || currentJob.status === 'publishing'));

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', (event) => { if (isUploading()) { event.preventDefault(); event.returnValue = ''; } });
}

const describe = (files) => {
  if (!files.length) return { kind: 'post', label: 'post' };
  const videos = files.filter((f) => f.type?.startsWith('video/')).length;
  if (videos === files.length) return { kind: 'video', label: files.length > 1 ? `${files.length} videos` : 'video' };
  if (videos === 0) return { kind: 'photo', label: files.length > 1 ? `${files.length} photos` : 'photo' };
  return { kind: 'media', label: `${files.length} files` };
};

// Upload phase is 0-92% (bytes sent = 85%, server confirmed = 100% of that), publishing is 95-99%, done is 100%.
const runJob = async (job) => {
  const { id, files, content, fallbackMedia, onDone, controller } = job;
  const total = files.reduce((sum, f) => sum + (f.size || 1), 0) || 1;
  const sent = files.map(() => 0);
  const confirmed = files.map(() => false);
  const updateUploadPercent = () => {
    const done = files.reduce((sum, f, i) => sum + (f.size || 1) * (confirmed[i] ? 1 : sent[i] * 0.85), 0);
    patch(id, { percent: Math.max(1, Math.min(92, Math.floor((done / total) * 92))) });
  };
  try {
    patch(id, { status: 'uploading', percent: 1, error: '' });
    const items = files.length
      ? await Promise.all(files.map(async (file, index) => {
        const upload = await uploadAPI.media(file, {
          signal: controller.signal,
          onProgress: (event) => { if (event.total) { sent[index] = Math.min(1, event.loaded / event.total); updateUploadPercent(); } }
        });
        confirmed[index] = true; updateUploadPercent();
        return { mediaUrl: upload.data.data.url, mediaType: file.type?.startsWith('video/') ? 'video' : upload.data.data.mediaType };
      }))
      : [{ mediaUrl: fallbackMedia?.mediaUrl || null, mediaType: fallbackMedia?.mediaType || 'text' }];
    if (controller.signal.aborted) throw Object.assign(new Error('cancelled'), { code: 'ERR_CANCELED' });
    patch(id, { status: 'publishing', percent: 95 });
    for (let i = 0; i < items.length; i += 1) {
      if (controller.signal.aborted) throw Object.assign(new Error('cancelled'), { code: 'ERR_CANCELED' });
      await postAPI.create({ content, mediaUrl: items[i].mediaUrl, mediaType: items[i].mediaType, isCreatorAd: false });
      patch(id, { percent: Math.min(99, 95 + Math.round(((i + 1) / items.length) * 4)) });
    }
    patch(id, { status: 'done', percent: 100 });
    try { onDone?.(); } catch (error) { console.error('Upload onDone failed', error); }
    setTimeout(() => { if (currentJob && currentJob.id === id && currentJob.status === 'done') { currentJob = null; emit(); } }, 3500);
  } catch (error) {
    if (error?.code === 'ERR_CANCELED' || controller.signal.aborted) { if (currentJob && currentJob.id === id) { currentJob = null; emit(); } return; }
    console.error('Post upload failed:', error);
    patch(id, { status: 'error', error: error.response?.data?.message || 'Upload failed. Check your connection and retry.' });
  }
};

// Returns false when another upload is still running.
export function startPostUpload({ files = [], content = '', fallbackMedia = null, onDone } = {}) {
  if (isUploading()) return false;
  const { kind, label } = describe(files);
  currentJob = { id: ++jobSeq, status: 'uploading', percent: 1, kind, label, error: '', files, content, fallbackMedia, onDone, controller: new AbortController() };
  emit();
  runJob(currentJob);
  return true;
}

export function retryUpload() {
  if (!currentJob || currentJob.status !== 'error') return;
  currentJob = { ...currentJob, controller: new AbortController(), status: 'uploading', percent: 1, error: '' };
  emit();
  runJob(currentJob);
}

export function cancelUpload() {
  if (!currentJob) return;
  currentJob.controller.abort();
  currentJob = null;
  emit();
}

export function dismissUpload() {
  if (currentJob && !isUploading()) { currentJob = null; emit(); }
}
