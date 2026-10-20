import type { ReactElement, ReactNode } from 'react'
import { DrawerSection } from '@/components/common/Drawer'
import { Badge, BadgeDot } from '@safe-global/views/components/ui/badge'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { Typography } from '@safe-global/views/components/ui/typography'
import { CHAIN_NAMES } from '../../m2OverviewPage'
import { PAYMENTS, SafeAddress, TRADING_DESK, TREASURY, type M2Account } from '../../m2Prototype'
import { PanelExpandableCard, PanelRow, PanelSection } from '../PanelBody'
import type { HeaderStatus } from '../SharedDrawerHeader'
import type { PanelType, PanelVariant } from '../VariantPanel'
import { FixLink, Muted, PEOPLE } from './shared'

/** Production's grades, worst first, in the shared status badge colours rather than SafeGradeChip's own. */
const GRADES = {
  critical: { label: 'Critical', tone: 'destructive' },
  atRisk: { label: 'At risk', tone: 'destructive' },
  needsReview: { label: 'Needs review', tone: 'warning' },
  healthy: { label: 'Healthy', tone: 'success' },
} as const satisfies Record<string, HeaderStatus>

type Grade = keyof typeof GRADES

/** A check as production words it; `fix` is its call to action (the prototype's links go nowhere). */
type Check = { title: string; detail?: ReactNode; fix?: string }

const CheckItem = ({ title, detail, fix }: Check): ReactElement => (
  <span className="flex min-w-0 flex-1 flex-col gap-1">
    <Typography variant="paragraph-small-medium">{title}</Typography>
    {typeof detail === 'string' ? <Muted>{detail}</Muted> : detail}
    {fix && (
      <span className="pt-1">
        <FixLink label={fix} />
      </span>
    )}
  </span>
)

const ChecksSection = ({ groups }: { groups: Partial<Record<Grade, Check[]>> }): ReactElement => {
  const order: Grade[] = ['critical', 'atRisk', 'needsReview', 'healthy']
  const issues = order
    .filter((grade) => grade !== 'healthy')
    .reduce((total, grade) => total + (groups[grade]?.length ?? 0), 0)

  return (
    <DrawerSection title="Checks" rightNode={issues ? `${issues} ${issues === 1 ? 'issue' : 'issues'}` : 'No issues'}>
      {/* 8px between groups, 4px between a group's own items, so the groups read as separate. */}
      <div className="flex flex-col gap-2">
        {order.map((grade) => {
          const checks = groups[grade]
          if (!checks?.length) return null
          const { label, tone } = GRADES[grade]
          return (
            <PanelExpandableCard
              key={grade}
              detailsLabel={`${label} checks`}
              summary={
                <>
                  <span className="flex-1">
                    <Badge variant={tone} size="status" shape="status">
                      <BadgeDot />
                      {label}
                    </Badge>
                  </span>
                  <Typography variant="paragraph-small-medium" className="tabular-nums">
                    {checks.length}
                  </Typography>
                </>
              }
              items={checks.map((check) => (
                <CheckItem key={check.title} {...check} />
              ))}
            />
          )
        })}
      </div>
    </DrawerSection>
  )
}

/** Production's Details tab, as two sections under the checks. */
const AccountDetails = ({ account }: { account: M2Account }): ReactElement => (
  <>
    <PanelSection title="Signers" rightNode={`${account.threshold} of ${account.owners} required`}>
      {PEOPLE.slice(0, account.owners).map((person) => (
        <div key={person.id} className="flex min-h-8 items-center">
          <SafeAddress name={person.name} address={person.address} chainId={account.chainId} />
        </div>
      ))}
      {account.owners > PEOPLE.length && <Muted>+{account.owners - PEOPLE.length} more</Muted>}
    </PanelSection>
    <PanelSection title="About">
      <PanelRow label="Contract version">v{account.version}</PanelRow>
      <PanelRow label="Networks">{CHAIN_NAMES[account.chainId]}</PanelRow>
      <PanelRow label="Balance">$1,284,301.22</PanelRow>
      <PanelRow label="Last scanned">2m ago</PanelRow>
    </PanelSection>
  </>
)

const HEALTHY: Check[] = [
  { title: 'Signing threshold is strong' },
  { title: 'Recovery is configured' },
  { title: 'Contract version is up to date' },
  { title: 'Deployed via official Safe factory' },
  { title: 'Official Safe fallback handler' },
  { title: 'Queue is up to date' },
]

const healthyWithout = (...titles: string[]): Check[] => HEALTHY.filter(({ title }) => !titles.includes(title))

const account = (safe: M2Account) =>
  ({ kind: 'account', name: safe.name, address: safe.address, chainId: safe.chainId }) as const

const LONG_NAME = 'Treasury reserve multisig for the EMEA operations team'

const variant = (safe: M2Account, rest: Omit<PanelVariant, 'media' | 'longTitle'>): PanelVariant => ({
  media: account(safe),
  longTitle: LONG_NAME,
  ...rest,
})

export const SECURITY_HUB: PanelType = {
  id: 'security',
  label: 'Security Hub',
  variants: [
    variant(TREASURY, {
      id: 'loading',
      label: 'Loading',
      body: (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[200px] rounded-xl" />
        </div>
      ),
    }),
    variant(TREASURY, {
      id: 'healthy',
      label: 'Healthy',
      banner: {
        tone: 'success',
        title: 'Healthy',
        description: 'Scanned 2m ago. Nothing on this account needs your attention.',
      },
      body: (
        <>
          <ChecksSection groups={{ healthy: HEALTHY }} />
          <AccountDetails account={TREASURY} />
        </>
      ),
    }),
    variant(TREASURY, {
      id: 'issues',
      label: 'Issues found',
      banner: {
        tone: 'error',
        title: '3 issues found',
        description: 'Scanned 2m ago. Review them to keep this account safe.',
      },
      body: (
        <>
          <ChecksSection
            groups={{
              atRisk: [
                {
                  title: 'Recovery is not configured',
                  detail:
                    'If all signers lose access, this Safe cannot be recovered. Set up a recovery mechanism to protect against key loss.',
                  fix: 'Set up recovery',
                },
              ],
              needsReview: [
                {
                  title: 'Signing threshold is low',
                  detail: 'Consider increasing the threshold to 2 of 3 for stronger security.',
                  fix: 'Review setup',
                },
                {
                  title: 'Pending transactions are stale',
                  detail:
                    'Pending transactions that sit unexecuted can become stale. Review the queue and execute or reject them.',
                  fix: 'Review queue',
                },
              ],
              healthy: healthyWithout('Recovery is configured', 'Signing threshold is strong', 'Queue is up to date'),
            }}
          />
          <AccountDetails account={TREASURY} />
        </>
      ),
    }),
    variant(TREASURY, {
      id: 'critical',
      label: 'Critical: vulnerable module',
      banner: {
        tone: 'error',
        title: '1 critical issue found',
        description: 'A module with a known critical vulnerability is enabled. Take action now.',
      },
      body: (
        <>
          <ChecksSection
            groups={{
              critical: [
                {
                  title: 'Vulnerable module · Zodiac Delay v1.1.0',
                  detail: (
                    <span className="flex flex-col gap-2">
                      <Muted>
                        This Safe is affected by a vulnerable third-party module with a known critical vulnerability. We
                        advise you to take immediate action.
                      </Muted>
                      <SafeAddress name="Zodiac Delay v1.1.0" address="0x0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c" />
                    </span>
                  ),
                  fix: 'Remove unsupported module',
                },
              ],
              healthy: HEALTHY,
            }}
          />
          <AccountDetails account={TREASURY} />
        </>
      ),
    }),
    variant(PAYMENTS, {
      id: 'update',
      label: 'Update available',
      banner: {
        tone: 'success',
        title: 'Healthy',
        description: 'Scanned 2m ago. A new contract version is available.',
        action: <FixLink label="Update" />,
      },
      body: (
        <>
          <ChecksSection
            groups={{
              healthy: [
                { title: 'New contract version available', fix: 'Update' },
                ...healthyWithout('Contract version is up to date'),
              ],
            }}
          />
          <AccountDetails account={PAYMENTS} />
        </>
      ),
    }),
    variant(TREASURY, {
      id: 'protection',
      label: 'Protection recommended',
      banner: {
        tone: 'warning',
        title: '1 issue found',
        description: 'Scanned 2m ago. Review it to keep this account safe.',
      },
      body: (
        <>
          <ChecksSection
            groups={{
              needsReview: [
                {
                  title: 'Transaction guard is recommended',
                  detail:
                    'For high-value accounts, a transaction guard adds pre-execution validation. Enterprise-grade protection is available via Hypernative.',
                  fix: 'Set up protection',
                },
              ],
              healthy: HEALTHY,
            }}
          />
          <AccountDetails account={TREASURY} />
        </>
      ),
    }),
    variant(TRADING_DESK, {
      id: 'multichain',
      label: 'Signers differ across networks',
      banner: {
        tone: 'error',
        title: '1 issue found',
        description: 'Scanned 2m ago. Review it to keep this account safe.',
      },
      body: (
        <>
          <ChecksSection
            groups={{
              atRisk: [
                {
                  title: 'Signers differ across networks',
                  detail: (
                    <span className="flex flex-col gap-2">
                      <Muted>
                        Different signers across networks could break approvals and risk losing control. Switch to the
                        affected network and review the signer setup.
                      </Muted>
                      <PanelRow label="Affected">Ethereum</PanelRow>
                    </span>
                  ),
                  fix: 'Review signers',
                },
              ],
              healthy: HEALTHY,
            }}
          />
          <AccountDetails account={TRADING_DESK} />
        </>
      ),
    }),
    variant(PAYMENTS, {
      id: 'no-results',
      label: 'No results yet',
      note: 'Some checks are still waiting for data. They will update on the next scan.',
      body: (
        <>
          <ChecksSection
            groups={{
              healthy: [
                {
                  title: 'Deployment origin not yet verified',
                  detail: 'Deployment origin will be verified once creation data loads.',
                },
                { title: 'Recovery not available on this network' },
                { title: 'No unsupported guard installed' },
              ],
            }}
          />
          <AccountDetails account={PAYMENTS} />
        </>
      ),
    }),
  ],
}
