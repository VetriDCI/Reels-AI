const BACKEND_URL = 'https://YOUR-RENDER-BACKEND.example.com';
const INBOUND_SECRET = 'RA_Social_Inbound_9Kx7P2mQ4V8nL6';

function setupMailAiTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'syncRaSocialMail') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger('syncRaSocialMail').timeBased().everyMinutes(5).create();
  syncRaSocialMail();
}

function syncRaSocialMail() {
  const query = 'in:inbox is:unread to:rasocialofficial@gmail.com -from:me';
  const threads = GmailApp.search(query, 0, 50);

  threads.forEach(function(thread) {
    thread.getMessages().forEach(function(message) {
      if (!message.isUnread()) return;

      const payload = {
        externalId: message.getId(),
        senderEmail: extractEmail(message.getFrom()),
        receiverEmail: 'rasocialofficial@gmail.com',
        subject: message.getSubject() || 'No subject',
        body: message.getPlainBody() || message.getBody() || ''
      };

      const response = UrlFetchApp.fetch(BACKEND_URL + '/api/admin/mail-ai/inbound', {
        method: 'post',
        contentType: 'application/json',
        headers: { 'X-Mail-AI-Secret': INBOUND_SECRET },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      const code = response.getResponseCode();
      if (code >= 200 && code < 300) {
        message.markRead();
      } else {
        console.log('Mail AI sync failed: ' + code + ' ' + response.getContentText());
      }
    });
  });
}

function extractEmail(value) {
  const match = String(value || '').match(/<([^>]+)>/);
  return (match ? match[1] : String(value || '')).trim();
}
