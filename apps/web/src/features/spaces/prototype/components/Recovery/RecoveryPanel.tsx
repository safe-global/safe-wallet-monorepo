import { Fragment, useState, type ReactNode } from 'react'
import { LifeBuoy, MoreHorizontal } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@safe-global/views/components/ui/avatar'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@safe-global/views/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { formatDateTime } from '@safe-global/utils/utils/date'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import Identicon from '@/components/common/Identicon'
import { accounts } from '../../services/model'
import { isSignerOf } from '../../services/personas'
import type { Persona } from '../../types'
import { chainLogoUrl, HINT_CLASS, HintContent, SafeIdentity, StatusChip } from '../shared'
import { getColumns } from '../QueueTable/sections'
import { STEPS_WIDTHS } from '../QueueTable/QueueSection'
import { SignatureGauge } from '../QueueTable/SignatureGauge'
import { RecoveryMark } from './RecoveryMark'
import {
  createRecoveries,
  formatDuration,
  getRecoveryHeadline,
  getRecoveryStatus,
  shortHex,
  type Recovery,
  type RecoveryState,
} from './recoveryData'

// Recovery uses the Delay Modifier, not the nonce queue. Its row uses the queue grid.
const HEADERS: Record<string, string> = { With: 'Recoverer', Signatures: 'Review window' }
const ago = (ms: number) => `${formatDuration(Date.now() - ms)} ago`

export const getReviewProgress = (recovery: Recovery, now = Date.now()) => {
  const total = recovery.executableAt - recovery.proposedAt
  const elapsed = Math.min(Math.max(now - recovery.proposedAt, 0), total)
  const ended = now >= recovery.executableAt
  return {
    percent: Math.round((elapsed / total) * 100),
    label: ended
      ? `Expires in ${formatDuration(recovery.expiresAt - now)}`
      : `${formatDuration(recovery.executableAt - now)} left`,
  }
}

const Hint = ({ title, body, children }: { title: string; body: ReactNode; children: ReactNode }) => (
  <Tooltip delay={150}>
    <TooltipTrigger render={<span className="flex min-w-0" />} onClick={(event) => event.stopPropagation()}>
      {children}
    </TooltipTrigger>
    <TooltipContent className={HINT_CLASS}>
      <HintContent title={title} body={body} />
    </TooltipContent>
  </Tooltip>
)

export type RecoveryController = ReturnType<typeof useRecoveries>

// One recovery as a row, in the Status view section or a Safe section.
export function RecoveryRow({
  recovery,
  columns,
  controller,
}: {
  recovery: Recovery
  columns: string[]
  controller: RecoveryController
}) {
  const { getPrimary, canCancel, cancel, setOpenId } = controller
  const account = accounts.find((candidate) => candidate.id === recovery.accountId)!
  const status = getRecoveryStatus(recovery)
  const progress = getReviewProgress(recovery)
  const primary = getPrimary(recovery)
  const cells: Record<string, ReactNode> = {
    Nonce: (
      <TableCell>
        <Hint title="Account recovery" body="Runs through the recovery module, outside this Safe's nonce queue.">
          <RecoveryMark />
        </Hint>
      </TableCell>
    ),
    Transaction: (
      <TableCell className="py-2">
        <span className="flex min-w-0 items-center gap-3 text-sm">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-[4px] bg-muted group-hover/transaction:bg-card group-data-[state=selected]/transaction:bg-card">
            <LifeBuoy className="size-3.5" strokeWidth={ICON_STROKE} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className={`block truncate ${recovery.malicious ? 'text-destructive' : ''}`}>
              {getRecoveryHeadline(recovery)}
            </span>
            <span
              className={`mt-0.5 block truncate text-xs ${recovery.malicious ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {recovery.malicious
                ? 'Malicious transaction'
                : `${recovery.newSigners.length} new · ${recovery.threshold} of ${recovery.newSigners.length} required`}
            </span>
          </span>
        </span>
      </TableCell>
    ),
    Safe: (
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
    ),
    With: (
      <TableCell className="text-xs">
        <span className="flex min-w-0 items-center gap-3">
          <Hint title="Recoverer" body={<span className="break-all font-mono">{recovery.recoverer.address}</span>}>
            <Identicon address={recovery.recoverer.address} size={24} />
          </Hint>
          <span className="min-w-0">
            <span className={`block truncate text-sm ${recovery.malicious ? 'text-destructive' : ''}`}>
              {recovery.recoverer.name}
            </span>
            <span className="mt-0.5 block truncate font-mono text-muted-foreground">
              {shortHex(recovery.recoverer.address)}
            </span>
          </span>
        </span>
      </TableCell>
    ),
    Chain: (
      <TableCell>
        <Tooltip delay={150}>
          <TooltipTrigger className="flex" aria-label={account.network} onClick={(event) => event.stopPropagation()}>
            <Avatar size="xs">
              <AvatarImage src={chainLogoUrl(account.chainId)} alt={account.network} />
              <AvatarFallback>{account.network[0]}</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>{account.network}</TooltipContent>
        </Tooltip>
      </TableCell>
    ),
    Proposed: (
      <TableCell className="text-sm">
        <Tooltip delay={150}>
          <TooltipTrigger onClick={(event) => event.stopPropagation()}>{ago(recovery.proposedAt)}</TooltipTrigger>
          <TooltipContent>{formatDateTime(recovery.proposedAt)}</TooltipContent>
        </Tooltip>
      </TableCell>
    ),
    Note: <TableCell />,
    Signatures: (
      <TableCell className="py-1">
        <Tooltip delay={150}>
          <TooltipTrigger
            className="flex items-center gap-1.5 text-sm tabular-nums"
            onClick={(event) => event.stopPropagation()}
          >
            <SignatureGauge count={progress.percent} threshold={100} />
            {progress.label}
          </TooltipTrigger>
          <TooltipContent className={HINT_CLASS}>
            <HintContent
              title="Review window"
              body={`Executable from ${formatDateTime(recovery.executableAt)}. Expires ${formatDateTime(recovery.expiresAt)}.`}
            />
          </TooltipContent>
        </Tooltip>
      </TableCell>
    ),
    Status: (
      <TableCell>
        <Tooltip delay={150}>
          <TooltipTrigger render={<span />} aria-label={status.hint} onClick={(event) => event.stopPropagation()}>
            <StatusChip tone={status.tone}>{status.label}</StatusChip>
          </TooltipTrigger>
          <TooltipContent className={HINT_CLASS}>{status.hint}</TooltipContent>
        </Tooltip>
      </TableCell>
    ),
    Action: (
      <TableCell className="sticky right-0 z-10 bg-card">
        <div className="flex items-center justify-end gap-1">
          {primary ? (
            <Button
              size="2xs"
              variant="outline"
              className="w-20"
              onClick={(event) => {
                event.stopPropagation()
                primary.run()
              }}
            >
              {primary.label}
            </Button>
          ) : (
            <Button
              size="2xs"
              variant="outline"
              className="w-20"
              onClick={(event) => {
                event.stopPropagation()
                setOpenId(recovery.id)
              }}
            >
              Review
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`More actions for ${account.name} recovery`}
                  onClick={(event) => event.stopPropagation()}
                />
              }
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto min-w-40 whitespace-nowrap">
              {recovery.state === 'executable' && !recovery.malicious && canCancel(recovery) && (
                <DropdownMenuItem onClick={() => cancel(recovery)}>Cancel recovery</DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setOpenId(recovery.id)}>View details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    ),
  }
  return (
    <TableRow className="group/transaction h-14 cursor-pointer" onClick={() => setOpenId(recovery.id)}>
      {columns.map((label) => (
        <Fragment key={label}>{cells[label]}</Fragment>
      ))}
    </TableRow>
  )
}

export function RecoveryNoticeRow({ columnCount, count }: { columnCount: number; count: number }) {
  return (
    <TableRow data-no-hover data-no-divider>
      <TableCell colSpan={columnCount} className="pt-4 pb-1">
        <div className="flex items-center gap-2 text-xs">
          <RecoveryMark />
          <span className="font-medium">{count === 1 ? 'Account recovery' : `${count} account recoveries`}</span>
          <span className="text-muted-foreground">Changes who controls this Safe. Runs outside the nonce queue.</span>
          <ExternalLink href={HelpCenterArticle.RECOVERY} className="text-muted-foreground" noIcon>
            How recovery works
          </ExternalLink>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function useRecoveries({
  enabled,
  persona,
  onFeedback,
}: {
  enabled: boolean
  persona: Persona
  onFeedback: (message: string) => void
}) {
  const [items, setItems] = useState(() => (enabled ? createRecoveries() : []))
  const [openId, setOpenId] = useState<string | null>(null)
  const update = (id: string, state: RecoveryState) =>
    setItems((current) => current.map((item) => (item.id === id ? { ...item, state } : item)))
  const accountOf = (recovery: Recovery) => accounts.find((candidate) => candidate.id === recovery.accountId)!
  const cancel = (recovery: Recovery) => {
    update(recovery.id, 'cancelling')
    onFeedback(
      `Cancellation proposed for ${accountOf(recovery).name} in this preview. It needs ${accountOf(recovery).threshold} signatures and execution before the recovery does.`,
    )
  }
  const execute = (recovery: Recovery) => {
    update(recovery.id, 'executed')
    setOpenId(null)
    onFeedback(`Recovery executed for ${accountOf(recovery).name} in this preview. Its signers have changed.`)
  }
  const canCancel = (recovery: Recovery) => {
    const owner = isSignerOf(accountOf(recovery), persona)
    return recovery.state !== 'cancelling' && (owner || recovery.state === 'expired')
  }
  const getPrimary = (recovery: Recovery) =>
    recovery.state === 'cancelling'
      ? undefined
      : recovery.malicious || recovery.state === 'review'
        ? canCancel(recovery)
          ? { label: 'Cancel', run: () => cancel(recovery) }
          : undefined
        : recovery.state === 'executable'
          ? { label: 'Execute', run: () => execute(recovery) }
          : undefined
  const visible = items.filter((item) => item.state !== 'executed')
  return {
    visible,
    forAccount: (accountId: string) => visible.filter((item) => item.accountId === accountId),
    open: items.find((item) => item.id === openId) ?? null,
    setOpenId,
    cancel,
    canCancel,
    getPrimary,
  }
}

// Status view: recoveries above the queue, in the same grid as the queue tables.
export function RecoveryPanel({ controller, isWide }: { controller: RecoveryController; isWide: boolean }) {
  const { visible } = controller
  const columns = getColumns('status', isWide, true)
  if (!visible.length) return null
  return (
    <section className="mb-6 flex flex-col gap-2">
      <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium">
        <RecoveryMark />
        Account recovery
        <Badge variant="outline">{visible.length}</Badge>
        <span className="text-xs font-normal text-muted-foreground">
          Changes who controls a Safe. Runs outside the nonce queue.
        </span>
        <ExternalLink href={HelpCenterArticle.RECOVERY} className="text-xs text-muted-foreground" noIcon>
          How recovery works
        </ExternalLink>
      </div>
      <Card radius="xl" size="none">
        <CardContent>
          <Table
            aria-label="Account recovery"
            variant="panel"
            className="table-fixed min-w-[1080px] [&_td]:px-4 [&_th]:px-4"
          >
            <colgroup>
              {columns.map((label) => (
                <col key={label} className={STEPS_WIDTHS[label]} />
              ))}
            </colgroup>
            <TableHeader>
              <TableRow data-no-hover>
                {columns.map((label) => (
                  <TableHead
                    key={label}
                    scope="col"
                    className={`text-xs text-muted-foreground ${label === 'Action' ? 'sticky right-0 z-20' : ''}`}
                  >
                    {label === 'Action' ? <span className="sr-only">Action</span> : (HEADERS[label] ?? label)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((recovery) => (
                <RecoveryRow key={recovery.id} recovery={recovery} columns={columns} controller={controller} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )
}
