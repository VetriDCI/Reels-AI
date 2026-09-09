import axios from 'axios';
import { cloudinary } from '../config/cloudinary.js';

// ============================================
// MODEL CONFIGURATION
// ============================================

// NVIDIA can retire/deprecate hosted models. Keep a fallback chain instead
// of relying on one hard-coded model.
//
// You can override this in Render with:
// NVIDIA_MODELS=meta/llama-3.3-70b-instruct,openai/gpt-oss-20b,meta/llama-3.1-70b-instruct
const DEFAULT_CHAT_MODELS = [
    'meta/llama-3.3-70b-instruct',
    'openai/gpt-oss-20b',
    'meta/llama-3.1-70b-instruct',
];

const configuredChatModels = (process.env.NVIDIA_MODELS || process.env.NVIDIA_MODEL || '')
    .split(',')
    .map(model => model.trim())
    .filter(Boolean);

const CHAT_MODELS = [...new Set(
    configuredChatModels.length ? configuredChatModels : DEFAULT_CHAT_MODELS
)];

const IMAGE_MODEL = process.env.NVIDIA_IMAGE_MODEL || 'stabilityai/sdxl-turbo';  // ✅ Fixed
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

    _extractError(error, model = '') {
        const detail = error.response?.data?.detail ||
            error.response?.data?.error?.message ||
            error.response?.data?.message;

        if (detail) return detail;

        if (error.response?.status === 404) {
            return `NVIDIA API returned 404 — model "${model || 'unknown'}" is not available.`;
        }

        if (error.response?.status) return `NVIDIA API returned ${error.response.status}`;
        if (error.code === 'ECONNABORTED') return 'NVIDIA API request timed out';

        return error.message || 'Unknown error contacting NVIDIA API';
    }

    _isModelFailure(error) {
        const status = error.response?.status;
        const detail = String(
            error.response?.data?.detail ||
            error.response?.data?.error?.message ||
            error.response?.data?.message ||
            ''
        ).toLowerCase();

        // These normally mean the selected model cannot serve this request.
        return status === 404 ||
            status === 410 ||
            detail.includes('end of life') ||
            detail.includes('no longer available') ||
            detail.includes('model not found') ||
            detail.includes('not found') ||
            detail.includes('deprecated') ||
            detail.includes('retired');
    }

    async chatWithAI(userMessage, context = '') {
        const keyError = this._keyMissing();
        if (keyError) return { success: false, error: keyError };

        let lastError = null;

        for (let index = 0; index < CHAT_MODELS.length; index++) {
            const model = CHAT_MODELS[index];

            try {
                console.log(`🤖 Using chat model ${index + 1}/${CHAT_MODELS.length}: ${model}`);

                const response = await this.client.post('/chat/completions', {
                    model,
