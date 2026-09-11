import type { ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { Share2 as ShareIcon } from 'lucide-react'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import Track from '@/components/common/Track'
import { MESSAGE_EVENTS } from '@/services/analytics/events/txList'
import React from 'react'
import CopyTooltip from '@/components/common/CopyTooltip'
import useOrigin from '@/hooks/useOrigin'

const MsgShareLink = ({ safeMessageHash, button }: { safeMessageHash: string; button?: boolean }): ReactElement => {
  const router = useRouter()
  const { safe = '' } = router.query
  const href = `${AppRoutes.transactions.msg}?safe=${safe}&messageHash=${safeMessageHash}`
  const txUrl = useOrigin() + href

  return (
    <Track {...MESSAGE_EVENTS.COPY_DEEPLINK}>
      <CopyTooltip text={txUrl} initialToolTipText="Copy the message URL">
        {button ? (
          <Button data-testid="share-btn" aria-label="Share" size="sm" onClick={() => {}}>
            Copy link
          </Button>
        ) : (
          // eslint-disable-next-line no-restricted-syntax -- circular hover on the icon button; no round icon size variant exists
          <Button data-testid="share-btn" aria-label="Share" variant="ghost" size="icon-xs" className="rounded-full">
            <ShareIcon className="size-4 text-[var(--color-border-main)]" />
          </Button>
        )}
      </CopyTooltip>
    </Track>
  )
}

export default MsgShareLink
