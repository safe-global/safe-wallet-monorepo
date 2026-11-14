import { Children, Fragment, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, FileText, Info, Lock, Maximize2, Minimize2, ShieldCheck, X } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import { Drawer, DrawerBody, DrawerSection } from '@/components/common/Drawer'
import useSafeInfo from '@/hooks/useSafeInfo'
import { DEFI_V1_COPY, formatApy, formatCompactUsd, formatLiveFor, formatUsd } from '../copy'
import type { DefiV1Plan, DefiV1Signing, Opportunity } from '../types'
import { OpportunityMark, Tag, type Position } from './TreasuryTables'

const COPY = DEFI_V1_COPY.drawer

// Mock Safe fee for the Free vs Pro comparison; real fees are not set yet.
const SAFE_FEE_FREE = '5% of rewards'

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

const Fact = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex min-w-0 flex-col gap-0.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="truncate text-sm font-medium tabular-nums">{value}</span>
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
  plan,
  signing,
  position,
  onClose,
  onDeposit,
}: {
  opportunity: Opportunity | null
  list: Opportunity[]
  onNavigate: (opportunity: Opportunity) => void
  locked: boolean
  plan: DefiV1Plan
  signing: DefiV1Signing
  position?: Position
  onClose: () => void
  onDeposit: (opportunity: Opportunity) => void
}) => {
  const { safe } = useSafeInfo()
  const index = opportunity ? list.findIndex((item) => item.id === opportunity.id) : -1
  const safeFee = plan === 'pro' ? '0%' : SAFE_FEE_FREE

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
            <OpportunityMark opportunity={opportunity} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Typography as="h2" variant="paragraph-bold" className="truncate leading-tight">
                {opportunity.name}
              </Typography>
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-xs text-muted-foreground">
                  {opportunity.runBy} · {DEFI_V1_COPY.category[opportunity.category].title}
                </span>
                {position && (
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
                <Tag>{DEFI_V1_COPY.risk[opportunity.risk]}</Tag>
                {opportunity.chains.map((chain) => (
                  <Tag key={chain}>{chain}</Tag>
                ))}
                {opportunity.placement === 'sponsored' && <Badge variant="warning">{DEFI_V1_COPY.sponsored}</Badge>}
                {opportunity.placement === 'featured' && <Badge variant="info">{DEFI_V1_COPY.featured}</Badge>}
                {opportunity.placement === 'premium' && <Badge variant="info">{DEFI_V1_COPY.premium}</Badge>}
              </div>

              <DrawerSection title={COPY.overview} collapsible defaultOpen>
                <Frame>
                  <Row label={COPY.netApy} value={formatApy(opportunity.apy)} strong />
                  <Row label={COPY.exit} value={opportunity.exitLabel} />
                  <Row label={COPY.access} value={accessLabel(opportunity)} />
                  <Row label={COPY.tvl} value={formatCompactUsd(opportunity.tvl)} />
                  <Row label={COPY.liveFor} value={formatLiveFor(opportunity.liveSince)} />
                </Frame>
              </DrawerSection>

              {position && (
                <DrawerSection
                  title={COPY.yourPosition}
                  rightNode={formatUsd(position.principal)}
                  collapsible
                  defaultOpen
                >
                  <Frame>
                    <Row label={COPY.deposited} value={formatUsd(position.principal)} />
                    <Row
                      label={COPY.earned}
                      value={
                        <span className="text-badge-dot-success">
                          {position.earned > 0 ? `+${formatUsd(position.earned)}` : '—'}
                        </span>
                      }
                    />
                  </Frame>
                </DrawerSection>
              )}

              <DrawerSection title={COPY.fees} rightNode={`${COPY.safeFee} ${safeFee}`} collapsible defaultOpen={false}>
                <Frame>
                  <Row label={COPY.providerFee(opportunity.runBy)} value={opportunity.protocolFee} />
                  <Row
                    label={COPY.safeFee}
                    value={
                      plan === 'pro' ? (
                        <span className="flex items-center justify-end gap-1.5">
                          <span className="text-badge-dot-success">0%</span>
                          <Badge variant="brand">{DEFI_V1_COPY.proOnly}</Badge>
                        </span>
                      ) : (
                        SAFE_FEE_FREE
                      )
                    }
                  />
                  <Row label={COPY.freePlan} value={<span className="text-muted-foreground">{SAFE_FEE_FREE}</span>} />
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

          <footer
            className="flex shrink-0 flex-col gap-4 border-t border-border bg-background p-6"
            data-testid="drawer-action-summary"
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Fact label={COPY.youEarn} value={formatApy(opportunity.apy)} />
              <Fact label={COPY.exit} value={opportunity.exitShort} />
              <Fact label={COPY.safeFee} value={safeFee} />
              <Fact
                label={COPY.approval}
                value={signing === 'policy' ? COPY.policySigner : COPY.signers(safe.threshold, safe.owners.length)}
              />
            </div>
            {locked && (
              <Typography variant="paragraph-mini" color="muted" className="flex items-center gap-1.5">
                <Lock className="size-3.5 shrink-0" aria-hidden />
                {COPY.lockedNote}
              </Typography>
            )}
            <Button size="lg" className="w-full" disabled={locked} onClick={() => onDeposit(opportunity)}>
              {locked && <Lock />}
              {locked ? DEFI_V1_COPY.locked : DEFI_V1_COPY.factSheet.deposit}
            </Button>
          </footer>
        </>
      )}
    </Drawer>
  )
}
