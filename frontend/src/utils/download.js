// Downloads a remote media file (image/video) as an actual file save.
//
// The earlier approach used fetch() to pull the file as a blob before
// saving it — but Cloudinary (which this app uses for all media) does
// not set CORS headers on delivery URLs by default, so that fetch()
// call fails silently for every real deployment and falls back to just
// opening the file in a new tab, which looks like "download isn't
// working". Cloudinary supports a `fl_attachment` delivery flag that
// makes it send a Content-Disposition: attachment header itself —
// the browser then downloads it directly on a normal link click,
// with no fetch/CORS involved at all.
function withCloudinaryAttachment(url, filename) {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith('res.cloudinary.com')) return null;
    u.searchParams.set('fl_attachment', filename ? filename.replace(/\.[^.]+$/, '') : 'true');
    return u.toString();
  } catch {
    return null;
  }
}

export async function downloadMedia(url, filename) {
  if (!url) return { success: false, error: 'No media to download' };

  const cloudinaryUrl = withCloudinaryAttachment(url, filename);
  if (cloudinaryUrl) {
    const link = document.createElement('a');
    link.href = cloudinaryUrl;
    link.download = filename || 'ra-social-media';
    document.body.appendChild(link);
    link.click();
    link.remove();
    return { success: true };
  }

  // Not a Cloudinary URL (or URL parsing failed) — try the blob-fetch
  // approach, which works fine for same-origin or CORS-enabled hosts.
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
    // Last resort — open it so the user can save it manually.
    window.open(url, '_blank', 'noopener,noreferrer');
    return { success: false, error: error.message };
  }
}
