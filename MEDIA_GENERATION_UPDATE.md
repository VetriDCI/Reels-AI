# RA Social AI — Image + Video Generation Update

This update adds real media generation to the existing Groq AI platform.

## Provider

Pollinations is used only for media generation. Groq remains the main AI/chat provider.

## Backend environment

Add these variables:

```env
POLLINATIONS_API_KEY=your-pollinations-api-key
POLLINATIONS_BASE_URL=https://gen.pollinations.ai
POLLINATIONS_IMAGE_MODEL=flux
POLLINATIONS_VIDEO_MODEL=veo
POLLINATIONS_VIDEO_DURATION=4
```

Get the Pollinations API key from its account/key flow. Do not put the key in frontend code.

## New endpoints

- `POST /api/ai/generate-image`
- `POST /api/ai/generate-video`

Both endpoints are authenticated and generated media is uploaded to Cloudinary before being returned to the UI.

## UI

The AI header now has:

- Generate Image
- Generate Video

Enter a prompt and press Send.

## Notes

- Image generation uses the configured Pollinations image model.
- Video generation uses the configured Pollinations video model and defaults to 4 seconds.
- Groq is not removed or replaced for chat/reasoning/research/vision/coding/etc.
- If the media API key is missing, the UI receives a clear configuration error instead of silently pretending generation succeeded.
