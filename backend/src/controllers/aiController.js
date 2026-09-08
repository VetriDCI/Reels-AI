import nvidiaAI from '../services/nvidiaAIService.js';

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

export const generateImage = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: 'Prompt is required' });

    const result = await nvidiaAI.generateImage(prompt);
    if (result.success) {
      res.json({ success: true, data: { imageUrl: result.imageUrl } });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Generate image error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate image' });
  }
};
