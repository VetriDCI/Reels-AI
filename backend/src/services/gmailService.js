import tls from 'node:tls';

const cleanEnv = (value) => String(value || '').trim();

const encodeHeader = (value = '') => {
  const text = String(value);
  if (/^[\x20-\x7E]*$/.test(text)) return text;
  return `=?UTF-8?B?${Buffer.from(text, 'utf8').toString('base64')}?=`;
};

const dotStuff = (value) => String(value || '').replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..');

function readResponse(socket, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const timer = setTimeout(() => { cleanup(); reject(new Error('Gmail SMTP response timeout.')); }, timeoutMs);
    const cleanup = () => { clearTimeout(timer); socket.off('data', onData); socket.off('error', onError); socket.off('close', onClose); };
    const finish = () => {
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const last = lines[lines.length - 1] || '';
      if (/^\d{3} /.test(last)) { cleanup(); resolve(lines.join('\n')); }
    };
    const onData = (chunk) => { buffer += chunk.toString('utf8'); finish(); };
    const onError = (err) => { cleanup(); reject(err); };
    const onClose = () => { if (!/^\d{3} /.test(buffer.split(/\r?\n/).filter(Boolean).at(-1) || '')) { cleanup(); reject(new Error('Gmail SMTP connection closed unexpectedly.')); } };
    socket.on('data', onData); socket.once('error', onError); socket.once('close', onClose);
  });
}

function sendCommand(socket, command, expected = null) {
  return new Promise(async (resolve, reject) => {
    try {
      socket.write(`${command}\r\n`);
      const response = await readResponse(socket);
      const code = Number(response.slice(0, 3));
      if (expected && !expected.includes(code)) throw new Error(`Gmail SMTP error ${code}: ${response}`);
      resolve(response);
    } catch (error) { reject(error); }
  });
}

export function isGmailConfigured() {
  return Boolean(cleanEnv(process.env.GMAIL_USER) && cleanEnv(process.env.GMAIL_APP_PASSWORD));
}

export async function sendGmail({ to, subject, text, replyTo, inReplyTo }) {
  const user = cleanEnv(process.env.GMAIL_USER) || 'rasocialofficial@gmail.com';
  const password = cleanEnv(process.env.GMAIL_APP_PASSWORD).replace(/\s+/g, '');
  if (!password) throw new Error('Gmail is not configured. Add GMAIL_APP_PASSWORD in Render Environment.');
  if (!to || !/^\S+@\S+\.\S+$/.test(String(to).trim())) throw new Error('A valid recipient email is required.');

  const socket = tls.connect({ host: 'smtp.gmail.com', port: 465, servername: 'smtp.gmail.com', rejectUnauthorized: true });
  try {
    await new Promise((resolve, reject) => { socket.once('secureConnect', resolve); socket.once('error', reject); });
    await readResponse(socket);
    await sendCommand(socket, `EHLO rasocial.local`, [250]);
    await sendCommand(socket, 'AUTH LOGIN', [334]);
    await sendCommand(socket, Buffer.from(user).toString('base64'), [334]);
    await sendCommand(socket, Buffer.from(password).toString('base64'), [235]);
    await sendCommand(socket, `MAIL FROM:<${user}>`, [250]);
    await sendCommand(socket, `RCPT TO:<${String(to).trim()}>`, [250, 251]);
    await sendCommand(socket, 'DATA', [354]);

    const headers = [
      `From: RA Social <${user}>`,
      `To: ${String(to).trim()}`,
      `Subject: ${encodeHeader(subject || 'RA Social Support')}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      `Date: ${new Date().toUTCString()}`,
      replyTo ? `Reply-To: ${replyTo}` : '',
      inReplyTo ? `In-Reply-To: ${inReplyTo}` : '',
      ''
    ].filter(Boolean).join('\r\n');
    socket.write(`${headers}\r\n${dotStuff(text)}\r\n.\r\n`);
    await readResponse(socket);
    await sendCommand(socket, 'QUIT', [221]);
    return { success: true, from: user, to: String(to).trim() };
  } finally {
    socket.end();
  }
}
