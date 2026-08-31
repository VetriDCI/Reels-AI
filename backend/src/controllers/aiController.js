import nvidiaAI from '../services/nvidiaAIService.js';

export const generateCaption = async (req, res) => {
  try {
    const { imageUrl, context } = req.body;
    if (!context) return res.status(400).json({ success: false, message: 'Context is required' });

    const result = await nvidiaAI.generateCaption(imageUrl, context);
    if (result.success) {
      res.json({ success: true, data: { caption: result.caption } });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Generate caption error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate caption' });
  }
};

export const generateHashtags = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Content is required' });

    const result = await nvidiaAI.generateHashtags(content);
    if (result.success) {
      res.json({ success: true, data: { hashtags: result.hashtags } });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Generate hashtags error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate hashtags' });
  }
};

export const translateText = async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Text is required' });

    const result = await nvidiaAI.translateText(text, targetLanguage || 'ta');
    if (result.success) {
      res.json({ success: true, data: { translatedText: result.translatedText } });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Translate error:', error);
    res.status(500).json({ success: false, message: 'Failed to translate' });
  }
};

export const moderateContent = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Content is required' });

    const result = await nvidiaAI.moderateContent(content);
    res.json({ success: true, data: { isSafe: result.isSafe, reason: result.reason } });
  } catch (error) {
    console.error('Moderate error:', error);
    res.status(500).json({ success: false, message: 'Failed to moderate content' });
  }
};

export const chatWithAI = async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    const result = await nvidiaAI.chatWithAI(message, context);
    if (result.success) {
      res.json({ success: true, data: { response: result.response } });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, message: 'Failed to chat with AI' });
  }
};