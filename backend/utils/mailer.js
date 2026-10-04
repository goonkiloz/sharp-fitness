function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

async function sendConsultNotification(request) {
  if (!mailConfigured()) {
    return {
      sent: false,
      error: 'Resend is not configured. Lead was saved to the trainer dashboard.'
    };
  }

  const to = process.env.CONTACT_NOTIFICATION_TO || 'codysharp011@outlook.com';
  const from = process.env.RESEND_FROM;

  const text = [
    'New Sharp Fitness consultation request',
    '',
    `Name: ${request.name}`,
    `Contact: ${request.contact}`,
    `Goal: ${request.goal || 'Not provided'}`,
    `Interested in: ${request.interestedIn || 'Not sure yet'}`,
    '',
    request.message || 'No additional message.'
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#16110f;max-width:640px">
      <h2 style="margin-bottom:20px">New Sharp Fitness consultation request</h2>
      <p><strong>Name:</strong> ${escapeHtml(request.name)}</p>
      <p><strong>Contact:</strong> ${escapeHtml(request.contact)}</p>
      <p><strong>Goal:</strong> ${escapeHtml(request.goal || 'Not provided')}</p>
      <p><strong>Interested in:</strong> ${escapeHtml(request.interestedIn || 'Not sure yet')}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap">${escapeHtml(request.message || 'No additional message.')}</p>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `New Sharp Fitness consult request — ${request.name}`,
      text,
      html
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || data?.error || `Resend returned HTTP ${response.status}`;
    throw new Error(message);
  }

  return { sent: true, error: null, id: data.id || null };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

module.exports = { mailConfigured, sendConsultNotification };
