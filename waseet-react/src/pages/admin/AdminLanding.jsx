import React, { useState, useEffect, useRef } from 'react'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { settingsApi, landingApi } from '../../lib/api'

/* ------------------------------------------------------------------ *
 * Schema describing every editable landing section. The renderer below
 * walks this, so adding/removing a field here is all that's needed.
 * field.t: text | textarea | strings | list | button | group | image
 * ------------------------------------------------------------------ */
const btn = 'button'
const SECTIONS = [
  {
    id: 'hero', label: 'Hero', fields: [
      { k: 'badgeText', label: 'Badge text' },
      { k: 'title', label: 'Heading' },
      { k: 'highlight', label: 'Highlighted last word' },
      { k: 'subtitle', t: 'textarea', label: 'Subtitle' },
      { k: 'citiesLine', label: 'Cities line' },
      { k: 'checkLines', t: 'strings', label: 'Trust check-lines' },
      {
        k: 'cards', t: 'list', label: 'Showcase cards', itemFields: [
          { k: 'image', t: 'image', label: 'Card image' },
          { k: 'name', label: 'Project name' },
          { k: 'loc', label: 'Location' },
          { k: 'price', label: 'Price range' },
          { k: 'comm', label: 'Commission label (e.g. 3% Commission)' },
          { k: 'badge', label: 'Badge (NEW or FEATURED)' },
        ],
      },
      { k: 'primaryBtn', t: btn, label: 'Primary button' },
      { k: 'secondaryBtn', t: btn, label: 'Secondary button' },
    ],
  },
  {
    id: 'stats', label: 'Stats bar', fields: [
      { k: 'items', t: 'list', label: 'Stats', itemFields: [{ k: 'value', label: 'Value' }, { k: 'label', label: 'Label' }] },
    ],
  },
  {
    id: 'forWho', label: 'Who is Waseet for', fields: [
      { k: 'eyebrow', label: 'Eyebrow' }, { k: 'heading', label: 'Heading' },
      {
        k: 'developer', t: 'group', label: 'Developer card', fields: [
          { k: 'tag', label: 'Tag' }, { k: 'title', label: 'Title' }, { k: 'body', t: 'textarea', label: 'Body' },
          { k: 'points', t: 'strings', label: 'Bullet points' }, { k: 'cta', label: 'CTA label' }, { k: 'href', label: 'CTA link' },
        ],
      },
      {
        k: 'realtor', t: 'group', label: 'Realtor card', fields: [
          { k: 'tag', label: 'Tag' }, { k: 'title', label: 'Title' }, { k: 'body', t: 'textarea', label: 'Body' },
          { k: 'points', t: 'strings', label: 'Bullet points' }, { k: 'cta', label: 'CTA label' }, { k: 'href', label: 'CTA link' },
        ],
      },
    ],
  },
  {
    id: 'liveProjects', label: 'Live / Featured projects', note: 'The cards here are pulled automatically from your real Featured projects (Marketplace → feature a project, max 6). Edit only the surrounding copy.', fields: [
      { k: 'eyebrow', label: 'Eyebrow' }, { k: 'heading', label: 'Heading' },
      { k: 'browseLabel', label: 'Browse link label' }, { k: 'browseHref', label: 'Browse link URL' },
    ],
  },
  {
    id: 'howItWorksSticky', label: 'How Waseet works (scroll stepper)', fields: [
      { k: 'eyebrow', label: 'Eyebrow' },
      { k: 'steps', t: 'list', label: 'Steps', itemFields: [{ k: 'n', label: 'No.' }, { k: 'rail', label: 'Rail label' }, { k: 'title', label: 'Title' }, { k: 'body', t: 'textarea', label: 'Body' }] },
    ],
  },
  {
    id: 'darkBand', label: 'Dark band', fields: [
      { k: 'badge', label: 'Badge' }, { k: 'heading', label: 'Heading' }, { k: 'body', t: 'textarea', label: 'Body' },
      { k: 'primaryBtn', t: btn, label: 'Primary button' }, { k: 'secondaryBtn', t: btn, label: 'Secondary button' },
      {
        k: 'cards', t: 'list', label: 'Showcase cards', itemFields: [
          { k: 'image', t: 'image', label: 'Card image' },
          { k: 'name', label: 'Project name' }, { k: 'loc', label: 'Location' }, { k: 'price', label: 'Price range' },
          { k: 'comm', label: 'Commission label (e.g. 3% Commission)' }, { k: 'badge', label: 'Badge (NEW or FEATURED)' },
        ],
      },
    ],
  },
  {
    id: 'howItWorks3', label: 'How it works (3 steps)', fields: [
      { k: 'eyebrow', label: 'Eyebrow' }, { k: 'heading', label: 'Heading' },
      { k: 'steps', t: 'list', label: 'Steps', itemFields: [{ k: 'title', label: 'Title' }, { k: 'body', t: 'textarea', label: 'Body' }] },
      { k: 'ctaText', label: 'CTA prompt' }, { k: 'primaryBtn', t: btn, label: 'Primary button' }, { k: 'secondaryBtn', t: btn, label: 'Secondary button' },
    ],
  },
  {
    id: 'saudiMarket', label: 'Saudi market', fields: [
      { k: 'badge', label: 'Badge' }, { k: 'heading', label: 'Heading' }, { k: 'body', t: 'textarea', label: 'Body' },
      { k: 'stats', t: 'list', label: 'Stats', itemFields: [{ k: 'value', label: 'Value' }, { k: 'label', label: 'Label' }] },
      { k: 'primaryBtn', t: btn, label: 'Primary button' }, { k: 'secondaryBtn', t: btn, label: 'Secondary button' },
    ],
  },
  {
    id: 'whyWaseet', label: 'Why Waseet', fields: [
      { k: 'eyebrow', label: 'Eyebrow' }, { k: 'heading', label: 'Heading' },
      { k: 'cards', t: 'list', label: 'Cards', itemFields: [{ k: 'title', label: 'Title' }, { k: 'body', t: 'textarea', label: 'Body' }] },
    ],
  },
  {
    id: 'browseType', label: 'Browse by property type', fields: [
      { k: 'heading', label: 'Heading' },
      { k: 'types', t: 'list', label: 'Types', itemFields: [{ k: 'name', label: 'Name' }, { k: 'count', label: 'Count text' }] },
    ],
  },
  {
    id: 'badges', label: 'Realtor badges', fields: [
      { k: 'eyebrow', label: 'Eyebrow' }, { k: 'heading', label: 'Heading' }, { k: 'body', t: 'textarea', label: 'Body' }, { k: 'cta', label: 'CTA label' }, { k: 'href', label: 'CTA link' },
      { k: 'items', t: 'list', label: 'Tiers', itemFields: [{ k: 'icon', label: 'Icon (emoji)' }, { k: 'name', label: 'Name' }, { k: 'req', label: 'Requirement' }, { k: 'perk', label: 'Perk' }] },
    ],
  },
  {
    id: 'reviews', label: 'Reviews', fields: [
      { k: 'heading', label: 'Heading' },
      { k: 'items', t: 'list', label: 'Reviews', itemFields: [{ k: 'quote', t: 'textarea', label: 'Quote' }, { k: 'name', label: 'Name' }, { k: 'role', label: 'Role' }, { k: 'initials', label: 'Initials' }] },
    ],
  },
  {
    id: 'trust', label: 'Trust', fields: [
      { k: 'eyebrow', label: 'Eyebrow' }, { k: 'heading', label: 'Heading' },
      { k: 'cards', t: 'list', label: 'Cards', itemFields: [{ k: 'title', label: 'Title' }, { k: 'body', t: 'textarea', label: 'Body' }] },
    ],
  },
  {
    id: 'faq', label: 'FAQ', fields: [
      { k: 'heading', label: 'Heading' },
      { k: 'items', t: 'list', label: 'Questions', itemFields: [{ k: 'q', label: 'Question' }, { k: 'a', t: 'textarea', label: 'Answer' }] },
    ],
  },
  {
    id: 'finalCta', label: 'Final CTA', fields: [
      { k: 'heading', label: 'Heading' }, { k: 'subtitle', t: 'textarea', label: 'Subtitle' },
      { k: 'primaryBtn', t: btn, label: 'Primary button' }, { k: 'secondaryBtn', t: btn, label: 'Secondary button' }, { k: 'footnote', label: 'Footnote' },
    ],
  },
]

// Header (navbar) + Footer field schemas — edited under the "Header & Footer" tab.
const NAVBAR_FIELDS = [
  { k: 'logoText', label: 'Logo text' },
  { k: 'logoSub', label: 'Logo subtitle (Arabic)' },
  { k: 'logoImage', t: 'image', label: 'Logo image (optional — replaces the text logo)' },
  { k: 'links', t: 'list', label: 'Nav links', itemFields: [{ k: 'label', label: 'Label' }, { k: 'href', label: 'Link' }] },
  { k: 'loginLabel', label: 'Login link label (blank to hide)' },
  { k: 'primaryBtn', t: 'button', label: 'Primary button' },
  { k: 'secondaryBtn', t: 'button', label: 'Secondary button' },
]
const FOOTER_FIELDS = [
  { k: 'logoText', label: 'Logo text' },
  { k: 'logoSub', label: 'Logo subtitle (Arabic)' },
  { k: 'logoImage', t: 'image', label: 'Logo image (optional)' },
  { k: 'tagline', t: 'textarea', label: 'Tagline' },
  { k: 'socials', t: 'list', label: 'Social links', itemFields: [{ k: 'type', label: 'Type (facebook, linkedin, x, instagram, youtube, website)' }, { k: 'href', label: 'URL' }] },
  {
    k: 'columns', t: 'list', label: 'Link columns', itemFields: [
      { k: 'title', label: 'Column title' },
      { k: 'links', t: 'list', label: 'Links', itemFields: [{ k: 'label', label: 'Label' }, { k: 'href', label: 'Link' }] },
    ],
  },
  { k: 'copyrightLeft', label: 'Copyright — left' },
  { k: 'copyrightRight', label: 'Copyright — right' },
]
// Marketplace "Browse by city" cards — edited under the "Marketplace" tab.
const MARKETPLACE_FIELDS = [
  {
    k: 'cities', t: 'list', label: 'Browse-by-city cards', itemFields: [
      { k: 'image', t: 'image', label: 'City image' },
      { k: 'name', label: 'City name (also used as the filter when clicked)' },
    ],
  },
]

/* ---------- immutable path helpers ---------- */
function setPath(obj, path, value) {
  if (path.length === 0) return value
  const [head, ...rest] = path
  const clone = Array.isArray(obj) ? obj.slice() : { ...(obj || {}) }
  clone[head] = setPath(obj ? obj[head] : undefined, rest, value)
  return clone
}
const getPath = (obj, path) => path.reduce((o, k) => (o == null ? o : o[k]), obj)

/* ---------- shared styles ---------- */
const label = { fontSize: 11, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, display: 'block' }
const inputStyle = { width: '100%', height: 36, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 11px', fontSize: 13, fontFamily: 'inherit', color: colors.ink, background: '#fff', boxSizing: 'border-box' }
const areaStyle = { ...inputStyle, height: 'auto', minHeight: 64, padding: '9px 11px', lineHeight: 1.5, resize: 'vertical' }
const monoStyle = { ...areaStyle, minHeight: 150, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12.5 }
const addBtn = { border: `1.5px dashed ${colors.borderStrong}`, borderRadius: 8, padding: '7px 12px', textAlign: 'center', cursor: 'pointer', fontSize: 12, color: colors.textMuted, background: '#fff' }
const removeBtn = { fontSize: 11.5, color: colors.red, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 500 }
const chip = (active) => ({ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1px solid ${active ? colors.green : colors.border}`, background: active ? colors.greenTint : '#fff', color: active ? colors.greenDark : colors.textMuted })

function Toggle({ on, onClick }) {
  return (
    <span onClick={onClick} style={{ position: 'relative', width: 36, height: 20, borderRadius: 999, display: 'inline-block', cursor: 'pointer', background: on ? colors.green : colors.border, transition: 'background 0.15s', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 2, ...(on ? { right: 2 } : { left: 2 }), width: 16, height: 16, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </span>
  )
}

/* ---------- image / asset picker ---------- */
function AssetPicker({ url, onFile, uploading, onRemove, square }) {
  const ref = useRef(null)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: square ? 48 : 96, height: 48, borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
        {url ? <img src={url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 10, color: colors.textFaint }}>none</span>}
      </div>
      <input ref={ref} type="file" accept="image/*,.ico,.avif" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} />
      <button onClick={() => ref.current?.click()} disabled={uploading} style={{ ...chip(false), opacity: uploading ? 0.6 : 1 }}>{uploading ? 'Uploading…' : url ? 'Replace' : 'Upload'}</button>
      {url && <span onClick={onRemove} style={removeBtn}>× Remove</span>}
    </div>
  )
}

export default function AdminLanding() {
  const [cfg, setCfg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('sections')
  const [openSection, setOpenSection] = useState('hero')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const [toast, setToast] = useState(null)
  const toastTimer = useRef()

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }

  useEffect(() => {
    let alive = true
    landingApi.get()
      .then((c) => { if (alive) { setCfg(c); setLoading(false) } })
      .catch((e) => { if (alive) { setLoading(false); showToast(`Load failed: ${e.message}`, 'error') } })
    return () => { alive = false; clearTimeout(toastTimer.current) }
  }, [])

  const edit = (path, value) => { setCfg((prev) => setPath(prev, path, value)); setDirty(true) }

  const uploadImage = async (path, file, tag) => {
    setUploading(tag)
    try {
      const { key, url } = await settingsApi.uploadLandingAsset(file)
      // merge inside the updater so alt text typed during the upload isn't clobbered
      setCfg((prev) => setPath(prev, path, { ...(getPath(prev, path) || {}), key, url }))
      setDirty(true)
    } catch (e) { showToast(`Upload failed: ${e.message}`, 'error') }
    finally { setUploading('') }
  }
  const uploadSeo = async (kind, file) => { // kind: favicon | appleIcon | ogImage
    setUploading(kind)
    try {
      const { key, url } = await settingsApi.uploadLandingAsset(file)
      setCfg((prev) => ({ ...prev, seo: { ...prev.seo, [`${kind}Key`]: key, [`${kind}Url`]: url } }))
      setDirty(true)
    } catch (e) { showToast(`Upload failed: ${e.message}`, 'error') }
    finally { setUploading('') }
  }

  const save = async () => {
    if (!cfg) return
    setSaving(true)
    try {
      // strip resolved-only fields so we persist just the source of truth
      const out = JSON.parse(JSON.stringify(cfg))
      if (out.seo) { delete out.seo.faviconUrl; delete out.seo.appleIconUrl; delete out.seo.ogImageUrl }
      if (out.sections?.hero) delete out.sections.hero.image // strip legacy single-banner field
      if (Array.isArray(out.sections?.hero?.cards)) out.sections.hero.cards.forEach((c) => { if (c.image) delete c.image.url })
      if (Array.isArray(out.sections?.darkBand?.cards)) out.sections.darkBand.cards.forEach((c) => { if (c.image) delete c.image.url })
      if (out.sections?.liveProjects) delete out.sections.liveProjects.items
      if (out.navbar?.logoImage) delete out.navbar.logoImage.url
      if (out.footer?.logoImage) delete out.footer.logoImage.url
      if (Array.isArray(out.marketplace?.cities)) out.marketplace.cities.forEach((c) => { if (c.image) delete c.image.url })
      await settingsApi.saveLanding(out)
      setDirty(false)
      showToast('Landing page saved — changes are live')
    } catch (e) { showToast(`Save failed: ${e.message}`, 'error') }
    finally { setSaving(false) }
  }

  if (loading || !cfg) {
    return (
      <div>
        <Topbar title="Landing Page" />
        <div style={{ padding: 40, color: colors.textFaint, fontSize: 13 }}>Loading…</div>
      </div>
    )
  }

  /* ---------- generic field renderer ---------- */
  const renderField = (basePath, field) => {
    const path = [...basePath, field.k]
    const val = getPath(cfg, path)
    const t = field.t || 'text'
    if (t === 'text') return (
      <div key={field.k}><label style={label}>{field.label}</label>
        <input style={inputStyle} value={val ?? ''} onChange={(e) => edit(path, e.target.value)} /></div>
    )
    if (t === 'textarea') return (
      <div key={field.k}><label style={label}>{field.label}</label>
        <textarea style={areaStyle} value={val ?? ''} onChange={(e) => edit(path, e.target.value)} /></div>
    )
    if (t === 'strings') return (
      <div key={field.k}><label style={label}>{field.label}</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(val || []).map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input style={inputStyle} value={s} onChange={(e) => edit([...path, i], e.target.value)} />
              <span style={removeBtn} onClick={() => edit(path, val.filter((_, j) => j !== i))}>×</span>
            </div>
          ))}
        </div>
        <div style={{ ...addBtn, marginTop: 6 }} onClick={() => edit(path, [...(val || []), ''])}>+ Add</div>
      </div>
    )
    if (t === 'image') {
      const img = val || {}
      const tag = path.join('.')
      return (
        <div key={field.k}><label style={label}>{field.label}</label>
          <AssetPicker url={img.url} uploading={uploading === tag} onFile={(f) => uploadImage(path, f, tag)} onRemove={() => edit(path, { key: '', alt: img.alt || '', url: null })} />
          <input style={{ ...inputStyle, marginTop: 8 }} placeholder="Alt text (for SEO / accessibility)" value={img.alt || ''} onChange={(e) => edit([...path, 'alt'], e.target.value)} />
        </div>
      )
    }
    if (t === btn) {
      const b = val || {}
      return (
        <div key={field.k} style={{ border: `1px solid ${colors.border}`, borderRadius: 9, padding: 12, background: colors.surfaceAlt }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted }}>{field.label}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: colors.textFaint }}>{b.visible === false ? 'Hidden' : 'Shown'} <Toggle on={b.visible !== false} onClick={() => edit([...path, 'visible'], b.visible === false)} /></span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><label style={label}>Label</label><input style={inputStyle} value={b.label ?? ''} onChange={(e) => edit([...path, 'label'], e.target.value)} /></div>
            <div><label style={label}>Link</label><input style={inputStyle} value={b.href ?? ''} onChange={(e) => edit([...path, 'href'], e.target.value)} /></div>
          </div>
        </div>
      )
    }
    if (t === 'group') return (
      <div key={field.k} style={{ border: `1px solid ${colors.border}`, borderRadius: 9, padding: 14, background: colors.surfaceAlt }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.textMuted, marginBottom: 10 }}>{field.label}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{field.fields.map((f) => renderField(path, f))}</div>
      </div>
    )
    if (t === 'list') {
      const arr = val || []
      const blank = Object.fromEntries(field.itemFields.map((f) => [f.k, '']))
      return (
        <div key={field.k}><label style={label}>{field.label}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {arr.map((_, i) => (
              <div key={i} style={{ border: `1px solid ${colors.border}`, borderRadius: 9, padding: 12, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: colors.textFaint }}>#{i + 1}</span>
                  <span style={removeBtn} onClick={() => edit(path, arr.filter((_, j) => j !== i))}>× Remove</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {field.itemFields.map((f) => renderField([...path, i], f))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ ...addBtn, marginTop: 8 }} onClick={() => edit(path, [...arr, { ...blank }])}>+ Add {field.label?.toLowerCase() || 'item'}</div>
        </div>
      )
    }
    return null
  }

  const seo = cfg.seo || {}
  const custom = cfg.custom || {}
  const Counter = ({ v, max }) => <span style={{ fontSize: 11, color: (v || '').length > max ? colors.amber : colors.textFaint, marginLeft: 8 }}>{(v || '').length}/{max}</span>

  return (
    <>
      <Topbar
        title="Landing Page"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href="/" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: colors.textSoft, textDecoration: 'none' }}>Open landing ↗</a>
            <button onClick={save} disabled={!dirty || saving} style={{ height: 36, padding: '0 18px', borderRadius: 8, border: 'none', background: dirty ? colors.green : colors.border, color: dirty ? '#fff' : colors.textFaint, fontSize: 13, fontWeight: 600, cursor: dirty && !saving ? 'pointer' : 'default', fontFamily: 'inherit' }}>
              {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
            </button>
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '20px 22px' }}>
        <div style={{ maxWidth: 900 }}>
        {/* tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[['sections', 'Sections'], ['header', 'Header & Footer'], ['marketplace', 'Marketplace'], ['seo', 'SEO & Social'], ['custom', 'Custom Code']].map(([id, lbl]) => (
            <div key={id} style={chip(tab === id)} onClick={() => setTab(id)}>{lbl}</div>
          ))}
        </div>

        {/* ------------- SECTIONS ------------- */}
        {tab === 'sections' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SECTIONS.map((sec) => {
              const sc = cfg.sections?.[sec.id] || {}
              const open = openSection === sec.id
              return (
                <div key={sec.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }} onClick={() => setOpenSection(open ? '' : sec.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}><path d="M9 18l6-6-6-6" /></svg>
                      <span style={{ fontSize: 14, fontWeight: 600, color: sc.visible === false ? colors.textFaint : colors.ink }}>{sec.label}</span>
                      {sc.visible === false && <span style={{ fontSize: 10, fontWeight: 600, color: colors.amberText, background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, borderRadius: 999, padding: '2px 8px' }}>HIDDEN</span>}
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                      <span style={{ fontSize: 11, color: colors.textFaint }}>Show</span>
                      <Toggle on={sc.visible !== false} onClick={() => edit(['sections', sec.id, 'visible'], sc.visible === false)} />
                    </span>
                  </div>
                  {open && (
                    <div style={{ padding: '4px 16px 18px', borderTop: `1px solid ${colors.surfaceMuted}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {sec.note && <div style={{ fontSize: 12, color: colors.textSoft, background: colors.blueTint, border: `1px solid ${colors.blueTintBorder}`, borderRadius: 8, padding: '9px 11px', marginTop: 12 }}>{sec.note}</div>}
                      {sec.fields.map((f) => renderField(['sections', sec.id], f))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ------------- HEADER & FOOTER ------------- */}
        {tab === 'header' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, background: '#fff', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Navbar (header)</div>
              <div style={{ fontSize: 12, color: colors.textSoft, background: colors.blueTint, border: `1px solid ${colors.blueTintBorder}`, borderRadius: 8, padding: '9px 11px' }}>Nav links + buttons show to logged-out visitors. When a user is logged in the navbar switches to their portal links automatically.</div>
              {NAVBAR_FIELDS.map((f) => renderField(['navbar'], f))}
            </div>
            <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, background: '#fff', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Footer</div>
              {FOOTER_FIELDS.map((f) => renderField(['footer'], f))}
            </div>
          </div>
        )}

        {/* ------------- MARKETPLACE ------------- */}
        {tab === 'marketplace' && (
          <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, background: '#fff', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Marketplace — “Browse by city”</div>
            <div style={{ fontSize: 12, color: colors.textSoft, background: colors.blueTint, border: `1px solid ${colors.blueTintBorder}`, borderRadius: 8, padding: '9px 11px' }}>These cards show in the marketplace “Browse by city” row. Edit each city’s name + image; the project count is live from real data. The name is also the filter applied when a card is clicked (keep it matching your project cities).</div>
            {MARKETPLACE_FIELDS.map((f) => renderField(['marketplace'], f))}
          </div>
        )}

        {/* ------------- SEO & SOCIAL ------------- */}
        {tab === 'seo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, background: '#fff', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Search engine</div>
              <div><label style={label}>Page title <Counter v={seo.title} max={60} /></label><input style={inputStyle} value={seo.title || ''} onChange={(e) => edit(['seo', 'title'], e.target.value)} /></div>
              <div><label style={label}>Meta description <Counter v={seo.description} max={160} /></label><textarea style={areaStyle} value={seo.description || ''} onChange={(e) => edit(['seo', 'description'], e.target.value)} /></div>
              <div><label style={label}>Keywords (comma separated)</label><input style={inputStyle} value={seo.keywords || ''} onChange={(e) => edit(['seo', 'keywords'], e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 12 }}>
                <div><label style={label}>Canonical URL (optional)</label><input style={inputStyle} placeholder="https://waseet.sarimtools.com/" value={seo.canonicalUrl || ''} onChange={(e) => edit(['seo', 'canonicalUrl'], e.target.value)} /></div>
                <div><label style={label}>Theme color</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={seo.themeColor || '#16A34A'} onChange={(e) => edit(['seo', 'themeColor'], e.target.value)} style={{ width: 40, height: 36, border: `1px solid ${colors.border}`, borderRadius: 7, background: '#fff', cursor: 'pointer' }} />
                    <input style={inputStyle} value={seo.themeColor || ''} onChange={(e) => edit(['seo', 'themeColor'], e.target.value)} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div><div style={{ fontSize: 13, fontWeight: 500 }}>Structured data (JSON-LD)</div><div style={{ fontSize: 12, color: colors.textFaint }}>Adds Organization schema for rich results.</div></div>
                <Toggle on={seo.structuredData !== false} onClick={() => edit(['seo', 'structuredData'], seo.structuredData === false)} />
              </div>
            </div>

            <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, background: '#fff', padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Icons & social banner</div>
              <div><label style={label}>Favicon (browser tab icon — PNG/ICO)</label><AssetPicker square url={seo.faviconUrl} uploading={uploading === 'favicon'} onFile={(f) => uploadSeo('favicon', f)} onRemove={() => setCfg((p) => ({ ...p, seo: { ...p.seo, faviconKey: '', faviconUrl: null } })) || setDirty(true)} /></div>
              <div><label style={label}>App icon (Apple touch icon — 180×180 PNG)</label><AssetPicker square url={seo.appleIconUrl} uploading={uploading === 'appleIcon'} onFile={(f) => uploadSeo('appleIcon', f)} onRemove={() => setCfg((p) => ({ ...p, seo: { ...p.seo, appleIconKey: '', appleIconUrl: null } })) || setDirty(true)} /></div>
              <div><label style={label}>Social / link-preview banner (1200×630 PNG/JPG)</label><AssetPicker url={seo.ogImageUrl} uploading={uploading === 'ogImage'} onFile={(f) => uploadSeo('ogImage', f)} onRemove={() => setCfg((p) => ({ ...p, seo: { ...p.seo, ogImageKey: '', ogImageUrl: null } })) || setDirty(true)} /></div>
              <div><label style={label}>Social title</label><input style={inputStyle} value={seo.ogTitle || ''} onChange={(e) => edit(['seo', 'ogTitle'], e.target.value)} /></div>
              <div><label style={label}>Social description</label><textarea style={areaStyle} value={seo.ogDescription || ''} onChange={(e) => edit(['seo', 'ogDescription'], e.target.value)} /></div>
              {/* live link-preview card */}
              <div>
                <label style={label}>How your link will look when shared</label>
                <div style={{ border: `1px solid ${colors.border}`, borderRadius: 10, overflow: 'hidden', maxWidth: 460 }}>
                  <div style={{ height: 200, background: colors.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {seo.ogImageUrl ? <img src={seo.ogImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 12, color: colors.textFaint }}>banner preview</span>}
                  </div>
                  <div style={{ padding: '10px 14px', background: '#fff' }}>
                    <div style={{ fontSize: 11, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>waseet.sarimtools.com</div>
                    <div style={{ fontSize: 14, fontWeight: 600, margin: '3px 0', color: colors.ink }}>{seo.ogTitle || seo.title || 'Waseet'}</div>
                    <div style={{ fontSize: 12, color: colors.textSoft, lineHeight: 1.5 }}>{seo.ogDescription || seo.description || ''}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------- CUSTOM CODE ------------- */}
        {tab === 'custom' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 12, color: colors.amberText, background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, borderRadius: 8, padding: '10px 12px' }}>
              ⚠️ This code is injected into the live landing page exactly as written. Admin-only. A mistake here can break the page — test after saving.
            </div>
            {[['css', 'Custom CSS', '.my-widget { color: #16A34A }'], ['headHtml', 'Custom HTML — <head> (meta, verification tags, fonts)', '<meta name="google-site-verification" content="…">'], ['bodyHtml', 'Custom HTML — end of page (widgets, chat, embeds)', '<div id="my-widget"></div>'], ['js', 'Custom JavaScript', "console.log('hi from Waseet')"]].map(([k, lbl, ph]) => (
              <div key={k}><label style={label}>{lbl}</label>
                <textarea style={monoStyle} spellCheck={false} placeholder={ph} value={custom[k] || ''} onChange={(e) => edit(['custom', k], e.target.value)} /></div>
            ))}
          </div>
        )}
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100, background: toast.type === 'error' ? colors.red : colors.ink, color: '#fff', padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', maxWidth: 340 }}>{toast.msg}</div>
      )}
    </>
  )
}
