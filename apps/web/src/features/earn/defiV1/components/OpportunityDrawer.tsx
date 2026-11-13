import type { ReactNode } from 'react'
import { FileText, Info, Lock, ShieldCheck } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Typography } from '@safe-global/views/components/ui/typography'
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerSection,
  DrawerSubtitle,
  DrawerTitle,
} from '@/components/common/Drawer'
import { DEFI_V1_COPY, formatApy, formatCompactUsd, formatLiveFor } from '../copy'
import type { DefiV1Plan, Opportunity } from '../types'
import { ChainLogo, OpportunityMark, Tag } from './TreasuryTables'

const CATEGORY_TAG: Record<Opportunity['category'], string> = {
  cash: 'Cash-like',
  yield: 'Enhanced yield',
  staking: 'Staking',
}

// Mock Safe fee for the Free vs Pro comparison; real fees are not set yet.
const SAFE_FEE_FREE = '5% of rewards'

const Stat = ({ label, value, note }: { label: string; value: ReactNode; note?: string }) => (
  <div className="flex flex-col gap-1 rounded-lg bg-card p-3">
    <Typography variant="paragraph-mini-medium" color="muted" className="uppercase">
      {label}
    </Typography>
    <Typography variant="paragraph-bold">{value}</Typography>
    {note && (
      <Typography variant="paragraph-mini" color="muted">
        {note}
      </Typography>
    )}
  </div>
)

const Row = ({ label, value, strong }: { label: ReactNode; value: ReactNode; strong?: boolean }) => (
  <div className="flex items-center justify-between gap-3 py-2 text-sm">
    <span className={strong ? 'font-semibold' : undefined}>{label}</span>
    <span className={strong ? 'font-semibold tabular-nums' : 'tabular-nums'}>{value}</span>
  </div>
)

export const OpportunityDrawer = ({
  opportunity,
  locked,
  plan,
  onClose,
  onDeposit,
}: {
  opportunity: Opportunity | null
  locked: boolean
  plan: DefiV1Plan
  onClose: () => void
  onDeposit: (opportunity: Opportunity) => void
}) => (
  <Drawer open={opportunity !== null} onClose={onClose} ariaLabel={opportunity?.name}>
    {opportunity && (
      <>
        <DrawerHeader>
          <OpportunityMark opportunity={opportunity} />
          <div className="flex min-w-0 flex-col gap-1">
            <DrawerTitle size="lg">{opportunity.name}</DrawerTitle>
            <DrawerSubtitle>
              {opportunity.runBy} · {CATEGORY_TAG[opportunity.category]} ·
              <ChainLogo chain={opportunity.chains[0]} />
              {opportunity.chains.join(', ')}
            </DrawerSubtitle>
          </div>
        </DrawerHeader>

        <DrawerBody>
          <div className="flex flex-col gap-6 pb-6" data-testid="fact-sheet">
            <div className="flex flex-wrap gap-1.5">
              <Tag>{CATEGORY_TAG[opportunity.category]}</Tag>
              <Tag>{opportunity.asset}</Tag>
              <Tag>{DEFI_V1_COPY.risk[opportunity.risk]}</Tag>
              {opportunity.kyc && <Tag>KYC once</Tag>}
              {opportunity.placement === 'sponsored' && <Badge variant="warning">{DEFI_V1_COPY.sponsored}</Badge>}
              {opportunity.placement === 'featured' && <Badge variant="info">{DEFI_V1_COPY.featured}</Badge>}
              {opportunity.placement === 'premium' && <Badge variant="info">{DEFI_V1_COPY.premium}</Badge>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Stat label="Net APY" value={formatApy(opportunity.apy)} />
              <Stat label="TVL" value={formatCompactUsd(opportunity.tvl)} />
              <Stat label="Exit time" value={opportunity.exitShort} note={opportunity.exitLabel} />
              <Stat label="Live for" value={formatLiveFor(opportunity.liveSince)} />
            </div>

            <DrawerSection title="Fees" rightNode="Mock">
              <div className="flex flex-col rounded-lg bg-card px-3 py-1">
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 py-2 text-xs text-muted-foreground">
                  <span>Fee</span>
                  <span className="text-right">You</span>
                  <span className="text-right">Free plan</span>
                </div>
                <Separator />
                <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 py-2.5 text-sm">
                  <span>
                    {opportunity.runBy} fee <span className="text-xs text-muted-foreground">Already in net APY</span>
                  </span>
                  <span className="text-right">{opportunity.protocolFee}</span>
                  <span className="text-right text-muted-foreground">{opportunity.protocolFee}</span>
                </div>
                <Separator />
                <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 py-2.5 text-sm">
                  <span>Safe fee</span>
                  <span className="flex items-center justify-end gap-1.5">
                    {plan === 'pro' ? (
                      <>
                        <span className="font-semibold text-badge-dot-success">0%</span>
                        <Badge variant="brand">{DEFI_V1_COPY.proOnly}</Badge>
                      </>
                    ) : (
                      SAFE_FEE_FREE
                    )}
                  </span>
                  <span className="text-right text-muted-foreground">{SAFE_FEE_FREE}</span>
                </div>
              </div>
              <Typography variant="paragraph-mini" color="muted" className="flex items-center gap-1.5">
                <Info className="size-3.5 shrink-0" aria-hidden />
                Taken from rewards as they accrue. No deposit or withdrawal fee.
              </Typography>
            </DrawerSection>

            <DrawerSection title="Where the yield comes from">
              <Typography variant="paragraph-small">{opportunity.yieldSource}</Typography>
            </DrawerSection>

            <DrawerSection title="Who operates it">
              <Typography variant="paragraph-small">{opportunity.operators}</Typography>
              <Typography variant="paragraph-mini" color="muted">
                {DEFI_V1_COPY.factSheet.thirdParty(opportunity.runBy)}
              </Typography>
            </DrawerSection>

            <DrawerSection title="What you hold">
              <Typography variant="paragraph-small">{opportunity.holds}</Typography>
            </DrawerSection>

            <DrawerSection title="APY breakdown">
              <div className="flex flex-col">
                <Row label="Published APY" value={formatApy(opportunity.apy + opportunity.managementFee)} />
                <Separator />
                <Row
                  label="Management fee"
                  value={opportunity.managementFee ? formatApy(opportunity.managementFee) : 'None'}
                />
                <Separator />
                <Row label="Net APY" value={formatApy(opportunity.apy)} strong />
              </div>
              <Typography variant="paragraph-mini" color="muted">
                {DEFI_V1_COPY.factSheet.rateNote}
              </Typography>
            </DrawerSection>

            <DrawerSection title="Audits">
              <div className="flex flex-wrap gap-1.5">
                {opportunity.audits.map((audit) => (
                  <Tag key={audit}>
                    <ShieldCheck aria-hidden />
                    {audit}
                  </Tag>
                ))}
              </div>
            </DrawerSection>

            <DrawerSection title="Documents">
              <div className="flex flex-wrap gap-1.5">
                {['Fact sheet', 'Docs', 'Contract'].map((doc) => (
                  <Tag key={doc}>
                    <FileText aria-hidden />
                    {doc}
                  </Tag>
                ))}
              </div>
            </DrawerSection>

            {opportunity.safeIsPaid && (
              <div className="flex gap-2 rounded-lg bg-card p-3">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                <Typography variant="paragraph-small">{DEFI_V1_COPY.factSheet.safeIsPaid}</Typography>
              </div>
            )}
          </div>
        </DrawerBody>

        <DrawerFooter>
          <Button size="lg" className="w-full" disabled={locked} onClick={() => onDeposit(opportunity)}>
            {locked && <Lock />}
            {locked ? DEFI_V1_COPY.locked : DEFI_V1_COPY.factSheet.deposit}
          </Button>
        </DrawerFooter>
      </>
    )}
  </Drawer>
)
