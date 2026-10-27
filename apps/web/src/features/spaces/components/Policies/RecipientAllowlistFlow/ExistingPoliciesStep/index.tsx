import { useContext, useMemo, useState, type ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import TxCard, { TxCardActions } from '@safe-global/views/components/tx-flow/common/TxCard'
import { Button } from '@safe-global/views/components/ui/button'
import ExistingPoliciesContent from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/ExistingPoliciesContent'
import {
  getRestrictedSpendingLimitDescription,
  getTokenInAllowlistText,
  getTokenNotInAllowlistText,
  RESTRICTED_SPENDING_LIMITS_DESCRIPTION,
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
  const contactName = (address: string) => (chainId ? addressBook.get(address, chainId)?.name : undefined)
  const rows = impacts.map(({ spender, allowance, restricted }) => ({
    key: `${spender}-${allowance.token.address}`,
    spender: <AccountIdentity address={spender} name={contactName(spender)} />,
    description: `${formatAllowanceAmount(allowance)} · ${restricted ? getTokenInAllowlistText(allowance.token.symbol) : getTokenNotInAllowlistText(allowance.token.symbol)}`,
    restricted,
  }))
  const restrictedImpacts = impacts.filter(({ restricted }) => restricted)
  const [onlyRestricted] = restrictedImpacts
  const description =
    restrictedImpacts.length === 1
      ? getRestrictedSpendingLimitDescription(
          contactName(onlyRestricted.spender) || shortenAddress(onlyRestricted.spender),
          onlyRestricted.allowance.token.symbol,
          formatAllowanceAmount(onlyRestricted.allowance),
          onlyRestricted.recipients.length,
        )
      : RESTRICTED_SPENDING_LIMITS_DESCRIPTION

  return (
    <TxCard>
      <div className="flex flex-col gap-5" data-testid="recipient-allowlist-existing-policies-step">
        <ExistingPoliciesContent
          safeName={safeName}
          description={description}
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
