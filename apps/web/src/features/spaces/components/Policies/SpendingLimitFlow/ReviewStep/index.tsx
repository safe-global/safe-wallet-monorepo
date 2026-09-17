import { useContext, useMemo, type ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { getResetTimeOptions } from '@/features/spending-limits'
import useChainId from '@/hooks/useChainId'
import EthHashInfo from '@/components/common/EthHashInfo'
import TxCard from '@/components/tx-flow/common/TxCard'
import { parseSafeScopeKey } from '@/components/tx-flow/safe-scope'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import TxDetailsRow from '@/components/tx/ConfirmTxDetails/TxDetailsRow'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import useSpendingLimitTokenOptions from '../hooks/useSpendingLimitTokenOptions'
import { findTokenOption, tokenOptionLabel } from '../utils/tokenOptions'
import type { SpendingLimitPolicyFormValues } from '../types'
import { REVIEW_APPLIES_TO_LABEL, REVIEW_PLACEHOLDER_TEXT, REVIEW_STEP_TITLE } from '../constants'

/** Placeholder: shows what step 1 collected. Signing is not wired up yet, so the `TxFlow` props are ignored. */
const ReviewSpendingLimitPolicy = (): ReactElement => {
  const { data } = useContext<TxFlowContextType<SpendingLimitPolicyFormValues>>(TxFlowContext)
  const chainId = useChainId()
  const { options } = useSpendingLimitTokenOptions()
  const resetTimeOptions = useMemo(() => getResetTimeOptions(chainId), [chainId])
  const safe = data?.safe ? parseSafeScopeKey(data.safe) : undefined

  return (
    // Layout props are set per step, so the nonce has to be hidden here too while there is no transaction.
    <TxFlowStep title={REVIEW_STEP_TITLE} hideNonce>
      <TxCard>
        <div className="flex flex-col gap-4" data-testid="review-spending-limit-policy">
          {safe && (
            <TxDetailsRow label={REVIEW_APPLIES_TO_LABEL} grid>
              <EthHashInfo address={safe.safeAddress} chainId={safe.chainId} shortAddress showCopyButton hasExplorer />
            </TxDetailsRow>
          )}

          {data?.spenders.map((spender, spenderIndex) => (
            <div
              key={`${spender.address}-${spenderIndex}`}
              className="flex flex-col gap-2"
              data-testid="review-spender"
            >
              <EthHashInfo address={spender.address} shortAddress showCopyButton hasExplorer />
              <ul className="flex flex-col gap-1 pl-12">
                {spender.limits.map((limit, limitIndex) => {
                  const token = findTokenOption(options, limit.tokenAddress)
                  const period = resetTimeOptions.find((option) => option.value === limit.resetTime)
                  return (
                    <li key={`${limit.tokenAddress}-${limitIndex}`} data-testid="review-limit">
                      <Typography variant="paragraph-small">
                        {limit.amount} {token ? tokenOptionLabel(token) : shortenAddress(limit.tokenAddress)} ·{' '}
                        {period?.label ?? limit.resetTime}
                      </Typography>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          <Alert variant="info">
            <AlertSeverityIcon variant="info" />
            <AlertDescription>{REVIEW_PLACEHOLDER_TEXT}</AlertDescription>
          </Alert>
        </div>
      </TxCard>
    </TxFlowStep>
  )
}

export default ReviewSpendingLimitPolicy
