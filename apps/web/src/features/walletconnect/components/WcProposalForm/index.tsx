import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import { WCLoadingState } from '@/features/walletconnect/WalletConnectContext'
import {
  getPeerName,
  getSupportedChainIds,
  isBlockedBridge,
  isSafePassApp,
  isWarnedBridge,
} from '@/features/walletconnect/services/utils'
import { WalletConnectContext } from '@/features/walletconnect/WalletConnectContext'
import useChains from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'

import { Button, Checkbox, CircularProgress, Divider, FormControlLabel, Typography } from '@mui/material'
import type { WalletKitTypes } from '@reown/walletkit'
import type { ChangeEvent, ReactElement } from 'react'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { CompatibilityWarning } from './CompatibilityWarning'
import ProposalVerification from './ProposalVerification'
import css from './styles.module.css'
import { useSanctionedAddress } from '@/hooks/useSanctionedAddress'
import BlockedAddress from '@/components/common/BlockedAddress'

type ProposalFormProps = {
  proposal: WalletKitTypes.SessionProposal
  onApprove: () => Promise<void>
  onReject: () => Promise<void>
}

const WcProposalForm = ({ proposal, onApprove, onReject }: ProposalFormProps): ReactElement => {
  const { loading } = useContext(WalletConnectContext)

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

  const name = getPeerName(proposer) || 'Unknown dApp'
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
    (_: ChangeEvent, checked: boolean) => {
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
    <div className={css.container}>
      <Typography variant="body2" color="text.secondary">
        WalletConnect
      </Typography>

      {proposer.metadata.icons[0] && (
        <div className={css.icon}>
          <SafeAppIconCard src={proposer.metadata.icons[0]} width={32} height={32} alt={`${name || 'dApp'} logo`} />
        </div>
      )}

      <Typography mb={1}>
        <b>{name}</b> wants to connect
      </Typography>

      <Typography className={css.origin} mb={3}>
        {proposal.verifyContext.verified.origin}
      </Typography>

      <div className={css.info}>
        <ProposalVerification proposal={proposal} />

        <CompatibilityWarning proposal={proposal} chainIds={chainIds} />
      </div>

      {!isBlocked && isHighRisk && (
        <FormControlLabel
          className={css.checkbox}
          control={<Checkbox checked={understandsRisk} onChange={onCheckboxClick} />}
          label="I understand the risks associated with interacting with this dApp and would like to continue."
        />
      )}

      {isSafePass && sanctionedAddress && (
        <BlockedAddress address={sanctionedAddress} featureTitle="Safe{Pass}" onClose={onReject} />
      )}

      <Divider flexItem className={css.divider} />

      <div className={css.buttons}>
        <Button variant="danger" onClick={onReject} className={css.button} disabled={!!loading}>
          {loading === WCLoadingState.REJECT ? <CircularProgress size={20} /> : 'Reject'}
        </Button>

        <Button variant="contained" onClick={onApprove} className={css.button} disabled={disabled}>
          {loading === WCLoadingState.APPROVE ? <CircularProgress size={20} /> : 'Approve'}
        </Button>
      </div>
    </div>
  )
}

export default WcProposalForm
