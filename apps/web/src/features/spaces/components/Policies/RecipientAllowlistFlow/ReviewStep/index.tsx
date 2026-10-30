import { useContext, useMemo, useRef, useState, type ReactElement } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { Typography } from '@safe-global/views/components/ui/typography'
import AllowlistConsent from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/AllowlistConsent'
import AllowlistSummary from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/AllowlistSummary'
import {
  getNextSignersText,
  POLICY_CHANGE_DELAY,
  REVIEW_SUMMARY_DESCRIPTION,
  reviewConsentLabel,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { SubmitCallback } from '@/components/tx-flow/TxFlow'
import {
  getAllowlistSafeLabel,
  isAllowlistGuardEnabled,
  toAllowlistRecipients,
  toAllowlistTokens,
} from '../utils/allowlistDisplay'
import type { RecipientAllowlistFlowData } from '../types'
import { REVIEW_STEP_TITLE } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/constants'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import ReviewTransactionSkeleton from '@/components/tx/ReviewTransactionV2/ReviewTransactionSkeleton'
import { useLoadFeature } from '@/features/__core__'
import { PolicyGuardFeature } from '@/features/policy-guard'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import { findSafeAccount } from '../../SafeAccountSelector/utils'
import { joinNames, spenderDisplayName } from '../../SpendingLimitFlow/Summary/describePolicy'
import useSpendingLimitTokenOptions from '../../SpendingLimitFlow/hooks/useSpendingLimitTokenOptions'
import { useAllowlistAddressInfo } from '../hooks/useAllowlistAddressInfo'
import { useRecipientAllowlistSafeAccounts } from '../hooks/useRecipientAllowlistSafeAccounts'
import { useSaveBeforeSubmit } from '../hooks/useSaveBeforeSubmit'
import AllowlistPolicyDetails from './AllowlistPolicyDetails'
import AllowlistSetupActions from './AllowlistSetupActions'
import { getInstalledFallback } from './ruleKind'
import { useBuildAllowlistTransaction } from './useBuildAllowlistTransaction'

/** Step 2, "Confirm policy": the allowlist as the prototype's summary, then the setup calls rule by rule. */
const ReviewRecipientAllowlist = ({ onSubmit, children, ...props }: ReviewTransactionProps): ReactElement => {
  const { data } = useContext<TxFlowContextType<RecipientAllowlistFlowData>>(TxFlowContext)
  const { safeTxError } = useContext(SafeTxContext)
  const scope = useSafeScope()
  const chainId = scope?.chainId
  const { accounts } = useRecipientAllowlistSafeAccounts()
  const { options: tokenOptions } = useSpendingLimitTokenOptions()
  const resolveName = useSafeNameResolver()
  const { safe } = useSafeInfo()
  const wallet = useWallet()
  const { describeSetupCall, decodeErc20TransferPolicyData } = useLoadFeature(PolicyGuardFeature)

  const rules = data?.rules
  const { guardState, configurations, root, txs } = useBuildAllowlistTransaction(rules ?? [])

  const request = useMemo(() => (configurations && root ? { configurations, root } : undefined), [configurations, root])
  const handleSubmit = useSaveBeforeSubmit(request, onSubmit)
  const [isConsentGiven, setIsConsentGiven] = useState(false)
  const [showConsentError, setShowConsentError] = useState(false)
  const consentRef = useRef<HTMLDivElement>(null)

  const selected = findSafeAccount(accounts, scope?.scopeKey)

  const tokens = useMemo(
    () =>
      toAllowlistTokens(
        (rules ?? []).map(({ tokenAddress }) => tokenAddress),
        tokenOptions,
      ),
    [rules, tokenOptions],
  )

  const recipients = useMemo(
    () => (data && chainId ? toAllowlistRecipients(data, (address) => resolveName(address, chainId)) : []),
    [data, chainId, resolveName],
  )

  const otherSigners = useMemo(() => {
    if (!chainId) return ''
    const names = safe.owners
      .filter(({ value }) => !wallet || !sameAddress(value, wallet.address))
      .map(({ value }) => spenderDisplayName({ address: value, name: resolveName(value, chainId) }))
    return joinNames(names)
  }, [safe.owners, wallet, resolveName, chainId])

  const named = useMemo(() => (selected ? [selected, ...recipients] : recipients), [selected, recipients])
  const getAddressInfo = useAllowlistAddressInfo(named)

  if (!guardState && !safeTxError) {
    return (
      <TxFlowStep title={REVIEW_STEP_TITLE} hideNonce>
        <ReviewTransactionSkeleton />
      </TxFlowStep>
    )
  }

  const hasSummary = Boolean(guardState && selected && chainId)

  // Signing locks the Safe to the allowlist, so the owner confirms that before continuing
  const submitWithConsent: SubmitCallback = (args) => {
    if (hasSummary && !isConsentGiven) {
      setShowConsentError(true)
      consentRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
      return
    }
    return handleSubmit(args)
  }

  return (
    <ReviewTransaction
      {...props}
      title={REVIEW_STEP_TITLE}
      withDecodedData={false}
      withMultisend={false}
      onSubmit={submitWithConsent}
    >
      {hasSummary && selected && (
        <AllowlistSummary
          accountLabel={getAllowlistSafeLabel(selected)}
          tokenSymbols={tokens.map(({ symbol }) => symbol)}
          recipientNames={recipients.map(spenderDisplayName)}
          isGuardEnabled={isAllowlistGuardEnabled(guardState)}
          description={REVIEW_SUMMARY_DESCRIPTION}
          tone="error"
        />
      )}

      {hasSummary && selected && (
        <AllowlistPolicyDetails
          safe={selected}
          tokens={tokens}
          recipients={recipients}
          fallback={chainId && configurations ? getInstalledFallback(chainId, configurations) : undefined}
          hasNativeRule={Boolean(rules?.some(({ tokenAddress }) => sameAddress(tokenAddress, ZERO_ADDRESS)))}
        />
      )}

      {hasSummary && selected && (
        <AllowlistConsent
          ref={consentRef}
          label={reviewConsentLabel(spenderDisplayName(selected), POLICY_CHANGE_DELAY)}
          checked={isConsentGiven}
          showError={showConsentError}
          onCheckedChange={setIsConsentGiven}
        />
      )}

      {hasSummary && otherSigners && safe.threshold > 1 && (
        <Typography variant="paragraph-small" color="muted" data-testid="allowlist-next-signers">
          {getNextSignersText(otherSigners)}
        </Typography>
      )}

      {children}

      {chainId && txs && configurations && describeSetupCall && decodeErc20TransferPolicyData && (
        <AllowlistSetupActions
          chainId={chainId}
          calls={txs}
          configurations={configurations}
          describeCall={describeSetupCall}
          decodeRecipients={decodeErc20TransferPolicyData}
          getAddressInfo={getAddressInfo}
        />
      )}
    </ReviewTransaction>
  )
}

export default ReviewRecipientAllowlist
