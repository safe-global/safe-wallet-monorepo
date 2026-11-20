import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import Identicon from '@safe-global/views/components/common/Identicon'
import { getSignerIdentity, getSignerName } from '../../services/model'
import { isYou } from '../../services/personas'
import type { SignerLoad } from '../../services/flags'
import type { Persona } from '../../types'
import { FilterOption, FilterSectionTitle, SearchableOptions } from './QueueFilters'

// Signer section in the Filter menu. It takes one signer at a time.
export function SignerFilterMenu({
  load,
  persona,
  signer,
  onSignerChange,
}: {
  load: SignerLoad[]
  persona: Persona
  signer: string | null
  onSignerChange: (id: string | null) => void
}) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <FilterSectionTitle title="Signer" summary={signer ? '1' : undefined} />
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-60">
        <p className="px-2 py-1.5 text-xs text-muted-foreground">Transactions still waiting on</p>
        <SearchableOptions
          items={load}
          noun="signers"
          getText={({ id }) => getSignerName(id)}
          render={({ id, txs, member }) => (
            <FilterOption
              key={id}
              label={`${getSignerName(id)}${isYou(id, persona) ? ' (you)' : ''}${member ? '' : ' (outside)'}`}
              checked={signer === id}
              count={txs.length}
              icon={<Identicon address={getSignerIdentity(id).address} size={16} />}
              onToggle={() => onSignerChange(signer === id ? null : id)}
            />
          )}
        />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
