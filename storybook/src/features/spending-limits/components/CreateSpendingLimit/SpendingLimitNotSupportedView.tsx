import type { ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

import TxCard from '@/components/tx-flow/common/TxCard'
import ExternalLink from '@/components/common/ExternalLink'
import { HELP_CENTER_URL } from '@safe-global/utils/config/constants'

export type SpendingLimitNotSupportedViewProps = {
  chainName?: string
  renderErrorMessage: (children: ReactNode) => ReactNode
}

export const SpendingLimitNotSupportedView = ({
  chainName: name,
  renderErrorMessage,
}: SpendingLimitNotSupportedViewProps) => {
  const chainName = name ?? 'this network'

  return (
    <TxCard>
      {renderErrorMessage(
        <>
          <Typography variant="paragraph-bold">Spending limits aren&apos;t available on {chainName} yet</Typography>
          <Typography className="mt-1">
            The spending limit module hasn&apos;t been deployed on this network. Once it&apos;s available you&apos;ll be
            able to set up spending limits here. <ExternalLink href={HELP_CENTER_URL}>Contact us</ExternalLink> to
            request support for {chainName}.
          </Typography>
        </>,
      )}
    </TxCard>
  )
}
