import React, { useEffect } from 'react'
import { colors } from '../theme/tokens'

// In-page document preview. Renders the private document inline (iframe for PDF,
// <img> for images) inside a modal overlay — the file opens ON this page as a
// popup instead of navigating to the raw signed S3 URL in a new tab. The signed
// URL is short-lived (5 min) and stays embedded, never shown in the address bar.
export function DocPreviewModal({ doc, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!doc) return null
  const isPdf = doc.mimeType === 'application/pdf' || /\.pdf($|\?)/i.test(doc.url || '')

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, width: '100%', maxWidth: 860, height: '86vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}
      >
        {/* Header */}
        <div style={{ borderBottom: `1px solid ${colors.border}`, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.7}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title || doc.filename}</div>
            <div style={{ fontSize: 11, color: colors.textFaint }}>{doc.filename}</div>
          </div>
          <a href={doc.url} target="_blank" rel="noreferrer" download style={{ fontSize: 12, color: colors.textMuted, border: `1px solid ${colors.border}`, background: '#fff', borderRadius: 6, padding: '5px 10px', textDecoration: 'none' }}>Download ↓</a>
          <span onClick={onClose} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: colors.textFaint, cursor: 'pointer', borderRadius: 6 }}>×</span>
        </div>
        {/* Body */}
        <div style={{ flex: 1, background: colors.surfaceMuted, minHeight: 0 }}>
          {isPdf ? (
            <iframe title={doc.filename} src={doc.url} style={{ width: '100%', height: '100%', border: 'none' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: 16 }}>
              <img src={doc.url} alt={doc.filename} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 6 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
