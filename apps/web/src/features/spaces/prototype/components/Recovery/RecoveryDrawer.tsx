import { useState } from 'react'
import { ArrowRight, Check, Circle, LifeBuoy } from 'lucide-react'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { formatDateTime } from '@safe-global/utils/utils/date'
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerList,
  DrawerSection,
  DrawerSubtitle,
  DrawerTitle,
} from '@/components/common/Drawer'
import { accounts } from '../../services/model'
import { HINT_CLASS, StatusChip } from '../shared'
import { IdentityRow } from '../ReviewDrawer/steps/IdentityRow'
import { RecoveryMark } from './RecoveryMark'
import { formatDuration, getRecoveryHeadline, getRecoveryStatus, shortHex, type Recovery } from './recoveryData'

const Mono = ({ value }: { value: string }) => (
  <span className="block break-all text-right font-mono text-xs">{value}</span>
)

function Timeline({ recovery }: { recovery: Recovery }) {
  const now = Date.now()
  const steps = [
    { label: 'Proposed', at: recovery.proposedAt, done: true },
    { label: 'Review window ends', at: recovery.executableAt, done: now >= recovery.executableAt },
    { label: 'Expires', at: recovery.expiresAt, done: now >= recovery.expiresAt },
  ]
  return (
    <ol className="space-y-3 rounded-lg bg-muted p-3">
      {steps.map((step) => (
        <li key={step.label} className="flex items-center gap-3 text-sm">
          {step.done ? (
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-badge-dot-success text-black">
              <Check className="size-2.5" strokeWidth={3} aria-label="Done" />
            </span>
          ) : (
            <Circle className="size-4 shrink-0 text-muted-foreground" strokeWidth={ICON_STROKE} aria-label="Upcoming" />
          )}
          <span className={`min-w-0 flex-1 ${step.done ? '' : 'text-muted-foreground'}`}>{step.label}</span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatDateTime(step.at)}
            {!step.done && ` · in ${formatDuration(step.at - now)}`}
          </span>
        </li>
      ))}
    </ol>
  )
}

export function RecoveryDrawer({
  recovery,
  primary,
  canCancel,
  onCancel,
  onClose,
}: {
  recovery: Recovery | null
  primary?: { label: string; run: () => void }
  canCancel: boolean
  onCancel: () => void
  onClose: () => void
}) {
  const [showData, setShowData] = useState(false)
  const account = recovery ? accounts.find((candidate) => candidate.id === recovery.accountId) : undefined
  const status = recovery ? getRecoveryStatus(recovery) : undefined
  return (
    <Drawer resizable mobileFullScreen open={!!recovery} onClose={onClose} ariaLabel="Account recovery">
      <DrawerHeader>
        {recovery && (
          <div className="flex min-w-0 flex-1 items-center gap-3 pr-18">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-card">
              <LifeBuoy className="size-5" strokeWidth={ICON_STROKE} aria-hidden="true" />
            </span>
            <DrawerTitle size="lg">{getRecoveryHeadline(recovery)}</DrawerTitle>
          </div>
        )}
      </DrawerHeader>
      <DrawerBody>
        {recovery && account && status && (
          <div className="flex flex-col gap-6">
            <div className="flex min-w-0 items-center gap-2">
              <div className="min-w-0 flex-1 overflow-hidden">
                <DrawerSubtitle>
                  <RecoveryMark />
                  <span className="min-w-0 truncate">
                    {account.name} · {account.network} · Account recovery
                  </span>
                </DrawerSubtitle>
              </div>
              <Tooltip delay={150}>
                <TooltipTrigger render={<span className="ml-auto shrink-0" />} aria-label={status.hint}>
                  <StatusChip tone={status.tone}>{status.label}</StatusChip>
                </TooltipTrigger>
                <TooltipContent className={HINT_CLASS}>{status.hint}</TooltipContent>
              </Tooltip>
            </div>

            {recovery.malicious ? (
              <Alert variant="destructive" outlined={false}>
                <AlertSeverityIcon variant="destructive" />
                <AlertTitle>Malicious transaction</AlertTitle>
                <AlertDescription>
                  This recovery doesn&apos;t change {account.name}&apos;s signers. It calls {recovery.maliciousTarget}{' '}
                  instead. Cancel it before the review window ends.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="subtle">
                <AlertSeverityIcon variant="info" />
                <AlertTitle>Runs outside the nonce queue</AlertTitle>
                <AlertDescription>{status.hint}</AlertDescription>
              </Alert>
            )}

            <section aria-label="What changes" className="rounded-lg bg-muted p-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                <IdentityRow
                  name={recovery.recoverer.name}
                  address={recovery.recoverer.address}
                  chainId={account.chainId}
                  avatarSize={32}
                  tone={recovery.malicious ? 'warning' : undefined}
                />
                <ArrowRight className="size-4 text-muted-foreground" strokeWidth={ICON_STROKE} aria-label="to" />
                <IdentityRow
                  name={account.name}
                  address={account.iconAddress}
                  chainId={account.chainId}
                  avatarSize={32}
                />
              </div>
              <p className="mt-3 border-t border-border pt-3 text-center text-sm font-medium">
                {recovery.malicious
                  ? `Calls ${recovery.maliciousTarget}`
                  : `${getRecoveryHeadline(recovery)} · ${recovery.threshold} of ${recovery.newSigners.length}`}
              </p>
            </section>

            {!recovery.malicious && (
              <DrawerSection
                collapsible
                title="New signers"
                rightNode={`${recovery.threshold} of ${recovery.newSigners.length} required`}
              >
                <div className="space-y-2 rounded-lg bg-muted p-3">
                  {recovery.newSigners.map((signer) => (
                    <IdentityRow key={signer} address={signer} chainId={account.chainId} />
                  ))}
                </div>
              </DrawerSection>
            )}

            <DrawerSection collapsible title="Timeline">
              <Timeline recovery={recovery} />
            </DrawerSection>

            <DrawerSection collapsible title="Summary">
              <DrawerList
                mobileStack
                items={[
                  { label: 'Network', content: account.network },
                  {
                    label: 'Recoverer',
                    content: `${recovery.recoverer.name} · ${shortHex(recovery.recoverer.address)}`,
                  },
                  { label: 'Proposed', content: formatDateTime(recovery.proposedAt) },
                  { label: 'Executable', content: formatDateTime(recovery.executableAt) },
                  { label: 'Expires', content: formatDateTime(recovery.expiresAt) },
                ]}
              />
            </DrawerSection>

            <DrawerSection
              collapsible
              title="Transaction data"
              open={showData}
              onOpenChange={() => setShowData(!showData)}
            >
              <DrawerList
                mobileStack
                items={[
                  { label: 'Module', content: <Mono value={recovery.module} /> },
                  { label: 'Value', content: <Mono value="0" /> },
                  { label: 'Operation', content: '0 (call)' },
                  { label: 'Raw data', content: <Mono value={`${recovery.data.slice(0, 74)}…`} /> },
                ]}
              />
              <p className="text-xs text-muted-foreground">
                Values in this preview are placeholders.{' '}
                <ExternalLink href={HelpCenterArticle.RECOVERY}>How recovery works</ExternalLink>
              </p>
            </DrawerSection>
          </div>
        )}
      </DrawerBody>
      <div className="shrink-0 border-t border-border bg-background">
        <DrawerFooter safeArea>
          {recovery && (
            <div className="flex flex-col gap-2 pt-4">
              {recovery.state === 'cancelling' && (
                <p className="text-center text-xs text-muted-foreground">
                  The cancellation is in the queue and needs signatures and execution.
                </p>
              )}
              {primary && (
                <Button
                  className="w-full"
                  variant={primary.label === 'Cancel' && recovery.malicious ? 'destructive' : 'default'}
                  onClick={primary.run}
                >
                  {primary.label === 'Cancel' ? 'Cancel recovery' : 'Execute recovery'}
                </Button>
              )}
              {primary?.label === 'Execute' && canCancel && (
                <Button className="w-full" variant="ghost" onClick={onCancel}>
                  Cancel recovery
                </Button>
              )}
              {!primary && recovery.state !== 'cancelling' && (
                <p className="text-center text-xs text-muted-foreground">
                  Only signers of {account?.name} can cancel it. Anyone can execute it once the review window ends.
                </p>
              )}
            </div>
          )}
        </DrawerFooter>
      </div>
    </Drawer>
  )
}
