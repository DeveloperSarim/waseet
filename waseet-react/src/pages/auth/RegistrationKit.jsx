import React, { useRef } from 'react'
import { colors, radius } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'

export const inputStyle = {
  width: '100%',
  height: 34,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  padding: '0 10px',
  fontSize: 13,
  fontFamily: 'inherit',
  color: colors.ink,
  background: '#fff',
}

export function Label({ children, icon }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
      {children}
      {icon && <Icon name={icon} size={13} color={colors.textFaint} strokeWidth={1.8} />}
    </div>
  )
}

export function Hint({ children }) {
  return <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 4 }}>{children}</div>
}

export function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...props.style }} />
}

export function SelectInput({ children, ...props }) {
  return (
    <select {...props} style={{ ...inputStyle, color: colors.textMuted, ...props.style }}>
      {children}
    </select>
  )
}

export function Section({ num, title, children, style }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: radius.xl, padding: '16px 20px', marginBottom: 12, ...style }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
        {num} · {title}
      </div>
      {children}
    </div>
  )
}

export function CheckBox({ on, size = 16, radiusPx = 4, marginTop = 0 }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: radiusPx,
        marginTop,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: on ? colors.green : '#fff',
        border: `1.5px solid ${on ? colors.green : colors.borderStrong}`,
      }}
    >
      {on && (
        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}>
          <path d="M5 12l4 4L19 7" />
        </svg>
      )}
    </span>
  )
}

export function Pill({ label, on, onClick }) {
  return (
    <span
      onClick={onClick}
      style={{
        borderRadius: 999,
        padding: '5px 12px',
        fontSize: 12,
        cursor: 'pointer',
        background: on ? colors.greenTint : '#fff',
        border: `1px solid ${on ? colors.green : colors.border}`,
        color: on ? colors.greenDark : colors.textMuted,
      }}
    >
      {label}
    </span>
  )
}

/** Horizontal step indicator (Personal → Professional → …). activeIndex = current. */
export function StepIndicator({ labels, activeIndex = 0 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 28 }}>
      {labels.map((label, i) => {
        const done = i < activeIndex
        const isActive = i === activeIndex
        const nodeStyle = done
          ? { background: colors.green, color: '#fff', border: 'none' }
          : isActive
          ? { background: colors.ink, color: '#fff', border: 'none' }
          : { background: '#fff', border: `1px solid ${colors.border}`, color: colors.textFaint }
        return (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <div style={{ height: 1, flex: 1, background: i === 0 ? 'transparent' : i <= activeIndex ? colors.green : colors.border }} />
              <div style={{ width: 28, height: 28, minWidth: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, ...nodeStyle }}>
                {done ? '✓' : i + 1}
              </div>
              <div style={{ height: 1, flex: 1, background: i === labels.length - 1 ? 'transparent' : i < activeIndex ? colors.green : colors.border }} />
            </div>
            <span style={{ fontSize: 10, marginTop: 5, color: done ? colors.green : isActive ? colors.ink : colors.textFaint }}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

// Functional file dropzone. Controlled: parent holds `file` + `onFile` + `onRemove`.
export function Dropzone({ icon = 'upload', title, sub, note, accept = 'image/jpeg,image/png,application/pdf', file, onFile, onRemove }) {
  const inputRef = useRef(null)
  if (file) {
    const ext = (file.name.split('.').pop() || '').toUpperCase()
    return <FileChip name={file.name} meta={`${(file.size / 1024 / 1024).toFixed(1)} MB · ${ext}`} onRemove={onRemove} />
  }
  return (
    <div onClick={() => inputRef.current?.click()} style={{ border: `2px dashed ${colors.borderStrong}`, borderRadius: 10, padding: '18px 20px', textAlign: 'center', cursor: 'pointer', marginBottom: 10 }}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) onFile?.(f)
        }}
      />
      <Icon name={icon} size={22} color={colors.borderStrong} strokeWidth={1.6} style={{ margin: '0 auto 8px' }} />
      <div style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4 }}>{sub}</div>}
      {note && <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{note}</div>}
    </div>
  )
}

export function FileChip({ name, meta, tone = 'green', onRemove }) {
  const green = tone === 'green'
  return (
    <div style={{ border: `1px solid ${green ? colors.greenTintBorder : colors.border}`, background: green ? colors.greenTint : colors.surfaceAlt, borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
      <Icon name="fileText" size={20} color={green ? colors.green : colors.textSoft} strokeWidth={1.7} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ fontSize: 11, color: colors.textFaint }}>{meta}</div>
      </div>
      <Icon name="x" size={16} color={colors.textFaint} strokeWidth={2} onClick={onRemove} style={{ cursor: 'pointer' }} />
    </div>
  )
}

export function PhoneField({ flag = '🇸🇦', code = '+966', placeholder = '5X XXX XXXX', value, onChange }) {
  return (
    <div style={{ display: 'flex', border: `1px solid ${colors.border}`, borderRadius: radius.md, overflow: 'hidden', height: 34 }}>
      <span style={{ width: 78, background: colors.bg, borderRight: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: 12, color: colors.textMuted }}>
        {flag} {code}
      </span>
      <input value={value ?? ''} onChange={onChange} placeholder={placeholder} style={{ flex: 1, border: 'none', padding: '0 10px', fontSize: 13, fontFamily: 'inherit', minWidth: 0 }} />
    </div>
  )
}
