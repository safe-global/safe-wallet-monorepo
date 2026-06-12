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
      <Button onClick={onAccept} variant="ghost" size="sm">
        Save settings
      </Button>

      <Button onClick={onAcceptAll} variant="secondary" size="sm">
        Accept all
      </Button>
    </div>
  )
}

export default CookieBannerActions
