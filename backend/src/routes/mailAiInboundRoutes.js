import express from 'express';
import prisma from '../config/database.js';
import { analyzeMail, generateReply, shouldAutoReply } from '../services/mailAiService.js';
import { isGmailConfigured, sendGmail } from '../services/gmailService.js';

const router = express.Router();
const clean = (v) => String(v ?? '').trim();

router.post('/inbound', async (req, res) => {
  try {
    const supplied = clean(req.get('x-ra-inbound-secret'));
    const expected = clean(process.env.MAIL_AI_INBOUND_SECRET);
    if (!expected || supplied !== expected) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const senderEmail = clean(req.body?.senderEmail);
    const receiverEmail = clean(req.body?.receiverEmail || process.env.GMAIL_USER || 'rasocialofficial@gmail.com');
    const subject = clean(req.body?.subject) || 'No subject';
    const body = clean(req.body?.body);
    const externalId = clean(req.body?.externalId);
    if (!senderEmail || !/^\S+@\S+\.\S+$/.test(senderEmail) || !body) {
      return res.status(400).json({ success: false, error: 'Valid senderEmail and body are required' });
    }

    const existing = externalId ? await prisma.mailAIMessage.findFirst({ where: { summary: { contains: `[GMAIL_ID:${externalId}]` } } }) : null;
    if (existing) return res.json({ success: true, duplicate: true, data: existing });

    const analysis = analyzeMail(subject, body);
    const safeAutoReply = shouldAutoReply(subject, body, analysis);
    const replyBody = await generateReply({ senderEmail, subject, body, analysis });
    let status = safeAutoReply ? 'pending' : 'review';
    let delivery = 'not_sent';

    if (safeAutoReply && isGmailConfigured()) {
      await sendGmail({
        to: senderEmail,
        subject: subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`,
        text: replyBody,
        replyTo: process.env.GMAIL_USER || 'rasocialofficial@gmail.com'
      });
      status = 'replied';
      delivery = 'sent';
    }

    const summary = `${analysis.summary}${externalId ? ` [GMAIL_ID:${externalId}]` : ''}`;
    const message = await prisma.mailAIMessage.create({
      data: {
        userId: null,
        senderEmail,
        receiverEmail,
        subject,
        body,
        status,
        autoReply: delivery === 'sent',
        replyBody,
        category: analysis.category,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        spamScore: analysis.spamScore,
        phishingRisk: analysis.phishingRisk,
        summary,
        replies: { create: { body: replyBody, status: delivery === 'sent' ? 'sent' : 'generated' } }
      },
      include: { replies: { orderBy: { createdAt: 'desc' } } }
    });

    res.status(201).json({ success: true, delivery, status, data: message });
  } catch (error) {
    console.error('Mail AI inbound error:', error);
    res.status(500).json({ success: false, error: 'Could not process inbound mail' });
  }
});

export default router;
