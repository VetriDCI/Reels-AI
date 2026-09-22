const clean = (s = '') => String(s).replace(/\s+/g, ' ').trim();
const sentences = (s) => clean(s).split(/(?<=[.!?])\s+/).filter(Boolean);

export function analyzeMail(subject = '', body = '') {
  const text = clean(`${subject} ${body}`);
  const lower = text.toLowerCase();
  const positive = ['thanks','great','happy','love','excellent','appreciate','good'].filter(x => lower.includes(x)).length;
  const negative = ['angry','bad','issue','problem','urgent','hate','fail','error'].filter(x => lower.includes(x)).length;
  const urgency = /urgent|asap|immediately|deadline|critical|today/.test(lower) ? 'high' : /soon|tomorrow|priority/.test(lower) ? 'medium' : 'low';
  let category = 'general';
  if (/invoice|payment|bank|receipt|tax|refund/.test(lower)) category = 'finance';
  else if (/meeting|project|deadline|client|work|interview/.test(lower)) category = 'work';
  else if (/sale|order|delivery|shipping|offer|product/.test(lower)) category = 'shopping';
  else if (/job|resume|career|hiring/.test(lower)) category = 'career';
  const spamScore = /free money|winner|claim now|crypto|prize/.test(lower) ? 0.92 : 0.03;
  const phishingRisk = /verify your password|login immediately|click this link|confirm your account/.test(lower) ? 'high' : 'low';
  const ss = sentences(body);
  const summary = ss.slice(0, 3).join(' ').slice(0, 500) || text.slice(0, 500);
  const sentiment = negative > positive ? 'negative' : positive > negative ? 'positive' : 'neutral';
  return { summary, sentiment, urgency, category, spamScore, phishingRisk };
}

export function generateReply({ senderEmail, subject, body, analysis }) {
  const first = analysis.urgency === 'high'
    ? 'Thank you for reaching out. We understand that this is time-sensitive and will review it as a priority.'
    : 'Thank you for contacting us. We have received your message and reviewed the details.';
  const categoryLine = analysis.category === 'finance'
    ? 'Our support team will verify the payment, refund, or billing details and assist you with the next steps.'
    : analysis.category === 'shopping'
      ? 'Our team will check the product, order, or delivery details and assist you with the next steps.'
      : 'Our team will review your request and provide the relevant information or next steps.';
  return `Hello,\n\n${first}\n\n${categoryLine}\n\nIf you have any additional details that may help us, please reply to this email.\n\nBest regards,\nRA Social Support Team`;
}
