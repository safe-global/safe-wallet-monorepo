import { SelectLabel } from '@/components/ui/select'
import SafeRowStats from '../../../SafeSelectorDropdown/components/SafeRowStats'
import SafeIdentity from './SafeIdentity'
import { AccountBalance, toStatChains } from './SafeAccountRow'
import type { SafeAccountGroup } from '../types'

/**
 * A Safe eligible on more than one chain: its identity, setup, networks and total balance.
 *
 * Renders a group label — a plain `<div>` with no `option` role — so no entry can stand for "all
 * chains". The chain rows below are the selectable ones.
 */
const SafeAccountGroupHeader = ({ group }: { group: SafeAccountGroup }) => (
  // text-foreground: `SelectLabel` is muted by default, but this carries a Safe's identity and must read
  // at the same weight as the rows' names.
  <SelectLabel
    data-testid="safe-account-group-header"
    className="text-foreground flex min-w-0 items-center gap-3 px-3 py-2.5"
  >
    <SafeIdentity address={group.address} name={group.name} />
    <SafeRowStats
      threshold={group.threshold ?? 0}
      owners={group.owners ?? 0}
      chains={toStatChains(group.accounts)}
      pending={0}
      showPending={false}
      // Icon-only unless every chain agrees on the setup.
      thresholdIconOnly={group.owners === undefined}
    />
    <AccountBalance fiatTotal={group.fiatTotal} />
  </SelectLabel>
)

export default SafeAccountGroupHeader
