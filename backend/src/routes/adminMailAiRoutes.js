import express from 'express';
import prisma from '../config/database.js';
import { protectAdmin } from '../middleware/adminMiddleware.js';
import { analyzeMail, generateReply, shouldAutoReply } from '../services/mailAiService.js';
import { isGmailConfigured, sendGmail } from '../services/gmailService.js';

const router = express.Router();
router.use(protectAdmin);

const serialize = (m) => ({
  id: m.id,
  senderEmail: m.senderEmail,
  receiverEmail: m.receiverEmail,
  subject: m.subject,
  body: m.body,
  status: m.status,
  autoReply: m.autoReply,
  replyBody: m.replyBody,
  category: m.category,
  sentiment: m.sentiment,
  urgency: m.urgency,
  spamScore: m.spamScore,
  phishingRisk: m.phishingRisk,
  summary: m.summary,
  createdAt: m.createdAt,
  updatedAt: m.updatedAt,
  replies: m.replies || [],
});

router.get('/config', async (req, res) => {
  res.json({ senderEmail: process.env.GMAIL_USER || 'rasocialofficial@gmail.com', gmailConfigured: isGmailConfigured() });
});

router.get('/stats', async (req, res) => {
  try {
    const [incoming, replied, pending, review] = await Promise.all([
      prisma.mailAIMessage.count(),
      prisma.mailAIMessage.count({ where: { status: 'replied' } }),
      prisma.mailAIMessage.count({ where: { status: 'pending' } }),
      prisma.mailAIMessage.count({ where: { status: 'review' } }),
    ]);
    res.json({ incoming, replied, pending, review });
  } catch (e) { res.status(500).json({ error: 'Could not load Mail AI stats' }); }
});

router.get('/messages', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const status = String(req.query.status || '').trim();
    const where = {
      ...(status ? { status } : {}),
      ...(q ? { OR: [{ senderEmail: { contains: q, mode: 'insensitive' } }, { subject: { contains: q, mode: 'insensitive' } }, { body: { contains: q, mode: 'insensitive' } }] } : {}),
    };
    const rows = await prisma.mailAIMessage.findMany({ where, include: { replies: { orderBy: { createdAt: 'desc' } } }, orderBy: { createdAt: 'desc' }, take: 100 });
    res.json(rows.map(serialize));
  } catch (e) { res.status(500).json({ error: 'Could not load Mail AI messages' }); }
});

router.post('/messages', async (req, res) => {
  try {
    const senderEmail = String(req.body?.senderEmail || '').trim();
    const receiverEmail = String(req.body?.receiverEmail || '').trim();
    const subject = String(req.body?.subject || 'No subject').trim();
    const body = String(req.body?.body || '').trim();
    const autoReply = Boolean(req.body?.autoReply);
    if (!senderEmail || !receiverEmail || !body) return res.status(400).json({ error: 'senderEmail, receiverEmail and body are required' });

    const analysis = analyzeMail(subject, body);
    const safeAutoReply = autoReply && shouldAutoReply(subject, body, analysis);
    const shouldReview = analysis.phishingRisk === 'high' || analysis.spamScore >= 0.8 || !safeAutoReply;
    const replyBody = (safeAutoReply || shouldReview) ? await generateReply({ senderEmail, subject, body, analysis }) : null;
    let status = shouldReview ? 'review' : 'pending';
    let delivery = 'not_sent';

    if (safeAutoReply && replyBody && isGmailConfigured()) {
      await sendGmail({
        to: senderEmail,
        subject: subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject || 'RA Social Support'}`,
        text: replyBody,
        replyTo: process.env.GMAIL_USER || 'rasocialofficial@gmail.com'
      });
      status = 'replied';
      delivery = 'sent';
    }

    const message = await prisma.mailAIMessage.create({
      data: {
        userId: req.userId || null,
        senderEmail,
        receiverEmail,
        subject,
        body,
        status,
        autoReply: Boolean(safeAutoReply && delivery === 'sent'),
        replyBody,
        category: analysis.category,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        spamScore: analysis.spamScore,
        phishingRisk: analysis.phishingRisk,
        summary: analysis.summary,
        ...(replyBody ? { replies: { create: { body: replyBody, status: delivery === 'sent' ? 'sent' : 'generated' } } } : {}),
      },
      include: { replies: { orderBy: { createdAt: 'desc' } } },
    });
    res.status(201).json({ ...serialize(message), delivery });
  } catch (e) { console.error('Mail AI create error:', e); res.status(500).json({ error: 'Could not create Mail AI message' }); }
});

router.post('/messages/:id/generate', async (req, res) => {
  try {
    const message = await prisma.mailAIMessage.findUnique({ where: { id: req.params.id } });
    if (!message) return res.status(404).json({ error: 'Mail not found' });
    const analysis = analyzeMail(message.subject, message.body);
    const replyBody = await generateReply({ senderEmail: message.senderEmail, subject: message.subject, body: message.body, analysis });
    const updated = await prisma.mailAIMessage.update({ where: { id: message.id }, data: { category: analysis.category, sentiment: analysis.sentiment, urgency: analysis.urgency, spamScore: analysis.spamScore, phishingRisk: analysis.phishingRisk, summary: analysis.summary, replyBody, status: message.status === 'review' ? 'review' : 'pending', replies: { create: { body: replyBody, status: 'generated' } } }, include: { replies: { orderBy: { createdAt: 'desc' } } } });
    res.json(serialize(updated));
  } catch (e) { res.status(500).json({ error: 'Could not generate reply' }); }
});

router.post('/messages/:id/send', async (req, res) => {
  try {
    const message = await prisma.mailAIMessage.findUnique({ where: { id: req.params.id } });
    if (!message) return res.status(404).json({ error: 'Mail not found' });
    const replyBody = String(req.body?.replyBody || message.replyBody || '').trim();
    if (!replyBody) return res.status(400).json({ error: 'Reply body is required' });
    if (message.status === 'replied') return res.status(409).json({ error: 'This mail has already been sent.' });
    if (!isGmailConfigured()) return res.status(503).json({ error: 'Gmail is not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD in Render Environment.' });
    const delivery = await sendGmail({
      to: message.senderEmail,
      subject: message.subject?.toLowerCase().startsWith('re:') ? message.subject : `Re: ${message.subject || 'RA Social Support'}`,
      text: replyBody,
      replyTo: process.env.GMAIL_USER || 'rasocialofficial@gmail.com'
    });
    const updated = await prisma.mailAIMessage.update({
      where: { id: message.id },
      data: {
        replyBody,
        status: 'replied',
        autoReply: true,
        replies: { create: { body: replyBody, status: 'sent' } }
      },
      include: { replies: { orderBy: { createdAt: 'desc' } } }
    });
    res.json({ ...serialize(updated), delivery: 'sent', senderEmail: delivery.from, recipientEmail: delivery.to });
  } catch (e) { res.status(500).json({ error: 'Could not send reply' }); }
});

router.patch('/messages/:id', async (req, res) => {
  try {
    const data = {};
    if (typeof req.body?.replyBody === 'string') data.replyBody = req.body.replyBody;
    if (['pending','review','replied'].includes(req.body?.status)) data.status = req.body.status;
    const updated = await prisma.mailAIMessage.update({ where: { id: req.params.id }, data, include: { replies: { orderBy: { createdAt: 'desc' } } } });
    res.json(serialize(updated));
  } catch (e) { res.status(400).json({ error: 'Could not update mail' }); }
});

export default router;
