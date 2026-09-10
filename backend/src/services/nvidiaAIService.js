import axios from 'axios';
import { cloudinary } from '../config/cloudinary.js';

const configuredTextModels = (process.env.NVIDIA_TEXT_MODELS || process.env.NVIDIA_TEXT_MODEL || '')
    .split(',')
    .map(model => model.trim())
    .filter(Boolean);

const TEXT_MODELS = configuredTextModels.length
    ? [...new Set(configuredTextModels)]
    : [
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'google/gemma-4-31b-it'
    ];

const VISION_MODEL = process.env.NVIDIA_VISION_MODEL || 'meta/muse-glimmer-30b';
const OMNI_MODEL = process.env.NVIDIA_OMNI_MODEL || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning';
const IMAGE_MODEL = process.env.NVIDIA_IMAGE_MODEL || 'stabilityai/sdxl-turbo';
const VIDEO_MODEL = process.env.NVIDIA_VIDEO_MODEL || 'nvidia/cosmos-1.0-diffusion-7b';

class NvidiaAIService {
    constructor() {
        this.apiKey = process.env.NVIDIA_API_KEY;
        this.baseURL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 120000,
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    _keyMissing() {
        if (!this.apiKey || this.apiKey.includes('your-nvidia') || this.apiKey === 'nvapi-your-nvidia-api-key') {
            return 'NVIDIA_API_KEY is not set on the backend yet — add your real key in Render → Environment, then redeploy.';
        }
        return null;
    }

    _error(error, model = '') {
        const detail = error?.response?.data?.detail || error?.response?.data?.error?.message || error?.response?.data?.message;
        if (detail) return String(detail);
        if (error?.response?.status === 404) return `NVIDIA API returned 404 — model "${model}" is not available.`;
        if (error?.response?.status === 410) return `NVIDIA API returned 410 — model "${model}" is no longer available.`;
        if (error?.response?.status === 429) return 'NVIDIA API rate limit reached. Please try again shortly.';
        if (error?.code === 'ECONNABORTED') return 'NVIDIA API request timed out.';
        return error?.message || 'Unknown error contacting NVIDIA API';
    }

    _isUnavailable(error) {
        const status = error?.response?.status;
        const text = String(error?.response?.data?.detail || error?.response?.data?.message || '').toLowerCase();
        return status === 404 || status === 410 || text.includes('end of life') || text.includes('no longer available') || text.includes('deprecated') || text.includes('retired') || text.includes('model not found');
    }

    _systemPrompt() {
        return `You are RA Social AI, a premium, highly capable assistant inside a social app.

Be accurate, useful, practical and natural. Reason carefully before answering, but never expose private chain-of-thought or hidden reasoning. Give the user the conclusion and concise supporting logic.

Language behavior is automatic and adaptive. English is the default when the user's language is not clear. For every request, first detect the user's intended response language from the latest message, including the script, vocabulary, phrasing and explicit instructions. If the user writes in Tamil, Tanglish, Hindi, Malayalam, Telugu, Kannada, Bengali, Marathi, Gujarati, Punjabi, Urdu, or another language, answer in that language when the intent is clear. If the user explicitly asks for a language, that explicit request always wins. If the user has already stated a language preference in the conversation, keep using the most recent preference until they change it. If the user mixes languages, choose the dominant language unless they explicitly request a different output language. Never switch languages just because a quoted name, code, URL, product name, or attachment uses another language. When creating captions, scripts, posts, prompts, replies, translations, rewrites, bios, comments, or any other content, create the actual output in the language the user wants, matching their requested tone, style, audience and format. Do not unnecessarily mix languages. If the user changes language later, switch automatically on the next response. The goal is to make the AI feel like a natural multilingual assistant without requiring the user to select a language setting.

Capabilities: answer questions, explain concepts, help with coding, writing, social-media content, captions, ideas, planning, troubleshooting and attached media. If an attachment is present, use it when the selected model supports that modality. Do not pretend you inspected an attachment you cannot access.

For complex requests, structure the answer with short headings or bullets. Avoid unnecessary filler. Do not claim access to live/private data unless it is actually provided.

RA Social context: the user is chatting with an AI assistant in the RA Social app. Be friendly and helpful.`;
    }

    async _chatRequest(model, messages, options = {}) {
        const payload = {
            model,
            messages,
            max_tokens: options.maxTokens || 4096,
            temperature: options.temperature ?? 0.6,
            top_p: options.topP ?? 0.95
        };
        if (model === OMNI_MODEL && options.thinking !== false) {
            payload.reasoning_budget = options.reasoningBudget || 8192;
            payload.extra_body = {
                chat_template_kwargs: { enable_thinking: true, reasoning_budget: payload.reasoning_budget },
                mm_processor_kwargs: { use_audio_in_video: false }
            };
        }
        const response = await this.client.post('/chat/completions', payload);
        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) throw new Error('NVIDIA API returned an empty AI response.');
        return content.trim();
    }

    async chatWithAI(userMessage, context = '', attachments = [], history = []) {
        const keyError = this._keyMissing();
        if (keyError) return { success: false, error: keyError };

        const hasVideo = attachments.some(a => a.mimeType?.startsWith('video/'));
        const hasImage = attachments.some(a => a.mimeType?.startsWith('image/'));
        const hasVisual = hasImage || hasVideo;

        // Build a compact, bounded history to prevent runaway prompt size.
        const priorMessages = Array.isArray(history) ? history.slice(-16) : [];
        const baseText = `${context ? `Context: ${context}\n\n` : ''}${userMessage || 'Please analyze the attached file(s).'}`;
        let lastError = null;

        if (hasVideo) {
            try {
                const content = [{ type: 'text', text: baseText }];
                for (const attachment of attachments.slice(0, 4)) {
                    if (attachment.mimeType?.startsWith('video/')) {
                        content.push({ type: 'video_url', video_url: { url: attachment.url } });
                    } else if (attachment.mimeType?.startsWith('image/')) {
                        content.push({ type: 'image_url', image_url: { url: attachment.url } });
                    }
                }
                const messages = [
                    { role: 'system', content: this._systemPrompt() },
                    ...priorMessages.map(m => ({ role: m.role, content: m.content })),
                    { role: 'user', content }
                ];
                const response = await this._chatRequest(OMNI_MODEL, messages, { maxTokens: 4096, reasoningBudget: 8192 });
                return { success: true, response, model: OMNI_MODEL };
            } catch (error) {
                lastError = error;
                if (!this._isUnavailable(error)) return { success: false, error: this._error(error, OMNI_MODEL) };
            }
        }

        if (hasImage) {
            try {
                const content = [{ type: 'text', text: baseText }];
                for (const attachment of attachments.filter(a => a.mimeType?.startsWith('image/')).slice(0, 6)) {
                    content.push({ type: 'image_url', image_url: { url: attachment.url } });
                }
                const messages = [
                    { role: 'system', content: this._systemPrompt() },
                    ...priorMessages.map(m => ({ role: m.role, content: m.content })),
                    { role: 'user', content }
                ];
                const response = await this._chatRequest(VISION_MODEL, messages, { maxTokens: 4096, reasoningBudget: 8192 });
                return { success: true, response, model: VISION_MODEL };
            } catch (error) {
                lastError = error;
                if (!this._isUnavailable(error)) return { success: false, error: this._error(error, VISION_MODEL) };
            }
        }

        const attachmentText = attachments.length
            ? `\n\nAttachments:\n${attachments.map(a => `- ${a.name} (${a.mimeType || 'file'}): ${a.url}${a.textPreview ? `\n  Text content:\n${a.textPreview}` : ''}`).join('\n')}`
            : '';
        const messages = [
            { role: 'system', content: this._systemPrompt() },
            ...priorMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: baseText + attachmentText }
        ];

        for (const model of TEXT_MODELS) {
            try {
                const response = await this._chatRequest(model, messages, { maxTokens: 4096 });
                return { success: true, response, model };
            } catch (error) {
                lastError = error;
                if (!this._isUnavailable(error)) break;
            }
        }

        return { success: false, error: this._error(lastError, TEXT_MODELS[0]) };
    }

    async generateImage(prompt) {
        const keyError = this._keyMissing();
        if (keyError) return { success: false, error: keyError };
        try {
            const response = await axios.post(`https://ai.api.nvidia.com/v1/genai/${IMAGE_MODEL}`, {
                text_prompts: [{ text: prompt }], seed: 0, sampler: 'K_EULER_ANCESTRAL', steps: 4
            }, { timeout: 60000, headers: { Authorization: `Bearer ${this.apiKey}`, Accept: 'application/json', 'Content-Type': 'application/json' } });
            const b64 = response.data?.artifacts?.[0]?.base64;
            if (!b64) return { success: false, error: 'NVIDIA image API returned no image data.' };
            const upload = await cloudinary.uploader.upload(`data:image/jpeg;base64,${b64}`, { folder: 'ra-social/ai-images', resource_type: 'image' });
            return { success: true, imageUrl: upload.secure_url };
        } catch (error) {
            return { success: false, error: this._error(error, IMAGE_MODEL) };
        }
    }

    async generateVideo(prompt, options = {}) {
        const keyError = this._keyMissing();
        if (keyError) return { success: false, error: keyError };
        try {
            const params = { prompt, video_length: options.videoLength || 3, resolution: options.resolution || '720p', fps: options.fps || 24, seed: options.seed || Math.floor(Math.random() * 1000000) };
            const response = await axios.post(`https://ai.api.nvidia.com/v1/genai/${VIDEO_MODEL}`, params, { timeout: 120000, headers: { Authorization: `Bearer ${this.apiKey}`, Accept: 'application/json', 'Content-Type': 'application/json' } });
            const videoBase64 = response.data?.video?.base64 || response.data?.artifacts?.[0]?.base64 || response.data?.output?.base64;
            if (!videoBase64) return { success: false, error: 'NVIDIA video API returned no video data.' };
            const uploadResult = await cloudinary.uploader.upload(`data:video/mp4;base64,${videoBase64}`, { folder: 'ra-social/ai-videos', resource_type: 'video', public_id: `video_${Date.now()}` });
            return { success: true, videoUrl: uploadResult.secure_url, duration: uploadResult.duration || params.video_length, format: uploadResult.format || 'mp4' };
        } catch (error) {
            return { success: false, error: this._error(error, VIDEO_MODEL) };
        }
    }

    async generateVideoFromImage(imageUrl, prompt, options = {}) {
        const keyError = this._keyMissing();
        if (keyError) return { success: false, error: keyError };
        try {
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const imageBase64 = Buffer.from(imageResponse.data).toString('base64');
            const params = { image: imageBase64, prompt, video_length: options.videoLength || 3, resolution: options.resolution || '720p', fps: options.fps || 24, seed: options.seed || Math.floor(Math.random() * 1000000) };
            const response = await axios.post(`https://ai.api.nvidia.com/v1/genai/${VIDEO_MODEL}`, params, { timeout: 120000, headers: { Authorization: `Bearer ${this.apiKey}`, Accept: 'application/json', 'Content-Type': 'application/json' } });
            const videoBase64 = response.data?.video?.base64 || response.data?.artifacts?.[0]?.base64 || response.data?.output?.base64;
            if (!videoBase64) return { success: false, error: 'NVIDIA video API returned no video data.' };
            const uploadResult = await cloudinary.uploader.upload(`data:video/mp4;base64,${videoBase64}`, { folder: 'ra-social/ai-videos', resource_type: 'video', public_id: `video_from_image_${Date.now()}` });
            return { success: true, videoUrl: uploadResult.secure_url, duration: uploadResult.duration || params.video_length };
        } catch (error) {
            return { success: false, error: this._error(error, VIDEO_MODEL) };
        }
    }
}

export default new NvidiaAIService();
