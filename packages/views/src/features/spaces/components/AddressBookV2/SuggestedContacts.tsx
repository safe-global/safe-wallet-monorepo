import { useState, type ReactNode } from 'react'
import { PenLine, Plus, Sparkles } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@safe-global/views/components/ui/empty'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import PaginatedDataTable, { type DataTableColumn } from '@safe-global/views/components/common/PaginatedDataTable'
import TruncatedText from '@safe-global/views/components/common/AccountRow/TruncatedText'
import ChainLogos from './ChainLogos'
import ContactCell, { CONTACT_CELL_MIN_WIDTH } from './ContactCell'
import RowDetail from './RowDetail'
import { describeSuggestion, type SuggestedContact, type SuggestionReason } from './types'

export type SuggestionAddLocation = 'row' | 'bulk'

const ReasonText = ({ children }: { children: ReactNode }) => (
  <span className="flex min-w-0 items-center gap-1.5 text-sm" data-testid="suggestion-reason">
    <PenLine aria-hidden="true" className="text-muted-foreground size-3.5 shrink-0" />
    {children}
  </span>
)

const Reason = ({ reason }: { reason: SuggestionReason }) => {
  const text = describeSuggestion(reason)

  if (reason.safes.length === 1) {
    return (
      <ReasonText>
        <TruncatedText variant="paragraph-small" className="min-w-0" text={text} />
      </ReasonText>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="flex min-w-0" tabIndex={0} />}>
        <ReasonText>
          <span className="min-w-0 truncate">{text}</span>
        </ReasonText>
      </TooltipTrigger>
      <TooltipContent data-testid="suggestion-reason-safes">{reason.safes.join(', ')}</TooltipContent>
    </Tooltip>
  )
}

/** Phones have no hover, so the expanded row spells out every Safe. */
const CompactReason = ({ reason }: { reason: SuggestionReason }) => (
  <div className="flex min-w-0 flex-col gap-1">
    <ReasonText>
      <span className="min-w-0">{describeSuggestion(reason)}</span>
    </ReasonText>
    {reason.safes.length > 1 && (
      <Typography
        variant="paragraph-small"
        className="text-muted-foreground"
        data-testid="suggestion-reason-safes-list"
      >
        {reason.safes.join(', ')}
      </Typography>
    )}
  </div>
)

const AddButton = ({ isCompact, onClick }: { isCompact: boolean; onClick: () => void }) => {
  if (!isCompact) {
    return (
      <Button variant="outline" size="sm" onClick={onClick} data-testid="add-suggestion">
        <Plus aria-hidden="true" data-icon="inline-start" />
        Add to Workspace
      </Button>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Add to Workspace"
          onClick={onClick}
          data-testid="add-suggestion"
        >
          <Plus aria-hidden="true" className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Add to Workspace</TooltipContent>
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

  const suggestionsKey = suggestions.map((item) => item.address).join('\u0000')
  const [prevSuggestionsKey, setPrevSuggestionsKey] = useState(suggestionsKey)

  // Rows that leave the list (e.g. once added) drop out of the selection
  if (suggestionsKey !== prevSuggestionsKey) {
    setPrevSuggestionsKey(suggestionsKey)
    if (selectedSuggestions.length !== selected.size) {
      setSelected(new Set(selectedSuggestions.map((item) => item.address)))
    }
  }

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
        width: 'fit',
        align: 'end',
        minWidth: 180,
        cell: (item, { isCompact }) => <AddButton isCompact={isCompact} onClick={() => onAdd?.([item], 'row')} />,
      }
    : renderRowAction
      ? {
          id: 'action',
          width: 'fit',
          align: 'end',
          minWidth: 180,
          cell: (item, { isCompact }) => renderRowAction(item, { isCompact }),
        }
      : undefined

  const secondaryColumns: DataTableColumn<SuggestedContact>[] = [
    {
      id: 'chains',
      header: 'Chains',
      width: 'share',
      priority: 'secondary',
      minWidth: 90,
      sortValue: (item) => item.chains.length,
      cell: (item) => <ChainLogos chains={item.chains} />,
    },
    {
      id: 'reason',
      header: 'Why suggested',
      width: 'share',
      priority: 'secondary',
      minWidth: 200,
      sortValue: (item) => describeSuggestion(item.reason).toLowerCase(),
      cell: (item, { isCompact }) =>
        isCompact ? <CompactReason reason={item.reason} /> : <Reason reason={item.reason} />,
    },
  ]

  const columns: DataTableColumn<SuggestedContact>[] = [
    {
      id: 'contact',
      header: 'Contact',
      width: 'share',
      minWidth: CONTACT_CELL_MIN_WIDTH,
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
    ...secondaryColumns,
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
            Add {selectedSuggestions.length} to Workspace
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
        renderRowDetail={(item) => <RowDetail row={item} columns={secondaryColumns} />}
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
