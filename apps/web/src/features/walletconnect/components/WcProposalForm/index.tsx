import { WCLoadingState } from '../../types'
import { getPeerName, getSupportedChainIds, isBlockedBridge, isWarnedBridge } from '../../services/utils'
import { isSafePassApp } from '@/services/safe-apps/utils'
import { WalletConnectContext } from '../WalletConnectContext'
import useChains from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'

import type { WalletKitTypes } from '@reown/walletkit'
import type { ReactElement } from 'react'
import { useId } from 'react'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { CompatibilityWarning } from './CompatibilityWarning'
import ProposalVerification from './ProposalVerification'
import { useSanctionedAddress } from '@/hooks/useSanctionedAddress'
import BlockedAddress from '@/components/common/BlockedAddress'
import { WcProposalFormView } from '@views/features/walletconnect/components/WcProposalForm/WcProposalFormView'

type ProposalFormProps = {
  proposal: WalletKitTypes.SessionProposal
  onApprove: () => Promise<void>
  onReject: () => Promise<void>
}

const WcProposalForm = ({ proposal, onApprove, onReject }: ProposalFormProps): ReactElement => {
  const { loading } = useContext(WalletConnectContext)
  const riskCheckboxId = useId()

  const { configs } = useChains()
  const { safeLoaded, safe } = useSafeInfo()
  const { chainId } = safe
  const [understandsRisk, setUnderstandsRisk] = useState(false)
  const { proposer } = proposal.params
  const { isScam, origin } = proposal.verifyContext.verified
  const url = proposer.metadata.url || origin

  const isSafePass = isSafePassApp(origin)
  const sanctionedAddress = useSanctionedAddress(isSafePass)

  const chainIds = useMemo(() => getSupportedChainIds(configs, proposal.params), [configs, proposal.params])
  const isUnsupportedChain = !chainIds.includes(chainId)

  const peerName = getPeerName(proposer)
  const name = peerName || 'Unknown dApp'
  const isHighRisk = proposal.verifyContext.verified.validation === 'INVALID' || isWarnedBridge(origin, name)
  const isBlocked = isScam || isBlockedBridge(origin)
  const disabled =
    !safeLoaded ||
    isUnsupportedChain ||
    isBlocked ||
    (isHighRisk && !understandsRisk) ||
    !!loading ||
    (Boolean(sanctionedAddress) && isSafePass)

  const onCheckboxClick = useCallback(
    (checked: boolean) => {
      setUnderstandsRisk(checked)

      if (checked) {
        trackEvent({
          ...WALLETCONNECT_EVENTS.ACCEPT_RISK,
          label: url,
        })
      }
    },
    [url],
  )

  // Track risk/scam/bridge warnings
  useEffect(() => {
    if (isHighRisk || isBlocked) {
      trackEvent({
        ...WALLETCONNECT_EVENTS.SHOW_RISK,
        label: url,
      })
    }
  }, [isHighRisk, isBlocked, url])

  // Track unsupported chain warnings
  useEffect(() => {
    if (isUnsupportedChain) {
      trackEvent({
        ...WALLETCONNECT_EVENTS.UNSUPPORTED_CHAIN,
        label: url,
      })
    }
  }, [url, isUnsupportedChain])

  return (
    <WcProposalFormView
      peerName={peerName}
      iconUrl={proposer.metadata.icons[0]}
      origin={proposal.verifyContext.verified.origin}
      verification={<ProposalVerification proposal={proposal} />}
      compatibilityWarning={<CompatibilityWarning proposal={proposal} chainIds={chainIds} />}
      showRiskCheckbox={!isBlocked && isHighRisk && !isUnsupportedChain}
      riskCheckboxId={riskCheckboxId}
      understandsRisk={understandsRisk}
      onRiskCheckboxChange={onCheckboxClick}
      renderBlockedAddress={
        isSafePass && sanctionedAddress
          ? (featureTitle) => (
              <BlockedAddress address={sanctionedAddress} featureTitle={featureTitle} onClose={onReject} />
            )
          : undefined
      }
      isUnsupportedChain={isUnsupportedChain}
      approveDisabled={disabled}
      isBusy={!!loading}
      isApproving={loading === WCLoadingState.APPROVE}
      isRejecting={loading === WCLoadingState.REJECT}
      onApprove={onApprove}
      onReject={onReject}
    />
  )
}

export default WcProposalForm
