import { Fragment } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { getConflicts, getTransactionLabel } from '../../services/model'
import { getMenuItems, getPrimaryAction, MENU_LABELS, RARE_MENU_ACTIONS, type MenuAction } from '../../services/actions'
import type { PreviewAction } from '../../services/queue'
import { canSpeedUp, getLockingTx, type Executions } from '../../services/execution'
import type { Milestone, Persona, Proposal } from '../../types'
import { HINT_CLASS } from '../shared'

export type RowActionsProps = {
  tx: Proposal
  items: Proposal[]
  persona: Persona
  milestone?: Milestone
  remindedIds?: string[]
  executions?: Executions
  now?: number
  // The row is hovered: the main button fills.
  hovered?: boolean
  // Phones: the most urgent button stays filled.
  filled?: boolean
  // Phones: the button fits its label instead of the table's fixed width.
  fit?: boolean
  onReplaceHover?: (id: string | null) => void
  onReview: (tx: Proposal) => void
  onGoTo?: (tx: Proposal) => void
  onRemind?: (tx: Proposal) => void
  onStartFlow?: (tx: Proposal, flow: PreviewAction) => void
  onMenuAction?: (tx: Proposal, action: MenuAction) => void
  onSpeedUp?: (id: string) => void
}

// The row's main button and its More menu, shared by the table and the phone list.
export function RowActions({
  tx,
  items,
  persona,
  milestone = 2,
  remindedIds = [],
  executions = {},
  now = Date.now(),
  hovered = false,
  filled = false,
  fit = false,
  onReplaceHover = () => undefined,
  onReview,
  onGoTo,
  onRemind,
  onStartFlow,
  onMenuAction,
  onSpeedUp,
}: RowActionsProps) {
  const m1 = milestone === 1
  const width = fit ? undefined : 'w-20'
  const execution = executions[tx.id]
  const lockedBy = execution ? undefined : getLockingTx(tx, items, executions)
  const conflicts = getConflicts(tx, items)
  const reminded = remindedIds.includes(tx.id)
  // Shared action rules set the main button, the menu and the status hint.
  const fullAction = getPrimaryAction(tx, items, persona, remindedIds, 'row')
  // M1: no Remind yet. The row offers Review, which opens the transaction page.
  const primaryAction = m1 && fullAction.kind === 'remind' ? ({ kind: 'review', label: 'Review' } as const) : fullAction
  const menuItems = getMenuItems(tx, items, persona).filter(
    ({ action }) => !m1 || (action !== 'remind' && action !== 'invite'),
  )
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
  return (
    <div className="flex items-center justify-end gap-1">
      {execution ? (
        canSpeedUp(execution, now) ? (
          <Button
            size="2xs"
            variant="default"
            className={width}
            aria-label={`Speed up ${getTransactionLabel(tx)}`}
            onClick={stop(() => onSpeedUp?.(tx.id))}
          >
            Speed up
          </Button>
        ) : (
          <span className={width} aria-hidden="true" />
        )
      ) : lockedBy ? (
        <Tooltip delay={150}>
          <TooltipTrigger render={<span className="flex" />}>
            <Button
              size="2xs"
              variant="outline"
              className={width}
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
        <span className={width} aria-hidden="true" />
      ) : primary.hint ? (
        <Tooltip delay={150}>
          <TooltipTrigger
            render={
              <Button
                size="2xs"
                variant={hovered || filled ? 'default' : 'outline'}
                className={width}
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
          variant={hovered || filled ? 'default' : 'outline'}
          className={width}
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
  )
}
