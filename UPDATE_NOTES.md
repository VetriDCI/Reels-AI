# RA Social 1-8 Fix Update

- Home feed no longer shows owner Delete controls.
- Owner post management is available from the profile/My Posts area: Hide/Restore and Delete.
- More menus close when clicking outside; same behavior applied to Reels.
- Action row uses View, Like, Comment, Share, Download, More with compact spacing.
- Join button enlarged and toggles Joined/Join.
- Comment panel includes Like and Reply actions.
- Create Post removed AI Caption/AI Hashtags controls.
- LIVE camera now has live/paused/resume/stop controls.
- Chat redesigned for mobile: conversation list and chat view switch on small screens, with back button.
- Chat composer order: Gallery, Emoji, Text, Send.
- Gallery uploads an image/video attachment through the existing upload endpoint and sends its URL with the message.
- Emoji picker added.
- Chat send uses a sending lock to prevent repeated-click duplicate sends.
- Message sent/read ticks retained.
- Added backend post visibility endpoint PATCH /posts/:id/hide.
- Hidden posts are excluded from the normal feed because feed already filters non-approved/rejected status.
- Backend syntax checks passed.

Note: frontend production build could not be executed in this environment because npm dependencies were not available in the local cache and registry installation timed out.

## AI simplification (Super AI merge)
- Removed the unused multi-feature AI grid (`AIFeatures.jsx`, `services/aiApi.js`) and its backend endpoints (`generate-caption`, `generate-hashtags`, `translate`, `moderate`) — none of these were wired into the live app.
- The "AI" tab now uses the dedicated `AIFeatures` page with the new Groq-based AI core:
  - Normal chat uses `openai/gpt-oss-20b`.
  - Coding/reasoning tasks use `openai/gpt-oss-120b`.
  - Current-information/research/URL tasks use `groq/compound` with built-in tools when supported.
  - Groq model fallback is enabled.
- New backend env vars: `GROQ_API_KEY`, `GROQ_FAST_MODEL`, `GROQ_REASONING_MODEL`, `GROQ_AGENT_MODEL`, `GROQ_REASONING_EFFORT`.
