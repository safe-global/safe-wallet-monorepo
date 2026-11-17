import { Children, Fragment, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, FileText, Info, Maximize2, Minimize2, ShieldCheck, X } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import { Drawer, DrawerBody, DrawerSection } from '@/components/common/Drawer'
import { DEFI_V1_COPY, formatApy, formatCompactUsd, formatLiveFor, formatUsd } from '../copy'
import type { Holding, Operation, Opportunity } from '../types'
import { growthSeries, growthShare, liquidityBucket } from '../shelf'
import { ActionPanel, type ActionResult } from './ActionPanel'
import { Sparkline } from './Sparkline'
import { SigningBlock } from './SigningBlock'
import { OpportunityMark, Tag } from './TreasuryTables'

const COPY = DEFI_V1_COPY.drawer

// Mock Safe fee for the Free vs Pro comparison; real fees are not set yet.

type HeaderAction = { id: string; label: string; icon: ReactNode; onClick?: () => void; disabled?: boolean }

// Same joined button group as the pending queue drawer header.
const HeaderActions = ({ actions }: { actions: HeaderAction[] }) => (
  <div
    data-slot="button-group"
    role="group"
    aria-label="Panel actions"
    className="flex shrink-0 items-stretch overflow-hidden rounded-md border border-border bg-card shadow-xs"
  >
    {actions.map((action, index) => (
      <span key={action.id} className="flex items-stretch">
        {index > 0 && <span aria-hidden className="w-px bg-border" />}
        <Tooltip delay={0} closeDelay={150}>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={action.label}
                disabled={action.disabled}
                onClick={action.onClick}
              />
            }
          >
            {action.icon}
          </TooltipTrigger>
          <TooltipContent>{action.label}</TooltipContent>
        </Tooltip>
      </span>
    ))}
  </div>
)

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
  [item.access === 'pro' ? DEFI_V1_COPY.proOnly : DEFI_V1_COPY.toolbar.openOnly, item.kyc && 'KYC once']
    .filter(Boolean)
    .join(' · ')

export const OpportunityDrawer = ({
  opportunity,
  list,
  onNavigate,
  locked,
  operations,
  canCreate,
  onCustomise,
  holding,
  onClose,
  onDeposited,
  onWithdrawn,
}: {
  opportunity: Opportunity | null
  list: Opportunity[]
  onNavigate: (opportunity: Opportunity) => void
  locked: boolean
  operations: Operation[]
  canCreate: boolean
  onCustomise: () => void
  holding?: Holding
  onClose: () => void
  onDeposited: (result: ActionResult) => void
  onWithdrawn: (result: ActionResult) => void
}) => {
  const index = opportunity ? list.findIndex((item) => item.id === opportunity.id) : -1

  return (
    <Drawer
      open={opportunity !== null}
      onClose={onClose}
      ariaLabel={opportunity?.name}
      resizable
      mobileFullScreen
      header={({ fullScreen, toggleFullScreen, close }) =>
        opportunity && (
          <header className="flex items-center gap-3 px-6 pt-6">
            <OpportunityMark invested={Boolean(holding)} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Typography as="h2" variant="paragraph-bold" className="truncate leading-tight">
                {opportunity.name}
              </Typography>
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-xs text-muted-foreground">
                  {opportunity.runBy} · {DEFI_V1_COPY.liquidity[liquidityBucket(opportunity)].title}
                </span>
                {holding && (
                  <Badge variant="mint" size="status" shape="status">
                    {DEFI_V1_COPY.invested}
                  </Badge>
                )}
              </div>
            </div>
            {index >= 0 && (
              <span className={fullScreen ? 'shrink-0 text-xs tabular-nums text-muted-foreground' : 'sr-only'}>
                {index + 1} of {list.length}
              </span>
            )}
            <HeaderActions
              actions={[
                {
                  id: 'previous',
                  label: COPY.previous,
                  icon: <ChevronUp />,
                  disabled: index <= 0,
                  onClick: () => onNavigate(list[index - 1]),
                },
                {
                  id: 'next',
                  label: COPY.next,
                  icon: <ChevronDown />,
                  disabled: index < 0 || index >= list.length - 1,
                  onClick: () => onNavigate(list[index + 1]),
                },
                ...(toggleFullScreen
                  ? [
                      {
                        id: 'expand',
                        label: fullScreen ? COPY.restore : COPY.fullScreen,
                        icon: fullScreen ? <Minimize2 /> : <Maximize2 />,
                        onClick: toggleFullScreen,
                      },
                    ]
                  : []),
                { id: 'close', label: COPY.close, icon: <X />, onClick: close },
              ]}
            />
          </header>
        )
      }
    >
      {opportunity && (
        <>
          <DrawerBody>
            <div className="flex flex-col gap-6 pb-6" data-testid="fact-sheet">
              <div className="flex flex-wrap gap-1.5">
                <Tag>{opportunity.asset}</Tag>
                {opportunity.chains.map((chain) => (
                  <Tag key={chain}>{chain}</Tag>
                ))}
                {opportunity.placement === 'sponsored' && <Badge variant="warning">{DEFI_V1_COPY.sponsored}</Badge>}
              </div>

              {canCreate && !locked && (holding || operations[0]) && (
                <SigningBlock operation={operations[0]} onSetUp={onCustomise} />
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
                    {holding.invested > 0 && (
                      <Row
                        label={COPY.growth}
                        value={
                          <span className="flex items-center justify-end gap-2">
                            <Sparkline
                              values={growthSeries(holding.invested, holding.earned)}
                              label={DEFI_V1_COPY.positions.trend(
                                formatApy(growthShare(holding.invested, holding.earned)),
                              )}
                            />
                            <span className="text-badge-dot-success">
                              +{formatApy(growthShare(holding.invested, holding.earned))}
                            </span>
                          </span>
                        }
                      />
                    )}
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

              <DrawerSection title={COPY.fees} rightNode={opportunity.protocolFee} collapsible defaultOpen={false}>
                <Frame>
                  <Row label={COPY.providerFee(opportunity.runBy)} value={opportunity.protocolFee} />
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
            operations={operations}
            canCreate={canCreate}
            onCustomise={onCustomise}
            onDeposited={onDeposited}
            onWithdrawn={onWithdrawn}
          />
        </>
      )}
    </Drawer>
  )
}
