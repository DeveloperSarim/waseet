import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { realtorApi } from '../../lib/api'
import { joinedLabel, countryName } from '../../lib/adminFormat'
import { useAuth } from '../../context/AuthContext'

const hatch = 'repeating-linear-gradient(45deg, #ECECEE 0, #ECECEE 1px, transparent 1px, transparent 8px)'

const money = (n) => (n == null ? '—' : `SAR ${Number(n).toLocaleString()}`)

// Minimal, dependency-free PDF generator (single page, Helvetica). Returns a
// Uint8Array suitable for a Blob download. ASCII content only.
function makePDF(title, lines) {
  const esc = (s) => String(s).replace(/([\\()])/g, '\\$1')
  let stream = `BT\n/F1 20 Tf\n60 780 Td\n(${esc(title)}) Tj\n/F1 12 Tf\n`
  let first = true
  for (const l of lines) { stream += `0 ${first ? -40 : -20} Td\n(${esc(l)}) Tj\n`; first = false }
  stream += 'ET'
  const objs = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>',
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
    `<</Length ${stream.length}>>\nstream\n${stream}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = []
  objs.forEach((o, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n` })
  const xref = pdf.length
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
  offsets.forEach((off) => { pdf += String(off).padStart(10, '0') + ' 00000 n \n' })
  pdf += `trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`
  const bytes = new Uint8Array(pdf.length)
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff
  return bytes
}

const card = { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12 }
const sectionLabel = { fontSize: 9, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em' }
const rLabel = { fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em' }

function renderIcon(name, color, size) {
  const sz = size || 16
  const common = { width: sz, height: sz, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (name === 'clock')
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    )
  if (name === 'check')
    return (
      <svg {...common}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    )
  if (name === 'alert')
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    )
  if (name === 'refresh')
    return (
      <svg {...common} style={{ animation: 'wsk-spin 1.4s linear infinite' }}>
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    )
  if (name === 'checkmini')
    return (
      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )
  return null
}

function buildBanner(st, c) {
  const base = { padding: '10px 22px', display: 'flex', gap: 10, alignItems: 'center' }
  if (st === 'pending')
    return {
      style: { ...base, borderBottom: '1px solid #FDE68A', background: '#FFFBEB' },
      icon: renderIcon('clock', '#D97706'),
      text: 'Waiting for developer to pay commission',
      sub: '',
      textColor: '#92400E',
      subColor: '#D97706',
    }
  if (st === 'processing')
    return {
      style: { ...base, borderBottom: '1px solid #BFDBFE', background: '#EEF3FF' },
      icon: renderIcon('refresh', '#1B4FD8'),
      text: 'Commission payment received — processing',
      sub: '',
      textColor: '#1B4FD8',
      subColor: '#1B4FD8',
    }
  if (st === 'failed')
    return {
      style: { ...base, borderBottom: `1px solid ${colors.redTintBorder}`, background: colors.redTint },
      icon: renderIcon('alert', colors.red),
      text: 'Commission payment could not be processed',
      sub: c.failureReason || '',
      textColor: '#991B1B',
      subColor: colors.red,
    }
  return {
    style: { ...base, borderBottom: '1px solid #BBF7D0', background: '#F0FDF4' },
    icon: renderIcon('check', '#16A34A'),
    text: 'Commission paid to your bank account',
    sub: '',
    textColor: '#15803D',
    subColor: '#15803D',
  }
}

function buildStatusBox(st, c) {
  const base = { borderRadius: 8, padding: 12, textAlign: 'center' }
  if (st === 'pending')
    return {
      style: { ...base, border: '1px solid #F3E2B8', background: '#FEF9EC' },
      icon: renderIcon('clock', '#D97706'),
      big: 'Awaiting payment',
      bigSize: 13,
      bigColor: '#92400E',
      sub: 'Pending developer payment',
      subColor: '#9CA3AF',
      third: null,
    }
  if (st === 'processing')
    return {
      style: { ...base, border: '1px solid #BFDBFE', background: '#EEF3FF' },
      icon: renderIcon('refresh', '#1B4FD8'),
      big: 'Processing',
      bigSize: 13,
      bigColor: '#1B4FD8',
      sub: 'Payment being verified',
      subColor: '#9CA3AF',
      third: null,
    }
  if (st === 'failed')
    return {
      style: { ...base, border: `1px solid ${colors.redTintBorder}`, background: colors.redTint },
      icon: renderIcon('alert', colors.red, 20),
      big: 'Payment Failed',
      bigSize: 14,
      bigColor: '#991B1B',
      sub: c.failureReason || 'Transfer could not be completed',
      subColor: colors.red,
      third: null,
    }
  return {
    style: { ...base, border: '1px solid #BBF7D0', background: '#F0FDF4' },
    icon: renderIcon('check', '#16A34A', 20),
    big: money(c.net),
    bigSize: 18,
    bigColor: '#0A0A0A',
    sub: 'Paid',
    subColor: '#15803D',
    third: null,
  }
}

function buildTimeline(st, c) {
  const closed = joinedLabel(c.closedAt)
  const step0 = { label: 'Deal closed', sub: 'Lead marked closed by developer', date: closed }
  const stepDev = { label: 'Developer paid Waseet', sub: `${money(c.gross)} received`, date: '—' }
  let defs
  if (st === 'pending') {
    defs = [
      { ...step0, kind: 'done' },
      { label: 'Awaiting developer payment', sub: 'Developer has 7 days from deal close', date: '—', kind: 'current', amber: true },
      { label: 'Disbursement initiated', sub: 'Funds transferred', date: '—', kind: 'upcoming' },
      { label: 'In your bank account', sub: '—', date: '—', kind: 'upcoming' },
    ]
  } else if (st === 'processing') {
    defs = [
      { ...step0, kind: 'done' },
      { ...stepDev, kind: 'done' },
      { label: 'Payment processing', sub: 'Waseet verifying payment', date: '—', kind: 'current', amber: true },
      { label: 'Disbursement initiated', sub: 'Funds transferred', date: '—', kind: 'upcoming' },
      { label: 'In your bank account', sub: '—', date: '—', kind: 'upcoming' },
    ]
  } else if (st === 'failed') {
    defs = [
      { ...step0, kind: 'done' },
      { ...stepDev, kind: 'done' },
      { label: 'Payment processed', sub: 'Waseet verified payment', date: '—', kind: 'done' },
      { label: 'Disbursement failed', sub: c.failureReason || 'Bank transfer could not be completed', date: '—', kind: 'failed' },
    ]
  } else {
    defs = [
      { ...step0, kind: 'done' },
      { ...stepDev, kind: 'done' },
      { label: 'Payment processed', sub: 'Waseet verified payment', date: '—', kind: 'done' },
      { label: 'Disbursement initiated', sub: 'Funds transferred to bank', date: '—', kind: 'done' },
      { label: 'Received in your account', sub: '—', date: money(c.net), kind: 'done' },
    ]
  }
  return defs.map((t, i) => {
    let circleStyle = { width: 20, height: 20, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
    let circleInner = null
    let labelColor = '#9CA3AF'
    let labelWeight = 500
    let dateColor = '#9CA3AF'
    if (t.kind === 'done') {
      circleStyle = { ...circleStyle, background: '#16A34A', border: '1px solid #16A34A' }
      circleInner = renderIcon('checkmini')
      labelColor = '#0A0A0A'
      dateColor = '#16A34A'
    } else if (t.kind === 'failed') {
      circleStyle = { ...circleStyle, background: colors.red, border: `1px solid ${colors.red}` }
      circleInner = <span style={{ width: 6, height: 6, borderRadius: 999, background: '#fff' }} />
      labelColor = '#991B1B'
      labelWeight = 600
      dateColor = colors.red
    } else if (t.kind === 'current') {
      const cc = t.amber ? '#D97706' : '#0A0A0A'
      circleStyle = { ...circleStyle, background: cc, border: `1px solid ${cc}` }
      circleInner = <span style={{ width: 6, height: 6, borderRadius: 999, background: '#fff' }} />
      labelColor = '#0A0A0A'
      labelWeight = 600
      dateColor = t.amber ? '#D97706' : '#0A0A0A'
    } else {
      circleStyle = { ...circleStyle, background: '#fff', border: '1.5px solid #E5E7EB' }
    }
    return {
      label: t.label,
      sub: t.sub,
      date: t.date,
      circleStyle,
      circleInner,
      labelStyle: { fontSize: 13, fontWeight: labelWeight, color: labelColor },
      dateColor,
      showLine: i < defs.length - 1,
      lineColor: t.kind === 'done' ? '#16A34A' : '#E5E7EB',
    }
  })
}

const statusTabDefs = [
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'paid', label: 'Paid' },
]

export default function CommissionDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth() || {}
  const [commission, setCommission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [status, setStatus] = useState('pending')
  const [dispute, setDispute] = useState(false)
  const [download, setDownload] = useState('idle') // idle | loading | done
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const dt = useRef(null)
  const tt = useRef(null)

  useEffect(() => () => { clearTimeout(dt.current); clearTimeout(tt.current) }, [])

  useEffect(() => {
    let active = true
    setLoading(true); setNotFound(false); setLoadError('')
    realtorApi.getCommission(id)
      .then((c) => {
        if (!active) return
        setCommission(c)
        setStatus((c.status || 'PENDING').toLowerCase())
      })
      .catch((e) => {
        if (!active) return
        if (e.status === 404) setNotFound(true)
        else setLoadError(e.message || 'Could not load commission')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  const doDownload = () => {
    if (download === 'loading' || !commission) return
    setDownload('loading')
    clearTimeout(dt.current)
    dt.current = setTimeout(() => {
      try {
        const c = commission
        const fee = Number(c.gross) - Number(c.net)
        const lines = [
          `Statement #: ${c.dealRef}`,
          `Realtor: ${user?.fullName || '-'}`,
          user?.agency ? `Agency: ${user.agency}` : `License: ${user?.licenseNumber || '-'}`,
          user?.email ? `Email: ${user.email}` : '',
          `Developer: ${c.developerName || '-'}`,
          `Project: ${c.projectName || '-'}${c.unit ? ' - ' + c.unit : ''}`,
          `Deal closed: ${joinedLabel(c.closedAt)}`,
          `Status: ${c.status}`,
          '',
          `Gross commission: SAR ${Number(c.gross).toLocaleString()}`,
          `Waseet platform fee (${c.platformPct}%): - SAR ${fee.toLocaleString()}`,
          `Net to you: SAR ${Number(c.net).toLocaleString()}`,
          '',
          'Waseet - private B2B real estate marketplace',
        ].filter(Boolean)
        const blob = new Blob([makePDF('Waseet - Commission Statement', lines)], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `commission_${c.dealRef}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      } catch { /* ignore */ }
      setDownload('done')
      setToastMsg(`commission_${commission.dealRef}.pdf downloaded`)
      setShowToast(true)
      clearTimeout(tt.current)
      tt.current = setTimeout(() => { setDownload('idle'); setShowToast(false) }, 3000)
    }, 500)
  }

  const tabStyle = (on) => ({
    fontSize: 11,
    fontWeight: 500,
    padding: '5px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    border: `1px solid ${on ? '#16A34A' : colors.border}`,
    background: on ? '#16A34A' : '#fff',
    color: on ? '#fff' : colors.textFaint,
  })

  // ---- loading / not-found / error guards ----
  if (loading || notFound || loadError || !commission) {
    return (
      <>
        <style>{`@keyframes wsk-spin { to { transform: rotate(360deg); } }`}</style>
        <Topbar
          left={
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span onClick={() => navigate('/realtor/commissions')} style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer' }}>Commissions</span>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.borderStrong} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              <span style={{ fontSize: 13, color: colors.ink, fontWeight: 500 }}>Commission</span>
            </div>
          }
        />
        <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '80px 20px', fontSize: 13, color: colors.textFaint }}>Loading commission…</div>
          )}
          {!loading && notFound && (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: colors.textMuted }}>Commission not found</div>
              <div style={{ fontSize: 13, color: colors.textFaint, marginTop: 6 }}>This commission may have been removed or the link is incorrect.</div>
              <div onClick={() => navigate('/realtor/commissions')} style={{ fontSize: 13, color: colors.greenDark, marginTop: 12, cursor: 'pointer' }}>← Back to commissions</div>
            </div>
          )}
          {!loading && loadError && (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: colors.textMuted }}>Could not load commission</div>
              <div style={{ fontSize: 13, color: colors.textFaint, marginTop: 6 }}>{loadError}</div>
              <div onClick={() => navigate('/realtor/commissions')} style={{ fontSize: 13, color: colors.greenDark, marginTop: 12, cursor: 'pointer' }}>← Back to commissions</div>
            </div>
          )}
        </div>
      </>
    )
  }

  const c = commission
  const fee = (c.gross != null && c.net != null) ? c.gross - c.net : null
  const banner = buildBanner(status, c)
  const statusBox = buildStatusBox(status, c)
  const timeline = buildTimeline(status, c)

  const dealDetails = [
    { label: 'Project', value: c.projectName || '—' },
    { label: 'Unit', value: c.unit || '—' },
    { label: 'Client', value: '—' },
    { label: 'Client phone', value: '—' },
    { label: 'Sale price', value: '—' },
    { label: 'Deal closed', value: joinedLabel(c.closedAt) },
    { label: 'Lead submitted', value: '—' },
  ]

  let downloadBtnStyle = { height: 34, padding: '0 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }
  let downloadContent
  if (download === 'done') {
    downloadBtnStyle = { ...downloadBtnStyle, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D' }
    downloadContent = 'Downloaded ✓'
  } else if (download === 'loading') {
    downloadBtnStyle = { ...downloadBtnStyle, background: '#fff', border: `1px solid ${colors.border}`, color: colors.textFaint }
    downloadContent = (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 12, height: 12, border: `2px solid ${colors.border}`, borderTopColor: colors.textFaint, borderRadius: 999, display: 'inline-block', animation: 'wsk-spin 0.7s linear infinite' }} />
        Generating...
      </span>
    )
  } else {
    downloadBtnStyle = { ...downloadBtnStyle, background: '#fff', border: `1px solid ${colors.border}`, color: colors.textMuted }
    downloadContent = '↓ Download PDF'
  }

  return (
    <>
      <style>{`@keyframes wsk-spin { to { transform: rotate(360deg); } } @keyframes wsk-toast { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

      <Topbar
        left={
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span onClick={() => navigate('/realtor/commissions')} style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer' }}>Commissions</span>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.borderStrong} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            <span style={{ fontSize: 13, color: colors.ink, fontWeight: 500 }}>Deal #{c.dealRef}</span>
          </div>
        }
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={doDownload} style={{ ...downloadBtnStyle }}><span>{downloadContent}</span></button>
            <button onClick={() => navigate('/realtor/commissions')} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, fontWeight: 500, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>Back
            </button>
          </div>
        }
      />

      {/* status banner */}
      <div style={banner.style}>
        <span style={{ display: 'flex' }}>{banner.icon}</span>
        <span style={{ fontSize: 13, color: banner.textColor }}>{banner.text}</span>
        {banner.sub && <span style={{ fontSize: 12, color: banner.subColor, marginLeft: 'auto' }}>{banner.sub}</span>}
      </div>

      {/* content */}
      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* LEFT COLUMN */}
          <div style={{ flex: 2, minWidth: 0 }}>

            {/* STATEMENT CARD */}
            <div style={{ ...card, padding: '18px 20px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${colors.surfaceMuted}` }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    <span style={{ fontSize: 18, fontWeight: 700, color: colors.ink }}>waseet</span>
                    <span style={{ fontSize: 12, color: colors.textFaint }}>وسيط</span>
                  </div>
                  <span style={{ fontSize: 12, color: colors.textFaint, display: 'block', marginTop: 4 }}>Commission Statement</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: colors.ink, marginBottom: 3 }}>Statement #{c.dealRef}</div>
                  <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 2 }}>Deal closed: {joinedLabel(c.closedAt)}</div>
                  <div style={{ fontSize: 11, color: colors.textFaint }}>Generated: {joinedLabel(c.createdAt)}</div>
                </div>
              </div>

              {/* parties */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <div style={{ flex: 1, background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ ...sectionLabel, marginBottom: 8 }}>Your Details</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink, marginBottom: 2 }}>{user?.fullName || '—'}</div>
                  <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 2 }}>{user?.agency || (user?.licenseNumber ? `License ${user.licenseNumber}` : '—')}</div>
                  <div style={{ fontSize: 11, color: colors.textFaint }}>{user?.email || '—'}</div>
                </div>
                <div style={{ flex: 1, background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ ...sectionLabel, marginBottom: 8 }}>Developer</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink, marginBottom: 2 }}>{c.developerName || '—'}</div>
                  <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 2 }}>{c.projectName || '—'}</div>
                  <div style={{ fontSize: 11, color: colors.textFaint }}>{c.unit || '—'}</div>
                </div>
              </div>

              {/* deal details */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ ...sectionLabel, marginBottom: 12 }}>Deal Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px' }}>
                  {dealDetails.map((d) => (
                    <div key={d.label}>
                      <div style={{ fontSize: 10, color: colors.textFaint, marginBottom: 2 }}>{d.label}</div>
                      <div style={{ fontSize: 13, color: colors.textMuted }}>{d.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* breakdown table */}
              <div>
                <div style={{ ...sectionLabel, marginBottom: 12 }}>Commission Breakdown</div>
                <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}`, padding: '8px 14px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }}>Description</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase' }}>Amount</span>
                  </div>
                  <div style={{ padding: '10px 14px', borderBottom: `1px solid ${colors.surfaceMuted}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: colors.textMuted }}>Sale Price{c.unit ? ` (${c.unit})` : ''}</span>
                    <span style={{ fontSize: 13, color: colors.textMuted }}>—</span>
                  </div>
                  <div style={{ padding: '10px 14px', borderBottom: `1px solid ${colors.surfaceMuted}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: colors.textMuted }}>Developer Commission Rate</span>
                    <span style={{ fontSize: 13, color: colors.textMuted }}>—</span>
                  </div>
                  <div style={{ padding: '10px 14px', borderBottom: `1px solid ${colors.surfaceMuted}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: colors.textMuted }}>Gross Commission</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.ink }}>{money(c.gross)}</span>
                  </div>
                  <div style={{ padding: '10px 14px', borderBottom: `1px solid ${colors.surfaceMuted}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: colors.textMuted }}>Waseet Platform Fee <span style={{ fontSize: 11, color: colors.textFaint, marginLeft: 4 }}>{c.platformPct}% of {money(c.gross)}</span></span>
                    <span style={{ fontSize: 12, color: colors.textFaint }}>− {money(fee)}</span>
                  </div>
                  <div style={{ background: colors.bg, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: colors.ink }}>Your commission (net)</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: colors.ink, letterSpacing: '-0.02em' }}>{money(c.net)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'flex-start' }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                  <span style={{ fontSize: 11, color: colors.textFaint, lineHeight: 1.5 }}>Platform fee is deducted before disbursement. You receive {money(c.net)}.</span>
                </div>
              </div>
            </div>

            {/* TIMELINE CARD */}
            <div style={{ ...card, padding: '16px 18px', marginBottom: 12 }}>
              <div style={{ ...sectionLabel, marginBottom: 16 }}>Payment Timeline</div>
              <div>
                {timeline.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
                      <div style={t.circleStyle}><span style={{ display: 'flex' }}>{t.circleInner}</span></div>
                      {t.showLine && <div style={{ width: 1.5, height: 34, margin: '3px 0', background: t.lineColor }} />}
                    </div>
                    <div style={{ paddingBottom: 20, flex: 1 }}>
                      <div style={t.labelStyle}>{t.label}</div>
                      <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{t.sub}</div>
                      <div style={{ fontSize: 11, marginTop: 2, color: t.dateColor }}>{t.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BANK CARD */}
            <div style={{ ...card, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={sectionLabel}>Payment Destination</span>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><title>Bank details are encrypted</title><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M9 14v3M15 14v3" /></svg>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink, marginBottom: 2 }}>—</div>
                  <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 2 }}>—</div>
                  <div style={{ fontSize: 12, color: colors.textFaint }}>IBAN: —</div>
                </div>
              </div>
              <div onClick={() => navigate('/realtor/settings')} style={{ fontSize: 12, color: colors.greenDark, marginTop: 10, cursor: 'pointer', display: 'inline-block' }}>Update bank details →</div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div style={{ flex: 1, minWidth: 0, position: 'sticky', top: 0 }}>

            {/* AMOUNT CARD */}
            <div style={{ ...card, padding: 16, marginBottom: 12 }}>
              <div style={{ ...rLabel, marginBottom: 12 }}>Your Commission</div>
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: colors.ink, letterSpacing: '-0.03em' }}>{money(c.net)}</div>
                <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 4 }}>(net after platform fee)</div>
              </div>
              <div style={{ background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 11, color: colors.textFaint }}>Sale price:</span><span style={{ fontSize: 12, color: colors.textMuted }}>—</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 11, color: colors.textFaint }}>Gross:</span><span style={{ fontSize: 12, color: colors.textMuted }}>{money(c.gross)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 11, color: colors.textFaint }}>Fee ({c.platformPct}%):</span><span style={{ fontSize: 12, color: colors.textMuted }}>− {money(fee)}</span></div>
                <div style={{ height: 1, background: colors.border, margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 12, fontWeight: 600, color: colors.ink }}>Net to you:</span><span style={{ fontSize: 13, fontWeight: 700, color: colors.ink }}>{money(c.net)}</span></div>
              </div>
              {/* payment status box */}
              <div style={statusBox.style}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 5 }}>{statusBox.icon}</div>
                <div style={{ fontSize: statusBox.bigSize, fontWeight: 700, color: statusBox.bigColor }}>{statusBox.big}</div>
                <div style={{ fontSize: 12, color: statusBox.subColor, marginTop: 3 }}>{statusBox.sub}</div>
                {statusBox.third && <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{statusBox.third}</div>}
              </div>
            </div>

            {/* PROJECT QUICK VIEW */}
            <div style={{ ...card, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ ...rLabel, marginBottom: 12 }}>Project</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 56, height: 42, borderRadius: 7, backgroundColor: colors.surfaceMuted, backgroundImage: hatch, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink, marginBottom: 2 }}>{c.projectName || '—'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    <span style={{ fontSize: 11, color: colors.textFaint }}>—</span>
                  </div>
                  <div style={{ fontSize: 11, color: colors.textMuted }}>{c.unit || '—'}</div>
                </div>
              </div>
              <div onClick={() => navigate('/realtor/browse')} style={{ fontSize: 12, color: colors.greenDark, marginTop: 10, cursor: 'pointer', display: 'inline-block' }}>View project →</div>
            </div>

            {/* LEAD QUICK VIEW */}
            <div style={{ ...card, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ ...rLabel, marginBottom: 12 }}>Lead</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: 999, background: colors.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>—</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink, marginBottom: 2 }}>—</div>
                  <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>—</div>
                  <div style={{ fontSize: 11, color: colors.textFaint }}>—</div>
                </div>
              </div>
              <div style={{ marginTop: 10 }}><span style={{ fontSize: 11, fontWeight: 600, color: colors.greenDark, background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 999, padding: '3px 10px' }}>Closed ✓</span></div>
              <div onClick={() => navigate('/realtor/leads')} style={{ fontSize: 12, color: colors.greenDark, marginTop: 8, cursor: 'pointer', display: 'inline-block' }}>View lead details →</div>
            </div>

            {/* DISPUTE CARD */}
            <div style={{ ...card, padding: '14px 16px' }}>
              <div style={{ ...rLabel, marginBottom: 10 }}>Dispute</div>
              {!dispute ? (
                <div>
                  <div style={{ fontSize: 12, color: colors.textSoft, lineHeight: 1.6, marginBottom: 12 }}>If there's an issue with this commission, you can raise a dispute.</div>
                  <button onClick={() => setDispute(true)} style={{ width: '100%', height: 34, background: '#fff', border: `1px solid ${colors.redTintBorder}`, borderRadius: 7, fontSize: 12, fontWeight: 500, color: colors.red, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>Raise Dispute
                  </button>
                </div>
              ) : (
                <div style={{ background: colors.redTint, border: `1px solid ${colors.redTintBorder}`, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 13l-7.5 7.5a2.12 2.12 0 0 1-3-3L11 10M9 7l4-4 7 7-4 4M14 4l6 6" /></svg>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#991B1B' }}>Dispute raised</div>
                  <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>Under review</div>
                  <div onClick={() => navigate('/realtor/commissions')} style={{ fontSize: 12, color: colors.red, marginTop: 8, cursor: 'pointer' }}>View Dispute →</div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* toast */}
      {showToast && (
        <div style={{ position: 'fixed', bottom: 22, right: 22, background: colors.ink, color: '#fff', borderRadius: 10, padding: '12px 16px', fontSize: 13, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', animation: 'wsk-toast 300ms ease-out', zIndex: 80 }}>{toastMsg}</div>
      )}
    </>
  )
}
