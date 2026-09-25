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
    const cleanup = () => {
      clearTimeout(timer);
      socket.off('data', onData);
      socket.off('error', onError);
      socket.off('close', onClose);
    };
    const finish = () => {
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const last = lines[lines.length - 1] || '';
      if (/^\d{3} /.test(last)) {
        cleanup();
        resolve(lines.join('\n'));
      }
    };
    const onData = (chunk) => { buffer += chunk.toString('utf8'); finish(); };
    const onError = (err) => { cleanup(); reject(err); };
    const onClose = () => {
      const last = buffer.split(/\r?\n/).filter(Boolean).at(-1) || '';
      if (!/^\d{3} /.test(last)) {
        cleanup();
        reject(new Error('Gmail SMTP connection closed unexpectedly.'));
      }
    };
    socket.on('data', onData);
    socket.once('error', onError);
    socket.once('close', onClose);
  });
}

// IMPORTANT: attach the response listener before writing the command.
// Otherwise a fast Gmail response can arrive before the listener is attached,
// causing a false timeout and a 500 response from the API.
function sendCommand(socket, command, expected = null) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const timer = setTimeout(() => { cleanup(); reject(new Error('Gmail SMTP response timeout.')); }, 15000);
    const cleanup = () => {
      clearTimeout(timer);
      socket.off('data', onData);
      socket.off('error', onError);
      socket.off('close', onClose);
    };
    const finish = () => {
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const last = lines[lines.length - 1] || '';
      if (!/^\d{3} /.test(last)) return;
      cleanup();
      const code = Number(last.slice(0, 3));
      const response = lines.join('\n');
      if (expected && !expected.includes(code)) {
        reject(new Error(`Gmail SMTP error ${code}: ${response}`));
        return;
      }
      resolve(response);
    };
    const onData = (chunk) => { buffer += chunk.toString('utf8'); finish(); };
    const onError = (err) => { cleanup(); reject(err); };
    const onClose = () => {
      const last = buffer.split(/\r?\n/).filter(Boolean).at(-1) || '';
      if (!/^\d{3} /.test(last)) {
        cleanup();
        reject(new Error('Gmail SMTP connection closed unexpectedly.'));
      }
    };
    socket.on('data', onData);
    socket.once('error', onError);
    socket.once('close', onClose);
    socket.write(`${command}\r\n`);
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
    await new Promise((resolve, reject) => {
      const onSecure = () => { cleanup(); resolve(); };
      const onError = (error) => { cleanup(); reject(error); };
      const cleanup = () => { socket.off('secureConnect', onSecure); socket.off('error', onError); };
      socket.once('secureConnect', onSecure);
      socket.once('error', onError);
    });

    // Read the initial 220 greeting before sending EHLO.
    await readResponse(socket);
    await sendCommand(socket, 'EHLO rasocial.local', [250]);
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

    // DATA has the same race condition risk as normal SMTP commands, so
    // attach the response listener before writing the message terminator.
    await new Promise((resolve, reject) => {
      let buffer = '';
      const timer = setTimeout(() => { cleanup(); reject(new Error('Gmail SMTP DATA response timeout.')); }, 15000);
      const cleanup = () => {
        clearTimeout(timer);
        socket.off('data', onData);
        socket.off('error', onError);
        socket.off('close', onClose);
      };
      const finish = () => {
        const lines = buffer.split(/\r?\n/).filter(Boolean);
        const last = lines[lines.length - 1] || '';
        if (!/^\d{3} /.test(last)) return;
        cleanup();
        const code = Number(last.slice(0, 3));
        if (code !== 250) {
          reject(new Error(`Gmail SMTP error ${code}: ${lines.join('\n')}`));
          return;
        }
        resolve();
      };
      const onData = (chunk) => { buffer += chunk.toString('utf8'); finish(); };
      const onError = (error) => { cleanup(); reject(error); };
      const onClose = () => {
        const last = buffer.split(/\r?\n/).filter(Boolean).at(-1) || '';
        if (!/^\d{3} /.test(last)) {
          cleanup();
          reject(new Error('Gmail SMTP connection closed unexpectedly after DATA.'));
        }
      };
      socket.on('data', onData);
      socket.once('error', onError);
      socket.once('close', onClose);
      socket.write(`${headers}\r\n${dotStuff(text)}\r\n.\r\n`);
    });

    await sendCommand(socket, 'QUIT', [221]);
    return { success: true, from: user, to: String(to).trim() };
  } finally {
    socket.end();
  }
}
