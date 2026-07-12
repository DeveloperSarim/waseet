import nodemailer from 'nodemailer'
import { config } from '../config/env.js'
import { logger } from '../utils/logger.js'

// Real transport only if SMTP is configured; otherwise dev fallback (log to console).
const transporter = config.SMTP_HOST
  ? nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
    })
  : null

export async function sendMail({ to, subject, html, text }) {
  if (!transporter) {
    logger.info(
      { to, subject, preview: (text || html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400) },
      '📧 [DEV] SMTP not configured — email logged, not sent',
    )
    return { dev: true }
  }
  const info = await transporter.sendMail({ from: config.SMTP_FROM, to, subject, html, text })
  logger.info({ to, subject, messageId: info.messageId }, '📧 Email sent')
  return info
}

const shell = (body) =>
  `<div style="font-family: Inter, Arial, sans-serif; color:#0A0A0A; max-width:520px; margin:0 auto;">${body}
   <hr style="border:none;border-top:1px solid #E5E7EB;margin:22px 0;">
   <p style="font-size:12px;color:#9CA3AF;">Waseet · وسيط — private real-estate marketplace</p></div>`

export function sendApprovalEmail(user, { tempPassword, setLink }) {
  const html = shell(`
    <h2 style="margin:0 0 8px;">Welcome to Waseet, ${user.fullName} 🎉</h2>
    <p>Your ${user.role.toLowerCase()} account has been <b>approved</b> by our team.</p>
    <p style="margin:18px 0 8px;"><b>Set your password</b> to get started:</p>
    <p><a href="${setLink}" style="display:inline-block;background:#16A34A;color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Set your password →</a></p>
    <p style="font-size:13px;color:#6B7280;">This link is valid for 7 days.</p>
    <p style="font-size:13px;color:#6B7280;margin-top:16px;">Or sign in with this temporary password (you'll be asked to change it):<br>
      <b style="font-family:monospace;font-size:15px;background:#F3F4F6;padding:3px 8px;border-radius:6px;display:inline-block;margin-top:4px;">${tempPassword}</b></p>`)
  return sendMail({ to: user.email, subject: 'Your Waseet account is approved — set your password', html })
}

export function sendRejectionEmail(user, { reason } = {}) {
  const html = shell(`
    <h2 style="margin:0 0 8px;">Update on your Waseet application</h2>
    <p>Hi ${user.fullName},</p>
    <p>After review, your ${user.role.toLowerCase()} application was not approved at this time.</p>
    ${reason ? `<p style="background:#FFF5F5;border:1px solid #FECACA;border-radius:8px;padding:10px 12px;"><b>Reason:</b> ${reason}</p>` : ''}
    <p style="font-size:13px;color:#6B7280;">Questions? Contact support@waseet.io</p>`)
  return sendMail({ to: user.email, subject: 'Update on your Waseet application', html })
}
