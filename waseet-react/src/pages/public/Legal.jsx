import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { colors } from '../../theme/tokens'

/* ---------- shared building blocks ---------- */
function SecHead({ children, first }) {
  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 700, color: colors.ink, letterSpacing: '-0.01em', marginTop: first ? 0 : 28, marginBottom: 12 }}>{children}</div>
      <div style={{ height: 2, width: 32, background: colors.green, marginBottom: 16 }} />
    </>
  )
}
function Para({ children, style }) {
  return <p style={{ fontSize: 14, color: colors.textMuted, lineHeight: 1.8, margin: '0 0 14px', ...style }}>{children}</p>
}
function SubHead({ children, first }) {
  return <div style={{ fontSize: 14, fontWeight: 600, color: colors.ink, marginTop: first ? 0 : 18, marginBottom: 8 }}>{children}</div>
}
function Bullets({ items }) {
  return (
    <ul style={{ margin: '0 0 14px', padding: 0, listStyle: 'none' }}>
      {items.map((t, i) => (
        <li key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 14, color: colors.textMuted, lineHeight: 1.6 }}>
          <span style={{ color: colors.green, fontWeight: 700 }}>•</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}
function Callout({ variant = 'green', children }) {
  const v =
    variant === 'amber'
      ? { bg: colors.amberTint, bd: colors.amberTintBorder, color: colors.amberText }
      : { bg: colors.greenTint, bd: colors.greenTintBorder, color: colors.textMuted }
  return (
    <div style={{ background: v.bg, border: `1px solid ${v.bd}`, borderRadius: 8, padding: '12px 14px', marginBottom: 14, fontSize: 13, color: v.color, lineHeight: 1.6 }}>{children}</div>
  )
}
function Section({ id, children }) {
  return (
    <div id={id} data-sec={id.replace('sec-', '')}>{children}</div>
  )
}
function ContactCard({ label, email }) {
  return (
    <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '14px 16px' }}>
      <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></svg>
        <span style={{ fontSize: 13, color: colors.greenDark }}>{email}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
        <span style={{ fontSize: 13, color: colors.greenDark }}>support@waseet.io</span>
      </div>
    </div>
  )
}

/* ---------- privacy content ---------- */
function PrivacyDoc() {
  return (
    <div>
      <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: colors.ink, letterSpacing: '-0.02em', marginBottom: 6 }}>Privacy Policy</div>
        <div style={{ fontSize: 12, color: colors.textFaint }}>Last updated: June 1, 2026</div>
        <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 2 }}>Effective: January 1, 2026</div>
        <div style={{ background: colors.greenTint, border: `1px solid ${colors.greenTintBorder}`, borderRadius: 8, padding: '12px 14px', marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: colors.greenDark, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Plain language summary</div>
          <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.6 }}>Waseet collects your professional information to provide B2B real estate services. We never sell your data. You can request deletion anytime.</div>
        </div>
      </div>

      <Section id="sec-1"><SecHead first>1. Introduction</SecHead><Para>Waseet ("we", "us", "our") operates a private B2B real estate marketplace connecting property developers with licensed realtors in Saudi Arabia, UAE, and Pakistan. This Privacy Policy explains how we collect, use, and protect your data.</Para></Section>

      <Section id="sec-2"><SecHead>2. Data we collect</SecHead>
        <SubHead first>2.1 Account information</SubHead>
        <Para>Name, email address, phone number, company name, professional license details.</Para>
        <SubHead>2.2 Professional documents</SubHead>
        <Para>Trade licenses, real estate licenses, and national ID documents provided during registration and verification.</Para>
        <SubHead>2.3 Transaction data</SubHead>
        <Para>Lead submissions, deal records, commission payments, and related financial data.</Para>
        <SubHead>2.4 Usage data</SubHead>
        <Para>Pages viewed, projects browsed, login timestamps, and IP addresses.</Para>
        <Callout>We never collect payment card numbers. Commission payments use bank transfer (IBAN) only.</Callout>
      </Section>

      <Section id="sec-3"><SecHead>3. How we use your data</SecHead>
        <Bullets items={['To verify your professional credentials', 'To match realtors with developer projects', 'To process and track commission payments', 'To send platform notifications and updates', 'To maintain audit logs for compliance', 'To improve the Waseet platform']} />
      </Section>

      <Section id="sec-4"><SecHead>4. Data sharing</SecHead>
        <Para style={{ color: colors.ink, fontWeight: 700 }}>We do NOT sell your personal data.</Para>
        <Para style={{ margin: '0 0 10px' }}>We share data only in these cases:</Para>
        <Bullets items={['Developers see realtor names and lead details', 'Realtors see developer project information', 'Admins access all data for platform management', 'Legal compliance when required by law']} />
      </Section>

      <Section id="sec-5"><SecHead>5. Data retention</SecHead><Para>Financial records are retained for 7 years per Saudi ZATCA requirements. Account data is deleted within 30 days of account deletion request. Audit logs retained for 7 years.</Para></Section>

      <Section id="sec-6"><SecHead>6. Your rights (PDPL)</SecHead>
        <Callout>Waseet complies with Saudi Arabia's Personal Data Protection Law (PDPL).</Callout>
        <Bullets items={['Right to access your data', 'Right to correct inaccurate data', 'Right to delete your data (with exceptions)', 'Right to data portability', 'Right to object to processing']} />
        <Para>To exercise your rights, contact us at <span style={{ color: colors.greenDark }}>privacy@waseet.io</span></Para>
      </Section>

      <Section id="sec-7"><SecHead>7. Cookies</SecHead><Para>We use essential cookies only — for login sessions and security. No advertising cookies or third-party trackers.</Para></Section>

      <Section id="sec-8"><SecHead>8. Security</SecHead><Para>All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Bank details are encrypted and only decrypted during commission disbursement.</Para></Section>

      <Section id="sec-9"><SecHead>9. Children</SecHead><Para>Waseet is a professional B2B platform. We do not knowingly collect data from anyone under 18 years of age.</Para></Section>

      <Section id="sec-10"><SecHead>10. Changes to this policy</SecHead><Para>We will notify all users by email when this policy changes significantly. Last updated: June 1, 2026.</Para></Section>

      <Section id="sec-11"><SecHead>11. Contact us</SecHead><ContactCard label="Privacy questions:" email="privacy@waseet.io" /></Section>
    </div>
  )
}

/* ---------- terms content ---------- */
function TermsDoc() {
  const cell = (text, color) => <div style={{ padding: '10px 14px', fontSize: 13, color: color || colors.textMuted }}>{text}</div>
  const grid = { display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.3fr' }
  return (
    <div>
      <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: colors.ink, letterSpacing: '-0.02em', marginBottom: 6 }}>Terms of Service</div>
        <div style={{ fontSize: 12, color: colors.textFaint }}>Last updated: June 1, 2026</div>
        <div style={{ background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, borderRadius: 8, padding: '12px 14px', marginTop: 14 }}>
          <div style={{ fontSize: 13, color: colors.amberText, lineHeight: 1.6 }}>By using Waseet, you agree to these terms. Key points: Platform fee applies to all deals. Commission rates are set by developers. Disputes are resolved by Waseet admin.</div>
        </div>
      </div>

      <Section id="sec-1"><SecHead first>1. Acceptance</SecHead><Para>By creating an account or using Waseet, you agree to these Terms of Service. If you do not agree, do not use the platform.</Para></Section>

      <Section id="sec-2"><SecHead>2. Platform description</SecHead><Para>Waseet is a private B2B marketplace connecting verified property developers with licensed real estate agents. Waseet facilitates lead submissions and commission tracking but is not a party to any real estate transaction.</Para></Section>

      <Section id="sec-3"><SecHead>3. Registration & eligibility</SecHead>
        <Bullets items={['Must be 18+ years old', 'Must hold valid professional licenses', 'Must provide accurate information', 'One account per person/entity', "Account approval at Waseet's discretion"]} />
      </Section>

      <Section id="sec-4"><SecHead>4. Developer obligations</SecHead>
        <Bullets items={['Commission rates must be accurate and honored', 'Payment due within 7 days of deal close', 'Day 14: first overdue notice', 'Day 30: account may be suspended']} />
        <Callout variant="amber">Failure to pay commission within 30 days may result in account suspension and dispute resolution.</Callout>
      </Section>

      <Section id="sec-5"><SecHead>5. Realtor obligations</SecHead>
        <Bullets items={['Submit only genuine client leads', 'One active lead per client per project', 'Client information must be accurate', 'Cannot submit leads for own purchases']} />
      </Section>

      <Section id="sec-6"><SecHead>6. Commission structure</SecHead>
        <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ ...grid, background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
            <div style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: colors.textMuted }}>Item</div>
            <div style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: colors.textMuted }}>Rate</div>
            <div style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: colors.textMuted }}>Notes</div>
          </div>
          <div style={{ ...grid, borderBottom: `1px solid ${colors.surfaceMuted}` }}>{cell('Developer commission')}{cell('Set by developer')}{cell('Per unit type', colors.textSoft)}</div>
          <div style={{ ...grid, borderBottom: `1px solid ${colors.surfaceMuted}` }}>{cell('Waseet platform fee')}{cell('10–20%')}{cell('Of gross commission', colors.textSoft)}</div>
          <div style={grid}>{cell('Realtor receives')}{cell('80–90%')}{cell('Of gross commission', colors.textSoft)}</div>
        </div>
        <Para>Commission rates are locked at time of lead submission and cannot be changed retroactively.</Para>
      </Section>

      <Section id="sec-7"><SecHead>7. Disputes</SecHead><Para>Disputes must be submitted within 30 days of deal close. Admin decision is final.</Para></Section>

      <Section id="sec-8"><SecHead>8. Prohibited conduct</SecHead>
        <Bullets items={['Submitting false leads', 'Misrepresenting professional credentials', 'Circumventing platform for direct payments', 'Sharing account credentials', 'Scraping platform data']} />
      </Section>

      <Section id="sec-9"><SecHead>9. Intellectual property</SecHead><Para>All platform content, design, and code is owned by Waseet. User-submitted content (project photos, descriptions) remains property of the submitter.</Para></Section>

      <Section id="sec-10"><SecHead>10. Limitation of liability</SecHead><Para>Waseet is not liable for real estate transaction outcomes, developer defaults, or third-party payment delays.</Para></Section>

      <Section id="sec-11"><SecHead>11. Termination</SecHead><Para>Accounts violating these terms may be suspended or terminated without notice. Financial records are retained per legal requirements after termination.</Para></Section>

      <Section id="sec-12"><SecHead>12. Governing law</SecHead><Para>These terms are governed by the laws of Saudi Arabia. Disputes shall be subject to Saudi jurisdiction.</Para></Section>

      <Section id="sec-13"><SecHead>13. Contact</SecHead><ContactCard label="Legal inquiries:" email="legal@waseet.io" /></Section>
    </div>
  )
}

const privacyToc = [
  ['sec-1', '1. Introduction'], ['sec-2', '2. Data we collect'],
  ['sec-3', '3. How we use your data'], ['sec-4', '4. Data sharing'],
  ['sec-5', '5. Data retention'], ['sec-6', '6. Your rights (PDPL)'],
  ['sec-7', '7. Cookies'], ['sec-8', '8. Security'],
  ['sec-9', '9. Children'], ['sec-10', '10. Changes to policy'],
  ['sec-11', '11. Contact us'],
]
const termsToc = [
  ['sec-1', '1. Acceptance'], ['sec-2', '2. Platform description'],
  ['sec-3', '3. Registration & eligibility'], ['sec-4', '4. Developer obligations'],
  ['sec-5', '5. Realtor obligations'], ['sec-6', '6. Commission structure'],
  ['sec-7', '7. Disputes'], ['sec-8', '8. Prohibited conduct'],
  ['sec-9', '9. Intellectual property'], ['sec-10', '10. Limitation of liability'],
  ['sec-11', '11. Termination'], ['sec-12', '12. Governing law'],
  ['sec-13', '13. Contact'],
]

export default function Legal() {
  const { doc } = useParams()
  const page = doc === 'terms' ? 'terms' : 'privacy'
  const [activeId, setActiveId] = useState('sec-1')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setActiveId('sec-1')
    window.scrollTo({ top: 0 })
    const els = [...document.querySelectorAll('[data-sec]')]
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (vis[0]) setActiveId(vis[0].target.id)
      },
      { rootMargin: '-80px 0px -65% 0px', threshold: 0 }
    )
    els.forEach((el) => io.observe(el))
    const onScroll = () => {
      const se = document.scrollingElement || document.documentElement
      const max = se.scrollHeight - se.clientHeight
      setProgress(max > 0 ? Math.min(100, (se.scrollTop / max) * 100) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [page])

  const goTo = (id) => {
    const el = document.getElementById(id)
    if (!el) return
    const se = document.scrollingElement || document.documentElement
    const y = el.getBoundingClientRect().top + se.scrollTop - 76
    window.scrollTo({ top: y, behavior: 'smooth' })
  }

  const toc = page === 'privacy' ? privacyToc : termsToc

  return (
    <div style={{ background: colors.bg }}>
      {/* scroll progress */}
      <div style={{ position: 'fixed', top: 56, left: 0, right: 0, height: 2, background: 'transparent', zIndex: 60 }}>
        <div style={{ height: '100%', background: colors.green, width: `${progress}%`, transition: 'width 120ms linear' }} />
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 32, display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        {/* TOC */}
        <div className="wa-hide-sm" style={{ width: 220, flexShrink: 0, position: 'sticky', top: 88, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 10 }}>Contents</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {toc.map(([id, label]) => {
              const active = activeId === id
              return (
                <div
                  key={id}
                  onClick={() => goTo(id)}
                  style={{
                    padding: active ? '6px 8px 6px 10px' : '6px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    cursor: 'pointer',
                    transition: 'all 150ms',
                    lineHeight: 1.4,
                    background: active ? colors.greenTint : 'transparent',
                    color: active ? colors.greenDark : colors.textSoft,
                    borderLeft: active ? `2px solid ${colors.green}` : '2px solid transparent',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {label}
                </div>
              )
            })}
          </div>
        </div>

        {/* content */}
        <div style={{ flex: 1, minWidth: 0, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '28px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
            <span onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: colors.textFaint, cursor: 'pointer' }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
              Print
            </span>
          </div>
          {page === 'privacy' ? <PrivacyDoc /> : <TermsDoc />}
        </div>
      </div>
    </div>
  )
}
