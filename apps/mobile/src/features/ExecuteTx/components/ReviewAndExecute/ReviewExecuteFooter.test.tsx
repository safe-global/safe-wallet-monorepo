import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import config from '@/src/theme/tamagui.config'
import { ReviewExecuteFooter } from './ReviewExecuteFooter'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'

// Stub the child fee/executor components — they carry their own store/relay hooks and are not part
// of the GTF gate under test.
jest.mock('@/src/components/SelectExecutor', () => ({ SelectExecutor: () => null }))
jest.mock('../EstimatedNetworkFee', () => {
  const { Text: T } = jest.requireActual('tamagui')
  return { EstimatedNetworkFee: () => <T>Est. network fee</T> }
})
jest.mock('@/src/features/WalletConnect/Signer/components/WalletConnectGate', () => ({
  WalletConnectGate: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@/src/store/hooks', () => ({
  useAppSelector: () => 'usd',
}))

jest.mock('@/src/features/ConfirmTx/components/TransactionInfo/useFeesBreakdown', () => ({
  useFeesBreakdown: () => undefined,
}))

const baseProps = {
  txId: 'tx123',
  activeSigner: undefined,
  executionMethod: ExecutionMethod.WITH_PK,
  isPaidFromSafe: false,
  detailedExecutionInfo: undefined,
  totalFee: '0.01',
  isLoadingFees: false,
  willFail: false,
  hasSufficientFunds: true,
  isCheckingFunds: false,
  isExecuting: false,
  onConfirmPress: jest.fn(),
}

const renderFooter = (isGtfEnabled: boolean) =>
  render(
    <TamaguiProvider config={config} defaultTheme="light">
      <ReviewExecuteFooter {...baseProps} isGtfEnabled={isGtfEnabled} />
    </TamaguiProvider>,
  )

describe('ReviewExecuteFooter', () => {
  it('hides the "Execution Fee" row on networks without GTF', () => {
    renderFooter(false)
    expect(screen.queryByText('Execution Fee')).toBeNull()
    // The pre-GTF estimated network fee row is still shown.
    expect(screen.getByText('Est. network fee')).toBeTruthy()
  })

  it('shows the "Execution Fee" row on GTF-enabled networks', () => {
    renderFooter(true)
    expect(screen.getByText('Execution Fee')).toBeTruthy()
  })
})
