import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { MoreHorizontal, StickyNote, TriangleAlert } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { TableRow, TableCell } from '@safe-global/views/components/ui/table'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { formatDateTime } from '@safe-global/utils/utils/date'
import {
  getAccount,
  getConflicts,
  getCreatedAt,
  getSignatureCount,
  getSignerSummary,
  getStepsStatus,
  getTransactionLabel,
  getWarnings,
  WARNING_LABELS,
} from '../../services/model'
import type { Persona, Proposal } from '../../types'
import { SignatureGauge } from './SignatureGauge'
import { getRiskFlags, RiskFlagBadge } from '../RiskFlag'
import { NonceLabel, NonceMark } from './NonceCell'
import { SignerList } from './SignerList'
import {
  getMenuItems,
  getPrimaryAction,
  getStatusHint,
  MENU_LABELS,
  RARE_MENU_ACTIONS,
  type MenuAction,
} from '../../services/actions'
import type { PreviewAction } from '../../services/queue'
import { Counterparty, TransactionHead } from './TransactionLine'
import { ExecutionChip, LockedChip } from './ExecutionStatus'
import { canSpeedUp, getLockingTx, type Executions } from '../../services/execution'
import { chainLogoUrl, HINT_CLASS, StatusChip, StepsStatusChip } from '../shared'

export type QueueRowProps = {
  tx: Proposal
  sectionItems: Proposal[]
  items: Proposal[]
  persona: Persona
  // Extra-wide screens show the note text, not only the icon.
  showNoteText?: boolean
  isWide: boolean
  columns: string[]
  selected: boolean
  cursor: boolean
  highlighted: boolean
  replaceHover: string | null
  onReplaceHover: (id: string | null) => void
  onReview: (tx: Proposal) => void
  // After you sign, the main action reminds the missing signers.
  remindedIds?: string[]
  onRemind?: (tx: Proposal) => void
  // A blocked row goes to the earlier transaction that blocks it.
  onGoTo?: (tx: Proposal) => void
  // Sign and Execute start a flow. Menu items run immediately.
  onStartFlow?: (tx: Proposal, flow: PreviewAction) => void
  onMenuAction?: (tx: Proposal, action: MenuAction) => void
  // The hovered conflict group, as `account:nonce`.
  conflictHover?: string | null
  onConflictHover?: (key: string | null) => void
  executions?: Executions
  now?: number
  onSpeedUp?: (id: string) => void
}

export function QueueRow({
  tx,
  sectionItems,
  items,
  persona,
  showNoteText,
  isWide,
  columns,
  selected,
  cursor,
  highlighted,
  replaceHover,
  onReplaceHover,
  onReview,
  remindedIds = [],
  onRemind,
  onGoTo,
  onStartFlow,
  onMenuAction,
  conflictHover,
  onConflictHover,
  executions = {},
  now = Date.now(),
  onSpeedUp,
}: QueueRowProps) {
  const [hovered, setHovered] = useState(false)
  const noteIcon = useRef<SVGSVGElement>(null)
  // The drawer covers the row, so mouseleave does not fire. mousemove resets the hover.
  useEffect(() => setHovered(false), [selected])
  const conflicts = getConflicts(tx, items)
  const execution = executions[tx.id]
  const lockedBy = execution ? undefined : getLockingTx(tx, items, executions)
  const sameNonce = (other: Proposal) => other.account === tx.account && other.nonce === tx.nonce
  const groupSize = sectionItems.filter(sameNonce).length
  const optionIndex = sectionItems.filter(sameNonce).indexOf(tx) + 1
  const isLastOption = optionIndex === groupSize
  const startsGroup = groupSize > 1 && sectionItems.find(sameNonce) === tx
  const willBeReplaced = !!replaceHover && conflicts.some((other) => other.id === replaceHover)
  const account = getAccount(tx)
  const signatureCount = getSignatureCount(tx)
  const warnings = getWarnings(tx)
  const reminded = remindedIds.includes(tx.id)
  // Shared action rules set the main button, the menu and the status hint.
  const primaryAction = getPrimaryAction(tx, items, persona, remindedIds, 'row')
  const menuItems = getMenuItems(tx, items, persona)
  const statusHint = getStatusHint(tx, items, persona)
  const stop = (run: () => void) => (event: { stopPropagation: () => void }) => {
    event.stopPropagation()
    run()
  }
  const runPrimary = () => {
    if (primaryAction.kind === 'flow' && onStartFlow) onStartFlow(tx, primaryAction.flow)
    else if (primaryAction.kind === 'goTo') onGoTo?.(primaryAction.target)
    else if (primaryAction.kind === 'remind') onRemind?.(primaryAction.target)
    else onReview(tx)
  }
  const primary = {
    label: primaryAction.label,
    hint: 'hint' in primaryAction ? primaryAction.hint : undefined,
    onClick: stop(runPrimary),
  }
  const primaryLabel = primary.label
  const columnCount = columns.length
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
  const noteDetails = tx.note && (
    <>
      <p className="font-medium">Off-chain note</p>
      <p className="mt-1 leading-relaxed">{tx.note.text}</p>
      <p className="mt-1 text-background/70">
        {tx.note.author} · {tx.note.date}
      </p>
    </>
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
      <TooltipContent className="max-w-sm whitespace-normal">{noteDetails}</TooltipContent>
    </Tooltip>
  )

  const cells: Record<string, ReactNode> = {
    Nonce: (
      <TableCell className="relative py-2 max-md:sticky max-md:left-0 max-md:z-10 max-md:border-l-card! max-md:bg-card">
        {groupSize > 1 ? (
          // Conflict options show the nonce once, in the group sub-header.
          <span
            aria-label={`Option ${optionIndex} of ${groupSize} at nonce ${tx.nonce}`}
            role="img"
            className="block h-6"
          >
            <span
              aria-hidden="true"
              className={`absolute left-1/2 w-3 border-l-[1.5px] border-[var(--warning-accent)] ${isLastOption ? 'top-[-30px] h-[calc(50%+30px)] rounded-bl-md border-b-[1.5px]' : optionIndex === 1 ? 'top-[-22px] bottom-[-8px]' : 'top-[-30px] bottom-[-8px]'}`}
            />
            {!isLastOption && (
              <span
                aria-hidden="true"
                className="absolute top-1/2 left-1/2 w-3 border-b-[1.5px] border-[var(--warning-accent)]"
              />
            )}
          </span>
        ) : (
          // Centred in the column, under the Safe chevron and the "Nonce" title.
          <span className="flex justify-center">
            <NonceLabel tx={tx} persona={persona} competing={conflicts.length} />
          </span>
        )}
      </TableCell>
    ),
    Transaction: (
      <TableCell className="py-2">
        {/* min-h-10 matches the Policies table, so rows are the same height across Spaces. */}
        <div className="flex min-h-10 min-w-0 items-center gap-1.5">
          <button
            className={`flex min-w-0 max-w-full items-center gap-3 text-left text-sm font-normal focus-visible:outline-none focus-visible:underline ${willBeReplaced ? 'text-muted-foreground line-through' : ''}`}
            onClick={() => onReview(tx)}
            aria-label={`Open ${getTransactionLabel(tx)}`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <TransactionHead tx={tx} onRow />
              {!columns.includes('To') && <Counterparty tx={tx} />}
            </span>
          </button>
          {warningMarker}
          {!isWide && noteButton}
        </div>
      </TableCell>
    ),
    Chain: (
      <TableCell className="text-sm">
        <span className="flex min-w-0 items-center gap-1.5">
          <img src={chainLogoUrl(account.chainId)} alt="" className="size-4 shrink-0 rounded-full" />
          <span className="truncate">{account.network}</span>
        </span>
      </TableCell>
    ),
    To: (
      <TableCell className="py-2">
        <Counterparty tx={tx} inColumn />
      </TableCell>
    ),
    Signatures: (
      <TableCell className="py-1">
        <Tooltip delay={150}>
          <TooltipTrigger
            aria-label={`${signatureCount} of ${account.threshold} signatures, ${getSignerSummary(tx, persona)}`}
            className="flex text-sm tabular-nums"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="flex items-center gap-1.5">
              <SignatureGauge count={signatureCount} threshold={account.threshold} />
              {signatureCount}/{account.threshold}
            </span>
          </TooltipTrigger>
          <TooltipContent className={HINT_CLASS}>
            <SignerList tx={tx} persona={persona} />
          </TooltipContent>
        </Tooltip>
      </TableCell>
    ),
    Note:
      showNoteText && tx.note ? (
        <TableCell className="whitespace-normal py-2">
          <Tooltip delay={150}>
            <TooltipTrigger
              aria-label={`Note for ${getTransactionLabel(tx)}: ${tx.note.text}`}
              className="flex items-start gap-2 text-left"
              onClick={review}
            >
              <StickyNote
                ref={noteIcon}
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                strokeWidth={ICON_STROKE}
                aria-hidden="true"
              />
              <span className="line-clamp-2 text-sm">{tx.note.text}</span>
            </TooltipTrigger>
            {/* The tooltip points at the icon, not the middle of the note text. */}
            <TooltipContent anchor={noteIcon} className="max-w-sm whitespace-normal">
              {noteDetails}
            </TooltipContent>
          </Tooltip>
        </TableCell>
      ) : (
        <TableCell>{noteButton}</TableCell>
      ),
    Status: (
      <TableCell>
        <div className="flex flex-wrap items-center gap-1.5">
          {execution ? (
            <ExecutionChip execution={execution} now={now} />
          ) : lockedBy ? (
            <LockedChip by={lockedBy} />
          ) : (
            <Tooltip delay={150}>
              <TooltipTrigger
                render={<span />}
                aria-label={`${getStepsStatus(tx, persona).label}. ${statusHint}`}
                onClick={(event) => event.stopPropagation()}
              >
                {willBeReplaced ? (
                  <StatusChip tone="secondary">Would be replaced</StatusChip>
                ) : (
                  <StepsStatusChip tx={tx} persona={persona} />
                )}
              </TooltipTrigger>
              <TooltipContent>
                {willBeReplaced ? 'Replaced if the option you are pointing at executes.' : statusHint}
              </TooltipContent>
            </Tooltip>
          )}
          {getRiskFlags(tx)
            .filter((flag) => flag.key === 'untrusted')
            .map((flag) => (
              <RiskFlagBadge key={flag.key} flag={flag} />
            ))}
          {/* Grouped conflicts carry the badge on their group header instead. */}
          {conflicts.length > 0 && groupSize < 2 && <Badge variant="warning">Conflicting</Badge>}
        </div>
      </TableCell>
    ),
    Proposed: (
      <TableCell className="text-sm">
        <Tooltip delay={150}>
          <TooltipTrigger aria-label={`Proposed ${tx.age}`} onClick={(event) => event.stopPropagation()}>
            {tx.age}
          </TooltipTrigger>
          <TooltipContent>{formatDateTime(getCreatedAt(tx))}</TooltipContent>
        </Tooltip>
      </TableCell>
    ),
    Action: (
      <TableCell className="sticky right-0 z-10 bg-card group-data-[overflow]/queue:shadow-[-12px_0_12px_-12px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-end gap-1">
          {execution ? (
            canSpeedUp(execution, now) ? (
              <Button
                size="2xs"
                variant="default"
                className="w-20"
                aria-label={`Speed up ${getTransactionLabel(tx)}`}
                onClick={stop(() => onSpeedUp?.(tx.id))}
              >
                Speed up
              </Button>
            ) : (
              <span className="w-20" aria-hidden="true" />
            )
          ) : lockedBy ? (
            <Tooltip delay={150}>
              <TooltipTrigger render={<span className="flex" />}>
                <Button
                  size="2xs"
                  variant="outline"
                  className="w-20"
                  disabled
                  aria-label={`${primaryLabel} ${getTransactionLabel(tx)}, locked`}
                >
                  {primaryLabel}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Available if #{lockedBy.nonce} fails.</TooltipContent>
            </Tooltip>
          ) : primaryAction.kind === 'review' && !primary.hint ? (
            // No main button when there is nothing to do. The row still opens the drawer.
            <span className="w-20" aria-hidden="true" />
          ) : primary.hint ? (
            <Tooltip delay={150}>
              <TooltipTrigger
                render={
                  <Button
                    size="2xs"
                    variant={hovered ? 'default' : 'outline'}
                    className="w-20"
                    aria-label={`${primaryLabel} ${getTransactionLabel(tx)}`}
                    onMouseEnter={() => conflicts.length && onReplaceHover(tx.id)}
                    onMouseLeave={() => onReplaceHover(null)}
                    onFocus={() => conflicts.length && onReplaceHover(tx.id)}
                    onBlur={() => onReplaceHover(null)}
                    onClick={primary.onClick}
                  >
                    {primaryLabel}
                  </Button>
                }
              />
              <TooltipContent>{primary.hint}</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              size="2xs"
              variant={hovered ? 'default' : 'outline'}
              className="w-20"
              aria-label={`${primaryLabel} ${getTransactionLabel(tx)}`}
              onMouseEnter={() => conflicts.length && onReplaceHover(tx.id)}
              onMouseLeave={() => onReplaceHover(null)}
              onFocus={() => conflicts.length && onReplaceHover(tx.id)}
              onBlur={() => onReplaceHover(null)}
              onClick={primary.onClick}
            >
              {primaryLabel}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`More actions for ${getTransactionLabel(tx)}`}

                  onClick={(event) => event.stopPropagation()}
                />
              }
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-auto min-w-40 whitespace-nowrap"
              onClick={(event) => event.stopPropagation()}
            >
              {menuItems.map(({ action, reason }, index) => {
                const label = action === 'remind' && reminded ? 'Remind signers again' : MENU_LABELS[action]
                const divider = index > 0 && action === RARE_MENU_ACTIONS[0] && <DropdownMenuSeparator />
                const item = reason ? (
                  // Disabled items ignore the pointer, so the wrapper holds the tooltip.
                  <Tooltip delay={150}>
                    <TooltipTrigger render={<div />}>
                      <DropdownMenuItem disabled>{label}</DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="left" className={HINT_CLASS}>
                      {reason}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <DropdownMenuItem onClick={() => onMenuAction?.(tx, action)}>{label}</DropdownMenuItem>
                )
                return (
                  <Fragment key={action}>
                    {divider}
                    {item}
                  </Fragment>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    ),
  }

  return (
    <Fragment>
      {startsGroup && (
        <TableRow data-no-hover data-no-divider>
          <TableCell className="pt-4 pb-1">
            <span className="flex justify-center text-xs">
              <NonceMark tx={tx} persona={persona} group active={conflictHover === `${tx.account}:${tx.nonce}`} />
            </span>
          </TableCell>
          <TableCell colSpan={columnCount - 1} className="pt-4 pb-1">
            <div className="flex w-max flex-wrap items-center gap-x-2 gap-y-1 text-xs max-md:sticky max-md:left-4 max-md:w-[calc(100vw-5rem)] max-md:whitespace-normal">
              {/* Orange, so the conflict reads at a glance (Oct 22 review). */}
              <Badge variant="warning">Conflicting</Badge>
              <span className="text-muted-foreground">
                Only 1/{groupSize} transactions can execute. Once it does, the{' '}
                {groupSize === 2 ? 'other becomes' : 'others become'} invalid.
              </span>
              <ExternalLink href={HelpCenterArticle.CONFLICTING_TRANSACTIONS} className="text-muted-foreground" noIcon>
                Learn more
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
        onMouseMove={() => setHovered(true)}
        onMouseEnter={() => groupSize > 1 && onConflictHover?.(`${tx.account}:${tx.nonce}`)}
        onMouseLeave={() => {
          setHovered(false)
          if (groupSize > 1) onConflictHover?.(null)
        }}
        data-executing={execution ? true : undefined}
        className={`group/transaction relative h-14 cursor-pointer data-[executing]:[&>td]:bg-info-subtle/40 data-[state=selected]:bg-transparent [&:has(:focus-visible)>td]:bg-muted [&[data-state=selected]>td]:bg-muted [&[data-state=selected]>td:first-child]:rounded-l-lg [&[data-state=selected]>td:last-child]:rounded-r-lg ${highlighted || cursor ? '[&>td]:bg-muted' : ''}`}
      >
        {columns.map((label) => (
          <Fragment key={label}>{cells[label]}</Fragment>
        ))}
      </TableRow>
    </Fragment>
  )
}
