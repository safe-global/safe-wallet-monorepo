import { useState } from 'react'
import { Lock, Repeat } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@safe-global/views/components/ui/dialog'
import { Switch } from '@safe-global/views/components/ui/switch'
import { Typography } from '@safe-global/views/components/ui/typography'
import { DEFI_V1_COPY, formatCompactUsd, formatUsd } from '../copy'
import useSafeInfo from '@/hooks/useSafeInfo'
import { OPPORTUNITIES, POLICY_PREVIEW } from '../opportunities'
import type { DefiV1Plan } from '../types'

const COPY = DEFI_V1_COPY.policy

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-[9rem_1fr] gap-3 py-2">
    <Typography variant="paragraph-small" color="muted">
      {label}
    </Typography>
    <Typography variant="paragraph-small-medium">{value}</Typography>
  </div>
)

export const PolicyPanel = ({ plan, idle }: { plan: DefiV1Plan; idle: number }) => {
  const { safe } = useSafeInfo()
  const [isOpen, setIsOpen] = useState(false)
  const [sweep, setSweep] = useState(true)
  const allowed = OPPORTUNITIES.filter((item) => POLICY_PREVIEW.opportunityIds.includes(item.id))
  const isPro = plan === 'pro'

  return (
    <div className="flex items-center gap-3" data-testid="policy-panel">
      <Repeat className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="flex min-w-0 flex-col">
        <span className="font-medium">{COPY.footerTitle(formatCompactUsd(idle))}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {COPY.footerLead}
          <Badge variant="warning">{DEFI_V1_COPY.deposit.comingSoon}</Badge>
        </span>
      </div>
      <Button variant="outline" size="xs" className="ml-auto" onClick={() => setIsOpen(true)}>
        {!isPro && <Lock />}
        {isPro ? COPY.cta : DEFI_V1_COPY.proOnly}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent size="sm" data-testid="policy-dialog">
          <DialogHeader divided="subtle">
            <DialogTitle>{COPY.dialogTitle}</DialogTitle>
            <DialogDescription>{COPY.lead}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col px-4">
            <Row label={COPY.options} value={allowed.map((item) => item.name).join(', ')} />
            <Row label={COPY.cap} value={formatUsd(POLICY_PREVIEW.cap)} />
            <Row label={COPY.who} value={COPY.whoValue(POLICY_PREVIEW.executors, safe.owners.length)} />
            <Row label="" value={COPY.returnRule} />
            <div className="flex items-center justify-between gap-3 py-2">
              <div className="flex flex-col">
                <Typography variant="paragraph-small-medium">{COPY.sweep}</Typography>
                <Typography variant="paragraph-small" color="muted">
                  {COPY.sweepValue(formatUsd(POLICY_PREVIEW.keepLiquid))}
                </Typography>
              </div>
              <Switch checked={sweep} onCheckedChange={setSweep} aria-label={COPY.sweep} />
            </div>
          </div>
          <DialogFooter divided="subtle">
            <Typography variant="paragraph-small" color="muted" align="center">
              {COPY.approveOnce(safe.threshold, safe.owners.length)}
            </Typography>
            <Button size="lg" disabled={!isPro} onClick={() => setIsOpen(false)}>
              {COPY.approve}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
