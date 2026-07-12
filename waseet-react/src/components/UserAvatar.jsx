import React from 'react'
import { Avatar } from './ui'
import { useAuth } from '../context/AuthContext'
import { initials as toInitials } from '../lib/adminFormat'

// Self-avatar for the logged-in user. Same visual as <Avatar>, but the initials
// always come from the real authenticated user (falls back to "··" pre-load).
export function UserAvatar(props) {
  const { user } = useAuth() || {}
  return <Avatar {...props} initials={user ? toInitials(user.fullName) : '··'} />
}

export default UserAvatar
