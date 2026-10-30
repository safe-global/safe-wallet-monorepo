import { useEffect, type ReactElement } from 'react'
import { Sheet, SheetContent, SheetTitle } from '@safe-global/views/components/ui/sheet'

const BEAMER_ORIGIN = 'https://app.getbeamer.com'
const BEAMER_FEED_URL = `${BEAMER_ORIGIN}/news`

type WhatsNewDrawerProps = {
  productId: string
  open: boolean
  onClose: () => void
}

export const WhatsNewDrawer = ({ productId, open, onClose }: WhatsNewDrawerProps): ReactElement => {
  const feedParams = new URLSearchParams({ app_id: productId, url: window.location.host })

  useEffect(() => {
    if (!open) return

    const handleMessage = (event: MessageEvent) => {
      if (event.origin === BEAMER_ORIGIN && event.data === 'hide') onClose()
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [open, onClose])

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="left" size="md" surface="paper" padding="none" showCloseButton={false}>
        <SheetTitle className="sr-only">What&apos;s new</SheetTitle>
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
