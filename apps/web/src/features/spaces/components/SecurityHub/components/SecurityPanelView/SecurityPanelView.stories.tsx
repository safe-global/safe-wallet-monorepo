import type { Meta, StoryObj } from '@storybook/react'
import SecurityPanelView from './SecurityPanelView'
import { createMockStory } from '@/stories/mocks'
import { createMockContext } from '@/features/security/testing'
import type { ScanResult } from '@/features/security/types'

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
  modules: mkResult({
    status: 'issue',
    severity: 'High',
    evidence: [{ label: 'Modules', value: '1 unrecognized module' }],
    remediation: 'Review and remove unrecognized modules.',
  }),
}

const critical: Record<string, ScanResult> = {
  ...withIssues,
  account_setup: mkResult({
    status: 'issue',
    severity: 'Critical',
    evidence: [{ label: 'Threshold', value: '1 of 1' }],
    remediation: 'Increase the signer threshold to avoid single-signer risk.',
  }),
}

const setup = createMockStory({ features: { spaces: true }, layout: 'paper' })

const meta = {
  title: 'Features/SecurityHub/SecurityPanelView',
  component: SecurityPanelView,
  decorators: [setup.decorator],
  parameters: {
    ...setup.parameters,
    chromatic: { disableSnapshot: true },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SecurityPanelView>

export default meta
type Story = StoryObj<typeof meta>

export const AllPassing: Story = {
  args: {
    scanContext: createMockContext(),
    results: allPassing,
    isComplete: true,
    safeQueryParam: 'eth:0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6',
  },
}

export const WithIssues: Story = {
  args: {
    scanContext: createMockContext(),
    results: withIssues,
    isComplete: true,
    safeQueryParam: 'eth:0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6',
  },
}

export const CriticalIssue: Story = {
  args: {
    scanContext: createMockContext({ threshold: 1, owners: [{ value: '0x1111111111111111111111111111111111111111' }] }),
    results: critical,
    isComplete: true,
    safeQueryParam: 'eth:0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6',
  },
}

export const Loading: Story = {
  args: {
    scanContext: null,
    results: {},
    isComplete: false,
  },
}
