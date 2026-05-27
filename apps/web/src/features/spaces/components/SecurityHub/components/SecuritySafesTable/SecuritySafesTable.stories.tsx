import type { Meta, StoryObj } from '@storybook/react'
import SecuritySafesTable from './SecuritySafesTable'
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
const SAFE_MC = '0xC000000000000000000000000000000000000000'

const single = (address: string, name: string): SpaceSafeEntry => ({
  address,
  chainId: '1',
  name,
  isMultichain: false,
  chainEntries: [{ chainId: '1', isDeployed: true }],
})

const multichain = (address: string, name: string): SpaceSafeEntry => ({
  address,
  chainId: '1',
  name,
  isMultichain: true,
  chainEntries: [
    { chainId: '1', isDeployed: true },
    { chainId: '137', isDeployed: true },
  ],
})

const allClear = {
  account_setup: mkResult({
    status: 'clear',
    evidence: [{ label: 'Threshold', value: '2 of 3' }],
  }),
  contract_version: mkResult({
    status: 'clear',
    evidence: [{ label: 'Current version', value: '1.4.1' }],
  }),
  guard: mkResult(),
  fallback_handler: mkResult(),
  pending_tx: mkResult(),
}

const mixedResults = {
  account_setup: mkResult({
    status: 'clear',
    evidence: [{ label: 'Threshold', value: '1 of 2' }],
  }),
  contract_version: mkResult({
    status: 'issue',
    severity: 'High',
    evidence: [{ label: 'Current version', value: '1.3.0' }],
  }),
  guard: mkResult({ status: 'partial', severity: 'Medium' }),
  fallback_handler: mkResult(),
  pending_tx: mkResult(),
}

const setup = createMockStory({ features: { spaces: true }, layout: 'paper' })

const meta = {
  title: 'Features/SecurityHub/SecuritySafesTable',
  component: SecuritySafesTable,
  decorators: [setup.decorator],
  parameters: {
    ...setup.parameters,
    layout: 'fullscreen',
    chromatic: { disableSnapshot: true },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SecuritySafesTable>

export default meta
type Story = StoryObj<typeof meta>

export const SingleChainSafes: Story = {
  args: {
    safes: [single(SAFE_A, 'Operations Vault'), single(SAFE_B, 'Treasury')],
    scanResults: {
      [`${SAFE_A}:1`]: allClear,
      [`${SAFE_B}:1`]: mixedResults,
    },
    scanTimestamps: {
      [`${SAFE_A}:1`]: Date.now() - 90_000,
      [`${SAFE_B}:1`]: Date.now() - 90_000,
    },
    scanningKeys: new Set(),
    selectedSafe: null,
    onViewReport: () => {},
    gradeFilter: null,
    balanceMap: {
      [`${SAFE_A}:1`]: '1250000',
      [`${SAFE_B}:1`]: '45200',
    },
  },
}

export const MultichainSafe: Story = {
  args: {
    safes: [multichain(SAFE_MC, 'Multichain Vault')],
    scanResults: {
      [`${SAFE_MC}:1`]: allClear,
      [`${SAFE_MC}:137`]: mixedResults,
    },
    scanTimestamps: {
      [`${SAFE_MC}:1`]: Date.now() - 120_000,
      [`${SAFE_MC}:137`]: Date.now() - 120_000,
    },
    scanningKeys: new Set(),
    selectedSafe: null,
    onViewReport: () => {},
    gradeFilter: null,
    balanceMap: {
      [`${SAFE_MC}:1`]: '850000',
      [`${SAFE_MC}:137`]: '15300',
    },
  },
}

export const Scanning: Story = {
  args: {
    safes: [single(SAFE_A, 'Operations Vault'), single(SAFE_B, 'Treasury')],
    scanResults: {},
    scanningKeys: new Set([`${SAFE_A}:1`, `${SAFE_B}:1`]),
    selectedSafe: null,
    onViewReport: () => {},
    gradeFilter: null,
    balanceMap: {},
  },
}
