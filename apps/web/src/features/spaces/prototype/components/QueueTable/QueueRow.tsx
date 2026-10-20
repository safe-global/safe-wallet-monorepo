import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { ListFilter, MoreHorizontal, StickyNote, TriangleAlert } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
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
  getStepsStatus,
  getStatusTone,
  getTransactionLabel,
  getTypeLabel,
  getWarnings,
  WARNING_LABELS,
  type RowSecondaryAction,
} from '../../services/model'
import type { Persona, Proposal } from '../../types'
import { SignatureGauge } from './SignatureGauge'
import { NonceLabel, NonceMark } from './NonceCell'
import { SignerList } from './SignerList'
import { getMenuActions, getPrimaryAction, getStatusHint, MENU_LABELS, type MenuAction } from '../../services/actions'
import type { PreviewAction } from '../../services/queue'
import Identicon from '@/components/common/Identicon'
import { getCounterpartyCell, getCounterpartyHint, getDetail, getHeadline, TYPE_HINTS } from '../../services/columns'
import { chainLogoUrl, HINT_CLASS, HintContent, SafeIdentity, StatusChip, StepsStatusChip, TYPE_ICONS } from '../shared'

export type QueueRowProps = {
  tx: Proposal
  sectionItems: Proposal[]
  items: Proposal[]
  persona: Persona
  // Next steps: Nonce first, then Transaction and With.
  steps?: boolean
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
  onSecondaryAction: (tx: Proposal, action: RowSecondaryAction) => void
  // Next steps: after you sign, the main action reminds the missing signers.
  remindedIds?: string[]
  onRemind?: (tx: Proposal) => void
  // Next steps: a blocked row goes to the earlier transaction that blocks it.
  onGoTo?: (tx: Proposal) => void
  // Next steps: Sign and Execute start a flow. Menu items run immediately.
  onStartFlow?: (tx: Proposal, flow: PreviewAction) => void
  onMenuAction?: (tx: Proposal, action: MenuAction) => void
  // Next steps: the hovered conflict group, as `account:nonce`.
  conflictHover?: string | null
  onConflictHover?: (key: string | null) => void
}

const SECONDARY_ACTIONS: Record<RowSecondaryAction, string> = { replace: 'Replace', reject: 'Reject' }

export function QueueRow({
  tx,
  sectionItems,
  items,
  persona,
  steps,
  showNoteText,
  isWide,
  columns,
  selected,
  cursor,
  highlighted,
  replaceHover,
  onReplaceHover,
  onReview,
  onSecondaryAction,
  remindedIds = [],
  onRemind,
  onGoTo,
  onStartFlow,
  onMenuAction,
  conflictHover,
  onConflictHover,
}: QueueRowProps) {
  const [hovered, setHovered] = useState(false)
  const noteIcon = useRef<SVGSVGElement>(null)
  // The drawer covers the row, so mouseleave does not fire. mousemove resets the hover.
  useEffect(() => setHovered(false), [selected])
  const state = getState(tx, persona)
  const conflicts = getConflicts(tx, items)
  const sameNonce = (other: Proposal) => other.account === tx.account && other.nonce === tx.nonce
  const groupSize = sectionItems.filter(sameNonce).length
  const optionIndex = sectionItems.filter(sameNonce).indexOf(tx) + 1
  const isLastOption = optionIndex === groupSize
  const startsGroup = groupSize > 1 && sectionItems.find(sameNonce) === tx
  const willBeReplaced = !!replaceHover && conflicts.some((other) => other.id === replaceHover)
  const account = getAccount(tx)
  const transactionType = getTypeLabel(tx)
  const TransactionIcon = TYPE_ICONS[transactionType]
  const rowAction = getRowAction(tx, persona)
  const signatureCount = getSignatureCount(tx)
  const warnings = getWarnings(tx)
  const counterparty = getCounterpartyCell(tx)
  const secondaryActions = getSecondaryActions(tx, persona)
  const reminded = remindedIds.includes(tx.id)
  // Next steps: shared action rules set the main button, the menu and the status hint.
  const stepsPrimary = steps ? getPrimaryAction(tx, items, persona, remindedIds, 'row') : undefined
  const menuActions = stepsPrimary ? getMenuActions(tx, items, persona, stepsPrimary) : []
  const statusHint = steps ? getStatusHint(tx, items, persona) : ''
  const stop = (run: () => void) => (event: { stopPropagation: () => void }) => {
    event.stopPropagation()
    run()
  }
  const runPrimary = () => {
    if (stepsPrimary?.kind === 'flow' && onStartFlow) onStartFlow(tx, stepsPrimary.flow)
    else if (stepsPrimary?.kind === 'goTo') onGoTo?.(stepsPrimary.target)
    else if (stepsPrimary?.kind === 'remind') onRemind?.(stepsPrimary.target)
    else onReview(tx)
  }
  const primary = {
    label: stepsPrimary?.label ?? rowAction,
    hint: stepsPrimary && 'hint' in stepsPrimary ? stepsPrimary.hint : undefined,
    onClick: stop(runPrimary),
  }
  const primaryLabel = primary.label
  const counterpartyHint = getCounterpartyHint(tx)
  const columnCount = columns.length
  const optionLabel = steps && groupSize > 1 ? `Option ${optionIndex} of ${groupSize}` : ''
  const detail = [optionLabel, getDetail(tx)].filter(Boolean).join(' · ')
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
    Nonce: steps ? (
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
              className={`absolute left-[18px] w-3 border-l-[1.5px] border-[var(--warning-accent)] ${isLastOption ? 'top-[-30px] h-[calc(50%+30px)] rounded-bl-md border-b-[1.5px]' : optionIndex === 1 ? 'top-[-22px] bottom-[-8px]' : 'top-[-30px] bottom-[-8px]'}`}
            />
            {!isLastOption && (
              <span
                aria-hidden="true"
                className="absolute top-1/2 left-[18px] w-3 border-b-[1.5px] border-[var(--warning-accent)]"
              />
            )}
          </span>
        ) : (
          <NonceLabel tx={tx} persona={persona} competing={conflicts.length} />
        )}
      </TableCell>
    ) : (
      <TableCell className="text-xs tabular-nums text-muted-foreground" aria-label={`Nonce ${tx.nonce}`}>
        #{tx.nonce}
      </TableCell>
    ),
    Type: (
      <TableCell
        className={`py-2 ${steps ? '' : 'max-md:sticky max-md:left-0 max-md:z-10 max-md:border-l-card! max-md:bg-card'} ${groupSize > 1 && !steps ? 'shadow-[inset_2px_0_0_var(--warning-accent)]' : ''}`}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            className={`flex min-w-0 max-w-full items-center gap-3 text-left text-sm ${steps ? 'font-normal' : 'font-medium'} focus-visible:outline-none focus-visible:underline ${willBeReplaced ? 'text-muted-foreground line-through' : ''}`}
            onClick={() => onReview(tx)}
            aria-label={`Open ${getTransactionLabel(tx)}`}
          >
            {!steps && (
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground"
                role="img"
                aria-label={transactionType}
              >
                <TransactionIcon className="size-4" strokeWidth={ICON_STROKE} aria-hidden="true" />
              </span>
            )}
            {steps ? (
              <>
                <Tooltip delay={150}>
                  <TooltipTrigger
                    render={
                      <span
                        className="flex size-6 shrink-0 items-center justify-center rounded-[4px] bg-muted group-hover/transaction:bg-card group-data-[state=selected]/transaction:bg-card text-foreground"
                        role="img"
                        aria-label={`${transactionType}. ${TYPE_HINTS[transactionType]}`}
                      />
                    }
                  >
                    <TransactionIcon className="size-3.5" strokeWidth={ICON_STROKE} aria-hidden="true" />
                  </TooltipTrigger>
                  <TooltipContent className={HINT_CLASS}>
                    <HintContent title={transactionType} body={TYPE_HINTS[transactionType]} />
                  </TooltipContent>
                </Tooltip>
                <span className="min-w-0">
                  <span className="block truncate">{getHeadline(tx)}</span>
                  {detail && (
                    <span className="mt-0.5 block truncate text-xs font-normal tabular-nums text-muted-foreground">
                      {detail}
                    </span>
                  )}
                </span>
              </>
            ) : (
              <span className="min-w-0">
                <span className="block truncate">{transactionType}</span>
                {getAmountLabel(tx) && (
                  <span className="mt-0.5 block truncate text-xs font-normal tabular-nums text-muted-foreground">
                    {getAmountLabel(tx)}
                  </span>
                )}
              </span>
            )}
          </button>
          {warningMarker}
          {!isWide && noteButton}
        </div>
      </TableCell>
    ),
    With: (
      <TableCell className="text-xs">
        <span className="flex min-w-0 items-center gap-3">
          <Tooltip delay={150}>
            <TooltipTrigger
              render={<span className="flex size-6 shrink-0" />}
              aria-label={`${counterpartyHint.title}. ${counterpartyHint.body}`}
              onClick={(event) => event.stopPropagation()}
            >
              <Identicon address={counterparty.avatar} size={24} />
            </TooltipTrigger>
            <TooltipContent className={HINT_CLASS}>
              <HintContent
                title={counterpartyHint.title}
                body={
                  counterparty.address ? (
                    <span className="break-all font-mono">{counterparty.address}</span>
                  ) : (
                    counterpartyHint.body
                  )
                }
              />
            </TooltipContent>
          </Tooltip>
          <span className="min-w-0">
            <span className="block truncate text-sm">{counterparty.name}</span>
            {counterparty.detail && (
              <span
                className={`mt-0.5 block truncate ${counterparty.tone === 'warning' ? 'text-warning-strong' : counterparty.tone === 'success' ? 'text-success-strong' : 'text-muted-foreground'} ${counterparty.detail.startsWith('0x') ? 'font-mono' : ''}`}
              >
                {counterparty.detail}
              </span>
            )}
          </span>
        </span>
      </TableCell>
    ),
    Safe: steps ? (
      <TableCell className="text-xs">
        <SafeIdentity
          address={account.iconAddress}
          size={24}
          className="flex min-w-0 items-center gap-3"
          title="Safe account"
        >
          <span className="min-w-0">
            <span className="block truncate text-sm">{account.name}</span>
            <span className="mt-0.5 block truncate font-mono text-muted-foreground">{account.address}</span>
          </span>
        </SafeIdentity>
      </TableCell>
    ) : (
      <TableCell className="text-xs">
        <SafeIdentity address={account.iconAddress} size={24} className="flex min-w-0 items-center gap-2">
          <div className="min-w-0">
            <p className="truncate">{account.name}</p>
            {!isWide && <p className="truncate text-muted-foreground">{account.network}</p>}
            <p className="truncate font-mono text-muted-foreground">{account.address}</p>
          </div>
        </SafeIdentity>
      </TableCell>
    ),
    Network: (
      <TableCell>
        <Tooltip delay={150}>
          <TooltipTrigger aria-label={account.network} className="flex" onClick={(event) => event.stopPropagation()}>
            <Avatar size="xs">
              <AvatarImage src={chainLogoUrl(account.chainId)} alt={account.network} />
              <AvatarFallback>{account.network[0]}</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>{account.network}</TooltipContent>
        </Tooltip>
      </TableCell>
    ),
    Signatures: (
      <TableCell className="py-1">
        <Tooltip delay={150}>
          <TooltipTrigger
            aria-label={`${signatureCount} of ${account.threshold} signatures, ${getSignerSummary(tx, persona)}`}
            className={`${steps ? 'flex text-sm' : 'text-xs'} tabular-nums`}
            onClick={(event) => event.stopPropagation()}
          >
            <span className="flex items-center gap-1.5">
              <SignatureGauge count={signatureCount} threshold={account.threshold} />
              {signatureCount}/{account.threshold}
            </span>
          </TooltipTrigger>
          <TooltipContent className={HINT_CLASS}>
            {steps ? (
              <SignerList tx={tx} persona={persona} />
            ) : (
              <div className="space-y-1">
                <p className="font-medium">
                  {signatureCount} of {account.threshold} signatures
                </p>
                <p>
                  {state.missing
                    ? `${state.missing} more ${state.missing === 1 ? 'signature' : 'signatures'} needed`
                    : 'Signature threshold met'}
                </p>
                {tx.signers.length > 0 && <p>Signed: {tx.signers.join(', ')}</p>}
                {state.missing > 0 && <p>Not yet signed: {getOutstandingSigners(tx).join(', ')}</p>}
              </div>
            )}
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
          {steps ? (
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
          ) : (
            <Badge variant={getStatusTone(tx, persona)} size="default" shape="pill">
              {getStatusLabel(tx, persona)}
            </Badge>
          )}
          {tx.proposedBy && tx.signers.length === 0 && <Badge variant="outline">Proposal</Badge>}
          {conflicts.length > 0 && groupSize < 2 && (
            <Badge variant="warning">
              {conflicts.length + 1} {steps ? 'conflicting' : 'competing proposals'}
            </Badge>
          )}
        </div>
      </TableCell>
    ),
    Proposed: (
      <TableCell className={steps ? 'text-sm' : 'text-xs text-muted-foreground'}>
        <Tooltip delay={150}>
          <TooltipTrigger aria-label={`Proposed ${tx.age}`} onClick={(event) => event.stopPropagation()}>
            {tx.age}
          </TooltipTrigger>
          <TooltipContent>{formatDateTime(getCreatedAt(tx))}</TooltipContent>
        </Tooltip>
      </TableCell>
    ),
    Action: (
      <TableCell
        className={
          steps
            ? 'sticky right-0 z-10 bg-card group-data-[overflow]/queue:shadow-[-12px_0_12px_-12px_rgba(0,0,0,0.25)]'
            : undefined
        }
      >
        <div className="flex items-center justify-end gap-1">
          {!steps && (
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/transaction:opacity-100 group-has-[:focus-visible]/transaction:opacity-100 [@media(hover:none)]:opacity-100">
              {secondaryActions.map((action) => (
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
          )}
          {stepsPrimary?.kind === 'review' && !primary.hint ? (
            // Next steps: no main button when there is nothing to do. The row still opens the drawer.
            <span className="w-20" aria-hidden="true" />
          ) : primary.hint ? (
            <Tooltip delay={150}>
              <TooltipTrigger
                render={
                  <Button
                    size="2xs"
                    variant={hovered ? 'default' : 'outline'}
                    className={steps ? 'w-20' : 'w-18'}
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
              className={steps ? 'w-20' : 'w-18'}
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
          {steps && (
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
                {menuActions.map((action) => (
                  <DropdownMenuItem key={action} onClick={() => onMenuAction?.(tx, action)}>
                    {action === 'remind' && reminded ? 'Remind signers again' : MENU_LABELS[action]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </TableCell>
    ),
  }
  cells.Transaction = cells.Type
  cells.Chain = cells.Network

  return (
    <Fragment>
      {startsGroup && (
        <TableRow data-no-hover data-no-divider>
          <TableCell colSpan={columnCount} className="pt-4 pb-1">
            <div className="flex w-max flex-wrap items-center gap-x-2 gap-y-1 text-xs max-md:sticky max-md:left-4 max-md:w-[calc(100vw-5rem)] max-md:whitespace-normal">
              {steps ? (
                <>
                  <NonceMark tx={tx} persona={persona} group active={conflictHover === `${tx.account}:${tx.nonce}`} />
                  <span className="font-medium">
                    {columns.includes('Safe') ? account.name : `${groupSize} options`}
                  </span>
                  <span className="text-muted-foreground">
                    {columns.includes('Safe') ? `${groupSize} options · ` : ''}Only one can execute; executing it
                    replaces the others.
                  </span>
                </>
              ) : (
                <>
                  <span
                    className="flex size-5 items-center justify-center rounded bg-warning-subtle text-warning-strong"
                    aria-hidden="true"
                  >
                    <ListFilter className="size-3" />
                  </span>
                  <span className="font-medium">{conflicts.length + 1} competing proposals</span>
                  <span className="text-muted-foreground">Executing one replaces the others.</span>
                </>
              )}
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
        onMouseMove={() => setHovered(true)}
        onMouseEnter={() => groupSize > 1 && onConflictHover?.(`${tx.account}:${tx.nonce}`)}
        onMouseLeave={() => {
          setHovered(false)
          if (groupSize > 1) onConflictHover?.(null)
        }}
        className={`group/transaction relative h-14 cursor-pointer data-[state=selected]:bg-transparent [&:has(:focus-visible)>td]:bg-muted [&[data-state=selected]>td]:bg-muted [&[data-state=selected]>td:first-child]:rounded-l-lg [&[data-state=selected]>td:last-child]:rounded-r-lg ${highlighted || cursor ? '[&>td]:bg-muted' : ''}`}
      >
        {columns.map((label) => (
          <Fragment key={label}>{cells[label]}</Fragment>
        ))}
      </TableRow>
    </Fragment>
  )
}
