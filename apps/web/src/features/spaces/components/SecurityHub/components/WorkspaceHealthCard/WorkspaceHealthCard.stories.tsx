import type { Meta, StoryObj } from '@storybook/react'
import WorkspaceHealthCard from './WorkspaceHealthCard'
import { createMockStory } from '@/stories/mocks'
import type { ScanResult } from '@/features/security/types'
import type { SpaceSafeEntry } from '../../types'

const mkResult = (overrides: Partial<ScanResult> = {}): ScanResult => ({
  status: 'clear',
  severity: 'Low',
  score: 100,
  evidence: [],
  remediation: '',
  lastChecked: new Date().toISOString(),
  ...overrides,
})

const SAFE_A = '0xA000000000000000000000000000000000000000'
const SAFE_B = '0xB000000000000000000000000000000000000000'
const SAFE_C = '0xC000000000000000000000000000000000000000'

const singleChain = (address: string): SpaceSafeEntry => ({
  address,
  chainId: '1',
  name: `Safe ${address.slice(0, 6)}`,
  isMultichain: false,
  chainEntries: [{ chainId: '1', isDeployed: true }],
})

const allClear = {
  account_setup: mkResult(),
  contract_version: mkResult(),
  guard: mkResult(),
  fallback_handler: mkResult(),
  pending_tx: mkResult(),
}

const mixedResults = {
  account_setup: mkResult({ status: 'clear' }),
  contract_version: mkResult({ status: 'issue', severity: 'High' }),
  guard: mkResult({ status: 'partial', severity: 'Medium' }),
  fallback_handler: mkResult({ status: 'clear' }),
  pending_tx: mkResult({ status: 'clear' }),
}

const criticalResults = {
  account_setup: mkResult({ status: 'issue', severity: 'Critical' }),
  contract_version: mkResult({ status: 'issue', severity: 'High' }),
  guard: mkResult({ status: 'partial', severity: 'Medium' }),
  fallback_handler: mkResult({ status: 'clear' }),
  pending_tx: mkResult({ status: 'clear' }),
}

const setup = createMockStory({ features: { spaces: true }, layout: 'paper' })

const meta = {
  title: 'Features/SecurityHub/WorkspaceHealthCard',
  tags: ['autodocs', 'skip-visual-test'],
  component: WorkspaceHealthCard,
  decorators: [setup.decorator],
  parameters: {
    ...setup.parameters,
    // Feature loads async in Storybook — snapshots can be flaky
  },
} satisfies Meta<typeof WorkspaceHealthCard>

export default meta
type Story = StoryObj<typeof meta>

export const Healthy: Story = {
  args: {
    safes: [singleChain(SAFE_A), singleChain(SAFE_B), singleChain(SAFE_C)],
    scanResults: {
      [`${SAFE_A}:1`]: allClear,
      [`${SAFE_B}:1`]: allClear,
      [`${SAFE_C}:1`]: allClear,
    },
    isScanning: false,
    activeFilter: null,
    onFilterChange: () => {},
    lastScannedAt: Date.now() - 120_000,
    onRescan: () => {},
  },
}

export const MixedGrades: Story = {
  args: {
    safes: [singleChain(SAFE_A), singleChain(SAFE_B), singleChain(SAFE_C)],
    scanResults: {
      [`${SAFE_A}:1`]: allClear,
      [`${SAFE_B}:1`]: mixedResults,
      [`${SAFE_C}:1`]: criticalResults,
    },
    isScanning: false,
    activeFilter: null,
    onFilterChange: () => {},
    lastScannedAt: Date.now() - 60_000,
    onRescan: () => {},
  },
}

export const Scanning: Story = {
  args: {
    safes: [singleChain(SAFE_A)],
    scanResults: {},
    isScanning: true,
    activeFilter: null,
    onFilterChange: () => {},
    lastScannedAt: null,
    onRescan: () => {},
  },
}

export const CriticalFilterActive: Story = {
  args: {
    safes: [singleChain(SAFE_A), singleChain(SAFE_B), singleChain(SAFE_C)],
    scanResults: {
      [`${SAFE_A}:1`]: allClear,
      [`${SAFE_B}:1`]: mixedResults,
      [`${SAFE_C}:1`]: criticalResults,
    },
    isScanning: false,
    activeFilter: 'critical',
    onFilterChange: () => {},
    lastScannedAt: Date.now() - 60_000,
    onRescan: () => {},
  },
}
