import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

export type SafeProAnnouncementModalViewProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  announcement: ReactNode
}

export const SafeProAnnouncementModalView = ({
  open,
  onOpenChange,
  announcement,
}: SafeProAnnouncementModalViewProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      size="md"
      surface="card"
      padding="none"
      // eslint-disable-next-line no-restricted-syntax -- Figma spec calls for a 32px corner one-off; no radius token in the scale matches it
      className="rounded-[2rem]"
    >
      <DialogTitle className="sr-only" render={<div />}>
        Your Workspace moves to Pro on Oct 6, 2026
      </DialogTitle>
      {announcement}
    </DialogContent>
  </Dialog>
)
