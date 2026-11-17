import { useCallback, useContext, useEffect, useMemo, useRef, type ReactElement } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { Typography } from '@safe-global/views/components/ui/typography'
import AllowlistSummary from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/AllowlistSummary'
import {
  getNextSignersText,
  REVIEW_SUMMARY_DESCRIPTION,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import {
  getAllowlistSafeLabel,
  isAllowlistGuardEnabled,
  toAllowlistRecipients,
  toAllowlistTokens,
} from '../utils/allowlistDisplay'
import type { RecipientAllowlistFlowData } from '../types'
import { REVIEW_STEP_TITLE } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/constants'
import type { SubmitCallback } from '@/components/tx-flow/TxFlow'
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
import { useRecipientAllowlistSafeAccounts } from '../hooks/useRecipientAllowlistSafeAccounts'
import { useSaveAllowlistConfiguration } from '../hooks/useSaveAllowlistConfiguration'
import AllowlistPolicyDetails from './AllowlistPolicyDetails'
import AllowlistSetupActions from './AllowlistSetupActions'
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

  const { save, isSaving } = useSaveAllowlistConfiguration()
  const { setIsSubmitLoading, setIsSubmitDisabled } = useContext(TxFlowContext)

  useEffect(() => {
    setIsSubmitLoading(isSaving)
  }, [isSaving, setIsSubmitLoading])

  useEffect(() => {
    setIsSubmitDisabled(!configurations || isSaving)
  }, [configurations, isSaving, setIsSubmitDisabled])

  useEffect(
    () => () => {
      setIsSubmitLoading(false)
      setIsSubmitDisabled(false)
    },
    [setIsSubmitLoading, setIsSubmitDisabled],
  )

  // The disabled state lands a render late, so a fast double click would otherwise save twice.
  const isSubmittingRef = useRef(false)
  const handleSubmit = useCallback<SubmitCallback>(
    async (args) => {
      if (!configurations || !root || isSubmittingRef.current) return
      isSubmittingRef.current = true
      try {
        if (await save({ configurations, root })) onSubmit(args)
      } finally {
        isSubmittingRef.current = false
      }
    },
    [configurations, root, save, onSubmit],
  )

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

  const getAddressInfo = useCallback(
    (address: string) => {
      const token = tokens.find((item) => sameAddress(item.address, address))
      if (token) return { name: token.symbol, logoUri: token.logoUri }
      if (selected && sameAddress(selected.address, address)) return { name: selected.name }
      const recipient = recipients.find((item) => sameAddress(item.address, address))
      if (recipient) return { name: recipient.name }
      return { name: resolveName(address, chainId) || undefined }
    },
    [tokens, selected, recipients, chainId, resolveName],
  )

  if (!guardState && !safeTxError) {
    return (
      <TxFlowStep title={REVIEW_STEP_TITLE} hideNonce>
        <ReviewTransactionSkeleton />
      </TxFlowStep>
    )
  }

  const hasSummary = Boolean(guardState && selected && chainId)

  return (
    <ReviewTransaction
      {...props}
      title={REVIEW_STEP_TITLE}
      withDecodedData={false}
      withMultisend={false}
      onSubmit={handleSubmit}
    >
      {hasSummary && selected && (
        <AllowlistSummary
          accountLabel={getAllowlistSafeLabel(selected)}
          tokenSymbols={tokens.map(({ symbol }) => symbol)}
          recipientNames={recipients.map(spenderDisplayName)}
          isGuardEnabled={isAllowlistGuardEnabled(guardState)}
          description={REVIEW_SUMMARY_DESCRIPTION}
        />
      )}

      {hasSummary && selected && <AllowlistPolicyDetails safe={selected} tokens={tokens} recipients={recipients} />}

      {hasSummary && otherSigners && safe.threshold > 1 && (
        <Typography variant="paragraph-small" color="muted" data-testid="allowlist-next-signers">
          {getNextSignersText(otherSigners)}
        </Typography>
      )}

      {children}

      {txs && configurations && describeSetupCall && decodeErc20TransferPolicyData && (
        <AllowlistSetupActions
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
