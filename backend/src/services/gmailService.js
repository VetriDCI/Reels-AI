import tls from 'node:tls';

const cleanEnv = (value) => String(value || '').trim();

const encodeHeader = (value = '') => {
  const text = String(value);
  if (/^[\x20-\x7E]*$/.test(text)) return text;
  return `=?UTF-8?B?${Buffer.from(text, 'utf8').toString('base64')}?=`;
};

const dotStuff = (value) => String(value || '').replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..');

function readResponse(socket, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    let settled = false;
    const cleanup = () => {
      clearTimeout(timer);
      socket.off('data', onData);
      socket.off('error', onError);
      socket.off('close', onClose);
    };
    const finish = () => {
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const last = lines[lines.length - 1] || '';
      if (!/^\d{3} /.test(last) || settled) return;
      settled = true;
      cleanup();
      resolve({ code: Number(last.slice(0, 3)), text: lines.join('\n') });
    };
    const onData = (chunk) => {
      buffer += chunk.toString('utf8');
      finish();
    };
    const onError = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const onClose = () => {
      if (settled) return;
      const last = buffer.split(/\r?\n/).filter(Boolean).at(-1) || '';
      if (!/^\d{3} /.test(last)) {
        settled = true;
        cleanup();
        reject(new Error('Gmail SMTP connection closed unexpectedly.'));
      }
    };
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Gmail SMTP response timeout.'));
    }, timeoutMs);

    // Attach listeners BEFORE the command is written. Gmail can answer very quickly.
    socket.on('data', onData);
    socket.once('error', onError);
    socket.once('close', onClose);
  });
}

async function sendCommand(socket, command, expectedCodes) {
  // Start listening first so a fast SMTP response cannot be missed.
  const responsePromise = readResponse(socket);
  socket.write(`${command}\r\n`);
  const response = await responsePromise;
  if (expectedCodes && !expectedCodes.includes(response.code)) {
    throw new Error(`Gmail SMTP error ${response.code}: ${response.text}`);
  }
  return response;
}

export function isGmailConfigured() {
  return Boolean(cleanEnv(process.env.GMAIL_USER) && cleanEnv(process.env.GMAIL_APP_PASSWORD));
}

export async function sendGmail({ to, subject, text, replyTo, inReplyTo }) {
  const user = cleanEnv(process.env.GMAIL_USER) || 'rasocialofficial@gmail.com';
  const password = cleanEnv(process.env.GMAIL_APP_PASSWORD).replace(/\s+/g, '');
  const recipient = String(to || '').trim();

  if (!password) throw new Error('Gmail is not configured. Add GMAIL_APP_PASSWORD in Render Environment.');
  if (!/^\S+@\S+\.\S+$/.test(recipient)) throw new Error('A valid recipient email is required.');

  const socket = tls.connect({
    host: 'smtp.gmail.com',
    port: 465,
    servername: 'smtp.gmail.com',
    rejectUnauthorized: true,
    timeout: 20000,
  });

  try {
    await new Promise((resolve, reject) => {
      const onSecure = () => { cleanup(); resolve(); };
      const onError = (error) => { cleanup(); reject(error); };
      const onTimeout = () => { cleanup(); reject(new Error('Connection to Gmail SMTP timed out.')); };
      const cleanup = () => {
        socket.off('secureConnect', onSecure);
        socket.off('error', onError);
        socket.off('timeout', onTimeout);
      };
      socket.once('secureConnect', onSecure);
      socket.once('error', onError);
      socket.once('timeout', onTimeout);
    });

    const greeting = await readResponse(socket);
    if (greeting.code !== 220) throw new Error(`Gmail SMTP greeting error ${greeting.code}: ${greeting.text}`);

    await sendCommand(socket, 'EHLO rasocial.local', [250]);
    await sendCommand(socket, 'AUTH LOGIN', [334]);
    await sendCommand(socket, Buffer.from(user, 'utf8').toString('base64'), [334]);
    await sendCommand(socket, Buffer.from(password, 'utf8').toString('base64'), [235]);
    await sendCommand(socket, `MAIL FROM:<${user}>`, [250]);
    await sendCommand(socket, `RCPT TO:<${recipient}>`, [250, 251]);
    await sendCommand(socket, 'DATA', [354]);

    const headers = [
      `From: RA Social <${user}>`,
      `To: ${recipient}`,
      `Subject: ${encodeHeader(subject || 'RA Social Support')}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      `Date: ${new Date().toUTCString()}`,
      replyTo ? `Reply-To: ${replyTo}` : '',
      inReplyTo ? `In-Reply-To: ${inReplyTo}` : '',
      '',
    ].filter(Boolean).join('\r\n');

    // DATA response listener is attached before sending the message terminator.
    const dataResponse = readResponse(socket);
    socket.write(`${headers}\r\n${dotStuff(text)}\r\n.\r\n`);
    const dataResult = await dataResponse;
    if (dataResult.code !== 250) {
      throw new Error(`Gmail SMTP DATA error ${dataResult.code}: ${dataResult.text}`);
    }

    await sendCommand(socket, 'QUIT', [221]);
    return { success: true, from: user, to: recipient };
  } finally {
    socket.end();
  }
}
