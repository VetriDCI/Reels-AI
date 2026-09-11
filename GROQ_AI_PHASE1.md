# RA Social AI — Phase 1: Groq Core

## Completed
- Removed NVIDIA AI service and NVIDIA AI routes.
- Added Groq AI service using the OpenAI-compatible Groq API.
- Added automatic model routing:
  - `openai/gpt-oss-20b` for normal fast chat.
  - `openai/gpt-oss-120b` for coding/reasoning/analysis tasks.
  - `groq/compound` for current-information, web, research, URL and agent-style requests.
- Added model fallback when a preferred Groq model is unavailable.
- Preserved per-user AI conversation history.
- Connected the real `AIFeatures` page from `App.jsx` instead of the obsolete inline AI chat.
- Kept the existing AI attachment/history UI intact.
- Removed the old NVIDIA image-generation endpoint. Image generation will be implemented in a later dedicated media phase because Groq's current core/Compound systems are text/agent systems rather than an image-generation API.

## Backend environment
Set these on the backend (for example Render):

```env
GROQ_API_KEY=your-real-groq-key
GROQ_FAST_MODEL=openai/gpt-oss-20b
GROQ_REASONING_MODEL=openai/gpt-oss-120b
GROQ_AGENT_MODEL=groq/compound
GROQ_REASONING_EFFORT=medium
```

## Validation
- Backend JavaScript syntax checks passed for the changed AI service, controller, routes and server.
- A full frontend `npm run build` was attempted, but dependency installation/build exceeded the execution timeout in this environment. No build result is being claimed.
