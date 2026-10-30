import { useContext, useMemo, useRef, useState, type ReactElement } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { Typography } from '@safe-global/views/components/ui/typography'
import AllowlistConsent from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/AllowlistConsent'
import AllowlistSummary from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/AllowlistSummary'
import {
  EDIT_SUMMARY_DETAILS,
  getEditReviewDescription,
  getNextSignersText,
  formatPolicyChangeDelay,
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
import { getLiveRecipients, markAllowlistChanges, toAllowlistRules } from '../utils/allowlistEdit'
import type { RecipientAllowlistFlowData } from '../types'
import { REVIEW_STEP_TITLE } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/constants'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import ReviewTransactionSkeleton from '@/components/tx/ReviewTransactionV2/ReviewTransactionSkeleton'
import { useLoadFeature } from '@/features/__core__'
import { PolicyGuardFeature, usePolicyGuardDelay } from '@/features/policy-guard'
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
  const baseline = data?.baseline
  const baselineRules = useMemo(() => (baseline ? toAllowlistRules(baseline) : undefined), [baseline])
  const { guardState, configurations, root, txs } = useBuildAllowlistTransaction(
    rules ?? [],
    baselineRules,
    data?.baselineGuard,
  )

  const installedGuard =
    guardState?.status === 'known' || guardState?.status === 'partial' ? guardState.guardAddress : undefined
  const changeDelay = formatPolicyChangeDelay(usePolicyGuardDelay(chainId ?? '', installedGuard))

  const request = useMemo(() => (configurations && root ? { configurations, root } : undefined), [configurations, root])
  const handleSubmit = useSaveBeforeSubmit(request, onSubmit)
  const [isConsentGiven, setIsConsentGiven] = useState(false)
  const [showConsentError, setShowConsentError] = useState(false)
  const consentRef = useRef<HTMLDivElement>(null)

  const selected = findSafeAccount(accounts, scope?.scopeKey)

  const liveTokens = useMemo(
    () => (baseline ?? []).map(({ token }) => ({ ...token, logoUri: token.logoUri ?? undefined })),
    [baseline],
  )

  const tokens = useMemo(
    () =>
      toAllowlistTokens(
        (rules ?? []).map(({ tokenAddress }) => tokenAddress),
        tokenOptions,
        liveTokens,
      ),
    [rules, tokenOptions, liveTokens],
  )

  const recipients = useMemo(
    () => (data && chainId ? toAllowlistRecipients(data, (address) => resolveName(address, chainId)) : []),
    [data, chainId, resolveName],
  )

  const markedTokens = useMemo(() => {
    if (!baseline) return tokens
    const previous = toAllowlistTokens(
      liveTokens.map(({ address }) => address),
      tokenOptions,
      liveTokens,
    )
    return markAllowlistChanges(tokens, previous, ({ address }) => address.toLowerCase())
  }, [baseline, tokens, liveTokens, tokenOptions])

  const markedRecipients = useMemo(() => {
    if (!baselineRules || !chainId) return recipients
    const previous = getLiveRecipients(baselineRules).map((address) => {
      const name = resolveName(address, chainId)
      return { address, name: name || undefined, isInAddressBook: Boolean(name) }
    })
    return markAllowlistChanges(recipients, previous, ({ address }) => address.toLowerCase())
  }, [baselineRules, recipients, chainId, resolveName])

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
          description={baseline ? getEditReviewDescription(changeDelay) : REVIEW_SUMMARY_DESCRIPTION}
          details={baseline ? EDIT_SUMMARY_DETAILS : undefined}
          tone="error"
        />
      )}

      {hasSummary && selected && (
        <AllowlistPolicyDetails
          safe={selected}
          tokens={markedTokens}
          recipients={markedRecipients}
          fallback={chainId && configurations ? getInstalledFallback(chainId, configurations) : undefined}
          hasNativeRule={Boolean(rules?.some(({ tokenAddress }) => sameAddress(tokenAddress, ZERO_ADDRESS)))}
        />
      )}

      {hasSummary && selected && (
        <AllowlistConsent
          ref={consentRef}
          label={reviewConsentLabel(spenderDisplayName(selected), changeDelay)}
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
