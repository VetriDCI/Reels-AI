// Downloads a remote media file (image/video) as an actual file save,
// instead of just opening the URL in a new tab (which is what a plain
// <a href> to a cross-origin Cloudinary URL does — the browser previews
// it instead of downloading it).
export async function downloadMedia(url, filename) {
  if (!url) return { success: false, error: 'No media to download' };
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`Download failed (${response.status})`);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || 'ra-social-media';
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(blobUrl);
    return { success: true };
  } catch (error) {
    // Cross-origin fetch can be blocked if Cloudinary's CORS headers
    // don't allow it — fall back to opening the direct URL so the user
    // can still save it manually (long-press / right-click "Save as").
    window.open(url, '_blank', 'noopener,noreferrer');
    return { success: false, error: error.message };
  }
}
