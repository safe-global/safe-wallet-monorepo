import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import config from '@/src/theme/tamagui.config'
import { FeesBreakdown } from './FeesBreakdown'
import type { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const mockHasFeature = jest.fn()

jest.mock('@/src/store/hooks/activeSafe', () => ({
  useDefinedActiveSafe: () => ({ address: '0xSafe', chainId: '137' }),
}))

jest.mock('@/src/store/hooks', () => ({
  useAppSelector: (selector: unknown) => (typeof selector === 'function' ? selector() : selector),
}))

jest.mock('@/src/store/chains', () => ({
  selectChainById: () => ({ chainId: '137', features: [] }),
  selectActiveChainCurrency: () => ({ symbol: 'MATIC', decimals: 18 }),
}))

jest.mock('@/src/store/settingsSlice', () => ({
  selectCurrency: () => 'usd',
}))

jest.mock('@safe-global/utils/utils/chains', () => ({
  ...jest.requireActual('@safe-global/utils/utils/chains'),
  hasFeature: (...args: unknown[]) => mockHasFeature(...args),
}))

jest.mock('@/src/hooks/useBalances', () => ({
  useBalances: () => ({ balances: undefined }),
}))

jest.mock('@/src/hooks/useTokenDetails/useTokenDetails', () => ({
  useTokenDetails: () => ({ value: '0', decimals: undefined }),
}))

jest.mock('./useFeesBreakdown', () => ({
  useFeesBreakdown: () => ({
    paidFromSafe: true,
    gasNotYetKnown: false,
    maxGasFee: { amount: '1000', symbol: 'MATIC', decimals: 18, address: '0x0' },
    maxGasFeeFiat: undefined,
    totalOutgoing: [{ amount: '1000', symbol: 'MATIC', decimals: 18, address: '0x0' }],
    totalOutgoingFiat: undefined,
  }),
}))

const detailedExecutionInfo = { type: 'MULTISIG' } as unknown as MultisigExecutionDetails

const renderWithTheme = () =>
  render(
    <TamaguiProvider config={config} defaultTheme="light">
      <FeesBreakdown detailedExecutionInfo={detailedExecutionInfo} />
    </TamaguiProvider>,
  )

describe('FeesBreakdown — GTF gating', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders nothing when the GTF feature is disabled', () => {
    mockHasFeature.mockReturnValue(false)
    renderWithTheme()
    expect(screen.queryByTestId('fees-breakdown')).toBeNull()
  })

  it('renders the fees block when the GTF feature is enabled', () => {
    mockHasFeature.mockReturnValue(true)
    renderWithTheme()
    expect(screen.getByTestId('fees-breakdown')).toBeTruthy()
  })
})
