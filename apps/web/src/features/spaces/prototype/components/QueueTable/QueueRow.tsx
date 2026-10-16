import { Fragment, useState } from 'react'
import { ListFilter, StickyNote, TriangleAlert } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@safe-global/views/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { TableRow, TableCell } from '@safe-global/views/components/ui/table'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { formatDateTime } from '@safe-global/utils/utils/date'
import {
  getAccount,
  getAmountLabel,
  getConflicts,
  getCreatedAt,
  getOutstandingSigners,
  getRowAction,
  getSecondaryActions,
  getSignatureCount,
  getSignerSummary,
  getState,
  getStatusLabel,
  getStatusTone,
  getTransactionLabel,
  getTypeLabel,
  getWarnings,
  WARNING_LABELS,
  type RowSecondaryAction,
} from '../../services/model'
import type { Persona, Proposal } from '../../types'
import { SignatureGauge } from './SignatureGauge'
import { chainLogoUrl, SafeIdentity, TYPE_ICONS, type GroupBy } from '../shared'

export type QueueRowProps = {
  tx: Proposal
  sectionItems: Proposal[]
  items: Proposal[]
  persona: Persona
  groupBy: GroupBy
  isWide: boolean
  columnCount: number
  selected: boolean
  cursor: boolean
  highlighted: boolean
  replaceHover: string | null
  onReplaceHover: (id: string | null) => void
  onReview: (tx: Proposal) => void
  onSecondaryAction: (tx: Proposal, action: RowSecondaryAction) => void
}

const SECONDARY_ACTIONS: Record<RowSecondaryAction, string> = { replace: 'Replace', reject: 'Reject' }

export function QueueRow({
  tx,
  sectionItems,
  items,
  persona,
  groupBy,
  isWide,
  columnCount,
  selected,
  cursor,
  highlighted,
  replaceHover,
  onReplaceHover,
  onReview,
  onSecondaryAction,
}: QueueRowProps) {
  const [hovered, setHovered] = useState(false)
  const state = getState(tx, persona)
  const conflicts = getConflicts(tx, items)
  const sameNonce = (other: Proposal) => other.account === tx.account && other.nonce === tx.nonce
  const groupSize = sectionItems.filter(sameNonce).length
  const startsGroup = groupSize > 1 && sectionItems.find(sameNonce) === tx
  const willBeReplaced = !!replaceHover && conflicts.some((other) => other.id === replaceHover)
  const account = getAccount(tx)
  const transactionType = getTypeLabel(tx)
  const TransactionIcon = TYPE_ICONS[transactionType]
  const rowAction = getRowAction(tx, persona)
  const signatureCount = getSignatureCount(tx)
  const warnings = getWarnings(tx)
  const review = (event: { stopPropagation: () => void }) => {
    event.stopPropagation()
    onReview(tx)
  }

  const warningMarker = warnings.length > 0 && (
    <Tooltip delay={150}>
      <TooltipTrigger
        aria-label={`Warnings: ${warnings.map((warning) => WARNING_LABELS[warning]).join(', ')}`}
        className="flex shrink-0 items-center text-warning-strong"
        onClick={review}
      >
        <TriangleAlert className="size-4" strokeWidth={ICON_STROKE} aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>
        {warnings.map((warning) => (
          <p key={warning}>{WARNING_LABELS[warning]}</p>
        ))}
      </TooltipContent>
    </Tooltip>
  )
  const noteButton = tx.note && (
    <Tooltip delay={150}>
      <TooltipTrigger
        aria-label={`Note for ${getTransactionLabel(tx)}`}
        className="flex shrink-0 items-center text-muted-foreground hover:text-foreground"
        onClick={review}
      >
        <StickyNote className="size-4" strokeWidth={ICON_STROKE} aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent className="max-w-sm whitespace-normal">
        <p className="font-medium">Off-chain note</p>
        <p className="mt-1 leading-relaxed">{tx.note.text}</p>
      </TooltipContent>
    </Tooltip>
  )

  return (
    <Fragment>
      {startsGroup && (
        <TableRow data-no-hover data-no-divider>
          <TableCell colSpan={columnCount} className="pt-4 pb-1">
            <div className="flex w-max flex-wrap items-center gap-x-2 gap-y-1 text-xs max-md:sticky max-md:left-4 max-md:w-[calc(100vw-5rem)] max-md:whitespace-normal">
              <span
                className="flex size-5 items-center justify-center rounded bg-warning-subtle text-warning-strong"
                aria-hidden="true"
              >
                <ListFilter className="size-3" />
              </span>
              <span className="font-medium">{conflicts.length + 1} competing proposals</span>
              <span className="text-muted-foreground">Executing one replaces the others.</span>
              <ExternalLink href={HelpCenterArticle.CONFLICTING_TRANSACTIONS} className="text-muted-foreground" noIcon>
                Why did this happen?
              </ExternalLink>
            </div>
          </TableCell>
        </TableRow>
      )}
      <TableRow
        data-state={selected ? 'selected' : undefined}
        data-cursor={cursor || undefined}
        data-conflict-group={groupSize > 1 || undefined}
        onClick={() => onReview(tx)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`group/transaction relative h-14 cursor-pointer data-[state=selected]:bg-transparent [&:focus-within>td]:bg-muted [&[data-state=selected]>td]:bg-muted [&[data-state=selected]>td:first-child]:rounded-l-lg [&[data-state=selected]>td:last-child]:rounded-r-lg ${highlighted || cursor ? '[&>td]:bg-muted' : ''}`}
      >
        <TableCell
          className={`py-2 max-md:sticky max-md:left-0 max-md:z-10 max-md:border-l-card! max-md:bg-card ${groupSize > 1 ? 'shadow-[inset_2px_0_0_var(--warning-accent)]' : ''}`}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              className={`flex min-w-0 max-w-full items-center gap-3 text-left text-sm font-medium focus-visible:outline-none focus-visible:underline ${willBeReplaced ? 'text-muted-foreground line-through' : ''}`}
              onClick={() => onReview(tx)}
              aria-label={`Open ${getTransactionLabel(tx)}`}
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground"
                role="img"
                aria-label={transactionType}
              >
                <TransactionIcon className="size-4" strokeWidth={ICON_STROKE} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate">{transactionType}</span>
                {getAmountLabel(tx) && (
                  <span className="mt-0.5 block truncate text-xs font-normal tabular-nums text-muted-foreground">
                    {getAmountLabel(tx)}
                  </span>
                )}
              </span>
            </button>
            {warningMarker}
            {!isWide && noteButton}
          </div>
        </TableCell>
        <TableCell className="text-xs tabular-nums text-muted-foreground" aria-label={`Nonce ${tx.nonce}`}>
          #{tx.nonce}
        </TableCell>
        {groupBy !== 'safe' && (
          <TableCell className="text-xs">
            <SafeIdentity address={account.iconAddress} size={24} className="flex min-w-0 items-center gap-2">
              <div className="min-w-0">
                <p className="truncate">{account.name}</p>
                {!isWide && <p className="truncate text-muted-foreground">{account.network}</p>}
                <p className="truncate font-mono text-muted-foreground">{account.address}</p>
              </div>
            </SafeIdentity>
          </TableCell>
        )}
        {groupBy !== 'safe' && isWide && (
          <TableCell>
            <Tooltip delay={150}>
              <TooltipTrigger aria-label={account.network} onClick={(event) => event.stopPropagation()}>
                <Avatar size="xs">
                  <AvatarImage src={chainLogoUrl(account.chainId)} alt={account.network} />
                  <AvatarFallback>{account.network[0]}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{account.network}</TooltipContent>
            </Tooltip>
          </TableCell>
        )}
        <TableCell className="py-1">
          <Tooltip delay={150}>
            <TooltipTrigger
              aria-label={`${signatureCount} of ${account.threshold} signatures, ${getSignerSummary(tx, persona)}`}
              className="text-xs tabular-nums"
              onClick={(event) => event.stopPropagation()}
            >
              <span className="flex items-center gap-1.5">
                <SignatureGauge count={signatureCount} threshold={account.threshold} />
                {signatureCount}/{account.threshold}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p>
                  {state.missing
                    ? `${state.missing} more ${state.missing === 1 ? 'signature' : 'signatures'} needed`
                    : 'Signature threshold met'}
                </p>
                {tx.signers.length > 0 && <p>Signed: {tx.signers.join(', ')}</p>}
                {state.missing > 0 && <p>Not yet signed: {getOutstandingSigners(tx).join(', ')}</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TableCell>
        {isWide && <TableCell>{noteButton}</TableCell>}
        <TableCell>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={getStatusTone(tx, persona)} size="default" shape="pill">
              {getStatusLabel(tx, persona)}
            </Badge>
            {tx.proposedBy && tx.signers.length === 0 && <Badge variant="outline">Proposal</Badge>}
            {conflicts.length > 0 && groupSize < 2 && (
              <Badge variant="warning">{conflicts.length + 1} competing proposals</Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          <Tooltip delay={150}>
            <TooltipTrigger aria-label={`Proposed ${tx.age}`} onClick={(event) => event.stopPropagation()}>
              {tx.age}
            </TooltipTrigger>
            <TooltipContent>{formatDateTime(getCreatedAt(tx))}</TooltipContent>
          </Tooltip>
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-1">
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/transaction:opacity-100 group-focus-within/transaction:opacity-100 [@media(hover:none)]:opacity-100">
              {getSecondaryActions(tx, persona).map((action) => (
                <Button
                  key={action}
                  size="2xs"
                  variant="outline"
                  aria-label={`${SECONDARY_ACTIONS[action]} ${getTransactionLabel(tx)}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    onSecondaryAction(tx, action)
                  }}
                >
                  {SECONDARY_ACTIONS[action]}
                </Button>
              ))}
            </div>
            <Button
              size="2xs"
              variant={hovered ? 'default' : 'outline'}
              className="w-18"
              aria-label={`${rowAction} ${getTransactionLabel(tx)}`}
              onMouseEnter={() => conflicts.length && onReplaceHover(tx.id)}
              onMouseLeave={() => onReplaceHover(null)}
              onFocus={() => conflicts.length && onReplaceHover(tx.id)}
              onBlur={() => onReplaceHover(null)}
              onClick={review}
            >
              {rowAction}
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </Fragment>
  )
}
