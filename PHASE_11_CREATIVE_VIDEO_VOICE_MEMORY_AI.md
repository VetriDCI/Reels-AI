# RA Social AI — Phase 11

Phase 11 adds Creative AI, Video AI assistance, Groq voice transcription, and user-controlled AI Memory on top of Phase 10.

## Added
- Creative AI: ideas, stories, characters, image prompts, campaign concepts, dialogue, names/taglines, variations.
- Video AI: storyboards, shot lists, voiceover scripts, editing plans, B-roll, thumbnails, repurposing.
- Voice AI: audio upload -> Groq Whisper transcription -> text inserted into the composer.
- Personal AI Memory: save/list/delete user-provided memories; relevant memories are included in normal AI chat context.
- Tamil/Tanglish/English and existing language routing remain intact.
- Existing Research, Vision, File, Coding, Data, Writing, Social/Reels and Agent modes are preserved.

## Important limitation
This phase provides text-based creative/video production assistance and voice transcription. It does not claim to render images or videos because no separate media-generation provider was added.

## Environment
GROQ_TRANSCRIPTION_MODEL=whisper-large-v3-turbo
GROQ_VISION_MODEL=qwen/qwen3.6-27b

The existing startup command uses Prisma db push, so the new AIMemory table is applied during deployment. If your deployment does not run the existing startup flow, run Prisma schema deployment/generation before using Memory.
