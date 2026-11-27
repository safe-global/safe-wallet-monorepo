import { useState, type ReactElement, type ReactNode } from 'react'
import { Check, Layers2 } from 'lucide-react'
import Identicon from '@safe-global/views/components/common/Identicon'
import { Badge } from '@safe-global/views/components/ui/badge'
import { SearchInput } from '@safe-global/views/components/ui/search-input'
import { formatSafeAddress, getSafeAddress, type MockWorkspace } from './fixtures'

export const MENU_ROW_CLASS =
  'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-hidden hover:bg-accent focus-visible:bg-accent'

type SafeListProps = {
  workspace: MockWorkspace
  /** The picked Safe, `null` for All Safes, or undefined when this workspace isn't the open one. */
  selected?: string | null
  /** A Workspace always has All Safes; My accounts has it once there are several Safes. */
  hasAllSafes: boolean
  onPick: (safe: string | null) => void
  autoFocus?: boolean
}

const Row = ({
  isSelected,
  onClick,
  testId,
  children,
}: {
  isSelected: boolean
  onClick: () => void
  testId: string
  children: ReactNode
}): ReactElement => (
  <li>
    <button
      type="button"
      className={MENU_ROW_CLASS}
      aria-current={isSelected || undefined}
      onClick={onClick}
      data-testid={testId}
    >
      {children}
      {isSelected && <Check className="ml-auto size-4 shrink-0" aria-hidden />}
    </button>
  </li>
)

/** A workspace's Safes with a search field: All Safes first, then each Safe with its network and short address. */
export const SafeList = ({
  workspace,
  selected,
  hasAllSafes,
  onPick,
  autoFocus = false,
}: SafeListProps): ReactElement => {
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  const safes = workspace.safes.filter((s) => !query || `${s.name} ${s.safe}`.toLowerCase().includes(query))
  const showAllSafes = hasAllSafes && (!query || 'all safes'.includes(query))

  return (
    <div className="flex flex-col gap-1" data-testid={`unified-safe-list-${workspace.context}`}>
      <SearchInput
        inputSize="sm"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onClear={() => setSearch('')}
        placeholder="Search Safes"
        aria-label={`Search Safes in ${workspace.name}`}
        autoFocus={autoFocus}
        autoComplete="off"
      />
      <ul className="flex max-h-72 flex-col overflow-y-auto" aria-label={`Safes in ${workspace.name}`}>
        {showAllSafes && (
          <Row isSelected={selected === null} onClick={() => onPick(null)} testId="unified-safe-all">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
              <Layers2 className="size-3.5" aria-hidden />
            </span>
            <span className="font-medium">All Safes</span>
            <Badge variant="secondary" size="sm">
              {workspace.safes.length}
            </Badge>
          </Row>
        )}
        {safes.map((s) => (
          <Row
            key={s.safe}
            isSelected={selected?.toLowerCase() === s.safe.toLowerCase()}
            onClick={() => onPick(s.safe)}
            testId="unified-safe-row"
          >
            <span className="shrink-0">
              <Identicon address={getSafeAddress(s.safe)} size={24} />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{s.name}</span>
              <span className="truncate font-mono text-xs text-muted-foreground">{formatSafeAddress(s.safe)}</span>
            </span>
          </Row>
        ))}
      </ul>
      {!showAllSafes && safes.length === 0 && (
        <p className="px-2 py-3 text-sm text-muted-foreground" role="status">
          No Safes match.
        </p>
      )}
    </div>
  )
}
