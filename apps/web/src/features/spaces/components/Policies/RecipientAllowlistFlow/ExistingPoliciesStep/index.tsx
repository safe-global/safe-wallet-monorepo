import { useContext, useMemo, useState, type ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import TxCard, { TxCardActions } from '@safe-global/views/components/tx-flow/common/TxCard'
import { Button } from '@safe-global/views/components/ui/button'
import ExistingPoliciesContent, {
  type ExistingPoliciesContentProps,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/ExistingPoliciesContent'
import {
  BLOCKED_SPENDING_LIMITS_DESCRIPTION,
  getBlockedSpendingLimitDescription,
  getBlockedSpendingLimitsTitle,
  getRestrictedSpendingLimitsTitle,
  getTokenInAllowlistText,
  getTokenNotInAllowlistText,
  RESTRICTED_SPENDING_LIMITS_DESCRIPTION,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { RecipientAllowlistFlowData } from '../types'
import { formatAllowanceAmount } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/format'
import { formatAllowance } from '@safe-global/views/features/spaces/components/Policies/utils/policyLabel'
import { NEXT_LABEL } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/constants'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import { AccountIdentity } from '../../components/AccountIdentity'
import { findSafeAccount } from '../../SafeAccountSelector/utils'
import { useRecipientAllowlistSafeAccounts } from '../hooks/useRecipientAllowlistSafeAccounts'
import { useSpendingLimitImpacts } from '../hooks/useSpendingLimitImpacts'

/** Shown when the picked Safe has an active spending limit, which the allowlist blocks or restricts: Next waits for the acknowledgement. */
const ExistingPoliciesStep = (): ReactElement => {
  const { data, onNext } = useContext<TxFlowContextType<RecipientAllowlistFlowData>>(TxFlowContext)
  const rules = useMemo(() => data?.rules ?? [], [data?.rules])
  const impacts = useSpendingLimitImpacts(rules)
  const scope = useSafeScope()
  const chainId = scope?.chainId
  const addressBook = useMergedAddressBooks(chainId)
  const { accounts } = useRecipientAllowlistSafeAccounts()
  const selectedSafe = findSafeAccount(accounts, scope?.scopeKey)
  const [acknowledged, setAcknowledged] = useState(false)

  const safeName = selectedSafe?.name || (scope?.safeAddress ? shortenAddress(scope.safeAddress) : '')
  const contactName = (address: string) => (chainId ? addressBook.get(address, chainId)?.name : undefined)
  const rows = impacts.map(({ spender, allowance, impact }) => ({
    key: `${spender}-${allowance.token.address}`,
    spender: <AccountIdentity address={spender} name={contactName(spender)} />,
    description: `${formatAllowanceAmount(allowance)} · ${impact === 'restricted' ? getTokenInAllowlistText(allowance.token.symbol) : getTokenNotInAllowlistText(allowance.token.symbol)}`,
    impact,
  }))
  const blocked = impacts.filter(({ impact }) => impact === 'blocked')
  const [onlyBlocked] = blocked
  const banner: ExistingPoliciesContentProps['banner'] =
    blocked.length === 0
      ? {
          tone: 'info',
          title: getRestrictedSpendingLimitsTitle(impacts.length),
          description: RESTRICTED_SPENDING_LIMITS_DESCRIPTION,
        }
      : {
          tone: 'warning',
          title: getBlockedSpendingLimitsTitle(blocked.length),
          description:
            blocked.length === 1
              ? getBlockedSpendingLimitDescription(
                  contactName(onlyBlocked.spender) || shortenAddress(onlyBlocked.spender),
                  formatAllowance(onlyBlocked.allowance),
                  onlyBlocked.allowance.token.symbol,
                )
              : BLOCKED_SPENDING_LIMITS_DESCRIPTION,
        }

  return (
    <TxCard>
      <div className="flex flex-col gap-5" data-testid="recipient-allowlist-existing-policies-step">
        <ExistingPoliciesContent
          safeName={safeName}
          banner={banner}
          rows={rows}
          acknowledged={acknowledged}
          onAcknowledgedChange={setAcknowledged}
        />

        <TxCardActions>
          <Button
            type="button"
            size="submit"
            disabled={!acknowledged}
            onClick={() => onNext(data)}
            data-testid="next-btn"
          >
            {NEXT_LABEL}
          </Button>
        </TxCardActions>
      </div>
    </TxCard>
  )
}

export default ExistingPoliciesStep
