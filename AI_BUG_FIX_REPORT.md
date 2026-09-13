# RA Social AI Bug Fix Report

## Fixed

1. **ZIP/project attachments were not readable by AI**
   - ZIP files are now accepted by the AI attachment picker.
   - Backend automatically extracts readable text/code from ZIP archives.
   - Common generated folders such as `node_modules`, `dist`, `build`, `.git`, and coverage are ignored.
   - Project files are prioritized so important source/config files reach the AI context first.
   - Extraction is size-limited to prevent oversized prompts.

2. **Enter key ignored active AI mode**
   - Enter now runs the selected mode (Research, Coding, Data, Writing, Social, Creative, Video, Memory, Image/Video generation) instead of always sending a normal chat message.

3. **Attachment-only messages could not be sent**
   - Send is now enabled when attachments exist even if the text box is empty.

4. **Multipart uploads were made more reliable**
   - Removed manual multipart Content-Type headers so the browser/Axios can set the correct boundary automatically.

5. **Deep Research was not saved to AI history**
   - Research now creates/uses an authenticated AI conversation and saves user + assistant messages.

6. **File analysis was not saved to AI history**
   - File analysis now creates/uses an authenticated AI conversation and returns conversation/message IDs.

7. **Creative AI and Video AI were not saved to history**
   - Both modes now create/use the current AI conversation and persist messages.

8. **Special AI modes now keep the current conversation**
   - Frontend passes `conversationId` for Research, Creative, Video, and File Analysis.

## Verification

- Backend JavaScript syntax checked with Node.js.
- Frontend JSX/JS syntax parsed successfully with TypeScript parser.
- ZIP archive extraction was verified against the project archive; readable source/config entries are detected.
- Changes are limited to AI-related frontend/backend files plus this AI bug-fix report.
