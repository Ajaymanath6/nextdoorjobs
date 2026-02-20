import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send email notification when a recruiter or candidate receives a message
 * @param {Object} params
 * @param {string} params.recipientEmail - Recipient's email address
 * @param {string} params.recipientName - Recipient's name
 * @param {string} params.senderName - Sender's name
 * @param {string} params.senderEmail - Sender's email address
 * @param {string} [params.senderOrgName] - Sender's organization name (if recruiter)
 * @param {string} params.messagePreview - Preview of the message content
 * @param {string} params.conversationLink - Link to view the conversation
 */
export async function sendMessageNotificationEmail({
  recipientEmail,
  recipientName,
  senderName,
  senderEmail,
  senderOrgName,
  messagePreview,
  conversationLink,
}) {
  // Skip if SMTP is not configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('SMTP not configured, skipping email notification');
    return;
  }

  const subject = `New message from ${senderName}${senderOrgName ? ` (${senderOrgName})` : ''} - MapMyGig`;
  
  const html = `
    <div style="font-family: 'Open Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #F84416; margin-bottom: 20px;">MapMyGig</h2>
      <p style="color: #1A1A1A; font-size: 16px; line-height: 1.5;">Hi ${recipientName},</p>
      <p style="color: #1A1A1A; font-size: 16px; line-height: 1.5;">
        <strong>${senderName}</strong>${senderEmail ? ` (${senderEmail})` : ''}${senderOrgName ? ` from <strong>${senderOrgName}</strong>` : ''} has sent you a message:
      </p>
      <blockquote style="border-left: 3px solid #F84416; padding-left: 12px; margin: 20px 0; color: #575757; font-style: italic;">
        ${messagePreview}
      </blockquote>
      <p style="margin: 30px 0;">
        <a href="${conversationLink}" style="background: #F84416; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 600;">View Message</a>
      </p>
      <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 30px 0;" />
      <p style="color: #A5A5A5; font-size: 12px; line-height: 1.5;">
        This is an automated message from MapMyGig. Do not reply to this email.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"MapMyGig" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject,
      html,
    });
    console.log(`Email notification sent to ${recipientEmail}`);
  } catch (error) {
    console.error('Error sending email notification:', error);
    // Don't throw - email failure shouldn't break the notification creation
  }
}
