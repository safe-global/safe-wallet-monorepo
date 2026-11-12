import { useState } from 'react'
import { Lock, ShieldCheck } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
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
import { DEFI_V1_COPY, formatUsd } from '../copy'
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

export const PolicyPanel = ({ plan }: { plan: DefiV1Plan }) => {
  const { safe } = useSafeInfo()
  const [isOpen, setIsOpen] = useState(false)
  const [sweep, setSweep] = useState(true)
  const allowed = OPPORTUNITIES.filter((item) => POLICY_PREVIEW.opportunityIds.includes(item.id))
  const isPro = plan === 'pro'

  return (
    <Card variant="muted" size="sm" data-testid="policy-panel">
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="size-4" aria-hidden />
            <Typography variant="paragraph-bold">{COPY.title}</Typography>
            <Badge variant="brand">{DEFI_V1_COPY.proOnly}</Badge>
            <Badge variant="warning">{DEFI_V1_COPY.deposit.comingSoon}</Badge>
          </div>
          <Typography variant="paragraph-small" color="muted">
            {COPY.lead}
          </Typography>
          <div>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
              {!isPro && <Lock />}
              {isPro ? COPY.cta : DEFI_V1_COPY.locked}
            </Button>
          </div>
        </div>
      </CardContent>

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
    </Card>
  )
}
