import React from 'react'
import { colors } from '../theme/tokens'

// Editor for a project's construction timeline + payment plan + % complete.
// Shared by the developer AddProject/EditProject forms and the admin edit page.
// value = { progressPercent:number, timeline:[{label,date,state}], paymentPlan:[{pct,title,sub}] }
const STATES = [
  { value: 'done', label: 'Done' },
  { value: 'active', label: 'In progress' },
  { value: 'todo', label: 'Upcoming' },
]

const field = { width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', color: colors.ink, background: '#fff', boxSizing: 'border-box' }
const label = { fontSize: 11, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }
const addBtn = { border: `2px dashed ${colors.borderStrong}`, borderRadius: 8, padding: '8px 12px', textAlign: 'center', cursor: 'pointer', fontSize: 12, color: colors.textMuted, background: '#fff' }
const removeBtn = { fontSize: 12, color: colors.red, cursor: 'pointer', padding: '2px 6px', whiteSpace: 'nowrap' }

export function ProjectProgressEditor({ value, onChange }) {
  const v = value || {}
  const timeline = Array.isArray(v.timeline) ? v.timeline : []
  const paymentPlan = Array.isArray(v.paymentPlan) ? v.paymentPlan : []
  const progressPercent = v.progressPercent ?? ''

  const patch = (p) => onChange({ ...v, ...p })
  const setMilestone = (i, k, val) => patch({ timeline: timeline.map((m, j) => (j === i ? { ...m, [k]: val } : m)) })
  const setPay = (i, k, val) => patch({ paymentPlan: paymentPlan.map((m, j) => (j === i ? { ...m, [k]: val } : m)) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* % complete */}
      <div style={{ maxWidth: 220 }}>
        <div style={label}>Overall progress (%)</div>
        <input type="number" min={0} max={100} value={progressPercent} onChange={(e) => patch({ progressPercent: e.target.value === '' ? '' : Math.max(0, Math.min(100, Number(e.target.value))) })} placeholder="e.g. 68" style={field} />
      </div>

      {/* Timeline milestones */}
      <div>
        <div style={{ ...label, marginBottom: 10 }}>Construction timeline</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {timeline.map((m, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
              <input value={m.label || ''} onChange={(e) => setMilestone(i, 'label', e.target.value)} placeholder="Phase (e.g. Foundation)" style={field} />
              <input value={m.date || ''} onChange={(e) => setMilestone(i, 'date', e.target.value)} placeholder="When (e.g. Q3 2025)" style={field} />
              <select value={m.state || 'todo'} onChange={(e) => setMilestone(i, 'state', e.target.value)} style={field}>
                {STATES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <span onClick={() => patch({ timeline: timeline.filter((_, j) => j !== i) })} style={removeBtn}>× Remove</span>
            </div>
          ))}
        </div>
        <div onClick={() => patch({ timeline: [...timeline, { label: '', date: '', state: 'todo' }] })} style={{ ...addBtn, marginTop: 8 }}>+ Add milestone</div>
      </div>

      {/* Payment plan */}
      <div>
        <div style={{ ...label, marginBottom: 10 }}>Payment plan</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {paymentPlan.map((p, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1.2fr 1.2fr auto', gap: 8, alignItems: 'center' }}>
              <input type="number" min={0} max={100} value={p.pct ?? ''} onChange={(e) => setPay(i, 'pct', e.target.value === '' ? '' : Number(e.target.value))} placeholder="%" style={field} />
              <input value={p.title || ''} onChange={(e) => setPay(i, 'title', e.target.value)} placeholder="Stage (e.g. Down payment)" style={field} />
              <input value={p.sub || ''} onChange={(e) => setPay(i, 'sub', e.target.value)} placeholder="Detail (e.g. On signing)" style={field} />
              <span onClick={() => patch({ paymentPlan: paymentPlan.filter((_, j) => j !== i) })} style={removeBtn}>× Remove</span>
            </div>
          ))}
        </div>
        <div onClick={() => patch({ paymentPlan: [...paymentPlan, { pct: '', title: '', sub: '' }] })} style={{ ...addBtn, marginTop: 8 }}>+ Add payment stage</div>
        {paymentPlan.length > 0 && (
          <div style={{ fontSize: 11, color: paymentPlan.reduce((s, p) => s + (Number(p.pct) || 0), 0) === 100 ? colors.greenDark : colors.textFaint, marginTop: 8 }}>
            Total: {paymentPlan.reduce((s, p) => s + (Number(p.pct) || 0), 0)}% {paymentPlan.reduce((s, p) => s + (Number(p.pct) || 0), 0) === 100 ? '✓' : '(should add up to 100%)'}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectProgressEditor
