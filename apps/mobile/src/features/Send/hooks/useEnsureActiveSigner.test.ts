import { renderHook, act } from '@testing-library/react-native'
import { useAppSelector } from '@/src/store/hooks'
import { setActiveSigner } from '@/src/store/activeSignerSlice'
import { Signer } from '@/src/store/signersSlice'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useEnsureActiveSigner } from './useEnsureActiveSigner'

const mockDispatch = jest.fn()

jest.mock('@/src/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: jest.fn(),
}))

jest.mock('@/src/store/hooks/activeSafe', () => ({
  useDefinedActiveSafe: () => ({ address: '0xSafe1', chainId: '1' }),
}))

jest.mock('@/src/store/safesSlice', () => ({
  selectSafeInfo: jest.fn(),
}))

jest.mock('@/src/store/activeSignerSlice', () => ({
  selectActiveSigner: jest.fn(),
  setActiveSigner: jest.fn((payload: unknown) => ({
    type: 'SET_ACTIVE_SIGNER',
    payload,
  })),
}))

jest.mock('@/src/store/signersSlice', () => ({
  selectSigners: jest.fn(),
}))

const mockUseAppSelector = useAppSelector as unknown as jest.Mock

const makeSigner = (address: string): Signer => ({
  value: address,
  name: `Signer-${address.slice(-4)}`,
  type: 'private-key',
})

const makeOwner = (address: string): AddressInfo => ({
  value: address,
})

function setupSelectors(
  owners: AddressInfo[] | undefined,
  signers: Record<string, Signer>,
  activeSigner: Signer | undefined,
) {
  mockUseAppSelector.mockReturnValueOnce(owners).mockReturnValueOnce(signers).mockReturnValueOnce(activeSigner)
}

describe('useEnsureActiveSigner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('availableSigners computation', () => {
    it('returns signers that match owners', () => {
      const signerA = makeSigner('0xA')
      const signerB = makeSigner('0xB')
      const owners = [makeOwner('0xA'), makeOwner('0xB')]
      const signersRecord = { '0xA': signerA, '0xB': signerB }

      setupSelectors(owners, signersRecord, signerA)

      const { result } = renderHook(() => useEnsureActiveSigner())

      expect(result.current.availableSigners).toEqual([signerA, signerB])
    })

    it('filters out owners that have no matching signer', () => {
      const signerA = makeSigner('0xA')
      const owners = [makeOwner('0xA'), makeOwner('0xB')]
      const signersRecord = { '0xA': signerA }

      setupSelectors(owners, signersRecord, signerA)

      const { result } = renderHook(() => useEnsureActiveSigner())

      expect(result.current.availableSigners).toEqual([signerA])
    })

    it('returns empty array when owners is undefined', () => {
      setupSelectors(undefined, {}, undefined)

      const { result } = renderHook(() => useEnsureActiveSigner())

      expect(result.current.availableSigners).toEqual([])
    })
  })

  describe('ensureActiveSigner callback', () => {
    it('does not dispatch on render (no automatic side effects)', () => {
      const signerA = makeSigner('0xA')
      const owners = [makeOwner('0xA')]
      const signersRecord = { '0xA': signerA }

      setupSelectors(owners, signersRecord, undefined)

      renderHook(() => useEnsureActiveSigner())

      expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('dispatches setActiveSigner with first available when called with no active signer', () => {
      const signerA = makeSigner('0xA')
      const owners = [makeOwner('0xA')]
      const signersRecord = { '0xA': signerA }

      setupSelectors(owners, signersRecord, undefined)

      const { result } = renderHook(() => useEnsureActiveSigner())

      act(() => result.current.ensureActiveSigner())

      expect(mockDispatch).toHaveBeenCalledTimes(1)
      expect(setActiveSigner).toHaveBeenCalledWith({
        safeAddress: '0xSafe1',
        signer: signerA,
      })
    })

    it('dispatches setActiveSigner when active signer is stale', () => {
      const signerA = makeSigner('0xA')
      const staleSigner = makeSigner('0xRemoved')
      const owners = [makeOwner('0xA')]
      const signersRecord = { '0xA': signerA }

      setupSelectors(owners, signersRecord, staleSigner)

      const { result } = renderHook(() => useEnsureActiveSigner())

      act(() => result.current.ensureActiveSigner())

      expect(mockDispatch).toHaveBeenCalledTimes(1)
      expect(setActiveSigner).toHaveBeenCalledWith({
        safeAddress: '0xSafe1',
        signer: signerA,
      })
    })

    it('does not dispatch when active signer is valid', () => {
      const signerA = makeSigner('0xA')
      const owners = [makeOwner('0xA')]
      const signersRecord = { '0xA': signerA }

      setupSelectors(owners, signersRecord, signerA)

      const { result } = renderHook(() => useEnsureActiveSigner())

      act(() => result.current.ensureActiveSigner())

      expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('does not dispatch when no available signers', () => {
      setupSelectors(undefined, {}, undefined)

      const { result } = renderHook(() => useEnsureActiveSigner())

      act(() => result.current.ensureActiveSigner())

      expect(mockDispatch).not.toHaveBeenCalled()
    })
  })

  describe('activeSigner resolution', () => {
    it('returns undefined when no available signers even if currentActiveSigner exists', () => {
      const staleSigner = makeSigner('0xA')

      setupSelectors(undefined, {}, staleSigner)

      const { result } = renderHook(() => useEnsureActiveSigner())

      expect(result.current.activeSigner).toBeUndefined()
    })

    it('returns the matched signer from available signers', () => {
      const signerA = makeSigner('0xA')
      const signerB = makeSigner('0xB')
      const owners = [makeOwner('0xA'), makeOwner('0xB')]
      const signersRecord = { '0xA': signerA, '0xB': signerB }

      setupSelectors(owners, signersRecord, signerB)

      const { result } = renderHook(() => useEnsureActiveSigner())

      expect(result.current.activeSigner).toEqual(signerB)
    })
  })
})
