import nodemailer from 'nodemailer';
import { fileURLToPath } from 'node:url';

const businessEmail = 'watikoloeventvenuerental@gmail.com';
const logoPath = fileURLToPath(new URL('../src/pictures/watikolo-logo.png', import.meta.url));
const logoCid = 'watikolo-logo@watikolo';

let transporter;

function formatMoney(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(value) || 0);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getAmountPaid(booking) {
  return Number(booking.depositAmount) || 0;
}

function getRemainingBalance(booking) {
  return Math.max(0, (Number(booking.totalPrice) || 0) - getAmountPaid(booking));
}

function getSelectedBookingName(booking) {
  if (booking.bookingMode === 'room') {
    return booking.roomAddOns?.length ? booking.roomAddOns.join(', ') : booking.packageName ?? booking.venueName;
  }

  return booking.packageName ? `${booking.venueName} - ${booking.packageName}` : booking.venueName;
}

function formatTimeLabel(value) {
  const match = String(value ?? '').match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return '';
  }

  const hour = Number(match[1]);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${match[2]} ${period}`;
}

function getEmailSubject(status, booking) {
  const subjects = {
    pending: `Booking request submitted - ${booking.reference}`,
    approved: `Booking confirmed - ${booking.reference}`,
    rejected: `Booking request not approved - ${booking.reference}`,
    cancelled: `Booking cancelled - ${booking.reference}`,
  };

  return subjects[status] ?? `Booking update - ${booking.reference}`;
}

function getStatusHeading(status) {
  const headings = {
    pending: 'Booking Request Received',
    approved: 'Booking Confirmed',
    rejected: 'Booking Request Update',
    cancelled: 'Booking Cancelled',
  };

  return headings[status] ?? 'Booking Update';
}

function getIntro(status, booking) {
  if (status === 'pending') {
    return `Your booking request was successfully submitted and is now pending. Our team will review your details and payment proof.`;
  }

  if (status === 'approved') {
    return `Your booking has been approved. Your 30% down payment has been verified and your reservation is now confirmed.`;
  }

  if (status === 'rejected') {
    return `Your booking request was not approved. You may contact Watikolo Event Venue Rental for clarification or to submit a new request.`;
  }

  if (status === 'cancelled') {
    return `This email confirms that your booking has been cancelled.`;
  }

  return `There is an update to your booking.`;
}

function buildBookingEmail(status, booking) {
  const amountPaid = getAmountPaid(booking);
  const remainingBalance = getRemainingBalance(booking);
  const statusText = status.charAt(0).toUpperCase() + status.slice(1);
  const statusHeading = getStatusHeading(status);
  const intro = getIntro(status, booking);
  const details = [
    ['Booking reference', booking.reference],
    ['Booking status', statusText],
    ['Date', booking.date],
    ['Time', booking.timeSlotLabel],
    ...(booking.preferredStartTime ? [['Preferred start time', formatTimeLabel(booking.preferredStartTime)]] : []),
    ['Selected venue/room', getSelectedBookingName(booking)],
    ['Total amount', formatMoney(booking.totalPrice)],
    ['Amount paid', formatMoney(amountPaid)],
    ['Remaining balance', formatMoney(remainingBalance)],
  ];

  const text = [
    `Dear ${booking.customerName},`,
    '',
    'Good day!',
    '',
    intro,
    '',
    ...details.map(([label, value]) => `${label}: ${value || 'N/A'}`),
    '',
    'Thank you,',
    'Watikolo Event Venue Rental',
  ].join('\n');

  const htmlRows = details
    .map(([label, value]) => `
      <tr>
        <td style="padding:18px 26px;border-bottom:1px solid #e9e1eb;color:#6b6470;font-size:16px;line-height:1.45;width:42%;">${escapeHtml(label)}</td>
        <td style="padding:18px 26px;border-bottom:1px solid #e9e1eb;font-weight:800;color:#241827;font-size:16px;line-height:1.45;">${escapeHtml(value || 'N/A')}</td>
      </tr>
    `)
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#2b2430;background:#f7f1f8;padding:28px 12px;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #eee5ef;border-radius:26px;overflow:hidden;">
        <div style="background-color:#53075f;padding:28px 20px;color:#ffffff;text-align:center;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;">
            <tr>
              <td align="center" style="padding:0 0 16px;text-align:center;color:#ffffff;font-family:Arial,sans-serif;">
                <img src="cid:${logoCid}" alt="Watikolo" width="100" style="display:block;width:100px;max-width:100%;height:auto;margin:0 auto;border:0;" />
                <div style="margin-top:4px;font-size:13px;line-height:20px;">Event Venue Rental</div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:16px 0 0;border-top:1px solid #98649f;text-align:center;color:#ffffff;font-family:Arial,sans-serif;">
                <div style="font-size:11px;line-height:18px;letter-spacing:1px;text-transform:uppercase;">Booking Notification</div>
                <div style="margin-top:8px;font-size:26px;line-height:34px;font-weight:700;">${escapeHtml(statusHeading)}</div>
              </td>
            </tr>
          </table>
        </div>
        <div style="padding:44px 54px 36px;">
          <p style="margin:0 0 28px;font-size:18px;">Dear <strong>${escapeHtml(booking.customerName)}</strong>,</p>
          <p style="margin:0 0 28px;font-size:18px;">Good day!</p>
          <p style="margin:0 0 34px;font-size:18px;line-height:1.75;">${escapeHtml(intro)}</p>
          <h2 style="margin:0 0 18px;color:#6d1378;font-size:22px;line-height:1.2;">Booking Details</h2>
          <table style="border-collapse:collapse;margin:0 0 34px;width:100%;background:#fbf6fc;">
            <tbody>${htmlRows}</tbody>
          </table>
          <p style="margin:0;font-size:16px;color:#4b4450;">Thank you,<br><strong>Watikolo Event Venue Rental</strong></p>
        </div>
      </div>
    </div>
  `;

  return { subject: getEmailSubject(status, booking), text, html };
}

function getTransporter() {
  const smtpUser = process.env.SMTP_USER ?? businessEmail;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpPass) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  return transporter;
}

export async function sendBookingEmail(status, booking) {
  const activeTransporter = getTransporter();
  const smtpUser = process.env.SMTP_USER ?? businessEmail;

  if (!activeTransporter) {
    console.warn(`Email skipped for ${booking.reference}: SMTP_PASS is not configured.`);
    return { sent: false, reason: 'SMTP_PASS is not configured.' };
  }

  const message = buildBookingEmail(status, booking);
  const info = await activeTransporter.sendMail({
    from: `"Watikolo Event Venue Rental" <${smtpUser}>`,
    to: booking.customerEmail,
    replyTo: businessEmail,
    subject: message.subject,
    text: message.text,
    html: message.html,
    attachments: [{
      filename: 'watikolo-logo.png',
      path: logoPath,
      cid: logoCid,
      contentType: 'image/png',
      contentDisposition: 'inline',
    }],
  });

  return {
    sent: true,
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  };
}
