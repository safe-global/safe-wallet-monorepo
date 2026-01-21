import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import { _UpdateSafe } from './index'
import { mockUpdateSafeTxData, mockUnknownContractTxData } from './mockData'
import { faker } from '@faker-js/faker'

// Seed faker for deterministic visual regression tests
faker.seed(123)

const meta = {
  component: _UpdateSafe,
  parameters: {
    // Stories use faker for addresses which causes non-deterministic visual tests
    visualTest: { disable: true },
  },
  decorators: [
    (Story) => {
      return (
        <StoreDecorator initialState={{}}>
          <Paper sx={{ padding: 2 }}>
            <Story />
          </Paper>
        </StoreDecorator>
      )
    },
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof _UpdateSafe>

export default meta
type Story = StoryObj<typeof meta>

const mockSafeInfo = {
  safe: {
    address: { value: faker.finance.ethereumAddress() },
    chainId: '1',
    nonce: 100,
    threshold: 2,
    owners: [
      {
        value: faker.finance.ethereumAddress(),
        name: 'Owner 1',
        logoUri: null,
      },
      {
        value: faker.finance.ethereumAddress(),
        name: 'Owner 2',
        logoUri: null,
      },
    ],
    implementation: { value: faker.finance.ethereumAddress() },
    implementationVersionState: 'UP_TO_DATE' as const,
    modules: null,
    fallbackHandler: { value: faker.finance.ethereumAddress() },
    guard: null,
    version: '1.3.0',
    collectiblesTag: '1234',
    txQueuedTag: '1234',
    txHistoryTag: '1234',
    messagesTag: '1234',
    deployed: true,
  },
  safeAddress: faker.finance.ethereumAddress(),
  safeLoaded: true,
  safeLoading: false,
  safeError: undefined,
}

const mockOldSafeInfo = {
  ...mockSafeInfo,
  safe: {
    ...mockSafeInfo.safe,
    version: '1.2.0',
    implementationVersionState: 'OUTDATED' as const,
  },
}

const mockChain = {
  chainId: '1',
  chainName: 'Ethereum',
  shortName: 'eth',
  l2: false,
} as any

const mockL2Chain = {
  chainId: '10',
  chainName: 'Optimism',
  shortName: 'oeth',
  l2: true,
} as any

export const Default: Story = {
  args: {
    safeInfo: mockSafeInfo,
    queueSize: '0',
    chain: mockChain,
    txData: mockUpdateSafeTxData,
  },
}

export const WithQueueWarning: Story = {
  args: {
    safeInfo: mockOldSafeInfo,
    queueSize: '5',
    chain: mockChain,
    txData: mockUpdateSafeTxData,
  },
}

export const L2Upgrade: Story = {
  args: {
    safeInfo: mockSafeInfo,
    queueSize: '0',
    chain: mockL2Chain,
    txData: mockUpdateSafeTxData,
  },
}

export const UnknownContract: Story = {
  args: {
    safeInfo: mockSafeInfo,
    queueSize: '0',
    chain: mockChain,
    txData: mockUnknownContractTxData,
  },
}
