import axios from 'axios';

class NvidiaAIService {
  constructor() {
    this.apiKey = process.env.NVIDIA_API_KEY;
    this.baseURL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async generateCaption(imageUrl, context = '') {
    try {
      const response = await this.client.post('/chat/completions', {
        model: 'meta/llama-3.1-70b-instruct',
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
      console.error('NVIDIA caption generation error:', error);
      return { success: false, error: 'Failed to generate caption' };
    }
  }

  async generateHashtags(content) {
    try {
      const response = await this.client.post('/chat/completions', {
        model: 'meta/llama-3.1-70b-instruct',
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
      console.error('NVIDIA hashtag generation error:', error);
      return { success: false, error: 'Failed to generate hashtags' };
    }
  }

  async translateText(text, targetLanguage = 'ta') {
    try {
      const languages = { 'ta': 'Tamil', 'hi': 'Hindi', 'en': 'English', 'es': 'Spanish', 'fr': 'French' };
      
      const response = await this.client.post('/chat/completions', {
        model: 'meta/llama-3.1-70b-instruct',
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
      console.error('NVIDIA translation error:', error);
      return { success: false, error: 'Failed to translate' };
    }
  }

  async moderateContent(content) {
    try {
      const response = await this.client.post('/chat/completions', {
        model: 'meta/llama-3.1-70b-instruct',
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
      console.error('NVIDIA moderation error:', error);
      return { success: false, isSafe: true, error: 'Failed to moderate' };
    }
  }

  async chatWithAI(userMessage, context = '') {
    try {
      const response = await this.client.post('/chat/completions', {
        model: 'meta/llama-3.1-70b-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are RA Social\'s friendly AI assistant. Help users with questions about the app, give tips for social media, and be conversational. Keep responses under 200 characters.'
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
      console.error('NVIDIA chat error:', error);
      return { success: false, error: 'Failed to chat' };
    }
  }
}

export default new NvidiaAIService();