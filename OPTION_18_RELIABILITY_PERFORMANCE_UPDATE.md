# RA-Social — Option 18: Reliability / Performance Update

Applied to the Option 17 source tree.

## Changes
- Added a 20-second default Axios timeout for normal API requests.
- Added bounded exponential retry (maximum 2 retries) only for safe read methods (GET/HEAD/OPTIONS), including transient network/408/425/429/5xx failures.
- Respects `Retry-After` when provided, capped at 5 seconds.
- Never retries canceled requests or write operations, avoiding accidental duplicate POST/PATCH/DELETE actions.
- Notification unread-count polling now prevents overlapping requests.
- Notification polling pauses while the document is hidden or the browser is offline and refreshes when the tab becomes visible again.
- Health endpoint sends `Cache-Control: no-store`.
- Added graceful backend shutdown for SIGTERM/SIGINT, closing the HTTP server and Prisma connection with a 10-second safety timeout.
- Added process-level logging for unhandled promise rejections and uncaught exceptions.
- Cleanup intervals are explicitly cleared during shutdown.

## Verification
- Backend `server.js` syntax check passed with Node.js.
- Frontend production build could not be completed in this environment because the local dependency install did not finish and `vite` was unavailable. No claim of a successful frontend build is made here.
