import { CalendarClock } from 'lucide-react'
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import Identicon from '@/components/common/Identicon'
import { getSignerIdentity, getSignerName } from '../../services/model'
import { isYou } from '../../services/personas'
import { PROPOSED_OPTIONS, proposedWithin, type ProposedWithin, type SignerLoad } from '../../services/fleet'
import type { Persona, Proposal } from '../../types'
import { FilterOption, FilterSectionTitle } from '../QueueFilters/QueueFilters'

// Signer section in the Filter menu, for both options. Fleet admin also gets Proposal date. Each takes one value.
export function FleetFilterMenu({
  items,
  load,
  persona,
  signer,
  onSignerChange,
  proposed,
  onProposedChange,
}: {
  items: Proposal[]
  load: SignerLoad[]
  persona: Persona
  signer: string | null
  onSignerChange: (id: string | null) => void
  proposed?: ProposedWithin | null
  // Leave out to hide the Proposal date section.
  onProposedChange?: (value: ProposedWithin | null) => void
}) {
  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <FilterSectionTitle title="Signer" summary={signer ? '1' : undefined} />
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-60">
          <p className="px-2 py-1.5 text-xs text-muted-foreground">Transactions still waiting on</p>
          {load.map(({ id, txs, member }) => (
            <FilterOption
              key={id}
              label={`${getSignerName(id)}${isYou(id, persona) ? ' (you)' : ''}${member ? '' : ' (outside)'}`}
              checked={signer === id}
              count={txs.length}
              icon={<Identicon address={getSignerIdentity(id).address} size={16} />}
              onToggle={() => onSignerChange(signer === id ? null : id)}
            />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      {onProposedChange && (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FilterSectionTitle title="Proposal date" summary={proposed ? '1' : undefined} />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            {PROPOSED_OPTIONS.map(({ value, label }) => (
              <FilterOption
                key={value}
                label={label}
                checked={proposed === value}
                count={items.filter((tx) => proposedWithin(tx, value)).length}
                icon={<CalendarClock className="size-4 text-muted-foreground" strokeWidth={ICON_STROKE} />}
                onToggle={() => onProposedChange(proposed === value ? null : value)}
              />
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )}
    </>
  )
}
