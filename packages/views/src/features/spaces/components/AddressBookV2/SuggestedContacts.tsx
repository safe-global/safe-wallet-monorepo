import { useState, type ReactNode } from 'react'
import { PenLine, Plus, Sparkles } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@safe-global/views/components/ui/empty'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import PaginatedDataTable, { type DataTableColumn } from '@safe-global/views/components/common/PaginatedDataTable'
import ChainLogos from './ChainLogos'
import ContactCell from './ContactCell'
import { describeSuggestion, type SuggestedContact, type SuggestionReason } from './types'

export type SuggestionAddLocation = 'row' | 'bulk'

const Reason = ({ reason }: { reason: SuggestionReason }) => (
  <span className="inline-flex min-w-0 items-center gap-1.5 text-sm" data-testid="suggestion-reason">
    <PenLine aria-hidden="true" className="text-muted-foreground size-3.5 shrink-0" />
    <span className="truncate">{describeSuggestion(reason)}</span>
  </span>
)

const AddButton = ({ isCompact, onClick }: { isCompact: boolean; onClick: () => void }) => {
  if (!isCompact) {
    return (
      <Button variant="outline" size="sm" onClick={onClick} data-testid="add-suggestion">
        <Plus aria-hidden="true" data-icon="inline-start" />
        Add to workspace
      </Button>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Add to workspace"
          onClick={onClick}
          data-testid="add-suggestion"
        >
          <Plus aria-hidden="true" className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Add to workspace</TooltipContent>
    </Tooltip>
  )
}

type SuggestedContactsProps = {
  suggestions: SuggestedContact[]
  /** Admins add suggestions directly; everyone else gets the row action. */
  canAdd: boolean
  onAdd?: (suggestions: SuggestedContact[], location: SuggestionAddLocation) => void
  /** Replaces the add button for people who cannot add. */
  renderRowAction?: (suggestion: SuggestedContact, options: { isCompact: boolean }) => ReactNode
  renderAvatar?: (address: string) => ReactNode
  getExplorerLink?: (address: string) => { href: string; title: string } | undefined
  pageSize?: number
}

const SuggestedContacts = ({
  suggestions,
  canAdd,
  onAdd,
  renderRowAction,
  renderAvatar,
  getExplorerLink,
  pageSize,
}: SuggestedContactsProps) => {
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

  const actionColumn: DataTableColumn<SuggestedContact> | undefined = canAdd
    ? {
        id: 'add',
        width: '20%',
        align: 'end',
        minWidth: 180,
        cell: (item, { isCompact }) => <AddButton isCompact={isCompact} onClick={() => onAdd?.([item], 'row')} />,
      }
    : renderRowAction
      ? {
          id: 'action',
          width: '20%',
          align: 'end',
          minWidth: 180,
          cell: (item, { isCompact }) => renderRowAction(item, { isCompact }),
        }
      : undefined

  const columns: DataTableColumn<SuggestedContact>[] = [
    {
      id: 'contact',
      header: 'Contact',
      width: '40%',
      minWidth: 360,
      sortValue: (item) => item.suggestedName.toLowerCase(),
      cell: (item, { isCompact }) => (
        <ContactCell
          name={item.suggestedName}
          address={item.address}
          isCompact={isCompact}
          avatar={renderAvatar?.(item.address)}
          explorerLink={getExplorerLink?.(item.address)}
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
    ...(actionColumn ? [actionColumn] : []),
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
          <Button size="sm" onClick={() => onAdd?.(selectedSuggestions, 'bulk')}>
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
        selectable={canAdd}
        selectedKeys={selected}
        onSelectionChange={setSelected}
        getSelectionLabel={(item) => `Select ${item.suggestedName}`}
      />
    </div>
  )
}

export default SuggestedContacts
