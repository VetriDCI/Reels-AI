import axios from 'axios';

const MODEL = process.env.NVIDIA_MODEL || 'meta/llama3-8b-instruct';

class NvidiaAIService {
  constructor() {
    this.apiKey = process.env.NVIDIA_API_KEY;
    this.baseURL = process.env.NVIDIA_BASE_URL;

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
    if (error.response?.status) return `NVIDIA API returned ${error.response.status}`;
    if (error.code === 'ECONNABORTED') return 'NVIDIA API request timed out';
    return error.message || 'Unknown error contacting NVIDIA API';
  }

  async generateCaption(imageUrl, context = '') {
    const keyError = this._keyMissing();
    if (keyError) return { success: false, error: keyError };

    try {
      const response = await this.client.post('', {
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a creative social media assistant. Generate engaging, short captions for social media posts. Use emojis and keep it under 150 characters.'
          },
          {
            role: 'user',
            content: `Generate a catchy social media caption for this: ${context}. Image URL: ${imageUrl}`
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      return { success: true, caption: response.data.choices[0].message.content.trim() };
    } catch (error) {
      const msg = this._extractError(error);
      console.error('NVIDIA caption generation error:', msg);
      return { success: false, error: msg };
    }
  }

  async generateHashtags(content) {
    const keyError = this._keyMissing();
    if (keyError) return { success: false, error: keyError };

    try {
      const response = await this.client.post('', {
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a social media expert. Generate 5-10 relevant, trending hashtags for social media posts. Return only hashtags, no explanations.'
          },
          {
            role: 'user',
            content: `Generate hashtags for this post: ${content}`
          }
        ],
        max_tokens: 200,
        temperature: 0.6
      });

      const hashtagsText = response.data.choices[0].message.content.trim();
      const hashtags = hashtagsText.match(/#\w+/g) || [];

      return { success: true, hashtags: hashtags.slice(0, 10) };
    } catch (error) {
      const msg = this._extractError(error);
      console.error('NVIDIA hashtag generation error:', msg);
      return { success: false, error: msg };
    }
  }

  async translateText(text, targetLanguage = 'ta') {
    const keyError = this._keyMissing();
    if (keyError) return { success: false, error: keyError };

    try {
      const languages = { ta: 'Tamil', hi: 'Hindi', en: 'English', es: 'Spanish', fr: 'French' };

      const response = await this.client.post('', {
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text to ${languages[targetLanguage] || 'English'}. Keep the tone natural and conversational.`
          },
          { role: 'user', content: text }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      return { success: true, translatedText: response.data.choices[0].message.content.trim() };
    } catch (error) {
      const msg = this._extractError(error);
      console.error('NVIDIA translation error:', msg);
      return { success: false, error: msg };
    }
  }

  async moderateContent(content) {
    const keyError = this._keyMissing();
    if (keyError) return { success: false, isSafe: true, error: keyError };

    try {
      const response = await this.client.post('', {
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a content moderation assistant. Analyze this content and determine if it contains hate speech, harassment, violence, or inappropriate material. Return JSON: { safe: boolean, reason: string }'
          },
          { role: 'user', content }
        ],
        max_tokens: 100,
        temperature: 0.2
      });

      const analysis = response.data.choices[0].message.content.trim();
      const isSafe = !analysis.toLowerCase().includes('unsafe') && !analysis.toLowerCase().includes('inappropriate');

      return { success: true, isSafe, reason: analysis };
    } catch (error) {
      const msg = this._extractError(error);
      console.error('NVIDIA moderation error:', msg);
      return { success: false, isSafe: true, error: msg };
    }
  }

  async chatWithAI(userMessage, context = '') {
    const keyError = this._keyMissing();
    if (keyError) return { success: false, error: keyError };

    try {
      const response = await this.client.post('', {
        model: MODEL,
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
}

export default new NvidiaAIService();
