import type { ReactElement, ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export type TrustedSafesModalViewProps = {
  open: boolean
  onClose: () => void
  /** Renders the ManageTrustedSafesContent container */
  renderContent: (props: { secondaryLabel: 'Cancel' | 'Back' }) => ReactNode
}

export function TrustedSafesModalView({ open, onClose, renderContent }: TrustedSafesModalViewProps): ReactElement {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        padding="none"
        // eslint-disable-next-line no-restricted-syntax -- responsive max-w-[min(900px,calc(100vw-2rem))]: not a size token (needs design)
        className="flex max-h-[90vh] max-w-[min(900px,calc(100vw-2rem))] flex-col"
      >
        <DialogHeader
          divided
          // eslint-disable-next-line no-restricted-syntax -- bespoke header padding px-6 pb-4 pt-6, no token
          className="shrink-0 px-6 pb-4 pt-6"
        >
          <DialogTitle className="font-bold">Manage my account list</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-4">{renderContent({ secondaryLabel: 'Cancel' })}</div>
      </DialogContent>
    </Dialog>
  )
}
