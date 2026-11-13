import type { LucideIcon } from 'lucide-react'
import type { TourPlacement, TourStepContent } from '@safe-global/views/features/spaces/components/WorkspaceTour/types'

type TourTarget = { anchor: string; sidebarItem?: string } | { anchor?: undefined; sidebarItem: string }

export type TourStep = TourStepContent &
  TourTarget & {
    id: string
    route: string
    selectOnEnter?: string
    emptyState?: string
    placement: TourPlacement
  }

export type TourNextActionLink = {
  icon: LucideIcon
  label: string
  description: string
  route: string
}
