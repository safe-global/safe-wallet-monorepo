import Link from 'next/link'
import type { ReactElement } from 'react'
import type { UrlObject } from 'url'

import { Button } from '@/components/ui/button'
import Track from '@/components/common/Track'
import { MODALS_EVENTS } from '@/services/analytics/events/modals'
import SwapIcon from '@/public/images/common/swap.svg'
import AssetsIcon from '@/public/images/sidebar/assets.svg'

const buttonClasses = 'h-[58px] w-full px-6 text-base [&_svg_path]:fill-current'

export const SendTokensButtonView = ({ onClick }: { onClick: () => void }): ReactElement => {
  return (
    <Track {...MODALS_EVENTS.SEND_FUNDS}>
      <Button data-testid="send-tokens-btn" onClick={onClick} className={buttonClasses}>
        <AssetsIcon width={20} />
        Send tokens
      </Button>
    </Track>
  )
}

export type TxBuilderButtonViewProps = {
  href: UrlObject
  onClick?: () => void
}

export const TxBuilderButtonView = ({ href, onClick }: TxBuilderButtonViewProps): ReactElement => {
  return (
    <Track {...MODALS_EVENTS.CONTRACT_INTERACTION}>
      <Button
        variant="outline"
        className={buttonClasses}
        onClick={onClick}
        render={<Link href={href} style={{ width: '100%' }} />}
      >
        {/* Sized via classes: Tailwind's preflight (img { height: auto }) overrides the height attribute. */}
        <img src="/images/apps/tx-builder.png" className="h-6 w-auto" alt="Transaction Builder" />
        Transaction Builder
      </Button>
    </Track>
  )
}

export const MakeASwapButtonView = ({ onClick }: { onClick: () => void }): ReactElement => {
  return (
    <Button className={buttonClasses} onClick={onClick}>
      <SwapIcon width={20} />
      Swap tokens
    </Button>
  )
}
