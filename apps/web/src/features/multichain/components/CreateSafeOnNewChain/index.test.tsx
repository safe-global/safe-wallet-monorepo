import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import { CreateSafeOnSpecificChain } from './index'
import { persistCounterfactualSafe } from '@/features/counterfactual/services'
import { predictAddressBasedOnReplayData } from '../../utils'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'

jest.mock('@/features/counterfactual/services', () => ({
  persistCounterfactualSafe: jest.fn(),
}))

jest.mock('../../utils', () => ({
  predictAddressBasedOnReplayData: jest.fn(),
  hasMultiChainAddNetworkFeature: jest.fn(() => true),
}))

jest.mock('@/hooks/wallets/web3', () => ({
  createWeb3ReadOnly: jest.fn(),
}))

const mockPersist = persistCounterfactualSafe as jest.MockedFunction<typeof persistCounterfactualSafe>
const mockPredict = predictAddressBasedOnReplayData as jest.MockedFunction<typeof predictAddressBasedOnReplayData>
const mockCreateProvider = createWeb3ReadOnly as jest.MockedFunction<typeof createWeb3ReadOnly>

const SAFE_ADDRESS = '0x0000000000000000000000000000000000001234'

const chain = {
  chainId: '100',
  chainName: 'Gnosis Chain',
  shortName: 'gno',
} as Chain

const safeCreationData = {
  safeAccountConfig: { owners: ['0xabc'], threshold: 1 },
} as unknown as ReplayedSafeProps

const renderDialog = (onClose: () => void) =>
  render(
    <CreateSafeOnSpecificChain
      safeAddress={SAFE_ADDRESS}
      chain={chain}
      currentName="My Safe"
      open
      onClose={onClose}
      safeCreationResult={[safeCreationData, undefined, false]}
    />,
  )

describe('CreateSafeOnSpecificChain', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateProvider.mockReturnValue({} as ReturnType<typeof createWeb3ReadOnly>)
    mockPredict.mockResolvedValue(SAFE_ADDRESS)
  })

  it('keeps the dialog open and shows the inline backend error when persisting fails', async () => {
    const onClose = jest.fn()
    mockPersist.mockResolvedValue({ ok: false, error: new Error('Network already added by another member') })

    renderDialog(onClose)

    fireEvent.submit(screen.getByTestId('add-chain-dialog').closest('form')!)

    await waitFor(() => expect(mockPersist).toHaveBeenCalled())

    expect(await screen.findByText('Network already added by another member')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes the dialog when persisting succeeds', async () => {
    const onClose = jest.fn()
    mockPersist.mockResolvedValue({ ok: true })

    renderDialog(onClose)

    fireEvent.submit(screen.getByTestId('add-chain-dialog').closest('form')!)

    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('keeps the dialog open and shows an inline error when the predicted address mismatches', async () => {
    const onClose = jest.fn()
    mockPredict.mockResolvedValue('0x0000000000000000000000000000000000009999')

    renderDialog(onClose)

    fireEvent.submit(screen.getByTestId('add-chain-dialog').closest('form')!)

    expect(await screen.findByText('The replayed Safe leads to an unexpected address')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    expect(mockPersist).not.toHaveBeenCalled()
  })
})
