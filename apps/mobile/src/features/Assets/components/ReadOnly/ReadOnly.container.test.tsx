import { render, screen } from '@/src/tests/test-utils'
import { ReadOnlyContainer } from './ReadOnly.container'
import { RootState } from '@/src/store'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { SignerInfo } from '@/src/types/address'

describe('ReadOnlyContainer', () => {
  const mockSafeAddress = '0x123'
  const mockSigners: Record<string, SignerInfo> = {
    '0x456': { value: '0x456', name: 'Signer 1', type: 'private-key' as const },
    '0x789': { value: '0x789', name: 'Signer 2', type: 'private-key' as const },
  }

  const mockSafeInfo: SafeOverview = {
    address: { value: mockSafeAddress },
    chainId: '1',
    owners: [{ value: '0x456' }, { value: '0x789' }],
    threshold: 2,
    fiatTotal: '0',
    queued: 0,
  }

  const createInitialState = (signers: Record<string, SignerInfo>, safeInfo: SafeOverview): Partial<RootState> => ({
    safes: {
      [mockSafeAddress]: {
        '1': safeInfo,
      },
    },
    signers: signers,
    activeSafe: {
      address: mockSafeAddress,
      chainId: '1',
    },
  })

  it('should render read-only message when there are no signers', () => {
    const initialState = createInitialState(
      {},
      {
        ...mockSafeInfo,
      },
    )
    render(<ReadOnlyContainer />, { initialStore: initialState })

    expect(screen.getByText('This is a read-only account')).toBeTruthy()
  })

  it("should render read-only message when signers don't match owners", () => {
    const initialState = createInitialState(mockSigners, {
      ...mockSafeInfo,
      owners: [{ value: '0x345' }],
    })
    render(<ReadOnlyContainer />, { initialStore: initialState })

    expect(screen.getByText('This is a read-only account')).toBeTruthy()
  })

  it('should not render read-only message when there are signers', () => {
    const initialState = createInitialState(mockSigners, mockSafeInfo)
    render(<ReadOnlyContainer />, { initialStore: initialState })

    expect(screen.queryByText('This is a read-only account')).toBeNull()
  })
})
