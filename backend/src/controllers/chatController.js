import prisma from '../config/database.js';

export const getChats = async (req, res) => {
  try {
    const userId = req.userId;

    const chats = await prisma.chat.findMany({
      where: { participants: { some: { id: userId } } },
      include: {
        participants: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ success: true, data: chats });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chats' });
  }
};

export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, participants: { some: { id: userId } } },
      select: { id: true }
    });
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    const messages = await prisma.message.findMany({
      where: { chatId },
      include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' }
    });

    await prisma.message.updateMany({
      where: { chatId, senderId: { not: userId }, isRead: false },
      data: { isRead: true }
    });

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

export const createChat = async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.userId;

    if (!participantId || participantId === userId) {
      return res.status(400).json({ success: false, message: 'Choose another user' });
    }

    const participant = await prisma.user.findUnique({ where: { id: participantId }, select: { id: true, status: true } });
    if (!participant || participant.status === 'blocked') {
      return res.status(404).json({ success: false, message: 'User is not available for chat' });
    }

    const existingChat = await prisma.chat.findFirst({
      where: {
        AND: [
          { participants: { some: { id: userId } } },
          { participants: { some: { id: participantId } } }
        ]
      },
      include: { participants: true }
    });

    if (existingChat) {
      return res.json({ success: true, data: existingChat, exists: true });
    }

    const chat = await prisma.chat.create({
      data: { participants: { connect: [{ id: userId }, { id: participantId }] } },
      include: { participants: true }
    });

    res.json({ success: true, data: chat, exists: false });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ success: false, message: 'Failed to create chat' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        participants: { some: { id: userId } }
      }
    });

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const message = await prisma.message.create({
      data: { chatId, senderId: userId, content: content.trim() },
      include: { sender: { select: { id: true, username: true, avatarUrl: true } } }
    });

    await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });
    req.app.get('io')?.to(`chat:${chatId}`).emit('new_message', message);
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};
