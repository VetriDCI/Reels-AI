# RA Social - FINAL FIXED

This package contains the corrected RA Social frontend, backend, and admin app.

## Important fixes
- Fixed user post creation so selected image/video is uploaded and saved instead of being discarded.
- Added backend Cloudinary media upload endpoint.
- Fixed video rendering in feed and Reels with native controls, lazy metadata loading, and media-error feedback.
- Fixed missing DELETE post API route.
- Added working comments UI and comment submission.
- Added working share button (native share when available, clipboard fallback).
- Fixed notification bell navigation and automatic mark-as-read.
- Fixed notification Prisma relation to posts.
- Added registration password show/hide eye button.
- Added basic browser camera/microphone Live preview with permission/error handling.
- Fixed blocked users from logging in.
- Fixed backend CORS parsing for comma-separated production origins.
- Fixed initial deployment database sync: backend now uses `prisma db push` because this package has no migration directory.
- Admin and RA Social use the same backend/database, so users/posts/video counts stay synchronized.

## Required production environment
The supplied environment files contain placeholders by design. Replace them with real values before deployment:
- DATABASE_URL
- JWT_SECRET
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- VITE_API_URL (frontend, normally `https://YOUR-BACKEND/api`)
- NEXT_PUBLIC_API_URL (admin, normally `https://YOUR-BACKEND`)
- ALLOWED_ORIGINS / FRONTEND_URL

The application cannot access your database or Cloudinary account without these real credentials.

## Local run
Backend:
  cd backend
  npm install
  npm start

Frontend:
  cd frontend
  npm install
  npm run dev

Admin:
  cd admin
  npm install
  npm run dev

## Admin
Default admin creation is controlled by:
DEFAULT_ADMIN_EMAIL
DEFAULT_ADMIN_PASSWORD

If those variables are not supplied, the backend creates:
admin@rasocial.com / admin123

Change the default password for production.

## Live note
The Live control now opens a real browser camera/microphone preview. A true multi-user live broadcast (viewer rooms, ingest, transcoding, recording, moderation) requires a streaming/WebRTC service or media server and is not faked in this package.
