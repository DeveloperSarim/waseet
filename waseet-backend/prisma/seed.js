import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import zlib from 'node:zlib'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { s3, buckets } from '../src/lib/s3.js'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// tiny file generators so demo documents/images are REAL, valid files
// ---------------------------------------------------------------------------
const CRC_TABLE = (() => {
  const t = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
const crc32 = (buf) => {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const pngChunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'latin1')
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}
// solid-colour RGB PNG
function makePNG(w, h, [r, g, b]) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2
  const rowLen = w * 3
  const raw = Buffer.alloc((rowLen + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (rowLen + 1)] = 0
    for (let x = 0; x < w; x++) { const o = y * (rowLen + 1) + 1 + x * 3; raw[o] = r; raw[o + 1] = g; raw[o + 2] = b }
  }
  const idat = zlib.deflateSync(raw)
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))])
}
// diagonal gradient PNG (color → darker) so project covers look less flat
function makeGradientPNG(w, h, [r, g, b]) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2
  const rowLen = w * 3
  const raw = Buffer.alloc((rowLen + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (rowLen + 1)] = 0
    for (let x = 0; x < w; x++) {
      const t = (x / w + y / h) / 2 // 0 → 1 diagonal
      const f = 1 - t * 0.55 // fade toward darker
      const o = y * (rowLen + 1) + 1 + x * 3
      raw[o] = Math.round(r * f); raw[o + 1] = Math.round(g * f); raw[o + 2] = Math.round(b * f)
    }
  }
  const idat = zlib.deflateSync(raw)
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))])
}
// minimal single-page PDF with a title + text lines
function makePDF(title, lines) {
  const esc = (s) => String(s).replace(/([\\()])/g, '\\$1')
  let stream = `BT\n/F1 22 Tf\n60 780 Td\n(${esc(title)}) Tj\n/F1 12 Tf\n`
  let first = true
  for (const l of lines) { stream += `0 ${first ? -44 : -22} Td\n(${esc(l)}) Tj\n`; first = false }
  stream += 'ET'
  const objs = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>',
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
    `<</Length ${Buffer.byteLength(stream)}>>\nstream\n${stream}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = []
  objs.forEach((o, i) => { offsets.push(Buffer.byteLength(pdf, 'latin1')); pdf += `${i + 1} 0 obj\n${o}\nendobj\n` })
  const xrefStart = Buffer.byteLength(pdf, 'latin1')
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
  offsets.forEach((off) => { pdf += String(off).padStart(10, '0') + ' 00000 n \n' })
  pdf += `trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`
  return Buffer.from(pdf, 'latin1')
}
async function put(bucket, key, body, contentType) {
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }))
  return key
}

const SAR = (n) => n

async function main() {
  // ---- users ----
  // Admin credentials come from env when provided (set by install.sh), else demo defaults.
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@waseet.com').toLowerCase()
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234'
  const passwordHash = await bcrypt.hash(adminPassword, 10)
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: 'ADMIN', status: 'ACTIVE' },
    create: { email: adminEmail, passwordHash, role: 'ADMIN', status: 'ACTIVE', fullName: 'Super Admin', country: 'SA', city: 'Jeddah', emailVerified: true },
  })
  console.log(`✅ Admin ready: ${admin.email}`)

  const testHash = await bcrypt.hash('Test@1234', 10)
  const realtor = await prisma.user.upsert({
    where: { email: 'realtor@waseet.com' },
    update: {
      status: 'ACTIVE', passwordHash: testHash, mustChangePassword: false,
      fullName: 'Ahmed Al-Rashid', phone: '+966 50 123 4567', country: 'SA', city: 'Jeddah',
      agency: 'Al-Rashid Real Estate', specialization: 'Apartments · Villas · Offices',
      languages: 'Arabic · English · Urdu', experience: '5–10 years',
      licenseType: 'FAL License', licenseNumber: 'FAL-2024-78923', licenseExpiry: 'December 2026',
      idType: 'Iqama', idNumber: '2XXXXXXXX4',
      bankName: 'Al Rajhi Bank', iban: 'SA** **** **** **** 1234', bankCountry: 'Saudi Arabia',
    },
    create: {
      email: 'realtor@waseet.com', passwordHash: testHash, role: 'REALTOR', status: 'ACTIVE', emailVerified: true, mustChangePassword: false,
      fullName: 'Ahmed Al-Rashid', phone: '+966 50 123 4567', country: 'SA', city: 'Jeddah',
      agency: 'Al-Rashid Real Estate', specialization: 'Apartments · Villas · Offices',
      languages: 'Arabic · English · Urdu', experience: '5–10 years',
      licenseType: 'FAL License', licenseNumber: 'FAL-2024-78923', licenseExpiry: 'December 2026',
      idType: 'Iqama', idNumber: '2XXXXXXXX4',
      bankName: 'Al Rajhi Bank', iban: 'SA** **** **** **** 1234', bankCountry: 'Saudi Arabia',
    },
  })
  console.log(`✅ REALTOR ready: ${realtor.email}  (password: Test@1234)`)

  const developer = await prisma.user.upsert({
    where: { email: 'developer@waseet.com' },
    update: { status: 'ACTIVE', passwordHash: testHash, mustChangePassword: false, fullName: 'Al Faisal Development', companyName: 'Al Faisal Development', contactName: 'Faisal Al-Otaibi', website: 'https://alfaisaldev.com', bio: 'Al Faisal Development is a verified real-estate developer on Waseet, delivering premium residential and commercial projects across Saudi Arabia and the Gulf since 2015.', country: 'SA', city: 'Jeddah', phone: '+966 55 000 2222' },
    create: { email: 'developer@waseet.com', passwordHash: testHash, role: 'DEVELOPER', status: 'ACTIVE', emailVerified: true, mustChangePassword: false, fullName: 'Al Faisal Development', companyName: 'Al Faisal Development', contactName: 'Faisal Al-Otaibi', website: 'https://alfaisaldev.com', bio: 'Al Faisal Development is a verified real-estate developer on Waseet, delivering premium residential and commercial projects across Saudi Arabia and the Gulf since 2015.', country: 'SA', city: 'Jeddah', phone: '+966 55 000 2222' },
  })
  console.log(`✅ DEVELOPER ready: ${developer.email}  (password: Test@1234)`)

  // ---- reset demo domain data (idempotent) ----
  await prisma.$transaction([
    prisma.withdrawal.deleteMany({ where: { realtorId: realtor.id } }),
    prisma.commission.deleteMany({ where: { realtorId: realtor.id } }),
    prisma.lead.deleteMany({ where: { realtorId: realtor.id } }),
    prisma.savedProject.deleteMany({ where: { userId: realtor.id } }),
    prisma.notification.deleteMany({ where: { userId: realtor.id } }),
    prisma.document.deleteMany({ where: { userId: realtor.id } }),
    prisma.project.deleteMany({ where: { developerId: developer.id } }),
  ])

  // ---- demo documents (REAL files → private bucket) ----
  const profilePng = makePNG(240, 240, [37, 99, 63])
  const falPdf = makePDF('Waseet — FAL License (DEMO)', ['Realtor: Ahmed Al-Rashid', 'License No: FAL-2024-78923', 'Type: FAL License', 'Valid until: December 2026', 'Issued by: REGA — Real Estate General Authority', '', 'This is a demo document generated for testing.'])
  const iqamaPdf = makePDF('Waseet — National ID / Iqama (DEMO)', ['Name: Ahmed Al-Rashid', 'ID Type: Iqama', 'ID No: 2XXXXXXXX4', 'Nationality: —', '', 'This is a demo document generated for testing.'])
  const docDefs = [
    { type: 'PROFILE_PHOTO', filename: 'profile-photo.png', mime: 'image/png', body: profilePng, key: `documents/${realtor.id}/demo-profile.png` },
    { type: 'FAL_LICENSE', filename: 'fal-license.pdf', mime: 'application/pdf', body: falPdf, key: `documents/${realtor.id}/demo-fal-license.pdf` },
    { type: 'NATIONAL_ID', filename: 'iqama-copy.pdf', mime: 'application/pdf', body: iqamaPdf, key: `documents/${realtor.id}/demo-iqama.pdf` },
  ]
  for (const d of docDefs) {
    await put(buckets.private, d.key, d.body, d.mime)
    await prisma.document.create({
      data: { userId: realtor.id, type: d.type, status: 'VERIFIED', bucket: buckets.private, key: d.key, filename: d.filename, mimeType: d.mime, size: d.body.length },
    })
  }
  console.log(`✅ Uploaded ${docDefs.length} demo documents to RustFS (private bucket)`)

  // ---- ensure EVERY developer has a complete profile + KYC documents ----
  // (covers the seed developer AND any accounts created via test registrations,
  //  so the admin overview is never blank and every developer has previewable docs)
  const allDevelopers = await prisma.user.findMany({ where: { role: 'DEVELOPER' } })
  for (const dev of allDevelopers) {
    const company = dev.companyName || dev.fullName || 'Developer'
    const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'developer'
    // company logo (demo)
    let avatarKey = dev.avatarKey
    if (!avatarKey) {
      avatarKey = `avatars/${dev.id}/logo.png`
      await put(buckets.public, avatarKey, makeGradientPNG(400, 400, [37, 99, 63]), 'image/png')
    }
    await prisma.user.update({
      where: { id: dev.id },
      data: {
        companyName: dev.companyName || company,
        contactName: dev.contactName || 'Authorized Representative',
        website: dev.website || `https://${slug}.com`,
        bio: dev.bio || `${company} is a verified real-estate developer on Waseet, delivering residential and commercial projects across the Gulf region.`,
        phone: dev.phone || '+966 55 000 0000',
        city: dev.city || 'Riyadh',
        country: dev.country || 'SA',
        avatarKey,
      },
    })
    // ensure the full KYC set exists — add only the document types the developer is missing
    const existingTypes = new Set((await prisma.document.findMany({ where: { userId: dev.id }, select: { type: true } })).map((x) => x.type))
    const crPdf = makePDF(`Commercial Registration — ${company} (DEMO)`, ['Company: ' + company, 'CR No: 1010-XXXXXX', 'Legal form: Limited Liability Company', 'Issued by: Riyadh Chamber of Commerce', 'Valid until: December 2027', '', 'This is a demo document generated for testing.'])
    const regaPdf = makePDF(`REGA Developer Certificate — ${company} (DEMO)`, ['Developer: ' + company, 'REGA / WAFI License: WAFI-XXXXXX', 'Status: Active', 'Valid until: December 2027', 'Issued by: Real Estate General Authority', '', 'This is a demo document generated for testing.'])
    const idPng = makePNG(280, 280, [37, 99, 63])
    const devDocs = [
      { type: 'TRADE_LICENSE', filename: 'commercial-registration.pdf', mime: 'application/pdf', body: crPdf, key: `documents/${dev.id}/cr.pdf` },
      { type: 'REGA_CERTIFICATE', filename: 'rega-certificate.pdf', mime: 'application/pdf', body: regaPdf, key: `documents/${dev.id}/rega.pdf` },
      { type: 'NATIONAL_ID', filename: 'authorized-signatory-id.png', mime: 'image/png', body: idPng, key: `documents/${dev.id}/id.png` },
    ]
    for (const d of devDocs) {
      if (existingTypes.has(d.type)) continue
      await put(buckets.private, d.key, d.body, d.mime)
      await prisma.document.create({ data: { userId: dev.id, type: d.type, status: dev.status === 'ACTIVE' ? 'VERIFIED' : 'PENDING', bucket: buckets.private, key: d.key, filename: d.filename, mimeType: d.mime, size: d.body.length } })
    }
  }
  console.log(`✅ Ensured ${allDevelopers.length} developers have full profiles + KYC documents`)

  // ---- projects (owned by the developer) with real cover images (public bucket) ----
  // colour helpers so each project ships several visibly-different gallery images
  const clampC = (v) => Math.max(0, Math.min(255, Math.round(v)))
  const tint = ([r, g, b], f) => [clampC(r * f), clampC(g * f), clampC(b * f)]
  const IMG_FACTORS = [1, 0.78, 1.22, 0.62, 1.4, 0.9] // 6 shades → 6 gallery images

  const projDefs = [
    {
      title: 'Palm Residence', slug: 'palm', city: 'Jeddah', country: 'SA', type: 'Apartment', bedrooms: 'Studio, 1BR, 2BR, 3BR',
      priceFrom: 420000, priceTo: 1400000, commissionPct: 3, color: [34, 139, 87], lat: 21.5433, lng: 39.1728, address: 'Al Rawdhah, Jeddah 23432',
      floors: 12, totalUnits: 96, handover: 'Q4 2027', constructionStatus: 'Under Construction',
      amenities: ['Swimming Pool', 'Gymnasium', '24/7 Security', 'Underground Parking', 'Landscaped Garden', 'High-speed Elevators', 'Kids Play Area', 'Smart Home System', 'Sea View Units'],
      units: [
        { type: 'Studio', count: '8', sizeMin: '45', sizeMax: '55', priceMin: '420000', priceMax: '480000', comm: '3' },
        { type: '1BR', count: '12', sizeMin: '75', sizeMax: '90', priceMin: '600000', priceMax: '700000', comm: '3' },
        { type: '2BR', count: '8', sizeMin: '110', sizeMax: '130', priceMin: '850000', priceMax: '1050000', comm: '3' },
        { type: '3BR', count: '4', sizeMin: '150', sizeMax: '170', priceMin: '1100000', priceMax: '1400000', comm: '2.5' },
      ],
    },
    {
      title: 'Al Noor Tower', slug: 'noor', city: 'Riyadh', country: 'SA', type: 'Apartment', bedrooms: 'Studio, 1BR, 2BR',
      priceFrom: 320000, priceTo: 980000, commissionPct: 3, color: [59, 91, 214], lat: 24.7136, lng: 46.6753, address: 'Olaya, Riyadh 12211',
      floors: 20, totalUnits: 160, handover: 'Q2 2026', constructionStatus: 'Under Construction',
      amenities: ['Gymnasium', '24/7 Security', 'Underground Parking', 'High-speed Elevators', 'Smart Home System', 'Retail Ground Floor', 'Concierge Service'],
      units: [
        { type: 'Studio', count: '20', sizeMin: '40', sizeMax: '50', priceMin: '320000', priceMax: '400000', comm: '3' },
        { type: '1BR', count: '24', sizeMin: '65', sizeMax: '80', priceMin: '480000', priceMax: '620000', comm: '3' },
        { type: '2BR', count: '12', sizeMin: '95', sizeMax: '115', priceMin: '700000', priceMax: '980000', comm: '3' },
      ],
    },
    {
      title: 'Al Faisaliah Residences', slug: 'faisaliah', city: 'Dammam', country: 'SA', type: 'Apartment', bedrooms: 'Studio, 1BR, 2BR, 3BR',
      priceFrom: 500000, priceTo: 1600000, commissionPct: 3.5, color: [201, 122, 74], lat: 26.4207, lng: 50.0888, address: 'Al Faisaliyah, Dammam 32271',
      floors: 15, totalUnits: 120, handover: 'Q3 2026', constructionStatus: 'Under Construction',
      amenities: ['Swimming Pool', 'Gymnasium', '24/7 Security', 'Underground Parking', 'High-speed Elevators', 'Smart Home System', 'Retail Ground Floor'],
      units: [
        { type: 'Studio', count: '16', sizeMin: '40', sizeMax: '52', priceMin: '500000', priceMax: '560000', comm: '3.5' },
        { type: '1BR', count: '20', sizeMin: '70', sizeMax: '88', priceMin: '620000', priceMax: '820000', comm: '3.5' },
        { type: '2BR', count: '14', sizeMin: '105', sizeMax: '125', priceMin: '900000', priceMax: '1200000', comm: '3.5' },
        { type: '3BR', count: '8', sizeMin: '145', sizeMax: '165', priceMin: '1300000', priceMax: '1600000', comm: '3' },
      ],
    },
    {
      title: 'Makkah Gate Towers', slug: 'makkah', city: 'Mecca', country: 'SA', type: 'Apartment', bedrooms: '1BR, 2BR, 3BR',
      priceFrom: 800000, priceTo: 2500000, commissionPct: 2.5, color: [120, 96, 180], lat: 21.3891, lng: 39.8579, address: 'Al Aziziyah, Makkah 24243',
      floors: 28, totalUnits: 240, handover: 'Q4 2026', constructionStatus: 'Under Construction',
      amenities: ['24/7 Security', 'Underground Parking', 'High-speed Elevators', 'Smart Home System', 'Concierge Service', 'Retail Ground Floor'],
      units: [
        { type: '1BR', count: '80', sizeMin: '60', sizeMax: '80', priceMin: '800000', priceMax: '1100000', comm: '2.5' },
        { type: '2BR', count: '60', sizeMin: '100', sizeMax: '130', priceMin: '1300000', priceMax: '1800000', comm: '2.5' },
        { type: '3BR', count: '30', sizeMin: '150', sizeMax: '185', priceMin: '1900000', priceMax: '2500000', comm: '2' },
      ],
    },
    {
      title: 'Taibah Gardens', slug: 'taibah', city: 'Medina', country: 'SA', type: 'Townhouse', bedrooms: '2BR, 3BR, 4BR',
      priceFrom: 700000, priceTo: 1800000, commissionPct: 3, color: [30, 130, 100], lat: 24.5247, lng: 39.5692, address: 'Qurban, Madinah 42311',
      floors: 3, totalUnits: 60, handover: 'Q2 2027', constructionStatus: 'Off-plan',
      amenities: ['Landscaped Garden', '24/7 Security', 'Underground Parking', 'Kids Play Area', 'Smart Home System', 'Gymnasium'],
      units: [
        { type: '2 Bed Townhouse', count: '24', sizeMin: '140', sizeMax: '170', priceMin: '700000', priceMax: '950000', comm: '3' },
        { type: '3 Bed Townhouse', count: '22', sizeMin: '190', sizeMax: '230', priceMin: '1100000', priceMax: '1500000', comm: '3' },
        { type: '4 Bed Townhouse', count: '14', sizeMin: '250', sizeMax: '300', priceMin: '1600000', priceMax: '1800000', comm: '2.5' },
      ],
    },
    {
      title: 'Khobar Corniche Villas', slug: 'khobar', city: 'Khobar', country: 'SA', type: 'Villa', bedrooms: '4BR, 5BR',
      priceFrom: 1500000, priceTo: 4000000, commissionPct: 2, color: [40, 110, 160], lat: 26.2794, lng: 50.2083, address: 'Al Aqrabiyah, Al Khobar 34424',
      floors: 2, totalUnits: 36, handover: 'Q1 2027', constructionStatus: 'Off-plan',
      amenities: ['Swimming Pool', 'Landscaped Garden', '24/7 Security', 'Smart Home System', 'Kids Play Area', 'Sea View Units'],
      units: [
        { type: '4 Bed Villa', count: '20', sizeMin: '350', sizeMax: '430', priceMin: '1500000', priceMax: '2400000', comm: '2' },
        { type: '5 Bed Villa', count: '16', sizeMin: '480', sizeMax: '600', priceMin: '2600000', priceMax: '4000000', comm: '2' },
      ],
    },
  ]

  const projects = []
  for (const p of projDefs) {
    // multiple gallery images (public bucket) — the first one is the cover
    const imageKeys = []
    for (let i = 0; i < IMG_FACTORS.length; i++) {
      const key = `projects/${p.slug}/img-${i + 1}.png`
      await put(buckets.public, key, makeGradientPNG(1200, 750, tint(p.color, IMG_FACTORS[i])), 'image/png')
      imageKeys.push(key)
    }
    // project documents (public bucket): brochure, payment plan, master plan (image), NOC
    const brochurePdf = makePDF(`${p.title} — Project Brochure (DEMO)`, [`Project: ${p.title}`, `Location: ${p.address}`, `Developer: ${developer.companyName}`, `Type: ${p.type}`, `Floors: ${p.floors} · Units: ${p.totalUnits}`, `Handover: ${p.handover}`, '', 'This is a demo brochure generated for testing.'])
    const paymentPdf = makePDF(`${p.title} — Payment Plan (DEMO)`, ['20% Down payment — on signing', '60% During construction — quarterly instalments', '20% On handover', `Handover: ${p.handover}`, '', 'This is a demo payment plan generated for testing.'])
    const nocPdf = makePDF(`${p.title} — NOC Certificate (DEMO)`, [`Project: ${p.title}`, 'No Objection Certificate', 'Issued by: Municipality', 'Status: Approved', '', 'This is a demo document generated for testing.'])
    const masterPng = makeGradientPNG(1400, 900, tint(p.color, 0.5))
    const docKeys = {
      brochure: `projects/${p.slug}/brochure.pdf`,
      payment: `projects/${p.slug}/payment-plan.pdf`,
      master: `projects/${p.slug}/master-plan.png`,
      noc: `projects/${p.slug}/noc.pdf`,
    }
    await put(buckets.public, docKeys.brochure, brochurePdf, 'application/pdf')
    await put(buckets.public, docKeys.payment, paymentPdf, 'application/pdf')
    await put(buckets.public, docKeys.master, masterPng, 'image/png')
    await put(buckets.public, docKeys.noc, nocPdf, 'application/pdf')

    // floor plans — one image per unit type (previewable/downloadable)
    const floorPlans = []
    for (let i = 0; i < p.units.length; i++) {
      const u = p.units[i]
      const buf = makeGradientPNG(1200, 850, tint(p.color, Math.min(1.4, 0.7 + i * 0.15)))
      const key = `projects/${p.slug}/floorplan-${i + 1}.png`
      await put(buckets.public, key, buf, 'image/png')
      floorPlans.push({ label: `${u.type} Floor Plan`, key, filename: `floorplan-${i + 1}.png`, size: buf.length })
    }

    const sizes = p.units.flatMap((u) => [Number(u.sizeMin), Number(u.sizeMax)]).filter(Boolean)
    const details = {
      images: imageKeys,
      masterPlanKey: docKeys.master,
      masterPlanName: 'master-plan.png',
      floorPlans,
      documents: {
        'Project Brochure': { key: docKeys.brochure, filename: 'brochure.pdf', size: brochurePdf.length },
        'Payment Plan': { key: docKeys.payment, filename: 'payment-plan.pdf', size: paymentPdf.length },
        'Master Plan': { key: docKeys.master, filename: 'master-plan.png', size: masterPng.length },
        'NOC Certificate': { key: docKeys.noc, filename: 'noc.pdf', size: nocPdf.length },
      },
      handover: p.handover,
      constructionStatus: p.constructionStatus,
      floors: p.floors,
      totalUnits: p.totalUnits,
      unitSizes: sizes.length ? `${Math.min(...sizes)} – ${Math.max(...sizes)} m²` : null,
      startingPrice: p.priceFrom,
      amenities: p.amenities,
      units: p.units,
      progressPercent: p.constructionStatus === 'Ready' ? 100 : p.constructionStatus === 'Off-plan' ? 15 : 60,
      timeline: [
        { label: 'Planning', date: 'Q1 2024', state: 'done' },
        { label: 'Foundation', date: 'Q4 2024', state: p.constructionStatus === 'Off-plan' ? 'active' : 'done' },
        { label: 'Construction', date: p.constructionStatus === 'Ready' ? 'Complete' : 'In Progress', state: p.constructionStatus === 'Ready' ? 'done' : p.constructionStatus === 'Off-plan' ? 'todo' : 'active' },
        { label: 'Handover', date: p.handover, state: p.constructionStatus === 'Ready' ? 'done' : 'todo' },
      ],
      paymentPlan: [
        { pct: 20, title: 'Down payment', sub: 'On signing' },
        { pct: 60, title: 'During construction', sub: 'Quarterly instalments' },
        { pct: 20, title: 'On handover', sub: p.handover },
      ],
    }

    const created = await prisma.project.create({
      data: {
        developerId: developer.id, developerName: developer.companyName || developer.fullName,
        title: p.title, city: p.city, country: p.country, type: p.type, bedrooms: p.bedrooms,
        priceFrom: p.priceFrom, priceTo: p.priceTo, commissionPct: p.commissionPct, status: 'LIVE',
        imageKey: imageKeys[0], location: p.address, mapLink: `https://www.google.com/maps?q=${p.lat},${p.lng}`,
        latitude: p.lat, longitude: p.lng, address: p.address,
        description: `${p.title} is a premium ${p.type.toLowerCase()} development in ${p.city}, offering ${p.units.map((u) => u.type).join(', ')} across ${p.floors} floors. Built to international standards with high-end finishes, smart-home integration and resort-grade amenities.`,
        details,
      },
    })
    projects.push(created)
  }
  console.log(`✅ Created ${projects.length} demo projects (× ${IMG_FACTORS.length} gallery images + 4 documents each, public bucket)`)

  // ---- saved projects (realtor saved 2) ----
  await prisma.savedProject.createMany({
    data: [
      { userId: realtor.id, projectId: projects[0].id },
      { userId: realtor.id, projectId: projects[2].id },
    ],
    skipDuplicates: true,
  })

  // ---- leads ----
  const leadDefs = [
    { p: projects[0], unit: 'Unit 4B · 2BR', client: 'Khalid Ahmed', phone: '+966 55 221 3344', status: 'NEGOTIATING', notes: 'Interested, negotiating price. Follow up Thursday.' },
    { p: projects[1], unit: 'Unit 2A · 1BR', client: 'Sara Al-Omar', phone: '+966 54 887 1122', status: 'VIEWING', notes: 'Scheduled a viewing this weekend.' },
    { p: projects[2], unit: 'Unit 6B · 2BR', client: 'Bilal Khan', phone: '+966 50 662 9900', status: 'NEW', notes: 'New enquiry from marketplace.' },
    { p: projects[0], unit: 'Unit 7C · 2BR', client: 'Mona Hassan', phone: '+966 53 010 2020', status: 'CONTACTED', notes: 'Called once, awaiting callback.' },
    { p: projects[1], unit: 'Unit 9A · 1BR', client: 'Omar Farooq', phone: '+966 56 445 8899', status: 'CLOSED', notes: 'Deal closed — commission raised.' },
  ]
  for (const l of leadDefs) {
    await prisma.lead.create({
      data: { realtorId: realtor.id, developerId: developer.id, realtorName: realtor.fullName, projectId: l.p.id, projectName: l.p.title, developerName: l.p.developerName, unit: l.unit, clientName: l.client, clientPhone: l.phone, status: l.status, notes: l.notes },
    })
  }
  console.log(`✅ Created ${leadDefs.length} demo leads`)

  // ---- commissions (mix of statuses incl. a FAILED payout) ----
  const mk = (dealRef, project, unit, gross, status, closed, failureReason) => ({
    realtorId: realtor.id, developerId: developer.id, realtorName: realtor.fullName, projectId: project.id, dealRef, projectName: project.title, developerName: project.developerName, unit,
    gross: SAR(gross), platformPct: 15, net: Math.round(gross * 0.85), status,
    closedAt: closed ? new Date(closed) : null, failureReason: failureReason || null,
  })
  const commissionData = [
    // NOTE: no FAILED demo — a failed payout only appears when a developer marks a
    // payment as failed from their portal. This one stays a normal pending payout.
    mk('WS-2026-042', projects[0], 'Unit 4B · 2BR', 27000, 'PENDING', '2026-06-24'),
    mk('WS-2026-041', projects[1], 'Unit 2A · 1BR', 19500, 'PROCESSING', '2026-06-25'),
    mk('WS-2026-040', projects[2], 'Unit 12 · 2BR', 32000, 'PROCESSING', '2026-06-20'),
    mk('WS-2026-039', projects[0], 'Unit 7C · 2BR', 28500, 'PENDING', '2026-06-27'),
    mk('WS-2026-038', projects[1], 'Unit 9A · 1BR', 21000, 'PENDING', '2026-06-26'),
    mk('WS-2026-037', projects[3], 'Villa 3', 60000, 'PENDING', '2026-06-23'),
    mk('WS-2026-030', projects[0], 'Unit 1A · 2BR', 26000, 'PAID', '2026-05-30'),
    mk('WS-2026-028', projects[1], 'Unit 5B · 1BR', 18500, 'PAID', '2026-05-18'),
    mk('WS-2026-025', projects[2], 'Unit 4 · 1BR', 30000, 'PAID', '2026-05-10'),
    mk('WS-2026-022', projects[0], 'Unit 8C · 2BR', 27500, 'PAID', '2026-04-28'),
    mk('WS-2026-019', projects[1], 'Unit 3A · 1BR', 20000, 'PAID', '2026-04-15'),
    mk('WS-2026-014', projects[3], 'Villa 1', 42000, 'PAID', '2026-03-30'),
  ]
  await prisma.commission.createMany({ data: commissionData })
  const paidTotal = commissionData.filter((c) => c.status === 'PAID').reduce((s, c) => s + c.net, 0)
  console.log(`✅ Created ${commissionData.length} demo commissions (total earned: SAR ${paidTotal.toLocaleString()})`)

  // ---- notifications ----
  const notifs = [
    { type: 'commission', title: 'Commission pending', body: 'A commission for deal WS-2026-042 is awaiting developer payment.', link: '/realtor/commissions', read: false },
    { type: 'lead', title: 'Lead status updated', body: 'Khalid Ahmed — Palm Residence is now Negotiating.', link: '/realtor/leads', read: false },
    { type: 'commission', title: 'Commission paid', body: 'SAR 22,100 for deal WS-2026-030 has been paid to your bank.', link: '/realtor/commissions', read: true },
    { type: 'announcement', title: 'New projects added', body: '3 new projects were added to the marketplace this week.', link: '/realtor/browse', read: true },
    { type: 'security', title: 'New login', body: 'A new sign-in to your account was detected.', link: '/realtor/settings', read: true },
  ]
  for (const n of notifs) await prisma.notification.create({ data: { userId: realtor.id, ...n } })
  console.log(`✅ Created ${notifs.length} demo notifications (${notifs.filter((n) => !n.read).length} unread)`)

  // ---- disputes (admin-side) ----
  await prisma.dispute.deleteMany({})
  const disputes = [
    { ref: 'DSP-2026-001', raisedById: realtor.id, raisedByName: realtor.fullName, raisedByRole: 'REALTOR', subject: 'Commission amount mismatch', description: 'The commission paid was lower than agreed for deal WS-2026-030.', amount: 22100, status: 'OPEN' },
    { ref: 'DSP-2026-002', raisedById: developer.id, raisedByName: developer.companyName || developer.fullName, raisedByRole: 'DEVELOPER', subject: 'Duplicate lead submitted', description: 'Two realtors submitted the same client for Palm Residence.', amount: null, status: 'UNDER_REVIEW' },
  ]
  for (const d of disputes) await prisma.dispute.create({ data: d })
  console.log(`✅ Created ${disputes.length} demo disputes`)

  // ---- announcements (admin-side) ----
  await prisma.announcement.deleteMany({})
  const announcements = [
    { title: 'Welcome to Waseet', body: 'The private B2B real-estate marketplace is now live.', audience: 'ALL', sentById: admin.id, recipients: 2 },
    { title: 'New commission policy', body: 'Platform fee is now 15% of developer commission.', audience: 'REALTORS', sentById: admin.id, recipients: 1 },
  ]
  for (const a of announcements) await prisma.announcement.create({ data: a })
  console.log(`✅ Created ${announcements.length} demo announcements`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
