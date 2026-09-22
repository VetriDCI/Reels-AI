# RA Social — Option 19 Deployment & Testing Readiness

## Production projects
- Frontend: deploy `frontend/` as a Vite SPA.
- Backend: deploy `backend/` as the Node/Express API.
- Admin: deploy `Admin-penal/` as a Next.js application.

## Required environment variables
- Frontend: `VITE_API_URL`
- Backend: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `ALLOWED_ORIGINS`
- Media: Cloudinary variables when uploads are enabled.
- Admin: `NEXT_PUBLIC_API_URL`

Use the `.env.example` files as templates. Never commit real secrets.

## Verification performed on the delivered source
- All backend `.js` files pass `node --check`.
- All relative local imports resolve to existing source files.
- PWA manifest icon files referenced by the service worker exist.
- Frontend Vercel SPA rewrite is present.
- Service worker is explicitly served with no-cache headers so updated workers can be fetched after deployment.
- Backend has graceful shutdown and unknown `/api/*` JSON 404 handling.
- Frontend API client has bounded GET retry behavior and upload timeout handling.

## Build limitation
A clean `npm ci` / production build could not be completed in the inspection environment because dependency installation timed out. The ZIP therefore does not claim a successful production build without dependencies installed.

## Deployment smoke test
After deployment, verify:
1. Frontend home/login loads on a direct deep link such as `/login`.
2. Browser console has no service-worker registration errors.
3. `GET /` on the backend returns the API health response.
4. Login, logout, refresh-token/session expiry, post upload, chat connection, and notifications work.
5. Admin login and at least one protected admin page load.
6. Test an image/video upload within and above the configured size limit.
7. Test mobile standalone/PWA install and offline shell.
