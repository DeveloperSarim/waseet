import React, { useState } from 'react'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { Avatar } from '../../components/ui'
import { UserAvatar } from '../../components/UserAvatar'
import BankDetails from './BankDetails'
import NotificationPreferences from './NotificationPreferences'
import ChangePassword from '../auth/ChangePassword'

const tabs = ['Bank Details', 'Password', 'Notifications']

export default function RealtorSettings() {
  const [tab, setTab] = useState('Bank Details')

  return (
    <>
      <Topbar
        title="Settings"
        notifications={2}
        avatar={<UserAvatar size={30} />}
      />
      {/* sub-tabs */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 22px', display: 'flex' }}>
        {tabs.map((t) => {
          const on = tab === t
          return (
            <div key={t} onClick={() => setTab(t)} style={{ padding: '11px 16px', fontSize: 13, cursor: 'pointer', borderBottom: `2px solid ${on ? colors.ink : 'transparent'}`, color: on ? colors.ink : colors.textSoft, fontWeight: on ? 600 : 400 }}>{t}</div>
          )
        })}
      </div>

      {tab === 'Bank Details' && <BankDetails embed />}
      {tab === 'Password' && <ChangePassword embed />}
      {tab === 'Notifications' && <NotificationPreferences embed />}
    </>
  )
}
