import { useEffect, type ReactElement } from 'react'
import { Sheet, SheetContent, SheetTitle } from '@safe-global/views/components/ui/sheet'
import { BEAMER_ORIGIN, httpsOnly } from '@/store/api/beamer'

const BEAMER_FEED_URL = `${BEAMER_ORIGIN}/news`
const OPEN_URL = 'openUrl:'

// Beamer's feed does not follow its links itself: it posts "openUrl:" followed by a JSON object with the url.
const parseOpenUrl = (data: unknown): string | undefined => {
  if (typeof data !== 'string' || !data.startsWith(OPEN_URL)) return undefined

  let payload: { url?: unknown } | null
  try {
    payload = JSON.parse(data.slice(OPEN_URL.length))
  } catch {
    return undefined
  }
  return typeof payload?.url === 'string' ? httpsOnly(payload.url) : undefined
}

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
      if (event.origin !== BEAMER_ORIGIN) return
      if (event.data === 'hide') onClose()

      const url = parseOpenUrl(event.data)
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
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
