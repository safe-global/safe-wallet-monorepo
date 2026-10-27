import { useCallback, useContext, useEffect, useMemo, type ReactElement } from 'react'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { Typography } from '@safe-global/views/components/ui/typography'
import AllowlistSummary from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/AllowlistSummary'
import {
  getAllowlistAccountLabel,
  getNextSignersText,
  REVIEW_SUMMARY_DESCRIPTION,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { getUniqueSelectedRecipients } from '../utils/allowlistForm'
import type { RecipientAllowlistFlowData } from '../types'
import { REVIEW_STEP_TITLE } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/constants'
import type { SubmitCallback } from '@/components/tx-flow/TxFlow'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import ReviewTransactionSkeleton from '@/components/tx/ReviewTransactionV2/ReviewTransactionSkeleton'
import { useLoadFeature } from '@/features/__core__'
import { PolicyGuardFeature } from '@/features/policy-guard'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import { useChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import { chainLabel, findSafeAccount } from '../../SafeAccountSelector/utils'
import { joinNames } from '../../SpendingLimitFlow/Summary/describePolicy'
import { findTokenOption, tokenOptionLabel } from '../../SpendingLimitFlow/utils/tokenOptions'
import useSpendingLimitTokenOptions from '../../SpendingLimitFlow/hooks/useSpendingLimitTokenOptions'
import { useRecipientAllowlistSafeAccounts } from '../hooks/useRecipientAllowlistSafeAccounts'
import { useSaveAllowlistConfiguration } from '../hooks/useSaveAllowlistConfiguration'
import AllowlistPolicyDetails, { type ReviewRecipient, type ReviewToken } from './AllowlistPolicyDetails'
import AllowlistSetupActions from './AllowlistSetupActions'
import { useBuildAllowlistTransaction } from './useBuildAllowlistTransaction'

/** Step 2, "Confirm policy": the allowlist as the prototype's summary, then the setup calls rule by rule. */
const ReviewRecipientAllowlist = ({ onSubmit, children, ...props }: ReviewTransactionProps): ReactElement => {
  const { data } = useContext<TxFlowContextType<RecipientAllowlistFlowData>>(TxFlowContext)
  const { safeTxError } = useContext(SafeTxContext)
  const scope = useSafeScope()
  const chainId = scope?.chainId
  const chain = useChain(chainId ?? '')
  const { accounts } = useRecipientAllowlistSafeAccounts()
  const { options: tokenOptions } = useSpendingLimitTokenOptions()
  const addressBook = useMergedAddressBooks(chainId)
  const { safe } = useSafeInfo()
  const wallet = useWallet()
  const { describeSetupCall, decodeErc20TransferPolicyData } = useLoadFeature(PolicyGuardFeature)

  const rules = useMemo(() => data?.rules ?? [], [data?.rules])
  const { guardState, configurations, configureRoot, calls } = useBuildAllowlistTransaction(rules)

  const { save, isSaving } = useSaveAllowlistConfiguration()
  const { setIsSubmitLoading, setIsSubmitDisabled } = useContext(TxFlowContext)

  useEffect(() => {
    setIsSubmitLoading(isSaving)
  }, [isSaving, setIsSubmitLoading])

  useEffect(() => {
    setIsSubmitDisabled(!configurations)
  }, [configurations, setIsSubmitDisabled])

  useEffect(
    () => () => {
      setIsSubmitLoading(false)
      setIsSubmitDisabled(false)
    },
    [setIsSubmitLoading, setIsSubmitDisabled],
  )

  const handleSubmit = useCallback<SubmitCallback>(
    async (args) => {
      if (!configurations || !configureRoot) return
      if (await save({ configurations, configureRoot })) onSubmit(args)
    },
    [configurations, configureRoot, save, onSubmit],
  )

  const selected = findSafeAccount(accounts, scope?.scopeKey)

  const tokens = useMemo(
    (): ReviewToken[] =>
      rules.map(({ tokenAddress }) => {
        const option = findTokenOption(tokenOptions, tokenAddress)
        const isNative = tokenAddress === ZERO_ADDRESS
        return {
          address: tokenAddress,
          symbol:
            (option ? tokenOptionLabel(option) : isNative ? chain?.nativeCurrency.symbol : undefined) ||
            shortenAddress(tokenAddress),
          logoUri: option?.logoUri ?? (isNative ? chain?.nativeCurrency.logoUri : undefined),
        }
      }),
    [rules, tokenOptions, chain],
  )

  const recipients = useMemo((): ReviewRecipient[] => {
    if (!data || !chainId) return []
    return getUniqueSelectedRecipients(data).map(({ address, name, fromAddressBook }) => ({
      address,
      name: name || addressBook.get(address, chainId)?.name,
      isInAddressBook: Boolean(fromAddressBook) || addressBook.has(address, chainId),
    }))
  }, [data, chainId, addressBook])

  const otherSigners = useMemo(() => {
    if (!chainId) return ''
    const names = safe.owners
      .filter(({ value }) => !wallet || !sameAddress(value, wallet.address))
      .map(({ value }) => addressBook.get(value, chainId)?.name || shortenAddress(value))
    return joinNames(names)
  }, [safe.owners, wallet, addressBook, chainId])

  const getAddressInfo = useCallback(
    (address: string) => {
      const token = tokens.find((item) => sameAddress(item.address, address))
      if (token) return { name: token.symbol, logoUri: token.logoUri }
      if (selected && sameAddress(selected.address, address)) return { name: selected.name }
      const recipient = recipients.find((item) => sameAddress(item.address, address))
      if (recipient) return { name: recipient.name }
      return { name: chainId ? addressBook.get(address, chainId)?.name : undefined }
    },
    [tokens, selected, recipients, chainId, addressBook],
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
    <ReviewTransaction {...props} title={REVIEW_STEP_TITLE} withDecodedData={false} onSubmit={handleSubmit}>
      {hasSummary && selected && (
        <AllowlistSummary
          accountLabel={getAllowlistAccountLabel(
            selected.name || shortenAddress(selected.address),
            chainLabel(selected),
          )}
          tokenSymbols={tokens.map(({ symbol }) => symbol)}
          recipientNames={recipients.map(({ name, address }) => name || shortenAddress(address))}
          isGuardEnabled={guardState?.status !== 'none'}
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

      {chainId && calls && configurations && describeSetupCall && decodeErc20TransferPolicyData && (
        <AllowlistSetupActions
          chainId={chainId}
          calls={calls}
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
