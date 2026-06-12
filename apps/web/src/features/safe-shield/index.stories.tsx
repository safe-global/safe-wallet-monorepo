import type { Meta, StoryObj } from '@storybook/react'
import type { LucideIcon } from 'lucide-react'
import { CircleCheck, Info, TriangleAlert, CircleX, ShieldCheck } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { Chip } from '@/components/ui/chip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress'

/**
 * Safe Shield provides security analysis for transactions before execution.
 * It checks for threats, contract verification, and recipient risk.
 *
 * Key components:
 * - SafeShieldDisplay: Main analysis widget
 * - AnalysisGroupCard: Grouped analysis results
 * - ThreatAnalysis: Threat detection display
 * - SeverityIcon: Risk level indicators
 *
 * Note: Actual component uses builder pattern for data.
 * These stories document the UI patterns.
 */
const meta: Meta = {
  title: 'Features/SafeShield',
  parameters: {
    layout: 'centered',
    chromatic: { disableSnapshot: true },
  },
}

export default meta

// Docs-style wrapper for each state
const StateWrapper = ({
  stateName,
  description,
  children,
}: {
  stateName: string
  description: string
  children: React.ReactNode
}) => (
  <div className="mb-16">
    <div className="mb-4 border-b border-border pb-4">
      <Typography variant="h3">{stateName}</Typography>
      <Typography variant="paragraph-small" color="muted">
        {description}
      </Typography>
    </div>
    <div className="bg-muted flex justify-center rounded-lg p-6">{children}</div>
  </div>
)

// Severity config
const severityConfig: Record<
  'OK' | 'INFO' | 'WARN' | 'CRITICAL',
  { icon: LucideIcon; color: string; bgColor: string; label: string }
> = {
  OK: {
    icon: CircleCheck,
    color: 'text-[var(--color-success-main)]',
    bgColor: 'bg-[var(--color-success-light)]',
    label: 'Safe',
  },
  INFO: { icon: Info, color: 'text-[var(--color-info-main)]', bgColor: 'bg-[var(--color-info-light)]', label: 'Info' },
  WARN: {
    icon: TriangleAlert,
    color: 'text-[var(--color-warning-main)]',
    bgColor: 'bg-[var(--color-warning-light)]',
    label: 'Warning',
  },
  CRITICAL: {
    icon: CircleX,
    color: 'text-[var(--color-error-main)]',
    bgColor: 'bg-[var(--color-error-light)]',
    label: 'Critical',
  },
}

// Mock SeverityIcon
const MockSeverityIcon = ({ severity }: { severity: keyof typeof severityConfig }) => {
  const config = severityConfig[severity]
  const Icon = config.icon
  return <Icon className={`size-5 ${config.color}`} />
}

// Mock AnalysisGroupCard
const MockAnalysisGroupCard = ({
  title,
  severity,
  items,
  expanded = false,
}: {
  title: string
  severity: keyof typeof severityConfig
  items: { description: string; details?: string }[]
  expanded?: boolean
}) => {
  const config = severityConfig[severity]

  return (
    <Accordion defaultValue={expanded ? [title] : []}>
      <AccordionItem value={title}>
        <AccordionTrigger>
          <div className="flex w-full items-center gap-4">
            <MockSeverityIcon severity={severity} />
            <Typography variant="paragraph-small" className="flex-1">
              {title}
            </Typography>
            <Chip className={`${config.bgColor} ${config.color}`}>{config.label}</Chip>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-2">
            {items.map((item, i) => (
              <div key={i} className={`bg-muted rounded-md border-l-[3px] p-1.5 ${config.color}`}>
                <Typography variant="paragraph-small" className="text-foreground">
                  {item.description}
                </Typography>
                {item.details && (
                  <Typography variant="paragraph-mini" color="muted">
                    {item.details}
                  </Typography>
                )}
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

// Mock SafeShieldHeader
const MockSafeShieldHeader = ({
  status,
  message,
}: {
  status: 'safe' | 'warning' | 'critical' | 'loading'
  message?: string
}) => {
  const statusConfig: Record<typeof status, { icon: LucideIcon; color: string; text: string }> = {
    safe: { icon: CircleCheck, color: 'text-[var(--color-success-main)]', text: 'Transaction looks safe' },
    warning: { icon: TriangleAlert, color: 'text-[var(--color-warning-main)]', text: 'Review required' },
    critical: { icon: CircleX, color: 'text-[var(--color-error-main)]', text: 'Potential threat detected' },
    loading: { icon: ShieldCheck, color: 'text-muted-foreground', text: 'Analyzing transaction...' },
  }
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-4 border-b border-border p-4">
      <Icon className={`size-7 ${config.color}`} />
      <div>
        <Typography variant="paragraph-bold">{message || config.text}</Typography>
        <Typography variant="paragraph-mini" color="muted">
          Safe Shield analysis
        </Typography>
      </div>
    </div>
  )
}

// All States - Scrollable view of all Safe Shield analysis states
export const SafeShieldAllStates: StoryObj = {
  render: () => (
    <div className="max-w-[500px]">
      <div className="mb-12 border-b-2 border-primary pb-6">
        <Typography variant="h2">Safe Shield analysis states</Typography>
        <Typography variant="paragraph" color="muted">
          All possible states of the transaction security analysis. Scroll to view each state.
        </Typography>
      </div>

      {/* State 1: Loading */}
      <StateWrapper stateName="Loading" description="Analysis in progress while scanning the transaction.">
        <div className="bg-background w-[350px] rounded-lg">
          <MockSafeShieldHeader status="loading" />
          <div className="p-4">
            <Progress className="mb-4" value={null}>
              <ProgressTrack>
                <ProgressIndicator />
              </ProgressTrack>
            </Progress>
            <Typography variant="paragraph-small" color="muted" align="center">
              Analyzing transaction security...
            </Typography>
          </div>
        </div>
      </StateWrapper>

      {/* State 2: Safe */}
      <StateWrapper stateName="Safe (all checks passed)" description="Transaction passed all security checks.">
        <div className="bg-background w-[350px] rounded-lg">
          <MockSafeShieldHeader status="safe" />
          <div className="p-4">
            <MockAnalysisGroupCard
              title="Contract verification"
              severity="OK"
              items={[{ description: 'Contract is verified on Etherscan', details: 'Source code matches bytecode' }]}
            />
            <MockAnalysisGroupCard
              title="Recipient analysis"
              severity="OK"
              items={[
                {
                  description: 'Known protocol: Uniswap V3 Router',
                  details: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
                },
              ]}
            />
            <MockAnalysisGroupCard
              title="Threat detection"
              severity="OK"
              items={[{ description: 'No threats detected' }]}
            />
          </div>
          <div className="border-t border-border p-2 text-center">
            <Typography variant="paragraph-mini" color="muted">
              Powered by Safe Shield
            </Typography>
          </div>
        </div>
      </StateWrapper>

      {/* State 3: Warning */}
      <StateWrapper
        stateName="Warning (review required)"
        description="Some checks need attention but transaction is not blocked."
      >
        <div className="bg-background w-[350px] rounded-lg">
          <MockSafeShieldHeader status="warning" message="Review before proceeding" />
          <div className="p-4">
            <MockAnalysisGroupCard
              title="Contract verification"
              severity="WARN"
              items={[
                {
                  description: 'Contract is not verified',
                  details: 'Unable to verify source code. Proceed with caution.',
                },
              ]}
            />
            <MockAnalysisGroupCard
              title="Recipient analysis"
              severity="OK"
              items={[{ description: 'Address has previous transactions' }]}
            />
          </div>
        </div>
      </StateWrapper>

      {/* State 4: Critical */}
      <StateWrapper
        stateName="Critical (threat detected)"
        description="Potential threat detected. User should be cautious."
      >
        <div className="bg-background w-[350px] rounded-lg">
          <MockSafeShieldHeader status="critical" message="Potential threat detected!" />
          <Alert variant="destructive" className="m-4">
            <AlertDescription>This transaction may be malicious. Review carefully before proceeding.</AlertDescription>
          </Alert>
          <div className="p-4">
            <MockAnalysisGroupCard
              title="Threat detection"
              severity="CRITICAL"
              items={[
                {
                  description: 'Address flagged as phishing',
                  details: 'This address has been reported for phishing attacks.',
                },
                {
                  description: 'Unusual token approval',
                  details: 'Requesting unlimited approval for token transfers.',
                },
              ]}
            />
          </div>
        </div>
      </StateWrapper>

      {/* State 5: Balance Changes */}
      <StateWrapper
        stateName="Balance changes preview"
        description="Shows simulated balance changes from the transaction."
      >
        <div className="bg-background w-[350px] rounded-lg p-6">
          <Typography variant="paragraph-small-bold" className="mb-2 block">
            Simulated balance changes
          </Typography>
          <div className="flex flex-col gap-2">
            <div className="bg-[var(--color-error-light)] flex justify-between rounded-md p-1.5">
              <Typography variant="paragraph-small">ETH</Typography>
              <Typography variant="paragraph-small-bold" className="text-[var(--color-error-main)]">
                -1.5 ETH
              </Typography>
            </div>
            <div className="bg-[var(--color-success-light)] flex justify-between rounded-md p-1.5">
              <Typography variant="paragraph-small">USDC</Typography>
              <Typography variant="paragraph-small-bold" className="text-[var(--color-success-main)]">
                +2,775 USDC
              </Typography>
            </div>
          </div>
        </div>
      </StateWrapper>

      {/* State 6: Severity Levels Reference */}
      <StateWrapper stateName="Severity levels" description="Reference of all severity indicators used in analysis.">
        <div className="bg-background w-[350px] rounded-lg p-6">
          <Typography variant="paragraph-small-bold" className="mb-2 block">
            Severity levels
          </Typography>
          <div className="flex flex-col gap-4">
            {(Object.keys(severityConfig) as Array<keyof typeof severityConfig>).map((severity) => {
              const config = severityConfig[severity]
              return (
                <div key={severity} className="flex items-center gap-4">
                  <MockSeverityIcon severity={severity} />
                  <Typography variant="paragraph-small" className="flex-1">
                    {severity}
                  </Typography>
                  <Chip className={`${config.bgColor} ${config.color}`}>{config.label}</Chip>
                </div>
              )
            })}
          </div>
        </div>
      </StateWrapper>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All states of the Safe Shield security analysis displayed vertically for easy review.',
      },
    },
  },
}

// Individual state: Full Safe Shield widget
export const FullSafeShieldWidget: StoryObj = {
  render: () => (
    <div className="bg-background w-[350px] rounded-lg">
      <MockSafeShieldHeader status="safe" />
      <div className="p-4">
        <MockAnalysisGroupCard
          title="Contract verification"
          severity="OK"
          items={[{ description: 'Contract is verified on Etherscan', details: 'Source code matches bytecode' }]}
          expanded
        />
        <MockAnalysisGroupCard
          title="Recipient analysis"
          severity="OK"
          items={[
            { description: 'Known protocol: Uniswap V3 Router', details: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45' },
          ]}
        />
        <MockAnalysisGroupCard
          title="Threat detection"
          severity="OK"
          items={[{ description: 'No threats detected' }]}
        />
      </div>
      <div className="border-t border-border p-2 text-center">
        <Typography variant="paragraph-mini" color="muted">
          Powered by Safe Shield
        </Typography>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full Safe Shield widget showing all analysis results.',
      },
    },
  },
}

// Checks Passed
export const ChecksPassed: StoryObj = {
  render: () => (
    <div className="bg-background w-[350px] rounded-lg">
      <MockSafeShieldHeader status="safe" />
      <div className="p-4">
        <MockAnalysisGroupCard
          title="All checks passed"
          severity="OK"
          items={[
            { description: 'Contract verified' },
            { description: 'Recipient is known' },
            { description: 'No threats detected' },
          ]}
          expanded
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All security checks passed - transaction is safe.',
      },
    },
  },
}

// Warning State
export const WarningState: StoryObj = {
  render: () => (
    <div className="bg-background w-[350px] rounded-lg">
      <MockSafeShieldHeader status="warning" message="Review before proceeding" />
      <div className="p-4">
        <MockAnalysisGroupCard
          title="Contract verification"
          severity="WARN"
          items={[
            {
              description: 'Contract is not verified',
              details: 'Unable to verify source code. Proceed with caution.',
            },
          ]}
          expanded
        />
        <MockAnalysisGroupCard
          title="Recipient analysis"
          severity="OK"
          items={[{ description: 'Address has previous transactions' }]}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Warning state when some checks need review.',
      },
    },
  },
}

// Critical Threat
export const CriticalThreat: StoryObj = {
  render: () => (
    <div className="bg-background w-[350px] rounded-lg">
      <MockSafeShieldHeader status="critical" message="Potential threat detected!" />
      <Alert variant="destructive" className="m-4">
        <AlertDescription>This transaction may be malicious. Review carefully before proceeding.</AlertDescription>
      </Alert>
      <div className="p-4">
        <MockAnalysisGroupCard
          title="Threat detection"
          severity="CRITICAL"
          items={[
            {
              description: 'Address flagged as phishing',
              details: 'This address has been reported for phishing attacks.',
            },
            {
              description: 'Unusual token approval',
              details: 'Requesting unlimited approval for token transfers.',
            },
          ]}
          expanded
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Critical threat detected - transaction may be malicious.',
      },
    },
  },
}

// Loading State
export const LoadingState: StoryObj = {
  render: () => (
    <div className="bg-background w-[350px] rounded-lg">
      <MockSafeShieldHeader status="loading" />
      <div className="p-4">
        <Progress className="mb-4" value={null}>
          <ProgressTrack>
            <ProgressIndicator />
          </ProgressTrack>
        </Progress>
        <Typography variant="paragraph-small" color="muted" align="center">
          Analyzing transaction security...
        </Typography>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading state while analysis is in progress.',
      },
    },
  },
}

// Unverified Contract
export const UnverifiedContract: StoryObj = {
  render: () => (
    <div className="bg-background w-[350px] rounded-lg">
      <MockSafeShieldHeader status="warning" />
      <div className="p-4">
        <MockAnalysisGroupCard
          title="Contract verification"
          severity="WARN"
          items={[
            {
              description: 'Contract source code is not verified',
              details: 'Unable to verify the contract on block explorers.',
            },
          ]}
          expanded
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Warning when interacting with unverified contract.',
      },
    },
  },
}

// Balance Changes
export const BalanceChanges: StoryObj = {
  render: () => (
    <div className="bg-background w-[350px] rounded-lg p-6">
      <Typography variant="paragraph-small-bold" className="mb-2 block">
        Simulated balance changes
      </Typography>
      <div className="flex flex-col gap-2">
        <div className="bg-[var(--color-error-light)] flex justify-between rounded-md p-1.5">
          <Typography variant="paragraph-small">ETH</Typography>
          <Typography variant="paragraph-small-bold" className="text-[var(--color-error-main)]">
            -1.5 ETH
          </Typography>
        </div>
        <div className="bg-[var(--color-success-light)] flex justify-between rounded-md p-1.5">
          <Typography variant="paragraph-small">USDC</Typography>
          <Typography variant="paragraph-small-bold" className="text-[var(--color-success-main)]">
            +2,775 USDC
          </Typography>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Simulated balance changes from transaction.',
      },
    },
  },
}

// Severity Levels
export const SeverityLevels: StoryObj = {
  render: () => (
    <div className="bg-background w-[350px] rounded-lg p-6">
      <Typography variant="paragraph-small-bold" className="mb-2 block">
        Severity levels
      </Typography>
      <div className="flex flex-col gap-4">
        {(Object.keys(severityConfig) as Array<keyof typeof severityConfig>).map((severity) => {
          const config = severityConfig[severity]
          return (
            <div key={severity} className="flex items-center gap-4">
              <MockSeverityIcon severity={severity} />
              <Typography variant="paragraph-small" className="flex-1">
                {severity}
              </Typography>
              <Chip className={`${config.bgColor} ${config.color}`}>{config.label}</Chip>
            </div>
          )
        })}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All severity level indicators.',
      },
    },
  },
}

// Multiple Issues
export const MultipleIssues: StoryObj = {
  render: () => (
    <div className="bg-background w-[350px] rounded-lg">
      <MockSafeShieldHeader status="warning" message="Multiple issues found" />
      <div className="p-4">
        <MockAnalysisGroupCard
          title="Contract verification"
          severity="WARN"
          items={[{ description: 'Contract is not verified' }]}
        />
        <MockAnalysisGroupCard
          title="Recipient analysis"
          severity="INFO"
          items={[{ description: 'First interaction with this address' }]}
        />
        <MockAnalysisGroupCard
          title="Threat detection"
          severity="WARN"
          items={[{ description: 'Unusual token approval pattern detected' }]}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple analysis items with different severity levels.',
      },
    },
  },
}

// Analysis Group Card Expanded
export const AnalysisGroupCardExpanded: StoryObj = {
  render: () => (
    <div className="bg-background w-[350px] rounded-lg p-4">
      <MockAnalysisGroupCard
        title="Detailed analysis"
        severity="INFO"
        items={[
          { description: 'Contract deployed 2 years ago', details: 'Block: 15,234,567' },
          { description: 'High transaction volume', details: 'Over 1M transactions' },
          { description: 'Multiple verified sources', details: 'Etherscan, Sourcify' },
        ]}
        expanded
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Expanded analysis group with multiple items.',
      },
    },
  },
}

// Address Changes
export const AddressChanges: StoryObj = {
  render: () => (
    <div className="bg-background w-[350px] rounded-lg p-6">
      <Typography variant="paragraph-small-bold" className="mb-2 block">
        Address changes detected
      </Typography>
      <Alert variant="warning" className="mb-4">
        <AlertDescription>This transaction will modify Safe settings</AlertDescription>
      </Alert>
      <div className="flex flex-col gap-2">
        <div className="rounded-md border border-border p-4">
          <Typography variant="paragraph-mini" color="muted">
            Adding owner
          </Typography>
          <Typography variant="paragraph-small" className="font-mono">
            0x1234...5678
          </Typography>
        </div>
        <div className="rounded-md border border-border p-4">
          <Typography variant="paragraph-mini" color="muted">
            New threshold
          </Typography>
          <Typography variant="paragraph-small">2 → 3 confirmations</Typography>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Display of detected Safe configuration changes.',
      },
    },
  },
}
