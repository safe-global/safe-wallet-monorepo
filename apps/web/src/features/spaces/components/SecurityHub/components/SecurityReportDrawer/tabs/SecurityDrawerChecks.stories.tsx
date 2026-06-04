import type { Meta, StoryObj } from '@storybook/react'
import SecurityDrawerChecks from './SecurityDrawerChecks'
import { createMockStory } from '@/stories/mocks'
import { createMockContext } from '@/features/security/testing'
import type { ScanResult } from '@/features/security/types'

const SAFE_QUERY = 'eth:0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6'

const mkResult = (overrides: Partial<ScanResult> = {}): ScanResult => ({
  status: 'clear',
  severity: 'Low',
  score: 100,
  evidence: [],
  remediation: '',
  lastChecked: new Date().toISOString(),
  ...overrides,
})

const allPassing: Record<string, ScanResult> = {
  account_setup: mkResult(),
  contract_version: mkResult({ evidence: [{ label: 'Current version', value: '1.4.1' }] }),
  factory_validation: mkResult(),
  guard: mkResult(),
  fallback_handler: mkResult(),
  modules: mkResult({ status: 'not_applicable' }),
  pending_tx: mkResult(),
  transaction_scanning: mkResult(),
  recovery: mkResult({ status: 'not_applicable' }),
  multichain_setup: mkResult({ status: 'not_applicable' }),
}

const withIssues: Record<string, ScanResult> = {
  ...allPassing,
  contract_version: mkResult({
    status: 'issue',
    severity: 'High',
    evidence: [
      { label: 'Current version', value: '1.3.0' },
      { label: 'Latest version', value: '1.4.1' },
    ],
    remediation: 'Update to the latest version.',
  }),
  guard: mkResult({
    status: 'partial',
    severity: 'Medium',
    remediation: 'No transaction guard is configured.',
  }),
}

const setup = createMockStory({ features: { spaces: true }, layout: 'paper' })

const meta = {
  title: 'Features/SecurityHub/SecurityDrawerChecks',
  component: SecurityDrawerChecks,
  decorators: [setup.decorator],
  parameters: {
    ...setup.parameters,
    chromatic: { disableSnapshot: true },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SecurityDrawerChecks>

export default meta
type Story = StoryObj<typeof meta>

export const WithIssues: Story = {
  args: {
    scanContext: createMockContext(),
    results: withIssues,
    isComplete: true,
    lastScannedAt: Date.now() - 3_600_000,
    safeQueryParam: SAFE_QUERY,
  },
}

export const AllPassing: Story = {
  args: {
    scanContext: createMockContext(),
    results: allPassing,
    isComplete: true,
    lastScannedAt: Date.now() - 3_600_000,
    safeQueryParam: SAFE_QUERY,
  },
}

export const Loading: Story = {
  args: {
    scanContext: null,
    results: {},
    isComplete: false,
    lastScannedAt: null,
  },
}
