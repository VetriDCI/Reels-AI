import React, { useEffect, useState } from 'react';
import { Upload, Check, AlertTriangle, X, RotateCcw, Loader2 } from 'lucide-react';
import { subscribeUpload, cancelUpload, retryUpload, dismissUpload } from '../utils/uploadManager';

// Notification-style upload card (1% to 100%). Stays visible on every screen while uploading.
export default function UploadProgress() {
  const [job, setJob] = useState(null);
  useEffect(() => subscribeUpload(setJob), []);
  if (!job) return null;

  const failed = job.status === 'error';
  const done = job.status === 'done';
  const title = failed ? 'Upload failed' : done ? `Your ${job.label} was posted` : job.status === 'publishing' ? 'Publishing your post…' : `Uploading ${job.label}…`;
  const tone = failed ? 'border-red-200' : done ? 'border-green-200' : 'border-purple-200';
  const barTone = failed ? 'bg-red-500' : done ? 'bg-green-500' : 'bg-gradient-to-r from-pink-500 to-purple-600';

  return (
    <div className="fixed inset-x-3 z-[210] mx-auto max-w-md" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }} role="status" aria-live="polite">
      <div className={`rounded-2xl border bg-white shadow-xl px-4 py-3 ${tone}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${failed ? 'bg-red-50 text-red-600' : done ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'}`}>
            {failed ? <AlertTriangle size={18} /> : done ? <Check size={18} /> : job.status === 'publishing' ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
            <p className="text-xs text-gray-500 truncate">{failed ? job.error : done ? 'It is live on your profile and feed.' : 'You can keep using the app. Do not close it.'}</p>
          </div>
          {!failed && <span className="text-sm font-bold text-gray-800 tabular-nums">{job.percent}%</span>}
          {failed && <button onClick={retryUpload} className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white"><RotateCcw size={13} />Retry</button>}
          {(failed || done) && <button onClick={dismissUpload} aria-label="Dismiss" className="p-1 text-gray-400"><X size={16} /></button>}
          {!failed && !done && job.status === 'uploading' && <button onClick={cancelUpload} aria-label="Cancel upload" className="p-1 text-gray-400 hover:text-red-500"><X size={16} /></button>}
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={job.percent}>
          <div className={`h-full rounded-full transition-all duration-300 ${barTone}`} style={{ width: `${failed ? Math.max(job.percent, 4) : job.percent}%` }} />
        </div>
      </div>
    </div>
  );
}
