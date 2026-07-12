import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { useAuth } from '../../context/AuthContext'

const countries = [
  ['SA', '🇸🇦 Saudi Arabia'],
  ['AE', '🇦🇪 UAE'],
  ['PK', '🇵🇰 Pakistan'],
]

// Plain-string country names for the bankCountry column.
const COUNTRY_NAMES = { SA: 'Saudi Arabia', AE: 'United Arab Emirates', PK: 'Pakistan' }

const bankSets = {
  SA: ['Select your bank', 'Al Rajhi Bank', 'National Commercial Bank (NCB)', 'Riyad Bank', 'Saudi British Bank (SABB)', 'Banque Saudi Fransi', 'Arab National Bank', 'Bank AlJazira', 'Alinma Bank'],
  AE: ['Select your bank', 'Emirates NBD', 'Abu Dhabi Commercial Bank (ADCB)', 'First Abu Dhabi Bank (FAB)', 'Dubai Islamic Bank', 'Mashreq Bank', 'RAKBANK'],
  PK: ['Select your bank', 'HBL', 'MCB', 'UBL', 'Allied Bank', 'Bank Alfalah', 'Meezan Bank', 'Other'],
}

const checkIcon = 'M20 6L9 17l-5-5'
const xIcon = 'M18 6L6 18M6 6l12 12'

const inputStyle = { width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }
const fieldLabel = { fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }
const hint = { fontSize: 11, color: colors.textFaint, marginTop: 4 }

export default function BankDetails({ embed = false }) {
  const navigate = useNavigate()
  const { user, updateProfile } = useAuth() || {}
  const [mode, setMode] = useState('form') // form | edit | saved
  const [country, setCountry] = useState('SA')
  const [bankName, setBankName] = useState('')
  const [iban, setIban] = useState('')
  const [holder, setHolder] = useState('')
  const [toast, setToast] = useState(false)

  // Initialise from the stored user record; land in the saved view if details exist.
  useEffect(() => {
    if (!user) return
    setCountry(user.country || 'SA')
    setBankName(user.bankName || '')
    setHolder(user.fullName || '')
    if (user.bankName || user.iban) setMode('saved')
  }, [user])

  const ibanLen = () => (country === 'SA' ? 22 : 21) // digits after prefix (SA=24 total, AE=23 total)
  const ibanValid = () => {
    if (country === 'PK') return true
    return iban.length === ibanLen() && /^[0-9A-Z]+$/.test(iban)
  }
  const saveDisabled = () => {
    if (country === 'PK') return false
    return !ibanValid()
  }

  const startEdit = () => { setMode('edit'); setIban(''); setHolder(user?.fullName || '') }
  const cancelEdit = () => setMode('saved')
  const pickCountry = (c) => { setCountry(c); setIban('') }
  const onIban = (e) => setIban(e.target.value.replace(/[^0-9A-Za-z]/g, '').toUpperCase())
  const save = async () => {
    if (saveDisabled()) return
    try {
      const bankCountry = COUNTRY_NAMES[country] || user?.bankCountry || ''
      const fullIban = country === 'PK' ? iban : `${country === 'SA' ? 'SA' : 'AE'}${iban}`
      await updateProfile?.({ bankName, iban: fullIban, bankCountry })
      setMode('saved')
      setToast(true)
      setTimeout(() => setToast(false), 4000)
    } catch (e) {
      // Keep the form open so the user can retry.
    }
  }

  const isSaved = mode === 'saved'
  const isForm = mode !== 'saved'
  const isEdit = mode === 'edit'
  const isIban = country === 'SA' || country === 'AE'
  const isPk = country === 'PK'
  const ibanPrefix = country === 'SA' ? 'SA' : 'AE'

  const needLen = ibanLen()
  const hasInput = iban.length > 0
  const valid = ibanValid()
  const wrongLen = hasInput && iban.length !== needLen
  const ibanColor = valid ? colors.green : colors.red
  const totalLen = country === 'SA' ? 24 : 23

  const disabled = saveDisabled()
  const saveLabel = isEdit ? 'Update Bank Details' : 'Save Bank Details'
  const banks = bankSets[country]

  return (
    <>
      {!embed && (
        <Topbar
          left={
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span onClick={() => navigate('/realtor/profile')} style={{ fontSize: 13, color: colors.textFaint, cursor: 'pointer' }}>My Profile</span>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.borderStrong} strokeWidth={2}><path d="M9 6l6 6-6 6" /></svg>
              <span style={{ fontSize: 13, color: colors.ink, fontWeight: 500 }}>Bank Details</span>
            </div>
          }
          actions={
            <button onClick={() => navigate('/realtor/profile')} style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2}><path d="M15 18l-6-6 6-6" /></svg>Back to Profile
            </button>
          }
        />
      )}

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* INFO BANNER */}
          <div style={{ background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, borderLeft: `3px solid ${colors.amber}`, borderRadius: 8, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.amber} strokeWidth={1.9} style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.amberText, marginBottom: 4 }}>Required to receive commissions</div>
              <div style={{ fontSize: 12, color: colors.amberText, lineHeight: 1.6 }}>Your commission payments will be transferred directly to this bank account. Make sure all details are accurate.</div>
            </div>
          </div>

          {/* ===== SAVED STATE ===== */}
          {isSaved && (
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Bank account saved</span>
                </div>
                <button onClick={startEdit} style={{ height: 30, padding: '0 10px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 11, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={1.9}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>Edit
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}><span style={{ fontSize: 11, color: colors.textFaint }}>Bank</span><span style={{ fontSize: 13, color: colors.textMuted }}>{user?.bankName || bankName || '—'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}><span style={{ fontSize: 11, color: colors.textFaint }}>Account Name</span><span style={{ fontSize: 13, color: colors.textMuted }}>{holder || user?.fullName || '—'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${colors.surfaceMuted}` }}><span style={{ fontSize: 11, color: colors.textFaint }}>Country</span><span style={{ fontSize: 13, color: colors.textMuted }}>{user?.bankCountry || COUNTRY_NAMES[country] || '—'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                  <span style={{ fontSize: 11, color: colors.textFaint }}>IBAN</span>
                  <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: colors.textMuted }}>{user?.iban || '—'}</span>
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    <span style={{ fontSize: 10, color: colors.textFaint }}>Encrypted</span>
                  </span>
                </div>
              </div>
              <div style={{ marginTop: 14, background: colors.bg, border: `1px solid ${colors.surfaceMuted}`, borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <span style={{ fontSize: 12, color: colors.textSoft, lineHeight: 1.5 }}>Your full IBAN is encrypted and only decrypted during disbursement. Waseet staff cannot view your complete IBAN number.</span>
              </div>
            </div>
          )}

          {/* ===== FORM STATE (empty or edit) ===== */}
          {isForm && (
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20 }}>
              {isEdit && (
                <div style={{ background: colors.amberTint, border: `1px solid ${colors.amberTintBorder}`, borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: colors.amberText, lineHeight: 1.5 }}>Editing bank details will temporarily pause commission disbursements until our team re-verifies the new details.</div>
              )}

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>Select your country</div>
                <div style={{ display: 'flex', border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  {countries.map(([id, label]) => {
                    const on = country === id
                    return (
                      <div key={id} onClick={() => pickCountry(id)} style={{ flex: 1, padding: '10px 0', textAlign: 'center', fontSize: 12, fontWeight: 500, cursor: 'pointer', ...(on ? { background: colors.ink, color: '#fff' } : { background: '#fff', color: colors.textSoft }) }}>{label}</div>
                    )
                  })}
                </div>
              </div>

              <div style={{ fontSize: 9, fontWeight: 700, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Bank Information</div>

              <div style={{ marginBottom: 12 }}>
                <div style={fieldLabel}>Bank Name *</div>
                <div style={{ position: 'relative' }}>
                  <select value={bankName} onChange={(e) => setBankName(e.target.value)} style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: colors.textMuted, appearance: 'none', cursor: 'pointer' }}>
                    {banks.map((b) => <option key={b}>{b}</option>)}
                  </select>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><path d="M6 9l6 6 6-6" /></svg>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={fieldLabel}>Account Holder Name *</div>
                <input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="As it appears on your bank account" style={inputStyle} />
                <div style={hint}>Must match your ID exactly</div>
              </div>

              {/* IBAN (SA/UAE) */}
              {isIban && (
                <div style={{ marginBottom: 12 }}>
                  <div style={fieldLabel}>IBAN Number *</div>
                  <div style={{ border: `1px solid ${colors.border}`, borderRadius: 7, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                    <span style={{ background: colors.bg, borderRight: `1px solid ${colors.border}`, padding: '0 10px', height: 34, display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 600, color: colors.textMuted }}>{ibanPrefix}</span>
                    <input value={iban} onChange={onIban} placeholder="44 2000 0001 2345 6789 1234" style={{ flex: 1, border: 'none', padding: '0 10px', height: 34, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                    {hasInput && (
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ibanColor} strokeWidth={2} style={{ marginRight: 10 }}><path d={valid ? checkIcon : xIcon} /></svg>
                    )}
                  </div>
                  {hasInput && (
                    <div style={{ fontSize: 11, marginTop: 4, color: ibanColor }}>{valid ? 'IBAN valid' : (wrongLen ? `IBAN must be ${totalLen} characters` : 'Invalid IBAN format')}</div>
                  )}
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 6 }}>
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    <span style={{ fontSize: 11, color: colors.textFaint }}>Stored with AES-256 encryption</span>
                  </div>
                </div>
              )}

              {/* PAKISTAN */}
              {isPk && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={fieldLabel}>Account Number *</div>
                    <input placeholder="1234567890123" style={inputStyle} />
                    <div style={hint}>10-16 digits</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={fieldLabel}>Branch Code *</div>
                    <input placeholder="0001" style={inputStyle} />
                    <div style={hint}>4-digit branch code</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={fieldLabel}>IBAN (if available)</div>
                    <input placeholder="PK36ALFH0011000…" style={inputStyle} />
                  </div>
                </>
              )}

              {isEdit && (
                <button onClick={cancelEdit} style={{ width: '100%', height: 36, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', margin: '8px 0' }}>Cancel</button>
              )}
              <button onClick={save} disabled={disabled} style={{ width: '100%', height: 36, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit', background: disabled ? colors.textFaint : colors.green, cursor: disabled ? 'not-allowed' : 'pointer' }}>{saveLabel}</button>

              <div style={{ marginTop: 12, textAlign: 'center', display: 'flex', gap: 4, alignItems: 'flex-start', justifyContent: 'center' }}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 2 }}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <span style={{ fontSize: 12, color: colors.textFaint, lineHeight: 1.5 }}>Your bank details are encrypted and only used for commission disbursements. Never shared with developers or realtors.</span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* SUCCESS TOAST */}
      {toast && (
        <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 60, background: '#fff', border: `1px solid ${colors.greenTintBorder}`, borderRadius: 10, padding: '12px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Bank details saved successfully</div>
            <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 3 }}>Commissions will be transferred to your {bankName || 'bank'} account.</div>
          </div>
        </div>
      )}
    </>
  )
}
