import { useContext, type ReactElement } from 'react'
import { getAddress, isAddress } from 'ethers'
import type { Address } from 'viem'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import type { ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import EthHashInfo from '@/components/common/EthHashInfo'
import GuardPolicyCallout from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/Summary/GuardPolicyCallout'
import SummaryCard from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/Summary/SummaryCard'
import {
  APPLIES_TO_LABEL,
  RECIPIENTS_LABEL,
  TOKENS_LABEL,
  TOKEN_ALLOWLIST_CALLOUT_TITLE,
  TOKEN_ALLOWLIST_COPY,
} from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import type { TokenAllowlistFormValues } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/types'
import GuardPolicyReview from '../../GuardPolicyFlow/GuardPolicyReview'
import { buildGuardPolicy } from '../../GuardPolicyFlow/buildGuardPolicy'
import { useGuardPolicyContracts } from '../../GuardPolicyFlow/hooks/useGuardPolicyContracts'
import useSpendingLimitTokenOptions from '../../SpendingLimitFlow/hooks/useSpendingLimitTokenOptions'
import { buildTokenWithdrawBatch } from '../buildBatch'

const addresses = (rows: Array<{ address: string }> = []): Address[] =>
  rows.filter((row) => isAddress(row.address)).map((row) => getAddress(row.address) as Address)

/** Step 2: the allowlist in plain language, then the shared transaction review. */
const ReviewTokenAllowlistPolicy = (props: ReviewTransactionProps): ReactElement => {
  const { data } = useContext<TxFlowContextType<TokenAllowlistFormValues>>(TxFlowContext)
  const contracts = useGuardPolicyContracts(PolicyType.TokenWithdraw)
  const scope = useSafeScope()

  const tokens = addresses(data?.tokens)
  const recipients = addresses(data?.recipients)

  // The snapshot is what the Policies page names a pending request by, so it carries the token
  // metadata the selector already resolved rather than bare addresses.
  const { options } = useSpendingLimitTokenOptions()
  const tokenInfo = (address: Address) => {
    const option = options.find((candidate) => candidate.address.toLowerCase() === address.toLowerCase())
    return {
      address,
      symbol: option?.symbol ?? '',
      decimals: option?.decimals ?? 0,
      logoUri: option?.logoUri,
    }
  }

  const build = buildGuardPolicy(contracts, (context, policyContract) =>
    buildTokenWithdrawBatch({
      ...context,
      policyContract,
      allowlist: tokens.map((token) => ({
        token,
        recipients: recipients.map((address) => ({ address, allowed: true })),
      })),
    }),
  )

  return (
    <GuardPolicyReview
      {...props}
      type={PolicyType.TokenWithdraw}
      build={build}
      contracts={contracts}
      snapshotData={{
        allowlist: tokens.map((token) => ({
          token: tokenInfo(token),
          recipients: recipients.map((address) => ({ address })),
        })),
      }}
      summary={
        <>
          <GuardPolicyCallout title={TOKEN_ALLOWLIST_CALLOUT_TITLE} description={TOKEN_ALLOWLIST_COPY.description} />

          <SummaryCard label={APPLIES_TO_LABEL} data-testid="token-allowlist-summary-safe">
            {scope && (
              <EthHashInfo address={scope.safeAddress} chainId={scope.chainId} shortAddress={false} hasExplorer />
            )}
          </SummaryCard>

          <SummaryCard label={TOKENS_LABEL} data-testid="token-allowlist-summary-tokens">
            <div className="flex flex-col gap-2">
              {tokens.map((token) => (
                <EthHashInfo key={token} address={token} chainId={contracts.chainId} shortAddress={false} hasExplorer />
              ))}
            </div>
          </SummaryCard>

          <SummaryCard label={RECIPIENTS_LABEL} data-testid="token-allowlist-summary-recipients">
            <div className="flex flex-col gap-2">
              {recipients.map((recipient) => (
                <EthHashInfo
                  key={recipient}
                  address={recipient}
                  chainId={contracts.chainId}
                  shortAddress={false}
                  hasExplorer
                />
              ))}
            </div>
          </SummaryCard>
        </>
      }
    />
  )
}

export default ReviewTokenAllowlistPolicy
