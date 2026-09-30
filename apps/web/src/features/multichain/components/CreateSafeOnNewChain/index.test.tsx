import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import { CreateSafeOnSpecificChain } from './index'
import { persistCounterfactualSafe } from '@/features/counterfactual/services'
import { useIsAdmin, useSpaceSafeCount, useSpaceSafeLimit } from '@/features/spaces'
import { useSpaceSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
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

// The feature barrel cannot be spread (circular import at init), so the source hook modules are mocked instead.
jest.mock('@/features/spaces/hooks/useSpaceMembers', () => ({
  ...jest.requireActual('@/features/spaces/hooks/useSpaceMembers'),
  useIsAdmin: jest.fn(),
}))
jest.mock('@/features/spaces/hooks/useIsCurrentSpaceAtSafeLimit', () => ({
  ...jest.requireActual('@/features/spaces/hooks/useIsCurrentSpaceAtSafeLimit'),
  useSpaceSafeCount: jest.fn(),
}))
jest.mock('@/features/spaces/hooks/useSpaceSafeLimit', () => ({
  useSpaceSafeLimit: jest.fn(),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/spaces'),
  useSpaceSafesGetV1Query: jest.fn(),
}))

const mockPersist = persistCounterfactualSafe as jest.MockedFunction<typeof persistCounterfactualSafe>
const mockUseIsAdmin = useIsAdmin as jest.Mock
const mockUseSpaceSafeCount = useSpaceSafeCount as jest.Mock
const mockUseSpaceSafeLimit = useSpaceSafeLimit as jest.Mock
const mockUseSpaceSafes = useSpaceSafesGetV1Query as jest.Mock
const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'
const spaceReduxState = {
  auth: {
    sessionExpiresAt: Date.now() + 60000,
    lastUsedSpace: MOCK_SPACE_UUID,
    isStoreHydrated: true,
    cfSafeSynced: false,
    isOidcLoginPending: false,
    isSessionCheckPending: false,
  },
}
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

const renderDialog = (onClose: () => void, initialReduxState?: typeof spaceReduxState) =>
  render(
    <CreateSafeOnSpecificChain
      safeAddress={SAFE_ADDRESS}
      chain={chain}
      currentName="My Safe"
      open
      onClose={onClose}
      safeCreationResult={[safeCreationData, undefined, false]}
    />,
    initialReduxState ? { initialReduxState } : undefined,
  )

describe('CreateSafeOnSpecificChain', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateProvider.mockReturnValue({} as ReturnType<typeof createWeb3ReadOnly>)
    mockPredict.mockResolvedValue(SAFE_ADDRESS)
    mockUseIsAdmin.mockReturnValue(false)
    mockUseSpaceSafeCount.mockReturnValue(undefined)
    mockUseSpaceSafeLimit.mockReturnValue({ limit: 40, isLoading: false })
    mockUseSpaceSafes.mockReturnValue({ currentData: undefined })
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

  describe('at the Workspace seat limit', () => {
    beforeEach(() => {
      mockUseIsAdmin.mockReturnValue(true)
      mockUseSpaceSafeCount.mockReturnValue(20)
      mockUseSpaceSafeLimit.mockReturnValue({ limit: 20, isLoading: false })
      mockPersist.mockResolvedValue({ ok: true })
    })

    it('warns upfront and skips the seat when the Safe is not in the Workspace yet', async () => {
      mockUseSpaceSafes.mockReturnValue({
        currentData: { safes: { '1': ['0x0000000000000000000000000000000000009999'] } },
      })

      renderDialog(jest.fn(), spaceReduxState)

      expect(screen.getByTestId('space-seat-limit-notice')).toHaveTextContent(
        'This Workspace is at its limit of 20 Safe accounts. The new network will be added in My accounts, outside the Workspace.',
      )

      fireEvent.submit(screen.getByTestId('add-chain-dialog').closest('form')!)

      await waitFor(() => expect(mockPersist).toHaveBeenCalled())
      expect(mockPersist).toHaveBeenCalledWith(
        expect.objectContaining({ spaceSafeCount: 20, spaceSafeLimit: 20, holdsSeatInSpace: false }),
      )
    })

    it('adds the new network to the Workspace when the Safe already holds a seat there on another chain', async () => {
      mockUseSpaceSafes.mockReturnValue({ currentData: { safes: { '1': [SAFE_ADDRESS.toLowerCase()] } } })

      renderDialog(jest.fn(), spaceReduxState)

      expect(screen.queryByTestId('space-seat-limit-notice')).not.toBeInTheDocument()

      fireEvent.submit(screen.getByTestId('add-chain-dialog').closest('form')!)

      await waitFor(() => expect(mockPersist).toHaveBeenCalled())
      expect(mockPersist).toHaveBeenCalledWith(expect.objectContaining({ holdsSeatInSpace: true }))
    })

    it('shows no notice to a member, whose Safes are never auto-added', () => {
      mockUseIsAdmin.mockReturnValue(false)

      renderDialog(jest.fn(), spaceReduxState)

      expect(screen.queryByTestId('space-seat-limit-notice')).not.toBeInTheDocument()
    })
  })
})
