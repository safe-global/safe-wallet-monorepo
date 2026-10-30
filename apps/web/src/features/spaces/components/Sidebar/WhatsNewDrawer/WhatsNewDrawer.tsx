import type { ReactElement } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@safe-global/views/components/ui/sheet'

const BEAMER_FEED_URL = 'https://app.getbeamer.com/news'

type WhatsNewDrawerProps = {
  productId: string
  open: boolean
  onClose: () => void
}

export const WhatsNewDrawer = ({ productId, open, onClose }: WhatsNewDrawerProps): ReactElement => {
  const feedParams = new URLSearchParams({ app_id: productId, url: window.location.host })

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="left" size="md" surface="paper" padding="none">
        <SheetHeader divided>
          <SheetTitle>What&apos;s new</SheetTitle>
        </SheetHeader>
        {/* Beamer must stay in a sandboxed cross-origin frame: its code must never run in the wallet page */}
        <iframe
          src={`${BEAMER_FEED_URL}?${feedParams}`}
          title="What's new"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
          className="min-h-0 w-full flex-1 border-0"
        />
      </SheetContent>
    </Sheet>
  )
}
