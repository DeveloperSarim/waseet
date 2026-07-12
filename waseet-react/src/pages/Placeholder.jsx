import React from 'react'
import { colors } from '../theme/tokens'
import { Topbar } from '../components/layout/Topbar'
import { PortalMain } from '../components/layout/PortalLayout'
import { Avatar, Badge } from '../components/ui'

function Body({ title }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 20px',
        minHeight: 320,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: colors.greenTint,
          border: `1px solid ${colors.greenTintBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11z" />
          <circle cx="12" cy="11" r="2.4" />
        </svg>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</div>
      <div style={{ fontSize: 13, color: colors.textSoft, marginTop: 6, maxWidth: 360 }}>
        This screen is part of the Waseet design and is queued for conversion in a later stage.
      </div>
      <div style={{ marginTop: 16 }}>
        <Badge tone="gray">Coming in a later stage</Badge>
      </div>
    </div>
  )
}

/** Placeholder used inside a portal shell (renders its own Topbar). */
export function PortalPlaceholder({ title }) {
  return (
    <>
      <Topbar
        title={title}
        notifications={3}
        avatar={<Avatar initials="AR" size={30} />}
      />
      <PortalMain maxWidth={1080}>
        <Body title={title} />
      </PortalMain>
    </>
  )
}

/** Placeholder used inside the public shell. */
export function PublicPlaceholder({ title }) {
  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 28px' }}>
      <Body title={title} />
    </div>
  )
}

export default PortalPlaceholder
