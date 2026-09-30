import type { Meta, StoryObj } from '@storybook/react'
import { StoreDecorator } from '@/stories/storeDecorator'
import { _UpdateSafe } from './index'
import { MOCK_SAFE_ADDRESS, mockUpdateSafeTxData, mockUnknownContractTxData } from './mockData'
import { faker } from '@faker-js/faker'

// Seed faker for deterministic visual regression tests
faker.seed(123)

const meta = {
  title: 'Components/TxFlow/ConfirmationViews/UpdateSafe',
  component: _UpdateSafe,
  tags: ['autodocs', 'skip-visual-test'],
  parameters: {
    // Stories use faker for addresses which causes non-deterministic visual tests
    visualTest: { disable: true },
  },
  decorators: [
    (Story) => {
      return (
        <StoreDecorator initialState={{}}>
          <div className="rounded-lg bg-background p-4">
            <Story />
          </div>
        </StoreDecorator>
      )
    },
  ],
} satisfies Meta<typeof _UpdateSafe>

export default meta
type Story = StoryObj<typeof meta>

const mockSafeInfo = {
  safe: {
    // Must match mockUpdateSafeTxData.to — the upgrade call targets the Safe itself.
    address: { value: MOCK_SAFE_ADDRESS },
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
    // Old Safe (1.2.0) upgrading to the mocked 1.3.0 mastercopy.
    safeInfo: mockOldSafeInfo,
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
