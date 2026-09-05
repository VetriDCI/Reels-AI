# RA Social update

Implemented:
- Search screen starts with only the search control; tabs/results appear after a query.
- Fixed comment UI as a reliable modal/sheet.
- Fixed Cloudinary downloads using attachment delivery URLs, with fallback.
- Posts now have Like, Comment, Share, Download, Views and More actions in one action row.
- Added Join button beside the channel/user name and real per-user post view counting.
- Home video cards no longer play in place; tapping opens the selected video in Reels.
- Reels supports direct opening from `?post=<id>`, active-video play/pause, comments, download and more actions.
- Upload uses the device file picker for Photo/Video (no forced camera capture).
- Made LIVE action prominent and camera preview accessible.
- Added selected-media preview, replace/remove controls and a basic image rotate editor.
- Upload/publishing now shows a blocking progress overlay.
- Added optional mobile number to registration/profile and phone-number user lookup for starting an in-app chat.
- Added WhatsApp/share invite flow for people who are not yet registered.
- Fixed ChatPage participant selection so the other user is selected correctly.

Backend database change:
- `User.phoneNumber` (optional unique)
- `Post.viewCount`
- `PostView` unique per user/post

Deployment:
- Backend startup already runs `prisma db push`, so the new schema fields are applied on startup.
- Keep your existing environment variables (DATABASE_URL, JWT_SECRET, Cloudinary values, FRONTEND_URL/ALLOWED_ORIGINS).
