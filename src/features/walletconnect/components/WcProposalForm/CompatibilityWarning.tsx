import { Alert, Typography } from '@mui/material'
import { useCallback } from 'react'
import type { WalletKitTypes } from '@reown/walletkit'

import ChainIndicator from '@/components/common/ChainIndicator'
import { useCompatibilityWarning } from './useCompatibilityWarning'
import useSafeInfo from '@/hooks/useSafeInfo'

import css from './styles.module.css'
import NetworkSelector from '@/components/common/NetworkSelector'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'

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
  const peerUrl = proposal.params.proposer.metadata.url || proposal.verifyContext.verified.origin

  const onChainChange = useCallback(() => {
    trackEvent({ ...WALLETCONNECT_EVENTS.SWITCH_FROM_UNSUPPORTED_CHAIN, label: peerUrl })
  }, [peerUrl])

  return (
    <>
      <Alert severity={severity} className={css.alert}>
        {message}
      </Alert>

      {isUnsupportedChain && (
        <>
          <Typography mt={3} mb={1}>
            Supported networks
          </Typography>

          <div>
            {chainIds.map((chainId) => (
              <ChainIndicator inline chainId={chainId} key={chainId} className={css.chain} />
            ))}
          </div>

          <Typography mt={3} component="div">
            Switch network
            <NetworkSelector onChainSelect={onChainChange} />
          </Typography>
        </>
      )}
    </>
  )
}
