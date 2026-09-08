import axios from 'axios';
import { cloudinary } from '../config/cloudinary.js';

// ============================================
// MODEL CONFIGURATION
// ============================================

const DEFAULT_CHAT_MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct';  // ✅ Fixed spelling
const configuredChatModel = (process.env.NVIDIA_MODEL || '').trim();

const CHAT_MODEL = configuredChatModel &&
    configuredChatModel !== 'meta/llama-3.1-8b-instruct' &&
    configuredChatModel !== 'openai/gpt-oss-120b'
    ? configuredChatModel
    : DEFAULT_CHAT_MODEL;

const IMAGE_MODEL = process.env.NVIDIA_IMAGE_MODEL || 'stabilityai/sdxl-turbo';
const VIDEO_MODEL = process.env.NVIDIA_VIDEO_MODEL || 'nvidia/cosmos-1.0-diffusion-7b';

// ============================================
// MAIN SERVICE CLASS
// ============================================

class NvidiaAIService {
    constructor() {
        this.apiKey = process.env.NVIDIA_API_KEY;
        this.baseURL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 20000,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
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

    _extractError(error) {
        const detail = error.response?.data?.detail ||
            error.response?.data?.error?.message ||
            error.response?.data?.message;

        if (detail) return detail;

        if (error.response?.status === 404) {
            return `NVIDIA API returned 404 — model "${CHAT_MODEL}" not found. Try: nvidia/llama-3.1-nemotron-70b-instruct`;
        }

        if (error.response?.status) return `NVIDIA API returned ${error.response.status}`;
        if (error.code === 'ECONNABORTED') return 'NVIDIA API request timed out';

        return error.message || 'Unknown error contacting NVIDIA API';
    }

    async chatWithAI(userMessage, context = '') {
        const keyError = this._keyMissing();
        if (keyError) return { success: false, error: keyError };

        try {
            console.log(`🤖 Using chat model: ${CHAT_MODEL}`);

            const response = await this.client.post('/chat/completions', {
                model: CHAT_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: "You are RA Social's friendly AI assistant. Help users with questions about the app, give tips for social media, and be conversational. Keep responses under 200 characters. Support Tamil and English."
                    },
                    {
                        role: 'user',
                        content: `${context ? 'Context: ' + context + '\n' : ''}User: ${userMessage}`
                    }
                ],
                max_tokens: 200,
                temperature: 0.7
            });

            return { success: true, response: response.data.choices[0].message.content.trim() };
        } catch (error) {
            const msg = this._extractError(error);
            console.error('❌ NVIDIA chat error:', msg);
            return { success: false, error: msg };
        }
    }

    async generateImage(prompt) {
        const keyError = this._keyMissing();
        if (keyError) return { success: false, error: keyError };

        try {
            console.log(`🖼️ Generating image with model: ${IMAGE_MODEL}`);

            const response = await axios.post(
                `https://ai.api.nvidia.com/v1/genai/${IMAGE_MODEL}`,
                {
                    text_prompts: [{ text: prompt }],
                    seed: 0,
                    sampler: 'K_EULER_ANCESTRAL',
                    steps: 4
                },
                {
                    timeout: 60000,
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );

            const b64 = response.data?.artifacts?.[0]?.base64;
            if (!b64) {
                return { success: false, error: 'NVIDIA image API returned no image data.' };
            }

            const upload = await cloudinary.uploader.upload(`data:image/jpeg;base64,${b64}`, {
                folder: 'ra-social/ai-images',
                resource_type: 'image'
            });

            return { success: true, imageUrl: upload.secure_url };

        } catch (error) {
            const status = error.response?.status;
            const detail = error.response?.data?.detail || error.response?.data?.message;
            const msg = status === 404
                ? `NVIDIA API returned 404 — the model ("${IMAGE_MODEL}") may need separate access approval on build.nvidia.com`
                : (detail || (status ? `NVIDIA API returned ${status}` : (error.message || 'Image generation failed')));

            console.error('❌ NVIDIA image generation error:', msg);
            return { success: false, error: msg };
        }
    }

    async generateVideo(prompt, options = {}) {
        const keyError = this._keyMissing();
        if (keyError) return { success: false, error: keyError };

        try {
            console.log(`🎬 Generating video with model: ${VIDEO_MODEL}`);
            console.log(`📝 Prompt: ${prompt}`);

            const params = {
                prompt: prompt,
                video_length: options.videoLength || 3,
                resolution: options.resolution || '720p',
                fps: options.fps || 24,
                seed: options.seed || Math.floor(Math.random() * 1000000)
            };

            const response = await axios.post(
                `https://ai.api.nvidia.com/v1/genai/${VIDEO_MODEL}`,
                params,
                {
                    timeout: 120000,
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );

            const videoBase64 = response.data?.video?.base64 ||
                response.data?.artifacts?.[0]?.base64 ||
                response.data?.output?.base64;

            if (!videoBase64) {
                return { success: false, error: 'NVIDIA video API returned no video data.' };
            }

            const uploadResult = await cloudinary.uploader.upload(
                `data:video/mp4;base64,${videoBase64}`,
                {
                    folder: 'ra-social/ai-videos',
                    resource_type: 'video',
                    public_id: `video_${Date.now()}`
                }
            );

            return {
                success: true,
                videoUrl: uploadResult.secure_url,
                duration: uploadResult.duration || params.video_length,
                format: uploadResult.format || 'mp4'
            };

        } catch (error) {
            const status = error.response?.status;
            const detail = error.response?.data?.detail || error.response?.data?.message;

            let msg;
            if (status === 404) {
                msg = `NVIDIA API returned 404 — the video model ("${VIDEO_MODEL}") may need separate access approval on build.nvidia.com.`;
            } else if (status === 402) {
                msg = 'NVIDIA API returned 402 — Payment required. Video generation may need credits or subscription.';
            } else if (status === 429) {
                msg = 'NVIDIA API returned 429 — Rate limit exceeded. Please try again later.';
            } else {
                msg = detail || (status ? `NVIDIA API returned ${status}` : (error.message || 'Video generation failed'));
            }

            console.error('❌ NVIDIA video generation error:', msg);
            return { success: false, error: msg };
        }
    }

    async generateVideoFromImage(imageUrl, prompt, options = {}) {
        const keyError = this._keyMissing();
        if (keyError) return { success: false, error: keyError };

        try {
            console.log(`🎬 Generating video from image: ${imageUrl}`);

            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const imageBase64 = Buffer.from(imageResponse.data).toString('base64');

            const params = {
                image: imageBase64,
                prompt: prompt,
                video_length: options.videoLength || 3,
                resolution: options.resolution || '720p',
                fps: options.fps || 24,
                seed: options.seed || Math.floor(Math.random() * 1000000)
            };

            const response = await axios.post(
                `https://ai.api.nvidia.com/v1/genai/${VIDEO_MODEL}`,
                params,
                {
                    timeout: 120000,
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );

            const videoBase64 = response.data?.video?.base64 ||
                response.data?.artifacts?.[0]?.base64 ||
                response.data?.output?.base64;

            if (!videoBase64) {
                return { success: false, error: 'NVIDIA video API returned no video data.' };
            }

            const uploadResult = await cloudinary.uploader.upload(
                `data:video/mp4;base64,${videoBase64}`,
                {
                    folder: 'ra-social/ai-videos',
                    resource_type: 'video',
                    public_id: `video_from_image_${Date.now()}`
                }
            );

            return {
                success: true,
                videoUrl: uploadResult.secure_url,
                duration: uploadResult.duration || params.video_length
            };

        } catch (error) {
            const msg = this._extractError(error);
            console.error('❌ NVIDIA video from image error:', msg);
            return { success: false, error: msg };
        }
    }
}

export default new NvidiaAIService();
