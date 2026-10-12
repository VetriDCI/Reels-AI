// Offline copies of saved posts/reels so saved videos still play without internet.
// Files are stored as Blobs in IndexedDB (not in localStorage, which is too small).
const DB_NAME = 'ra-social-offline';
const STORE = 'saved';
const MAX_BYTES = 200 * 1024 * 1024; // skip single files bigger than 200 MB

const openDb = () => new Promise((resolve, reject) => {
  if (typeof indexedDB === 'undefined') return reject(new Error('Offline storage is not supported'));
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => { request.result.createObjectStore(STORE, { keyPath: 'id' }); };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const run = async (mode, action) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = action(transaction.objectStore(STORE));
    transaction.oncomplete = () => { db.close(); resolve(request?.result); };
    transaction.onerror = transaction.onabort = () => { db.close(); reject(transaction.error); };
  });
};

const slim = (post) => ({
  id: post.id,
  content: post.content || '',
  mediaUrl: post.mediaUrl,
  mediaType: post.mediaType,
  createdAt: post.createdAt,
  hashtags: post.hashtags || [],
  user: post.user ? { id: post.user.id, username: post.user.username, fullName: post.user.fullName } : null
});

export const hasOffline = async (id) => Boolean(await run('readonly', (store) => store.getKey(id)).catch(() => false));
export const listOffline = async () => ((await run('readonly', (store) => store.getAll())) || []).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
export const removeOffline = (id) => run('readwrite', (store) => store.delete(id)).catch(() => {});

// Downloads the media once and keeps it on this device. Resolves true when stored.
export const saveOffline = async (post) => {
  if (!post?.id || !post.mediaUrl) return false;
  if (await hasOffline(post.id)) return true;
  const response = await fetch(post.mediaUrl, { mode: 'cors' });
  if (!response.ok) throw new Error(`Offline copy failed (${response.status})`);
  const blob = await response.blob();
  if (blob.size > MAX_BYTES) return false;
  await run('readwrite', (store) => store.put({ id: post.id, savedAt: Date.now(), post: slim(post), blob }));
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
  return true;
};
