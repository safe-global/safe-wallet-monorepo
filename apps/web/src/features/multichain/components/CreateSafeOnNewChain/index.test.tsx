import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import { CreateSafeOnSpecificChain } from './index'
import { createCounterfactualSafe, type ChainCreationResult } from '@/features/counterfactual/services'
import { useIsAdmin, useSpaceSafeCount, useSpaceSafeLimit } from '@/features/spaces'
import { useSpaceSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { predictAddressBasedOnReplayData } from '../../utils'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'

jest.mock('@/features/counterfactual/services', () => ({
  createCounterfactualSafe: jest.fn(),
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

const mockCreate = createCounterfactualSafe as jest.MockedFunction<typeof createCounterfactualSafe>
const resolveWith = (result: ChainCreationResult, isStepUpPending = false) =>
  mockCreate.mockResolvedValue({ chains: [result], isStepUpPending })
const mockUseIsAdmin = useIsAdmin as jest.Mock
const mockUseSpaceSafeCount = useSpaceSafeCount as jest.Mock
const mockUseSpaceSafeLimit = useSpaceSafeLimit as jest.Mock
const mockUseSpaceSafes = useSpaceSafesGetV1Query as jest.Mock
const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'
const signedInState = {
  auth: {
    sessionExpiresAt: Date.now() + 60000,
    landingSpaceHint: null as string | null,
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

type RenderOptions = { initialReduxState?: typeof signedInState; urlSpaceId?: string }

const renderDialog = (onClose: () => void, { initialReduxState, urlSpaceId }: RenderOptions = {}) =>
  render(
    <CreateSafeOnSpecificChain
      safeAddress={SAFE_ADDRESS}
      chain={chain}
      currentName="My Safe"
      open
      onClose={onClose}
      safeCreationResult={[safeCreationData, undefined, false]}
    />,
    { initialReduxState, routerProps: urlSpaceId ? { query: { spaceId: urlSpaceId } } : {} },
  )

const renderInSpace = () => renderDialog(jest.fn(), { initialReduxState: signedInState, urlSpaceId: MOCK_SPACE_UUID })

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

  it('keeps the dialog open and shows the inline backend error when creation fails', async () => {
    const onClose = jest.fn()
    resolveWith({ chainId: '100', status: 'failed', error: new Error('Network already added by another member') })

    renderDialog(onClose)

    fireEvent.submit(screen.getByTestId('add-chain-dialog').closest('form')!)

    await waitFor(() => expect(mockCreate).toHaveBeenCalled())

    expect(await screen.findByText('Network already added by another member')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes the dialog when creation succeeds', async () => {
    const onClose = jest.fn()
    resolveWith({ chainId: '100', status: 'saved' })

    renderDialog(onClose)

    fireEvent.submit(screen.getByTestId('add-chain-dialog').closest('form')!)

    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('keeps the dialog open without an error while a step-up is pending', async () => {
    const onClose = jest.fn()
    resolveWith({ chainId: '100', status: 'saved' }, true)

    renderDialog(onClose)

    fireEvent.submit(screen.getByTestId('add-chain-dialog').closest('form')!)

    await waitFor(() => expect(mockCreate).toHaveBeenCalled())
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.queryByText(/Successfully added/)).not.toBeInTheDocument()
  })

  it('keeps the dialog open and shows an inline error when the predicted address mismatches', async () => {
    const onClose = jest.fn()
    mockPredict.mockResolvedValue('0x0000000000000000000000000000000000009999')

    renderDialog(onClose)

    fireEvent.submit(screen.getByTestId('add-chain-dialog').closest('form')!)

    expect(await screen.findByText('The replayed Safe leads to an unexpected address')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  describe('at the Workspace seat limit', () => {
    beforeEach(() => {
      mockUseIsAdmin.mockReturnValue(true)
      mockUseSpaceSafeCount.mockReturnValue(20)
      mockUseSpaceSafeLimit.mockReturnValue({ limit: 20, isLoading: false })
      resolveWith({ chainId: '100', status: 'saved' })
    })

    it('warns upfront and skips the seat when the Safe is not in the Workspace yet', async () => {
      mockUseSpaceSafes.mockReturnValue({
        currentData: { safes: { '1': ['0x0000000000000000000000000000000000009999'] } },
      })

      renderInSpace()

      expect(screen.getByTestId('space-seat-limit-notice')).toHaveTextContent(
        'This Workspace is at its limit of 20 Safe accounts. The new network will be added in My accounts, outside the Workspace.',
      )

      fireEvent.submit(screen.getByTestId('add-chain-dialog').closest('form')!)

      await waitFor(() => expect(mockCreate).toHaveBeenCalled())
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          networks: [{ chainId: '100', provider: expect.anything() }],
          spaceSafeCount: 20,
          spaceSafeLimit: 20,
          holdsSeatInSpace: false,
        }),
      )
    })

    it('adds the new network to the Workspace when the Safe already holds a seat there on another chain', async () => {
      mockUseSpaceSafes.mockReturnValue({ currentData: { safes: { '1': [SAFE_ADDRESS.toLowerCase()] } } })

      renderInSpace()

      expect(screen.queryByTestId('space-seat-limit-notice')).not.toBeInTheDocument()

      fireEvent.submit(screen.getByTestId('add-chain-dialog').closest('form')!)

      await waitFor(() => expect(mockCreate).toHaveBeenCalled())
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ holdsSeatInSpace: true }))
    })

    it('shows no notice to a member, whose Safes are never auto-added', () => {
      mockUseIsAdmin.mockReturnValue(false)

      renderInSpace()

      expect(screen.queryByTestId('space-seat-limit-notice')).not.toBeInTheDocument()
    })
  })

  it('ignores a Workspace stored by another tab when the URL has none', async () => {
    // Earlier renders persist `auth`; hydration would otherwise replace the stored Workspace.
    window.localStorage.clear()
    mockUseIsAdmin.mockReturnValue(true)
    resolveWith({ chainId: '100', status: 'saved' })

    renderDialog(jest.fn(), {
      initialReduxState: { auth: { ...signedInState.auth, landingSpaceHint: MOCK_SPACE_UUID } },
    })

    fireEvent.submit(screen.getByTestId('add-chain-dialog').closest('form')!)

    await waitFor(() => expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ spaceId: null })))
  })
})
