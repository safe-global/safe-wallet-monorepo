'use client'

import type { ReactElement } from 'react'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { useCurrentSpaceId, useSpaceMembersByStatus } from '@/features/spaces'
import { SpacesFeedbackPopup } from './SpacesFeedbackPopup'

const DISMISSED_STORAGE_KEY = 'spacesFeedbackPopupDismissed'
const SETUP_WIDGET_DISMISSED_KEY = 'setupWidgetDismissed'
const CALENDLY_URL = 'https://calendly.com/iva-safe/30min'

export function SpacesFeedbackPopupContainer(): ReactElement | null {
  const spaceId = useCurrentSpaceId()
  const { activeMembers, invitedMembers } = useSpaceMembersByStatus()
  const [dismissed, setDismissed] = useLocalStorage<boolean>(DISMISSED_STORAGE_KEY)
  const [setupDismissedSpaces] = useLocalStorage<Record<string, number>>(SETUP_WIDGET_DISMISSED_KEY)

  const hasTeamMembers = activeMembers.length + invitedMembers.length > 1
  const setupDismissedForSpace = spaceId ? (setupDismissedSpaces?.[spaceId] ?? 0) > Date.now() : false
  const shouldShow = !dismissed && (hasTeamMembers || setupDismissedForSpace)

  if (!shouldShow) return null

  return (
    <SpacesFeedbackPopup
      name="Iva Lukan"
      role="Product Designer"
      avatarSrc="/images/spaces/feedback-popup-avatar.png"
      badge="New workspaces"
      title="Your feedback matters."
      description="We’re redesigning our workspaces and want to hear from users like you. Your input shapes what we build next."
      ctaLabel="Book a call"
      ctaHref={CALENDLY_URL}
      onClose={() => setDismissed(true)}
    />
  )
}

export default SpacesFeedbackPopupContainer
