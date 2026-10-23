import { useMemo, useState } from 'react'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Label } from '@safe-global/views/components/ui/label'
import { cn } from '@safe-global/views/utils/cn'
import ChainLogos from '../ChainLogos'
import GroupedAddress from '../GroupedAddress'
import { TagChips } from '../tags/TagChip'
import type { ChainInfo } from '../types'

export type ImportStatus =
  | 'new'
  | 'name-differs'
  | 'adds-tags'
  | 'adds-chains'
  | 'unchanged'
  | 'same-name-different-address'
  | 'look-alike'
  | 'invalid'
  | 'duplicate'

/** Most severe first, which is also the order of the status filter. */
export const IMPORT_STATUS_ORDER: ImportStatus[] = [
  'invalid',
  'duplicate',
  'look-alike',
  'same-name-different-address',
  'name-differs',
  'adds-tags',
  'adds-chains',
  'new',
  'unchanged',
]

export const IMPORT_STATUS_LABELS: Record<ImportStatus, string> = {
  new: 'New',
  'name-differs': 'Name differs',
  'adds-tags': 'Adds tags',
  'adds-chains': 'Adds chains',
  unchanged: 'Unchanged',
  'same-name-different-address': 'Same name',
  'look-alike': 'Look-alike',
  invalid: 'Invalid',
  duplicate: 'Duplicate',
}

const STATUS_VARIANT: Record<ImportStatus, 'success' | 'info' | 'warning' | 'negative' | 'subtle'> = {
  new: 'success',
  'name-differs': 'info',
  'adds-tags': 'info',
  'adds-chains': 'info',
  unchanged: 'subtle',
  'same-name-different-address': 'warning',
  'look-alike': 'warning',
  invalid: 'negative',
  duplicate: 'subtle',
}

/** One file row, already classified against the book. */
export type ImportReviewRow = {
  id: string
  /** Line in the file, for the user to find it. */
  line: number
  name: string
  address: string
  status: ImportStatus
  /** Why an invalid row was rejected. */
  reason?: string
  /** The saved contact this row relates to: same address, the look-alike, or the owner of the name. */
  existing?: { name: string; address: string }
  /** Chains and tags after merging with the saved contact. */
  chains: ChainInfo[]
  tags: string[]
  /** False for rows that can never be imported (invalid, duplicate, unchanged). */
  canInclude: boolean
  includedByDefault: boolean
}

export type ImportDecision = { included: boolean; nameAction: 'keep-existing-name' | 'rename'; verified: boolean }

export const isRowIncluded = (row: ImportReviewRow, decision: ImportDecision): boolean =>
  row.canInclude && decision.included && (row.status !== 'look-alike' || decision.verified)

const isUpdate = (row: ImportReviewRow) =>
  row.existing !== undefined && row.existing.address.toLowerCase() === row.address.toLowerCase()

const pluralize = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

export const getImportButtonLabel = (newCount: number, updateCount: number): string => {
  const base = `Import ${pluralize(newCount, 'contact')}`
  return updateCount > 0 ? `${base} · ${pluralize(updateCount, 'update')}` : base
}

const GROUP_SIZE = 4

/** The full address with the characters that differ from `other` in bold red. */
const HighlightedAddress = ({ address, other }: { address: string; other: string }) => {
  const checksummed = checksumAddress(address)
  const otherLower = other.toLowerCase()
  const chars = checksummed.slice(2).split('')
  const groups = Array.from({ length: Math.ceil(chars.length / GROUP_SIZE) }, (_, index) =>
    chars.slice(index * GROUP_SIZE, (index + 1) * GROUP_SIZE),
  )

  return (
    <span className="inline-flex gap-[0.35ch] font-mono text-xs tabular-nums whitespace-nowrap">
      <span className="text-muted-foreground">0x</span>
      {groups.map((group, groupIndex) => (
        <span key={groupIndex}>
          {group.map((char, charIndex) => {
            const position = 2 + groupIndex * GROUP_SIZE + charIndex
            const differs = otherLower[position] !== char.toLowerCase()
            return (
              <span key={position} className={differs ? 'text-destructive font-bold' : 'text-muted-foreground'}>
                {char}
              </span>
            )
          })}
        </span>
      ))}
    </span>
  )
}

type ImportReviewProps = {
  rows: ImportReviewRow[]
  /** Where the contacts go, e.g. "the workspace address book". */
  bookLabel: string
  /** Rows the user kept, with their decisions. */
  onConfirm: (rows: { row: ImportReviewRow; decision: ImportDecision }[]) => void
  onBack: () => void
  isSubmitting?: boolean
}

/** Review step of the file import: filter by status, decide per row, then import in one go. */
const ImportReview = ({ rows, bookLabel, onConfirm, onBack, isSubmitting = false }: ImportReviewProps) => {
  const [decisions, setDecisions] = useState<Record<string, ImportDecision>>(() =>
    Object.fromEntries(
      rows.map((row) => [
        row.id,
        { included: row.includedByDefault, nameAction: 'keep-existing-name', verified: false },
      ]),
    ),
  )
  const [statusFilter, setStatusFilter] = useState<ImportStatus>()

  const counts = useMemo(() => {
    const result = Object.fromEntries(IMPORT_STATUS_ORDER.map((status) => [status, 0])) as Record<ImportStatus, number>
    for (const row of rows) result[row.status]++
    return result
  }, [rows])

  const included = rows.filter((row) => isRowIncluded(row, decisions[row.id]))
  const updateCount = included.filter(isUpdate).length
  const newCount = included.length - updateCount
  const visibleRows = statusFilter ? rows.filter((row) => row.status === statusFilter) : rows

  const updateDecision = (id: string, patch: Partial<ImportDecision>) =>
    setDecisions((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))

  return (
    <div className="flex flex-col" data-testid="import-review">
      <div className="flex flex-col gap-3 px-6 pt-4">
        <p className="text-muted-foreground text-sm">
          Contacts will be added to {bookLabel}. Review each row before importing.
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {IMPORT_STATUS_ORDER.filter((status) => counts[status] > 0).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'secondary' : 'outline'}
              size="xs"
              aria-pressed={statusFilter === status}
              onClick={() => setStatusFilter((prev) => (prev === status ? undefined : status))}
            >
              {IMPORT_STATUS_LABELS[status]}
              <Badge variant={STATUS_VARIANT[status]} size="sm">
                {counts[status]}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      <ul className="mt-3 flex max-h-[min(28rem,55vh)] flex-col gap-2 overflow-auto px-6 pb-4">
        {visibleRows.map((row) => {
          const decision = decisions[row.id]
          const includeDisabled = !row.canInclude || (row.status === 'look-alike' && !decision.verified)
          const isValidAddress = /^0x[0-9a-fA-F]{40}$/.test(row.address)

          return (
            <li
              key={row.id}
              data-status={row.status}
              className={cn(
                'border-border flex items-start gap-3 rounded-md border px-3 py-2',
                !row.canInclude && 'opacity-60',
              )}
            >
              <Checkbox
                aria-label={`Include ${row.name || `line ${row.line}`}`}
                checked={isRowIncluded(row, decision)}
                disabled={includeDisabled}
                onCheckedChange={(checked) => updateDecision(row.id, { included: Boolean(checked) })}
                className="mt-1"
              />

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-bold">{row.name || <em className="font-normal">No name</em>}</span>
                  <Badge variant={STATUS_VARIANT[row.status]}>{IMPORT_STATUS_LABELS[row.status]}</Badge>
                  <span className="text-muted-foreground text-xs">line {row.line}</span>
                </div>

                <div className="overflow-x-auto">
                  {isValidAddress ? (
                    <GroupedAddress address={row.address} />
                  ) : (
                    <span className="font-mono text-xs break-all">{row.address || '—'}</span>
                  )}
                </div>

                {(row.chains.length > 0 || row.tags.length > 0) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {row.chains.length > 0 && <ChainLogos chains={row.chains} />}
                    <TagChips tags={row.tags} />
                  </div>
                )}

                {row.status === 'invalid' && row.reason && (
                  <span className="text-destructive text-xs">{row.reason}</span>
                )}

                {row.status === 'name-differs' && row.existing && (
                  <div className="flex flex-wrap items-center gap-2 text-xs" role="group" aria-label="Name">
                    <span className="text-muted-foreground">Saved as &ldquo;{row.existing.name}&rdquo;</span>
                    <Button
                      variant={decision.nameAction === 'keep-existing-name' ? 'secondary' : 'ghost'}
                      size="xs"
                      aria-pressed={decision.nameAction === 'keep-existing-name'}
                      onClick={() => updateDecision(row.id, { nameAction: 'keep-existing-name' })}
                    >
                      Keep existing name
                    </Button>
                    <Button
                      variant={decision.nameAction === 'rename' ? 'secondary' : 'ghost'}
                      size="xs"
                      aria-pressed={decision.nameAction === 'rename'}
                      onClick={() => updateDecision(row.id, { nameAction: 'rename' })}
                    >
                      Rename to &ldquo;{row.name}&rdquo;
                    </Button>
                  </div>
                )}

                {row.status === 'look-alike' && row.existing && (
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="text-muted-foreground">
                      Looks like &ldquo;{row.existing.name}&rdquo;. Compare the highlighted characters:
                    </span>
                    <div className="overflow-x-auto">
                      <HighlightedAddress address={row.address} other={row.existing.address} />
                    </div>
                    <div className="overflow-x-auto">
                      <HighlightedAddress address={row.existing.address} other={row.address} />
                    </div>
                    <Label className="flex items-center gap-2">
                      <Checkbox
                        checked={decision.verified}
                        onCheckedChange={(checked) =>
                          updateDecision(row.id, { verified: Boolean(checked), included: Boolean(checked) })
                        }
                      />
                      I verified this address
                    </Label>
                  </div>
                )}

                {row.status === 'same-name-different-address' && row.existing && (
                  <span className="text-muted-foreground text-xs">
                    &ldquo;{row.existing.name}&rdquo; is saved with another address. Including this row adds a separate
                    contact and keeps the saved one.
                  </span>
                )}

                {isUpdate(row) && row.status !== 'unchanged' && row.status !== 'duplicate' && (
                  <span className="text-muted-foreground text-xs">Updates the saved contact</span>
                )}
              </div>
            </li>
          )
        })}
        {visibleRows.length === 0 && <li className="text-muted-foreground p-4 text-sm">No rows with this status</li>}
      </ul>

      <div className="border-border flex items-center justify-between gap-2 border-t px-6 py-4">
        <Button variant="outline" size="submit" onClick={onBack}>
          Back
        </Button>
        <Button
          size="submit"
          disabled={included.length === 0 || isSubmitting}
          onClick={() => onConfirm(included.map((row) => ({ row, decision: decisions[row.id] })))}
          data-testid="import-review-confirm"
        >
          {getImportButtonLabel(newCount, updateCount)}
        </Button>
      </div>
    </div>
  )
}

export default ImportReview
