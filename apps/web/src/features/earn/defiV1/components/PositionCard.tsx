import { useState } from 'react'
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
import { Typography } from '@safe-global/views/components/ui/typography'
import { DEFI_V1_COPY, formatApy, formatUsd } from '../copy'
import type { Opportunity } from '../types'

const COPY = DEFI_V1_COPY.positions

export type Position = { opportunity: Opportunity; principal: number; earned: number; pending: boolean }

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5">
    <Typography variant="paragraph-mini" color="muted">
      {label}
    </Typography>
    <Typography variant="paragraph-small-medium">{value}</Typography>
  </div>
)

export const PositionCard = ({ position }: { position: Position }) => {
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const { opportunity } = position

  return (
    <div
      className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4"
      data-testid={`position-${opportunity.id}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <Typography variant="paragraph-bold">{opportunity.name}</Typography>
          <Typography variant="paragraph-small" color="muted">
            {opportunity.runBy} · {opportunity.chains[0]}
          </Typography>
        </div>
        {position.pending ? (
          <Badge variant="warning">{COPY.pending}</Badge>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setIsWithdrawing(true)}>
            {COPY.withdraw}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label={COPY.principal} value={formatUsd(position.principal)} />
        <Stat label={COPY.earned} value={formatUsd(position.earned)} />
        <Stat label={COPY.rate} value={formatApy(opportunity.apy)} />
        <Stat label={COPY.exit} value={opportunity.exitLabel} />
      </div>

      <Dialog open={isWithdrawing} onOpenChange={setIsWithdrawing}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{COPY.withdrawTitle(opportunity.name)}</DialogTitle>
            <DialogDescription>{COPY.withdrawLead}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 px-4">
            <Stat label={COPY.principal} value={formatUsd(position.principal + position.earned)} />
            <Stat label={COPY.exit} value={opportunity.exitLabel} />
          </div>
          <DialogFooter>
            <Button size="lg" onClick={() => setIsWithdrawing(false)}>
              {DEFI_V1_COPY.deposit.createProposal}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
