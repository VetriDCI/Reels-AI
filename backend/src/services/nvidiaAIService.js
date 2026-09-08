import axios from 'axios';
import { cloudinary } from '../config/cloudinary.js';

// Chat model — override with NVIDIA_MODEL if you want a different one.
const CHAT_MODEL = process.env.NVIDIA_MODEL || 'openai/gpt-oss-120b';
// Text-to-image model — same NVIDIA_API_KEY, different NVIDIA endpoint (ai.api.nvidia.com).
const IMAGE_MODEL = process.env.NVIDIA_IMAGE_MODEL || 'stabilityai/sdxl-turbo';

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

  // Returns a clear error instead of silently trying (and failing) an API
  // call when the key hasn't actually been configured yet.
  _keyMissing() {
    if (!this.apiKey || this.apiKey.includes('your-nvidia') || this.apiKey === 'nvapi-your-nvidia-api-key') {
      return 'NVIDIA_API_KEY is not set on the backend yet — add your real key in Render → Environment, then redeploy.';
    }
    return null;
  }

  // Extracts NVIDIA's actual error message so failures are debuggable
  // instead of a generic "failed" message with no explanation.
  _extractError(error) {
    const detail = error.response?.data?.detail || error.response?.data?.error?.message || error.response?.data?.message;
    if (detail) return detail;
    if (error.response?.status === 404) return `NVIDIA API returned 404 — check that the model id ("${CHAT_MODEL}") is correct and still available on build.nvidia.com`;
    if (error.response?.status) return `NVIDIA API returned ${error.response.status}`;
    if (error.code === 'ECONNABORTED') return 'NVIDIA API request timed out';
    return error.message || 'Unknown error contacting NVIDIA API';
  }

  async chatWithAI(userMessage, context = '') {
    const keyError = this._keyMissing();
    if (keyError) return { success: false, error: keyError };

    try {
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
      console.error('NVIDIA chat error:', msg);
      return { success: false, error: msg };
    }
  }

  // Text-to-image via NVIDIA's hosted GenAI endpoint, uploaded to Cloudinary
  // (same media host as the rest of the app) so the URL survives redeploys.
  async generateImage(prompt) {
    const keyError = this._keyMissing();
    if (keyError) return { success: false, error: keyError };

    try {
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
      if (!b64) return { success: false, error: 'NVIDIA image API returned no image data.' };

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
      console.error('NVIDIA image generation error:', msg);
      return { success: false, error: msg };
    }
  }
}

export default new NvidiaAIService();
