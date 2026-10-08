import type { WalletKitTypes } from '@reown/walletkit'

import ChainIndicator from '@/components/common/ChainIndicator'
import { useCompatibilityWarning } from './useCompatibilityWarning'
import useSafeInfo from '@/hooks/useSafeInfo'
import { CompatibilityWarningView } from '@views/features/walletconnect/components/WcProposalForm/CompatibilityWarningView'

export const CompatibilityWarning = ({
  proposal,
  chainIds,
}: {
  proposal: WalletKitTypes.SessionProposal
  chainIds: Array<string>
}) => {
  const { safe } = useSafeInfo()
  const isUnsupportedChain = !chainIds.includes(safe.chainId)
  const { severity, message } = useCompatibilityWarning(proposal, isUnsupportedChain)

  return (
    <CompatibilityWarningView
      severity={severity}
      message={message}
      isUnsupportedChain={isUnsupportedChain}
      chainIds={chainIds}
      renderChainIndicator={(props) => <ChainIndicator inline key={props.chainId} {...props} />}
    />
  )
}
