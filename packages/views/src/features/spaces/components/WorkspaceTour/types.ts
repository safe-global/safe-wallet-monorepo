import type { LucideIcon } from 'lucide-react'

export type SpotlightRect = {
  top: number
  left: number
  width: number
  height: number
  radius: number
}

export type TourInsideItem = {
  icon: LucideIcon
  label: string
  description: string
}

export type TourStepContent = {
  title: string
  body: string
  tip?: string
  inside?: TourInsideItem[]
}

export type TourPlacement = {
  side: 'bottom' | 'right'
  align: 'start' | 'center' | 'end'
}

export type TourProgress = {
  current: number
  total: number
}

export type TourNextAction = {
  icon: LucideIcon
  label: string
  description: string
  onSelect: () => void
}
