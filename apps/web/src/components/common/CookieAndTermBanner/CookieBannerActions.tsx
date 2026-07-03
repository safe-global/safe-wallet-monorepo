import type { ReactElement } from 'react'
import { Button } from '@/components/ui/button'

const CookieBannerActions = ({
  onAccept,
  onAcceptAll,
}: {
  onAccept: () => void
  onAcceptAll: () => void
}): ReactElement => {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
      <Button onClick={onAccept} variant="secondary" size="action">
        Save settings
      </Button>

      <Button onClick={onAcceptAll} variant="default" size="action">
        Accept all
      </Button>
    </div>
  )
}

export default CookieBannerActions
