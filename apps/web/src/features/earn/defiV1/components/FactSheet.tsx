import type { ReactNode } from 'react'
import { Info, Lock } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Separator } from '@safe-global/views/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@safe-global/views/components/ui/sheet'
import { Typography } from '@safe-global/views/components/ui/typography'
import { DEFI_V1_COPY, formatApy, formatLiveFor } from '../copy'
import type { Opportunity } from '../types'
import { OpportunityBadges } from './OpportunityRow'

const COPY = DEFI_V1_COPY.factSheet

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="grid grid-cols-[8rem_1fr] gap-3 py-2.5">
    <Typography variant="paragraph-small" color="muted">
      {label}
    </Typography>
    <Typography variant="paragraph-small-medium">{children}</Typography>
  </div>
)

export const FactSheet = ({
  opportunity,
  locked,
  onClose,
  onDeposit,
}: {
  opportunity: Opportunity | null
  locked: boolean
  onClose: () => void
  onDeposit: (opportunity: Opportunity) => void
}) => (
  <Sheet open={opportunity !== null} onOpenChange={(open) => !open && onClose()}>
    <SheetContent side="right" size="md" data-testid="fact-sheet">
      {opportunity && (
        <>
          <SheetHeader>
            <SheetTitle>{opportunity.name}</SheetTitle>
            <SheetDescription>{COPY.thirdParty(opportunity.runBy)}</SheetDescription>
            <OpportunityBadges opportunity={opportunity} locked={locked} />
          </SheetHeader>

          <div className="flex flex-col overflow-y-auto px-4">
            <Fact label={COPY.exit}>{opportunity.exitLabel}</Fact>
            <Fact label={COPY.runBy}>{opportunity.runBy}</Fact>
            {opportunity.curator && <Fact label={COPY.curator}>{opportunity.curator}</Fact>}
            <Fact label={COPY.audits}>{opportunity.audits.join(', ')}</Fact>
            <Fact label={COPY.liveFor}>{formatLiveFor(opportunity.liveSince)}</Fact>
            <Fact label={COPY.kyc}>{opportunity.kyc ? COPY.kycYes : COPY.kycNo}</Fact>
            <Fact label={COPY.chains}>{opportunity.chains.join(', ')}</Fact>
            <Fact label={COPY.holds}>{opportunity.holds}</Fact>
            <Separator className="my-2" />
            <Fact label={COPY.apy}>{formatApy(opportunity.apy)}</Fact>
            <Typography variant="paragraph-mini" color="muted">
              {COPY.rateNote}
            </Typography>

            {opportunity.safeIsPaid && (
              <div className="mt-4 flex gap-2 rounded-md bg-muted p-3">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                <Typography variant="paragraph-small">{COPY.safeIsPaid}</Typography>
              </div>
            )}
          </div>

          <SheetFooter>
            <Button size="lg" disabled={locked} onClick={() => onDeposit(opportunity)}>
              {locked && <Lock />}
              {locked ? DEFI_V1_COPY.locked : COPY.deposit}
            </Button>
          </SheetFooter>
        </>
      )}
    </SheetContent>
  </Sheet>
)
