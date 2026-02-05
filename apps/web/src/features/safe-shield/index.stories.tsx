import type { Meta, StoryObj } from '@storybook/react'
import {
  Box,
  Paper,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  LinearProgress,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import ErrorIcon from '@mui/icons-material/Error'
import InfoIcon from '@mui/icons-material/Info'
import SecurityIcon from '@mui/icons-material/Security'

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
  <Box sx={{ mb: 8 }}>
    <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h5">{stateName}</Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
    <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2, display: 'flex', justifyContent: 'center' }}>{children}</Box>
  </Box>
)

// Severity config
const severityConfig = {
  OK: { icon: CheckCircleIcon, color: 'success.main', bgColor: 'success.light', label: 'Safe' },
  INFO: { icon: InfoIcon, color: 'info.main', bgColor: 'info.light', label: 'Info' },
  WARN: { icon: WarningIcon, color: 'warning.main', bgColor: 'warning.light', label: 'Warning' },
  CRITICAL: { icon: ErrorIcon, color: 'error.main', bgColor: 'error.light', label: 'Critical' },
}

// Mock SeverityIcon
const MockSeverityIcon = ({ severity }: { severity: keyof typeof severityConfig }) => {
  const config = severityConfig[severity]
  const Icon = config.icon
  return <Icon sx={{ color: config.color }} />
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
    <Accordion defaultExpanded={expanded}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <MockSeverityIcon severity={severity} />
          <Typography variant="body2" sx={{ flex: 1 }}>
            {title}
          </Typography>
          <Chip label={config.label} size="small" sx={{ bgcolor: config.bgColor, color: config.color }} />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {items.map((item, i) => (
            <Box
              key={i}
              sx={{
                p: 1.5,
                borderLeft: 3,
                borderColor: config.color,
                bgcolor: 'background.default',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2">{item.description}</Typography>
              {item.details && (
                <Typography variant="caption" color="text.secondary">
                  {item.details}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </AccordionDetails>
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
  const statusConfig = {
    safe: { icon: CheckCircleIcon, color: 'success.main', text: 'Transaction looks safe' },
    warning: { icon: WarningIcon, color: 'warning.main', text: 'Review required' },
    critical: { icon: ErrorIcon, color: 'error.main', text: 'Potential threat detected' },
    loading: { icon: SecurityIcon, color: 'text.secondary', text: 'Analyzing transaction...' },
  }
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Icon sx={{ color: config.color, fontSize: 28 }} />
      <Box>
        <Typography variant="subtitle1" fontWeight="bold">
          {message || config.text}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Safe Shield Analysis
        </Typography>
      </Box>
    </Box>
  )
}

// All States - Scrollable view of all Safe Shield analysis states
export const SafeShieldAllStates: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 500 }}>
      <Box sx={{ mb: 6, pb: 3, borderBottom: '2px solid', borderColor: 'primary.main' }}>
        <Typography variant="h4">Safe Shield Analysis States</Typography>
        <Typography variant="body1" color="text.secondary">
          All possible states of the transaction security analysis. Scroll to view each state.
        </Typography>
      </Box>

      {/* State 1: Loading */}
      <StateWrapper stateName="Loading" description="Analysis in progress while scanning the transaction.">
        <Paper sx={{ width: 350 }}>
          <MockSafeShieldHeader status="loading" />
          <Box sx={{ p: 2 }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Analyzing transaction security...
            </Typography>
          </Box>
        </Paper>
      </StateWrapper>

      {/* State 2: Safe */}
      <StateWrapper stateName="Safe (All Checks Passed)" description="Transaction passed all security checks.">
        <Paper sx={{ width: 350 }}>
          <MockSafeShieldHeader status="safe" />
          <Box sx={{ p: 2 }}>
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
          </Box>
          <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Powered by Safe Shield
            </Typography>
          </Box>
        </Paper>
      </StateWrapper>

      {/* State 3: Warning */}
      <StateWrapper
        stateName="Warning (Review Required)"
        description="Some checks need attention but transaction is not blocked."
      >
        <Paper sx={{ width: 350 }}>
          <MockSafeShieldHeader status="warning" message="Review before proceeding" />
          <Box sx={{ p: 2 }}>
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
          </Box>
        </Paper>
      </StateWrapper>

      {/* State 4: Critical */}
      <StateWrapper
        stateName="Critical (Threat Detected)"
        description="Potential threat detected. User should be cautious."
      >
        <Paper sx={{ width: 350 }}>
          <MockSafeShieldHeader status="critical" message="Potential threat detected!" />
          <Alert severity="error" sx={{ m: 2 }}>
            This transaction may be malicious. Review carefully before proceeding.
          </Alert>
          <Box sx={{ p: 2 }}>
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
          </Box>
        </Paper>
      </StateWrapper>

      {/* State 5: Balance Changes */}
      <StateWrapper
        stateName="Balance Changes Preview"
        description="Shows simulated balance changes from the transaction."
      >
        <Paper sx={{ p: 3, width: 350 }}>
          <Typography variant="subtitle2" gutterBottom>
            Simulated Balance Changes
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                p: 1.5,
                bgcolor: 'error.light',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2">ETH</Typography>
              <Typography variant="body2" color="error.main" fontWeight="bold">
                -1.5 ETH
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                p: 1.5,
                bgcolor: 'success.light',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2">USDC</Typography>
              <Typography variant="body2" color="success.main" fontWeight="bold">
                +2,775 USDC
              </Typography>
            </Box>
          </Box>
        </Paper>
      </StateWrapper>

      {/* State 6: Severity Levels Reference */}
      <StateWrapper stateName="Severity Levels" description="Reference of all severity indicators used in analysis.">
        <Paper sx={{ p: 3, width: 350 }}>
          <Typography variant="subtitle2" gutterBottom>
            Severity Levels
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(Object.keys(severityConfig) as Array<keyof typeof severityConfig>).map((severity) => {
              const config = severityConfig[severity]
              return (
                <Box key={severity} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <MockSeverityIcon severity={severity} />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {severity}
                  </Typography>
                  <Chip label={config.label} size="small" sx={{ bgcolor: config.bgColor, color: config.color }} />
                </Box>
              )
            })}
          </Box>
        </Paper>
      </StateWrapper>
    </Box>
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
    <Paper sx={{ width: 350 }}>
      <MockSafeShieldHeader status="safe" />
      <Box sx={{ p: 2 }}>
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
      </Box>
      <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Powered by Safe Shield
        </Typography>
      </Box>
    </Paper>
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
    <Paper sx={{ width: 350 }}>
      <MockSafeShieldHeader status="safe" />
      <Box sx={{ p: 2 }}>
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
      </Box>
    </Paper>
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
    <Paper sx={{ width: 350 }}>
      <MockSafeShieldHeader status="warning" message="Review before proceeding" />
      <Box sx={{ p: 2 }}>
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
      </Box>
    </Paper>
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
    <Paper sx={{ width: 350 }}>
      <MockSafeShieldHeader status="critical" message="Potential threat detected!" />
      <Alert severity="error" sx={{ m: 2 }}>
        This transaction may be malicious. Review carefully before proceeding.
      </Alert>
      <Box sx={{ p: 2 }}>
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
      </Box>
    </Paper>
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
    <Paper sx={{ width: 350 }}>
      <MockSafeShieldHeader status="loading" />
      <Box sx={{ p: 2 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Analyzing transaction security...
        </Typography>
      </Box>
    </Paper>
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
    <Paper sx={{ width: 350 }}>
      <MockSafeShieldHeader status="warning" />
      <Box sx={{ p: 2 }}>
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
      </Box>
    </Paper>
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
    <Paper sx={{ p: 3, width: 350 }}>
      <Typography variant="subtitle2" gutterBottom>
        Simulated Balance Changes
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: 1.5,
            bgcolor: 'error.light',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2">ETH</Typography>
          <Typography variant="body2" color="error.main" fontWeight="bold">
            -1.5 ETH
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: 1.5,
            bgcolor: 'success.light',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2">USDC</Typography>
          <Typography variant="body2" color="success.main" fontWeight="bold">
            +2,775 USDC
          </Typography>
        </Box>
      </Box>
    </Paper>
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
    <Paper sx={{ p: 3, width: 350 }}>
      <Typography variant="subtitle2" gutterBottom>
        Severity Levels
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {(Object.keys(severityConfig) as Array<keyof typeof severityConfig>).map((severity) => {
          const config = severityConfig[severity]
          return (
            <Box key={severity} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <MockSeverityIcon severity={severity} />
              <Typography variant="body2" sx={{ flex: 1 }}>
                {severity}
              </Typography>
              <Chip label={config.label} size="small" sx={{ bgcolor: config.bgColor, color: config.color }} />
            </Box>
          )
        })}
      </Box>
    </Paper>
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
    <Paper sx={{ width: 350 }}>
      <MockSafeShieldHeader status="warning" message="Multiple issues found" />
      <Box sx={{ p: 2 }}>
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
      </Box>
    </Paper>
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
    <Paper sx={{ width: 350, p: 2 }}>
      <MockAnalysisGroupCard
        title="Detailed Analysis"
        severity="INFO"
        items={[
          { description: 'Contract deployed 2 years ago', details: 'Block: 15,234,567' },
          { description: 'High transaction volume', details: 'Over 1M transactions' },
          { description: 'Multiple verified sources', details: 'Etherscan, Sourcify' },
        ]}
        expanded
      />
    </Paper>
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
    <Paper sx={{ p: 3, width: 350 }}>
      <Typography variant="subtitle2" gutterBottom>
        Address Changes Detected
      </Typography>
      <Alert severity="warning" sx={{ mb: 2 }}>
        This transaction will modify Safe settings
      </Alert>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Adding owner
          </Typography>
          <Typography variant="body2" fontFamily="monospace">
            0x1234...5678
          </Typography>
        </Box>
        <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            New threshold
          </Typography>
          <Typography variant="body2">2 → 3 confirmations</Typography>
        </Box>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Display of detected Safe configuration changes.',
      },
    },
  },
}
