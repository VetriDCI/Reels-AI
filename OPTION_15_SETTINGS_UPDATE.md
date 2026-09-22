# RA Social — Option 15 Settings Update

Updated from the Option 14 project without creating a new application.

Changes:
- Account Security password change UI now matches the 8-character + letter + number password policy.
- Notifications Settings has safe local preference persistence and reset control; copy no longer claims delivery is connected.
- Privacy & Visibility keeps device-local preference semantics explicit.
- Data Download now invokes the existing authenticated account export endpoint and downloads JSON.
- Settings actions provide user feedback and disabled/loading behavior.

Note: profile visibility/activity settings are still device-local because the existing Prisma User model has no persisted privacy/preferences fields. No destructive schema migration was introduced in this option.
