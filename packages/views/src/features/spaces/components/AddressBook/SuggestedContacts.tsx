import { useState, type ReactNode } from 'react'
import { History, PenLine, Plus, Sparkles } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@safe-global/views/components/ui/empty'
import { Typography } from '@safe-global/views/components/ui/typography'
import PaginatedDataTable, { type DataTableColumn } from '@safe-global/views/components/common/PaginatedDataTable'
import ChainLogos from './ChainLogos'
import ContactCell, { CONTACT_COLUMN_WIDTH } from './ContactCell'
import { describeSuggestion, type SuggestedContact, type SuggestionReason } from './types'

const ReasonIcon = ({ reason }: { reason: SuggestionReason }) => {
  const Icon = reason.kind === 'signer' ? PenLine : History
  return <Icon aria-hidden="true" className="text-muted-foreground size-3.5 shrink-0" />
}

const Reason = ({ reason }: { reason: SuggestionReason }) => (
  <span className="inline-flex min-w-0 items-center gap-1.5 text-sm" data-testid="suggestion-reason">
    <ReasonIcon reason={reason} />
    <span className="truncate">{describeSuggestion(reason)}</span>
  </span>
)

type SuggestedContactsProps = {
  suggestions: SuggestedContact[]
  /** Admins add suggestions to the workspace book; everyone else only sees them. */
  canAdd: boolean
  /** Opens the naming step for one or more suggestions. */
  onAdd: (suggestions: SuggestedContact[]) => void
  renderAvatar?: (address: string) => ReactNode
  pageSize?: number
}

/** Addresses that aren't in the workspace book yet, each with the reason it is suggested. */
const SuggestedContacts = ({ suggestions, canAdd, onAdd, renderAvatar, pageSize }: SuggestedContactsProps) => {
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const selectedSuggestions = suggestions.filter((item) => selected.has(item.address))

  if (suggestions.length === 0) {
    return (
      <Empty data-testid="suggestions-empty">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Sparkles />
          </EmptyMedia>
          <EmptyTitle>No suggestions right now</EmptyTitle>
          <EmptyDescription>
            Addresses your workspace works with, like signers of your Safes, show up here until they're in the address
            book.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const columns: DataTableColumn<SuggestedContact>[] = [
    {
      id: 'contact',
      header: 'Contact',
      width: 'fit',
      minWidth: CONTACT_COLUMN_WIDTH,
      sortValue: (item) => item.suggestedName.toLowerCase(),
      cell: (item, { isCompact }) => (
        <ContactCell
          name={item.suggestedName}
          address={item.address}
          isCompact={isCompact}
          avatar={renderAvatar?.(item.address)}
        />
      ),
    },
    {
      id: 'chains',
      header: 'Chains',
      width: '10%',
      priority: 'secondary',
      minWidth: 90,
      sortValue: (item) => item.chains.length,
      cell: (item) => <ChainLogos chains={item.chains} />,
    },
    {
      id: 'reason',
      header: 'Why suggested',
      priority: 'secondary',
      minWidth: 200,
      sortValue: (item) => describeSuggestion(item.reason).toLowerCase(),
      cell: (item) => <Reason reason={item.reason} />,
    },
    ...(canAdd
      ? ([
          {
            id: 'add',
            width: '20%',
            align: 'end',
            minWidth: 160,
            cell: (item) => (
              <Button variant="outline" size="sm" onClick={() => onAdd([item])} data-testid="add-suggestion">
                <Plus aria-hidden="true" data-icon="inline-start" />
                Add to workspace
              </Button>
            ),
          },
        ] satisfies DataTableColumn<SuggestedContact>[])
      : []),
  ]

  return (
    <div className="flex flex-col gap-3">
      {canAdd && selectedSuggestions.length > 0 && (
        <div
          className="bg-muted/40 border-border mx-2 mt-2 flex flex-wrap items-center gap-2 rounded-md border px-3 py-1.5"
          role="region"
          aria-label="Selected suggestions"
          data-testid="suggestions-bulk-bar"
        >
          <Typography variant="paragraph-small-medium" className="mr-1">
            {selectedSuggestions.length} selected
          </Typography>
          <Button size="sm" onClick={() => onAdd(selectedSuggestions)}>
            <Plus aria-hidden="true" data-icon="inline-start" />
            Add {selectedSuggestions.length} to workspace
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSelected(new Set())}>
            Clear selection
          </Button>
        </div>
      )}
      <PaginatedDataTable
        columns={columns}
        rows={suggestions}
        getRowKey={(item) => item.address}
        renderRowDetail={(item) => (
          <div className="flex flex-col gap-2 text-sm">
            <ChainLogos chains={item.chains} />
            <Reason reason={item.reason} />
          </div>
        )}
        pageSize={pageSize}
        showSortIcons
        selectable={canAdd}
        selectedKeys={selected}
        onSelectionChange={setSelected}
        getSelectionLabel={(item) => `Select ${item.suggestedName}`}
      />
    </div>
  )
}

export default SuggestedContacts
