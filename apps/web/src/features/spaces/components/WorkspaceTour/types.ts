import type { LucideIcon } from 'lucide-react'
import type { TourPlacement, TourStepContent } from '@safe-global/views/features/spaces/components/WorkspaceTour/types'

export type TourStep = TourStepContent & {
  id: string
  route: string
  selectOnEnter?: string
  anchor: string
  emptyState?: string
  navAnchor?: string
  placement: TourPlacement
}

export type TourNextActionLink = {
  icon: LucideIcon
  label: string
  description: string
  route: string
}
