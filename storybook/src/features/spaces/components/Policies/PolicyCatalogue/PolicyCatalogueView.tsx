import { type ReactElement } from 'react'
import PolicyCatalogueTile from './PolicyCatalogueTile'
import type { PolicyCatalogueEntry, PolicyCatalogueId } from './catalogue'
import type { PolicyAccountCount } from '../policyLock'

export type PolicyCatalogueViewProps = {
  entries: PolicyCatalogueEntry[]
  isLocked: (id: PolicyCatalogueId) => boolean
  getAccountCount: (entry: PolicyCatalogueEntry) => PolicyAccountCount | undefined
  onTileClick: (entry: PolicyCatalogueEntry) => void
}

export const PolicyCatalogueView = ({
  entries,
  isLocked,
  getAccountCount,
  onTileClick,
}: PolicyCatalogueViewProps): ReactElement => (
  <div data-testid="policy-catalogue" className="grid gap-4 md:grid-cols-3">
    {entries.map((entry) => (
      <PolicyCatalogueTile
        key={entry.id}
        {...entry}
        locked={isLocked(entry.id)}
        accountCount={getAccountCount(entry)}
        onClick={() => onTileClick(entry)}
      />
    ))}
  </div>
)
