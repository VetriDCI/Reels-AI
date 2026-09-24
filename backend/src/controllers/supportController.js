import prisma from '../config/database.js';
import { isGmailConfigured, sendGmail } from '../services/gmailService.js';

const clean = (value) => String(value ?? '').trim();
const statuses = ['open', 'in_progress', 'resolved', 'closed'];

export const createSupportTicket = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, fullName: true, username: true, email: true } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const category = clean(req.body?.category) || 'General';
    const subject = clean(req.body?.subject);
    const message = clean(req.body?.message);
    if (!subject || !message) return res.status(400).json({ success: false, message: 'Subject and message are required' });
    if (subject.length > 160) return res.status(400).json({ success: false, message: 'Subject is too long' });
    if (message.length > 5000) return res.status(400).json({ success: false, message: 'Message is too long' });

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        name: user.fullName || user.username || 'RA Social User',
        email: user.email,
        category,
        subject,
        message
      }
    });

    // Email notification is best-effort; the ticket remains safely stored if Gmail is unavailable.
    if (isGmailConfigured()) {
      try {
        await sendGmail({
          to: process.env.GMAIL_USER || 'rasocialofficial@gmail.com',
          subject: `[RA Social Support #${ticket.id.slice(0, 8)}] ${subject}`,
          text: `New support request\n\nTicket: ${ticket.id}\nUser: ${ticket.name}\nEmail: ${ticket.email}\nCategory: ${category}\n\n${message}`,
          replyTo: ticket.email
        });
      } catch (mailError) {
        console.error('Support email notification failed:', mailError.message);
      }
    }

    res.status(201).json({ success: true, message: 'Support request submitted successfully', data: ticket });
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit support request' });
  }
};

export const getMySupportTickets = async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' }, take: 50 });
    res.json({ success: true, data: tickets });
  } catch (error) {
    console.error('My support tickets error:', error);
    res.status(500).json({ success: false, message: 'Failed to load support history' });
  }
};

export const getAdminSupportTickets = async (req, res) => {
  try {
    const status = clean(req.query?.status);
    const where = status && status !== 'all' ? { status } : {};
    const tickets = await prisma.supportTicket.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
    res.json(tickets);
  } catch (error) {
    console.error('Admin support tickets error:', error);
    res.status(500).json({ error: 'Failed to load support tickets' });
  }
};

export const updateAdminSupportTicket = async (req, res) => {
  try {
    const status = clean(req.body?.status);
    if (!statuses.includes(status)) return res.status(400).json({ error: 'Invalid support ticket status' });
    const ticket = await prisma.supportTicket.update({ where: { id: req.params.id }, data: { status } });
    res.json(ticket);
  } catch (error) {
    console.error('Update support ticket error:', error);
    res.status(400).json({ error: 'Failed to update support ticket' });
  }
};

export const replyToSupportTicket = async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
    if (!ticket) return res.status(404).json({ error: 'Support ticket not found' });
    const reply = clean(req.body?.reply);
    if (!reply) return res.status(400).json({ error: 'Reply is required' });
    if (!isGmailConfigured()) return res.status(503).json({ error: 'Gmail is not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD in Render Environment.' });

    await sendGmail({
      to: ticket.email,
      subject: ticket.subject.toLowerCase().startsWith('re:') ? ticket.subject : `Re: ${ticket.subject}`,
      text: reply,
      replyTo: process.env.GMAIL_USER || 'rasocialofficial@gmail.com'
    });

    const updated = await prisma.supportTicket.update({ where: { id: ticket.id }, data: { adminReply: reply, status: 'resolved' } });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Support ticket reply error:', error);
    res.status(500).json({ error: 'Failed to send support reply' });
  }
};
