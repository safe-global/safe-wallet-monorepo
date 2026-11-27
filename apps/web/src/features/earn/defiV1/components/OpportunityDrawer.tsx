import { Children, Fragment, type ReactNode } from 'react'
import { FileText, Info, ShieldCheck } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Typography } from '@safe-global/views/components/ui/typography'
import { Drawer } from '@safe-global/views/components/common/Drawer/Drawer'
import { DrawerBody } from '@safe-global/views/components/common/Drawer/components/DrawerBody'
import { DrawerHeader } from '@safe-global/views/components/common/Drawer/components/DrawerHeader'
import { DrawerSection } from '@safe-global/views/components/common/Drawer/components/DrawerSection'
import { DEFI_V1_COPY, formatApy, formatCompactUsd, formatLiveFor, formatUsd } from '../copy'
import type { Holding, Operation, Opportunity } from '../types'
import { ActionPanel, type ActionResult } from './ActionPanel'
import { SigningBlock } from './SigningBlock'
import { OpportunityMark, SponsoredBadge, Tag } from './TreasuryTables'

const COPY = DEFI_V1_COPY.drawer

const Frame = ({ children }: { children: ReactNode }) => (
  <div className="flex w-full flex-col overflow-hidden rounded-lg bg-card">
    {Children.toArray(children).map((row, index) => (
      <Fragment key={index}>
        {index > 0 && (
          <div className="px-2">
            <Separator className="bg-border/60" />
          </div>
        )}
        {row}
      </Fragment>
    ))}
  </div>
)

const Row = ({ label, value, strong }: { label: ReactNode; value: ReactNode; strong?: boolean }) => (
  <div className="flex min-h-8 items-center justify-between gap-2 px-3 py-2">
    <Typography variant="paragraph-small-medium" className="min-w-0">
      {label}
    </Typography>
    <Typography variant={strong ? 'paragraph-small-medium' : 'paragraph-small'} className="text-right tabular-nums">
      {value}
    </Typography>
  </div>
)

const TextRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-0.5 px-3 py-2.5">
    <Typography variant="paragraph-mini" color="muted">
      {label}
    </Typography>
    <Typography variant="paragraph-small">{children}</Typography>
  </div>
)

const accessLabel = (item: Opportunity) =>
  [item.access === 'pro' ? DEFI_V1_COPY.proOnly : DEFI_V1_COPY.openToAll, item.kyc && 'KYC once']
    .filter(Boolean)
    .join(' · ')

export const OpportunityDrawer = ({
  opportunity,
  list,
  onNavigate,
  locked,
  operations,
  canCreate,
  onDeposit,
  holding,
  onClose,
  onWithdrawn,
}: {
  opportunity: Opportunity | null
  list: Opportunity[]
  onNavigate: (opportunity: Opportunity) => void
  locked: boolean
  operations: Operation[]
  canCreate: boolean
  onDeposit: () => void
  holding?: Holding
  onClose: () => void
  onWithdrawn: (result: ActionResult) => void
}) => {
  const index = opportunity ? list.findIndex((item) => item.id === opportunity.id) : -1

  return (
    <Drawer open={opportunity !== null} onClose={onClose} ariaLabel={opportunity?.name} resizable expandable>
      {opportunity && (
        <>
          <DrawerHeader
            media={<OpportunityMark opportunity={opportunity} invested={Boolean(holding)} />}
            title={opportunity.name}
            subtitle={`${opportunity.runBy} · ${DEFI_V1_COPY.assetType[opportunity.type].label}`}
            status={
              holding && (
                <Badge variant="mint" size="status" shape="status">
                  {DEFI_V1_COPY.invested}
                </Badge>
              )
            }
            navigation={{
              onPrevious: () => onNavigate(list[index - 1]),
              onNext: () => onNavigate(list[index + 1]),
              hasPrevious: index > 0,
              hasNext: index >= 0 && index < list.length - 1,
              position: index >= 0 ? `${index + 1} of ${list.length}` : undefined,
            }}
          />
          <DrawerBody>
            <div className="flex flex-col gap-6 pb-6" data-testid="fact-sheet">
              <div className="flex flex-wrap gap-1.5">
                <Tag>{opportunity.asset}</Tag>
                {opportunity.chains.map((chain) => (
                  <Tag key={chain}>{chain}</Tag>
                ))}
                {opportunity.placement === 'sponsored' && <SponsoredBadge />}
              </div>

              {canCreate && !locked && (holding || operations[0]) && (
                <SigningBlock operation={operations[0]} onSetUp={onDeposit} />
              )}

              <DrawerSection title={COPY.overview} collapsible defaultOpen>
                <Frame>
                  <Row label={COPY.netApy} value={formatApy(opportunity.apy)} strong />
                  <Row label={COPY.exit} value={opportunity.exitLabel} />
                  <Row label={COPY.access} value={accessLabel(opportunity)} />
                  <Row label={COPY.tvl} value={formatCompactUsd(opportunity.tvl)} />
                  <Row label={COPY.liveFor} value={formatLiveFor(opportunity.liveSince)} />
                </Frame>
              </DrawerSection>

              {holding && (
                <DrawerSection
                  title={COPY.yourPosition}
                  rightNode={formatUsd(holding.invested + holding.pending)}
                  collapsible
                  defaultOpen
                >
                  <Frame>
                    <Row label={COPY.deposited} value={formatUsd(holding.invested)} />
                    {holding.pending > 0 && (
                      <Row label={DEFI_V1_COPY.positions.pending} value={formatUsd(holding.pending)} />
                    )}
                    <Row
                      label={COPY.earned}
                      value={
                        <span className="text-badge-dot-success">
                          {holding.earned > 0 ? `+${formatUsd(holding.earned)}` : '—'}
                        </span>
                      }
                    />
                  </Frame>
                </DrawerSection>
              )}

              <DrawerSection title={COPY.fees} rightNode={opportunity.protocolFee} collapsible defaultOpen>
                <Frame>
                  <Row label={COPY.providerFee(opportunity.runBy)} value={opportunity.protocolFee} />
                  <Row label={COPY.safeFee} value={COPY.noSafeFee} strong />
                </Frame>
                <Typography variant="paragraph-mini" color="muted" className="flex items-center gap-1.5">
                  <Info className="size-3.5 shrink-0" aria-hidden />
                  {COPY.feeNote}
                </Typography>
              </DrawerSection>

              <DrawerSection
                title={COPY.apyBreakdown}
                rightNode={formatApy(opportunity.apy)}
                collapsible
                defaultOpen={false}
              >
                <Frame>
                  <Row label={COPY.publishedApy} value={formatApy(opportunity.apy + opportunity.managementFee)} />
                  <Row
                    label={COPY.managementFee}
                    value={opportunity.managementFee ? formatApy(opportunity.managementFee) : 'None'}
                  />
                  <Row label={COPY.netApy} value={formatApy(opportunity.apy)} strong />
                </Frame>
                <Typography variant="paragraph-mini" color="muted">
                  {DEFI_V1_COPY.factSheet.rateNote}
                </Typography>
              </DrawerSection>

              <DrawerSection title={COPY.howItWorks} collapsible defaultOpen={false}>
                <Frame>
                  <TextRow label={COPY.yieldSource}>{opportunity.yieldSource}</TextRow>
                  <TextRow label={COPY.operators}>
                    {opportunity.operators}. {DEFI_V1_COPY.factSheet.thirdParty(opportunity.runBy)}
                  </TextRow>
                  <TextRow label={COPY.holds}>{opportunity.holds}</TextRow>
                </Frame>
              </DrawerSection>

              <DrawerSection
                title={COPY.auditsAndDocs}
                rightNode={COPY.auditCount(opportunity.audits.length)}
                collapsible
                defaultOpen={false}
              >
                <div className="flex flex-wrap gap-1.5">
                  {opportunity.audits.map((audit) => (
                    <Tag key={audit}>
                      <ShieldCheck aria-hidden />
                      {audit}
                    </Tag>
                  ))}
                  {COPY.documents.map((doc) => (
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

          <ActionPanel
            key={opportunity.id}
            opportunity={opportunity}
            holding={holding}
            locked={locked}
            onDeposit={onDeposit}
            onWithdrawn={onWithdrawn}
          />
        </>
      )}
    </Drawer>
  )
}
