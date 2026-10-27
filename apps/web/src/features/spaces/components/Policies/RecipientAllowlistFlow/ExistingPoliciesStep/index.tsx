import { useContext, useMemo, useState, type ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import TxCard, { TxCardActions } from '@safe-global/views/components/tx-flow/common/TxCard'
import { Button } from '@safe-global/views/components/ui/button'
import ExistingPoliciesContent from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/ExistingPoliciesContent'
import {
  getImpactAfterText,
  getImpactTodayText,
  getTokenInAllowlistText,
  getTokenNotInAllowlistText,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { RecipientAllowlistFlowData } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/types'
import { formatAllowanceAmount } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/format'
import { NEXT_LABEL } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/constants'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import { AccountIdentity } from '../../components/AccountIdentity'
import { findSafeAccount } from '../../SafeAccountSelector/utils'
import { useRecipientAllowlistSafeAccounts } from '../hooks/useRecipientAllowlistSafeAccounts'
import { useSpendingLimitImpacts } from '../hooks/useSpendingLimitImpacts'

/** Shown only when the allowlist restricts a spending limit on the picked Safe: Next waits for the acknowledgement. */
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
  const rows = impacts.map(({ spender, allowance, restricted, recipients }) => {
    const amount = formatAllowanceAmount(allowance)
    const { symbol } = allowance.token

    return {
      key: `${spender}-${allowance.token.address}`,
      spender: (
        <AccountIdentity address={spender} name={chainId ? addressBook.get(spender, chainId)?.name : undefined} />
      ),
      description: `${amount} · ${restricted ? getTokenInAllowlistText(symbol) : getTokenNotInAllowlistText(symbol)}`,
      restriction: restricted
        ? { today: getImpactTodayText(symbol, amount), after: getImpactAfterText(symbol, recipients.length, amount) }
        : undefined,
    }
  })

  return (
    <TxCard>
      <div className="flex flex-col gap-5" data-testid="recipient-allowlist-existing-policies-step">
        <ExistingPoliciesContent
          safeName={safeName}
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
