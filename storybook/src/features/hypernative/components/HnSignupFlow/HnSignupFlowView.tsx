import type { ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import HnModal from './HnModal'

export type HnSignupFlowViewProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export const HnSignupFlowView = ({ open, onClose, children }: HnSignupFlowViewProps) => {
  return (
    <HnModal open={open} onClose={onClose}>
      <div>{children}</div>
    </HnModal>
  )
}

export const HnSignupHubSpotConfigErrorView = () => {
  return (
    <div className="p-8">
      <Typography className="text-[var(--color-error-main)]">HubSpot configuration is missing or invalid.</Typography>
    </div>
  )
}

export type HnSignupCalendlyConfigErrorViewProps = {
  region: string
}

export const HnSignupCalendlyConfigErrorView = ({ region }: HnSignupCalendlyConfigErrorViewProps) => {
  return (
    <div className="p-8">
      <Typography className="text-[var(--color-error-main)]">
        Calendly configuration is missing for region: {region}
      </Typography>
    </div>
  )
}
