# Option 16 — Upload / Cloudinary Update

Base: RA-Social original project, continued from Option 15.

## Updated
- Cloudinary storage now explicitly stores images as `image` and videos as `video` resources.
- Added WebP and M4V to Cloudinary allowed formats to match the server MIME allow-list.
- Centralized frontend media validation before network upload.
- Rejects non-File, unsupported MIME types, empty files, and files over 50 MB before upload.
- Upload request timeout set to 120 seconds.
- Upload progress callback supported by the shared upload API.
- Create Post upload UI now shows percentage progress and an accessible progress bar.
- Existing server-side 50 MB limit, MIME validation, single-file-per-request handling, and Cloudinary response validation remain in place.

## Verification
- Backend modified JavaScript files pass `node --check`.
- Full frontend production build was not run because dependencies are not installed in this runtime.
