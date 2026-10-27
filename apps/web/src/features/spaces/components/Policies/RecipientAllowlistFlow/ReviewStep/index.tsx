import { useContext, type ReactElement } from 'react'
import { getAddress, isAddress } from 'ethers'
import type { Address } from 'viem'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import type { ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Typography } from '@safe-global/views/components/ui/typography'
import GuardPolicyCallout from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/Summary/GuardPolicyCallout'
import SummaryCard from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/Summary/SummaryCard'
import { APPLIES_TO_LABEL } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import {
  ALLOWLIST_CALLOUT_DESCRIPTION,
  ALLOWLIST_CALLOUT_TITLE,
  NATIVE_REVOKED_HELPER_TEXT,
  NATIVE_REVOKED_LABEL,
  RECIPIENTS_LABEL,
  TOKENS_LABEL,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import GuardPolicyReview from '../../GuardPolicyFlow/GuardPolicyReview'
import { buildGuardPolicy } from '../../GuardPolicyFlow/buildGuardPolicy'
import { useGuardPolicyContracts } from '../../GuardPolicyFlow/hooks/useGuardPolicyContracts'
import { usePolicyContracts } from '../../shared/usePolicyContracts'
import { isNativeTokenAddress } from '../../shared/erc20'
import { useNativeAllowlistRecipients } from '../hooks/useNativeAllowlistRecipients'
import { buildRecipientAllowlistBatch } from '../buildBatch'
import type { RecipientAllowlistFormValues } from '../types'

const addresses = (rows: Array<{ address: string }> = []): Address[] =>
  rows.filter((row) => isAddress(row.address)).map((row) => getAddress(row.address) as Address)

const AddressList = ({ items, chainId }: { items: Address[]; chainId: string }): ReactElement => (
  <div className="flex flex-col gap-2">
    {items.map((address) => (
      <EthHashInfo key={address} address={address} chainId={chainId} shortAddress={false} hasExplorer />
    ))}
  </div>
)

/**
 * Step 2: the allowlist in plain language, then the shared review. Without the policy guard the batch enables it
 * and applies the allowlist at once; with it, the review saves the configurations to CGW and proposes the request,
 * which the Policies page then takes through the delay and the apply step.
 */
const ReviewRecipientAllowlistPolicy = (props: ReviewTransactionProps): ReactElement => {
  const { data } = useContext<TxFlowContextType<RecipientAllowlistFormValues>>(TxFlowContext)
  const contracts = useGuardPolicyContracts(PolicyType.TokenWithdraw)
  const scope = useSafeScope()
  const safeAddress = contracts.safeAddress ?? ''

  const tokens = addresses(data?.tokens)
  const recipients = addresses(data?.recipients)
  const coversNative = tokens.some((token) => isNativeTokenAddress(token))

  const { policyContract: nativePolicyContract } = usePolicyContracts(
    contracts.chainId,
    safeAddress,
    PolicyType.NativeTransfer,
  )
  const { recipients: currentNativeRecipients, isLoading: isNativeLoading } = useNativeAllowlistRecipients(
    contracts.chainId,
    safeAddress,
  )
  const revoked = coversNative
    ? currentNativeRecipients.filter((current) => !recipients.some((recipient) => sameAddress(recipient, current)))
    : []

  // Without the Safe's current native recipients, a batch could leave a dropped one permitted
  const build = buildGuardPolicy(
    { ...contracts, isLoading: contracts.isLoading || (coversNative && isNativeLoading) },
    (context, policyContract) =>
      buildRecipientAllowlistBatch({
        ...context,
        policyContract,
        nativePolicyContract: nativePolicyContract as Address | undefined,
        currentNativeRecipients,
        tokens,
        recipients,
      }),
  )

  return (
    <GuardPolicyReview
      {...props}
      build={build}
      contracts={contracts}
      summary={
        <>
          <GuardPolicyCallout title={ALLOWLIST_CALLOUT_TITLE} description={ALLOWLIST_CALLOUT_DESCRIPTION} />

          <SummaryCard label={APPLIES_TO_LABEL} data-testid="recipient-allowlist-summary-safe">
            {scope && (
              <EthHashInfo address={scope.safeAddress} chainId={scope.chainId} shortAddress={false} hasExplorer />
            )}
          </SummaryCard>

          <SummaryCard label={TOKENS_LABEL} data-testid="recipient-allowlist-summary-tokens">
            <AddressList items={tokens} chainId={contracts.chainId} />
          </SummaryCard>

          <SummaryCard label={RECIPIENTS_LABEL} data-testid="recipient-allowlist-summary-recipients">
            <AddressList items={recipients} chainId={contracts.chainId} />
          </SummaryCard>

          {revoked.length > 0 && (
            <SummaryCard label={NATIVE_REVOKED_LABEL} data-testid="recipient-allowlist-summary-revoked">
              <div className="flex flex-col gap-2">
                <Typography variant="paragraph-mini" color="muted">
                  {NATIVE_REVOKED_HELPER_TEXT}
                </Typography>
                <AddressList items={revoked} chainId={contracts.chainId} />
              </div>
            </SummaryCard>
          )}
        </>
      }
    />
  )
}

export default ReviewRecipientAllowlistPolicy
