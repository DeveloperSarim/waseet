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

const sar = (n) => 'SAR ' + Number(n || 0).toLocaleString('en-US')

// Deal closed → commission created (developer still owes payment)
export function sendDealClosedEmail(to, { fullName, dealRef, projectName, net } = {}) {
  if (!to) return Promise.resolve({ skipped: true })
  const html = shell(`
    <h2 style="margin:0 0 8px;">Deal closed — commission on the way 🎉</h2>
    <p>Hi ${fullName || 'there'},</p>
    <p>Your deal on <b>${projectName}</b> (${dealRef}) has been marked closed by the developer.</p>
    <p style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px 14px;">Your commission: <b style="font-size:16px;">${sar(net)}</b> <span style="color:#6B7280;">(net after platform fee)</span></p>
    <p style="font-size:13px;color:#6B7280;">You'll be notified when the developer pays and the funds become available to withdraw.</p>`)
  return sendMail({ to, subject: `Deal closed — ${sar(net)} commission (${dealRef})`, html })
}

// Developer paid → funds available in the realtor's wallet
export function sendCommissionPaidEmail(to, { fullName, dealRef, net } = {}) {
  if (!to) return Promise.resolve({ skipped: true })
  const html = shell(`
    <h2 style="margin:0 0 8px;">Your commission is ready to withdraw 💰</h2>
    <p>Hi ${fullName || 'there'},</p>
    <p>The developer has paid the commission for <b>${dealRef}</b>. <b>${sar(net)}</b> is now available in your Waseet wallet.</p>
    <p><a href="${config.APP_URL}/realtor/commissions" style="display:inline-block;background:#16A34A;color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Withdraw now →</a></p>`)
  return sendMail({ to, subject: `${sar(net)} available to withdraw (${dealRef})`, html })
}

// Waseet disbursed the payout to the realtor's bank
export function sendCommissionDisbursedEmail(to, { fullName, dealRef, net } = {}) {
  if (!to) return Promise.resolve({ skipped: true })
  const html = shell(`
    <h2 style="margin:0 0 8px;">Payout sent to your bank ✅</h2>
    <p>Hi ${fullName || 'there'},</p>
    <p>We've disbursed <b>${sar(net)}</b> for commission <b>${dealRef}</b> to your registered bank account. It typically settles within 1–3 business days.</p>`)
  return sendMail({ to, subject: `Payout sent — ${sar(net)} (${dealRef})`, html })
}

// Platform announcement (broadcast)
export function sendAnnouncementEmail(to, { fullName, title, body, link } = {}) {
  if (!to) return Promise.resolve({ skipped: true })
  const safeBody = String(body || '').replace(/</g, '&lt;').replace(/\n/g, '<br>')
  const html = shell(`
    <p style="font-size:11px;font-weight:700;letter-spacing:.06em;color:#6B7280;text-transform:uppercase;margin:0 0 6px;">Platform announcement</p>
    <h2 style="margin:0 0 10px;">${String(title || '').replace(/</g, '&lt;')}</h2>
    <p style="line-height:1.7;">${safeBody}</p>
    ${link ? `<p style="margin-top:16px;"><a href="${link}" style="display:inline-block;background:#16A34A;color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Learn more →</a></p>` : ''}`)
  return sendMail({ to, subject: title || 'Waseet announcement', html })
}

// Lead status update
export function sendLeadStatusEmail(to, { fullName, clientName, projectName, status } = {}) {
  if (!to) return Promise.resolve({ skipped: true })
  const label = status ? status[0] + status.slice(1).toLowerCase() : 'updated'
  const html = shell(`
    <h2 style="margin:0 0 8px;">Lead update: ${clientName || 'your lead'} is now ${label}</h2>
    <p>Hi ${fullName || 'there'},</p>
    <p>Your lead <b>${clientName || ''}</b> on <b>${projectName || ''}</b> was updated to <b>${label}</b> by the developer.</p>
    <p><a href="${config.APP_URL}/realtor/leads" style="display:inline-block;background:#16A34A;color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:600;">View lead →</a></p>`)
  return sendMail({ to, subject: `Lead update — ${clientName || 'your lead'} is now ${label}`, html })
}
