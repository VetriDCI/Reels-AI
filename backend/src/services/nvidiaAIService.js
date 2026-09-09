import axios from 'axios';
import { cloudinary } from '../config/cloudinary.js';

// ============================================
// MODEL CONFIGURATION
// ============================================

// NVIDIA models can be retired/deprecated.
// Keep multiple models so one unavailable model
// automatically falls back to the next one.

const DEFAULT_CHAT_MODELS = [
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
    'google/gemma-4-31b-it',
];

// Supports both:
// NVIDIA_MODELS=model1,model2,model3
// OR old:
// NVIDIA_MODEL=model1
const configuredChatModels = (
    process.env.NVIDIA_MODELS ||
    process.env.NVIDIA_MODEL ||
    ''
)
    .split(',')
    .map(model => model.trim())
    .filter(Boolean);

// Remove duplicate model names
const CHAT_MODELS = [
    ...new Set(
        configuredChatModels.length
            ? configuredChatModels
            : DEFAULT_CHAT_MODELS
    )
];

const IMAGE_MODEL =
    process.env.NVIDIA_IMAGE_MODEL ||
    'stabilityai/sdxl-turbo';

const VIDEO_MODEL =
    process.env.NVIDIA_VIDEO_MODEL ||
    'nvidia/cosmos-1.0-diffusion-7b';

// ============================================
// MAIN SERVICE CLASS
// ============================================

class NvidiaAIService {

    constructor() {
        this.apiKey = process.env.NVIDIA_API_KEY;

        this.baseURL =
            process.env.NVIDIA_BASE_URL ||
            'https://integrate.api.nvidia.com/v1';

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 20000,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    // ============================================
    // API KEY CHECK
    // ============================================

    _keyMissing() {

        if (
            !this.apiKey ||
            this.apiKey.includes('your-nvidia') ||
            this.apiKey === 'nvapi-your-nvidia-api-key'
        ) {
            return 'NVIDIA_API_KEY is not set on the backend yet — add your real key in Render → Environment, then redeploy.';
        }

        return null;
    }

    // ============================================
    // ERROR MESSAGE
    // ============================================

    _extractError(error, model = '') {

        const detail =
            error.response?.data?.detail ||
            error.response?.data?.error?.message ||
            error.response?.data?.message;

        if (detail) {
            return detail;
        }

        if (error.response?.status === 404) {
            return `NVIDIA API returned 404 — model "${model || 'unknown'}" is not available.`;
        }

        if (error.response?.status === 410) {
            return `NVIDIA API returned 410 — model "${model || 'unknown'}" is no longer available.`;
        }

        if (error.response?.status) {
            return `NVIDIA API returned ${error.response.status}`;
        }

        if (error.code === 'ECONNABORTED') {
            return 'NVIDIA API request timed out';
        }

        return error.message ||
            'Unknown error contacting NVIDIA API';
    }

    // ============================================
    // CHECK WHETHER MODEL IS UNAVAILABLE
    // ============================================

    _isModelFailure(error) {

        const status = error.response?.status;

        const detail = String(
            error.response?.data?.detail ||
            error.response?.data?.error?.message ||
            error.response?.data?.message ||
            ''
        ).toLowerCase();

        return (
            status === 404 ||
            status === 410 ||
            detail.includes('end of life') ||
            detail.includes('no longer available') ||
            detail.includes('model not found') ||
            detail.includes('not found') ||
            detail.includes('deprecated') ||
            detail.includes('retired')
        );
    }

    // ============================================
    // CHAT WITH AI
    // ============================================

    async chatWithAI(userMessage, context = '') {

        const keyError = this._keyMissing();

        if (keyError) {
            return {
                success: false,
                error: keyError
            };
        }

        let lastError = null;

        // Try every model one by one
        for (
            let index = 0;
            index < CHAT_MODELS.length;
            index++
        ) {

            const model = CHAT_MODELS[index];

            try {

                console.log(
                    `🤖 Using NVIDIA chat model ${index + 1}/${CHAT_MODELS.length}: ${model}`
                );

                const response = await this.client.post(
                    '/chat/completions',
                    {
                        model: model,

                        messages: [
                            {
                                role: 'system',

                                content:
                                    "You are RA Social's friendly AI assistant. Help users with questions about the app, give tips for social media, and be conversational. Keep responses under 200 characters. Support Tamil and English."
                            },

                            {
                                role: 'user',

                                content:
                                    `${context ? 'Context: ' + context + '\n' : ''}User: ${userMessage}`
                            }
                        ],

                        max_tokens: 200,

                        temperature: 0.7
                    }
                );

                const content =
                    response.data?.choices?.[0]?.message?.content;

                if (!content) {
                    throw new Error(
                        'NVIDIA API returned an empty AI response.'
                    );
                }

                console.log(
                    `✅ NVIDIA AI response successful using: ${model}`
                );

                return {
                    success: true,
                    response: content.trim(),
                    model: model
                };

            } catch (error) {

                lastError = error;

                const msg =
                    this._extractError(error, model);

                console.error(
                    `❌ NVIDIA model failed: ${model}`,
                    msg
                );

                // If model is EOL / 404 / 410 etc.,
                // automatically try the next model.
                if (
                    this._isModelFailure(error) &&
                    index < CHAT_MODELS.length - 1
                ) {

                    const nextModel =
                        CHAT_MODELS[index + 1];

                    console.warn(
                        `⚠️ Falling back from ${model} → ${nextModel}`
                    );

                    continue;
                }

                // Don't fallback for unrelated errors
                // such as invalid API key or network issue.
                break;
            }
        }

        const finalError = this._extractError(
            lastError,
            CHAT_MODELS[CHAT_MODELS.length - 1]
        );

        console.error(
            '❌ All NVIDIA chat models failed:',
            finalError
        );

        return {
            success: false,
            error:
                `AI temporarily unavailable. Tried ${CHAT_MODELS.length} model(s). Last error: ${finalError}`
        };
    }

    // ============================================
    // IMAGE GENERATION
    // ============================================

    async generateImage(prompt) {

        const keyError = this._keyMissing();

        if (keyError) {
            return {
                success: false,
                error: keyError
            };
        }

        try {

            console.log(
                `🖼️ Generating image with model: ${IMAGE_MODEL}`
            );

            const response = await axios.post(

                `https://ai.api.nvidia.com/v1/genai/${IMAGE_MODEL}`,

                {
                    text_prompts: [
                        {
                            text: prompt
                        }
                    ],

                    seed: 0,

                    sampler: 'K_EULER_ANCESTRAL',

                    steps: 4
                },

                {
                    timeout: 60000,

                    headers: {
                        'Authorization':
                            `Bearer ${this.apiKey}`,

                        'Accept':
                            'application/json',

                        'Content-Type':
                            'application/json'
                    }
                }
            );

            const b64 =
                response.data?.artifacts?.[0]?.base64;

            if (!b64) {

                return {
                    success: false,
                    error:
                        'NVIDIA image API returned no image data.'
                };
            }

            const upload =
                await cloudinary.uploader.upload(
                    `data:image/jpeg;base64,${b64}`,
                    {
                        folder:
                            'ra-social/ai-images',

                        resource_type:
                            'image'
                    }
                );

            return {
                success: true,
                imageUrl:
                    upload.secure_url
            };

        } catch (error) {

            const status =
                error.response?.status;

            const detail =
                error.response?.data?.detail ||
                error.response?.data?.message;

            const msg =
                status === 404
                    ? `NVIDIA API returned 404 — the image model "${IMAGE_MODEL}" is unavailable.`
                    : (
                        detail ||
                        (
                            status
                                ? `NVIDIA API returned ${status}`
                                : (
                                    error.message ||
                                    'Image generation failed'
                                )
                        )
                    );

            console.error(
                '❌ NVIDIA image generation error:',
                msg
            );

            return {
                success: false,
                error: msg
            };
        }
    }

    // ============================================
    // VIDEO GENERATION
    // ============================================

    async generateVideo(
        prompt,
        options = {}
    ) {

        const keyError = this._keyMissing();

        if (keyError) {
            return {
                success: false,
                error: keyError
            };
        }

        try {

            console.log(
                `🎬 Generating video with model: ${VIDEO_MODEL}`
            );

            console.log(
                `📝 Prompt: ${prompt}`
            );

            const params = {

                prompt: prompt,

                video_length:
                    options.videoLength || 3,

                resolution:
                    options.resolution || '720p',

                fps:
                    options.fps || 24,

                seed:
                    options.seed ||
                    Math.floor(
                        Math.random() * 1000000
                    )
            };

            const response =
                await axios.post(

                    `https://ai.api.nvidia.com/v1/genai/${VIDEO_MODEL}`,

                    params,

                    {
                        timeout: 120000,

                        headers: {
                            'Authorization':
                                `Bearer ${this.apiKey}`,

                            'Accept':
                                'application/json',

                            'Content-Type':
                                'application/json'
                        }
                    }
                );

            const videoBase64 =
                response.data?.video?.base64 ||
                response.data?.artifacts?.[0]?.base64 ||
                response.data?.output?.base64;

            if (!videoBase64) {

                return {
                    success: false,
                    error:
                        'NVIDIA video API returned no video data.'
                };
            }

            const uploadResult =
                await cloudinary.uploader.upload(

                    `data:video/mp4;base64,${videoBase64}`,

                    {
                        folder:
                            'ra-social/ai-videos',

                        resource_type:
                            'video',

                        public_id:
                            `video_${Date.now()}`
                    }
                );

            return {

                success: true,

                videoUrl:
                    uploadResult.secure_url,

                duration:
                    uploadResult.duration ||
                    params.video_length,

                format:
                    uploadResult.format ||
                    'mp4'
            };

        } catch (error) {

            const status =
                error.response?.status;

            const detail =
                error.response?.data?.detail ||
                error.response?.data?.message;

            let msg;

            if (status === 404) {

                msg =
                    `NVIDIA API returned 404 — the video model "${VIDEO_MODEL}" may be unavailable.`;

            } else if (status === 402) {

                msg =
                    'NVIDIA API returned 402 — Payment required. Video generation may need credits or subscription.';

            } else if (status === 429) {

                msg =
                    'NVIDIA API returned 429 — Rate limit exceeded. Please try again later.';

            } else {

                msg =
                    detail ||
                    (
                        status
                            ? `NVIDIA API returned ${status}`
                            : (
                                error.message ||
                                'Video generation failed'
                            )
                    );
            }

            console.error(
                '❌ NVIDIA video generation error:',
                msg
            );

            return {
                success: false,
                error: msg
            };
        }
    }

    // ============================================
    // VIDEO FROM IMAGE
    // ============================================

    async generateVideoFromImage(
        imageUrl,
        prompt,
        options = {}
    ) {

        const keyError = this._keyMissing();

        if (keyError) {
            return {
                success: false,
                error: keyError
            };
        }

        try {

            console.log(
                `🎬 Generating video from image: ${imageUrl}`
            );

            const imageResponse =
                await axios.get(
                    imageUrl,
                    {
                        responseType:
                            'arraybuffer'
                    }
                );

            const imageBase64 =
                Buffer
                    .from(imageResponse.data)
                    .toString('base64');

            const params = {

                image:
                    imageBase64,

                prompt:
                    prompt,

                video_length:
                    options.videoLength || 3,

                resolution:
                    options.resolution || '720p',

                fps:
                    options.fps || 24,

                seed:
                    options.seed ||
                    Math.floor(
                        Math.random() * 1000000
                    )
            };

            const response =
                await axios.post(

                    `https://ai.api.nvidia.com/v1/genai/${VIDEO_MODEL}`,

                    params,

                    {
                        timeout: 120000,

                        headers: {
                            'Authorization':
                                `Bearer ${this.apiKey}`,

                            'Accept':
                                'application/json',

                            'Content-Type':
                                'application/json'
                        }
                    }
                );

            const videoBase64 =
                response.data?.video?.base64 ||
                response.data?.artifacts?.[0]?.base64 ||
                response.data?.output?.base64;

            if (!videoBase64) {

                return {
                    success: false,
                    error:
                        'NVIDIA video API returned no video data.'
                };
            }

            const uploadResult =
                await cloudinary.uploader.upload(

                    `data:video/mp4;base64,${videoBase64}`,

                    {
                        folder:
                            'ra-social/ai-videos',

                        resource_type:
                            'video',

                        public_id:
                            `video_from_image_${Date.now()}`
                    }
                );

            return {

                success: true,

                videoUrl:
                    uploadResult.secure_url,

                duration:
                    uploadResult.duration ||
                    params.video_length
            };

        } catch (error) {

            const msg =
                this._extractError(
                    error,
                    VIDEO_MODEL
                );

            console.error(
                '❌ NVIDIA video from image error:',
                msg
            );

            return {
                success: false,
                error: msg
            };
        }
    }
}

export default new NvidiaAIService();
