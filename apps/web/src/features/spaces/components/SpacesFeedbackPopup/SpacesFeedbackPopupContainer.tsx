import type { ReactElement } from 'react'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { useCurrentSpaceId, useSpaceMembersByStatus } from '@/features/spaces'
import { SpacesFeedbackPopup } from './SpacesFeedbackPopup'

const DISMISSED_STORAGE_KEY = 'spacesFeedbackPopupDismissed'
const SETUP_WIDGET_DISMISSED_KEY = 'setupWidgetDismissed'

const POPUP_CONTENT = {
  name: 'Iva Lukan',
  role: 'Product Designer',
  avatarSrc: '/images/spaces/feedback-popup-avatar.png',
  avatarFallback: 'IL',
  badge: 'New workspaces',
  title: 'Your feedback matters.',
  description:
    'We’re redesigning our workspaces and want to hear from users like you. Your input shapes what we build next.',
  ctaLabel: 'Book a call',
  ctaHref: 'https://calendly.com/iva-safe/30min',
} as const

export function SpacesFeedbackPopupContainer(): ReactElement | null {
  const spaceId = useCurrentSpaceId()
  const { activeMembers, invitedMembers } = useSpaceMembersByStatus()
  const [dismissed, setDismissed] = useLocalStorage<boolean>(DISMISSED_STORAGE_KEY)
  const [setupDismissedSpaces] = useLocalStorage<Record<string, number>>(SETUP_WIDGET_DISMISSED_KEY)

  const hasTeamMembers = activeMembers.length + invitedMembers.length > 1
  // setupWidgetDismissed stores a future expiry timestamp (now + 3 days), so a value
  // greater than now means the SetupWidget is currently dismissed for that space.
  const setupDismissedForSpace = spaceId ? (setupDismissedSpaces?.[spaceId] ?? 0) > Date.now() : false
  const shouldShow = !dismissed && (hasTeamMembers || setupDismissedForSpace)

  if (!shouldShow) return null

  return <SpacesFeedbackPopup {...POPUP_CONTENT} onClose={() => setDismissed(true)} />
}
