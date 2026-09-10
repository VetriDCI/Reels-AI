import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { cloudinary } from '../config/cloudinary.js';
import nvidiaAI from '../services/nvidiaAIService.js';

const prisma = new PrismaClient();
const aiUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 6 }
});

export { aiUpload };

const uploadBuffer = (file) => new Promise((resolve, reject) => {
  const isVideo = file.mimetype?.startsWith('video/');
  const isImage = file.mimetype?.startsWith('image/');
  const resourceType = isImage || isVideo ? 'auto' : 'raw';
  const stream = cloudinary.uploader.upload_stream({
    folder: 'ra-social/ai-chat',
    resource_type: resourceType,
    public_id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }, (error, result) => error ? reject(error) : resolve(result));
  stream.end(file.buffer);
});

export const uploadAIFile = async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ success: false, message: 'No files uploaded' });
    const files = await Promise.all(req.files.map(async (file) => {
      const result = await uploadBuffer(file);
      const isText = file.mimetype?.startsWith('text/') || /\.(txt|md|json|csv|log)$/i.test(file.originalname);
      const textPreview = isText ? file.buffer.toString('utf8').slice(0, 16000) : null;
      return {
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: result.secure_url || result.url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        ...(textPreview ? { textPreview } : {})
      };
    }));
    res.json({ success: true, data: { files } });
  } catch (error) {
    console.error('AI file upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload AI attachment' });
  }
};

export const listAIConversations = async (req, res) => {
  try {
    const conversations = await prisma.aIConversation.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, updatedAt: true, createdAt: true, _count: { select: { messages: true } } }
    });
    res.json({ success: true, data: { conversations } });
  } catch (error) {
    console.error('AI history list error:', error);
    res.status(500).json({ success: false, message: 'Failed to load AI history' });
  }
};

export const getAIConversation = async (req, res) => {
  try {
    const conversation = await prisma.aIConversation.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
    if (!conversation) return res.status(404).json({ success: false, message: 'AI conversation not found' });
    res.json({ success: true, data: { conversation } });
  } catch (error) {
    console.error('AI history get error:', error);
    res.status(500).json({ success: false, message: 'Failed to load AI conversation' });
  }
};

export const deleteAIConversation = async (req, res) => {
  try {
    const deleted = await prisma.aIConversation.deleteMany({ where: { id: req.params.id, userId: req.userId } });
    if (!deleted.count) return res.status(404).json({ success: false, message: 'AI conversation not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('AI history delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete AI conversation' });
  }
};

export const chatWithAI = async (req, res) => {
  try {
    const { message = '', context = '', conversationId, attachments = [] } = req.body || {};
    if (!message.trim() && !attachments.length) return res.status(400).json({ success: false, message: 'Message or attachment is required' });

    let conversation;
    if (conversationId) {
      conversation = await prisma.aIConversation.findFirst({ where: { id: conversationId, userId: req.userId } });
      if (!conversation) return res.status(404).json({ success: false, message: 'AI conversation not found' });
    } else {
      const title = (message || attachments[0]?.name || 'New AI chat').trim().slice(0, 80);
      conversation = await prisma.aIConversation.create({ data: { userId: req.userId, title } });
    }

    const previous = await prisma.aIMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 32
    });

    // "/image <prompt>" was documented but never actually routed to image
    // generation — it was just being sent to the text model as a normal
    // message. Intercept it here so it does what the UI/docs promise.
    const imageMatch = message.trim().match(/^\/image\s+(.+)/i);
    let result;
    if (imageMatch) {
      const imageResult = await nvidiaAI.generateImage(imageMatch[1].trim());
      result = imageResult.success
        ? { success: true, response: imageResult.imageUrl, model: 'stabilityai/sdxl-turbo' }
        : { success: false, error: imageResult.error };
    } else {
      result = await nvidiaAI.chatWithAI(
        message,
        context,
        attachments,
        previous.map(m => ({ role: m.role, content: m.content }))
      );
    }

    if (!result.success) return res.status(500).json({ success: false, message: result.error, conversationId: conversation.id });

    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message || 'Please analyze the attachment(s).',
        attachments: attachments.length ? attachments : undefined
      }
    });
    const assistant = await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: result.response,
        model: result.model || null
      }
    });

    await prisma.aIConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

    res.json({ success: true, data: { response: result.response, model: result.model, conversationId: conversation.id, messageId: assistant.id } });
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
    if (result.success) res.json({ success: true, data: { imageUrl: result.imageUrl } });
    else res.status(500).json({ success: false, message: result.error });
  } catch (error) {
    console.error('Generate image error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate image' });
  }
};
