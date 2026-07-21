import { prisma } from './prisma.js'
import { ApiError } from '../middleware/error.js'

// Shared dispute-raising logic for realtors and developers. Verifies the raiser
// owns the referenced commission / lead, mints a DSP reference, and alerts admins.
export async function raiseDispute({ userId, role, subject, description, commissionId, leadId, amount }) {
  if (!subject || !subject.trim()) throw new ApiError(400, 'Please describe the issue', 'BAD_INPUT')
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true, companyName: true } })

  if (commissionId) {
    const c = await prisma.commission.findUnique({ where: { id: commissionId }, select: { realtorId: true, developerId: true, leadId: true } })
    if (!c) throw new ApiError(404, 'Commission not found', 'NOT_FOUND')
    if (role === 'REALTOR' && c.realtorId !== userId) throw new ApiError(403, 'This is not your commission', 'FORBIDDEN')
    if (role === 'DEVELOPER' && c.developerId !== userId) throw new ApiError(403, 'This is not your commission', 'FORBIDDEN')
    if (!leadId) leadId = c.leadId
  }
  if (leadId) {
    const l = await prisma.lead.findUnique({ where: { id: leadId }, select: { realtorId: true, developerId: true } })
    if (!l) throw new ApiError(404, 'Lead not found', 'NOT_FOUND')
    if (role === 'REALTOR' && l.realtorId !== userId) throw new ApiError(403, 'This is not your lead', 'FORBIDDEN')
    if (role === 'DEVELOPER' && l.developerId !== userId) throw new ApiError(403, 'This is not your lead', 'FORBIDDEN')
  }

  const count = await prisma.dispute.count()
  const ref = `DSP-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`
  const raisedByName = user?.companyName || user?.fullName || null
  const dispute = await prisma.dispute.create({
    data: {
      ref, raisedById: userId, raisedByName, raisedByRole: role,
      commissionId: commissionId || null, leadId: leadId || null,
      subject: subject.trim().slice(0, 200), description: description?.trim() || null,
      amount: amount != null && amount !== '' ? Math.round(Number(amount)) || null : null,
      status: 'OPEN',
    },
  })
  // confirm to the raiser + alert every admin
  await prisma.notification.create({ data: { userId, type: 'announcement', title: 'Dispute submitted', body: `${ref} has been submitted. Our team reviews disputes within 48 hours.`, link: '#', read: false } })
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
  if (admins.length) {
    await prisma.notification.createMany({ data: admins.map((a) => ({ userId: a.id, type: 'announcement', title: 'New dispute raised', body: `${ref}: ${dispute.subject} — raised by ${raisedByName || role}`, link: '/admin/disputes', read: false })) })
  }
  await prisma.auditLog.create({ data: { actorId: userId, action: 'dispute.raise', entity: 'Dispute', entityId: dispute.id, meta: { ref } } })
  return { id: dispute.id, ref: dispute.ref, status: dispute.status }
}

// A raiser's own disputes (for showing status in their portal).
export async function listMyDisputes(userId) {
  const rows = await prisma.dispute.findMany({ where: { raisedById: userId }, orderBy: { createdAt: 'desc' }, take: 100 })
  return rows.map((d) => ({ id: d.id, ref: d.ref, subject: d.subject, status: d.status, amount: d.amount, commissionId: d.commissionId, leadId: d.leadId, resolution: d.resolution, createdAt: d.createdAt }))
}
