import { Typography } from '@/components/ui/typography'

import TxCard from '@/components/tx-flow/common/TxCard'
import ErrorMessage from '@/components/tx/ErrorMessage'
import ExternalLink from '@/components/common/ExternalLink'
import { useCurrentChain } from '@/hooks/useChains'
import { HELP_CENTER_URL } from '@safe-global/utils/config/constants'

const SpendingLimitNotSupported = () => {
  const chain = useCurrentChain()
  const chainName = chain?.chainName ?? 'this network'

  return (
    <TxCard>
      <ErrorMessage>
        <Typography variant="paragraph-bold">Spending limits aren&apos;t available on {chainName} yet</Typography>
        <Typography className="mt-1">
          The spending limit module hasn&apos;t been deployed on this network. Once it&apos;s available you&apos;ll be
          able to set up spending limits here. <ExternalLink href={HELP_CENTER_URL}>Contact us</ExternalLink> to request
          support for {chainName}.
        </Typography>
      </ErrorMessage>
    </TxCard>
  )
}

export default SpendingLimitNotSupported
