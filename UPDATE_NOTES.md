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
