import { renderHook } from '@/src/tests/test-utils'
import { useTxSignerActions } from './useTxSignerActions'
import { setActiveSigner } from '@/src/store/activeSignerSlice'
import { faker } from '@faker-js/faker'
import type { SignerInfo } from '@/src/types/address'
import type { RootState } from '@/src/tests/test-utils'
import * as reduxHooks from '@/src/store/hooks'

jest.mock('@/src/store/hooks/activeSafe', () => ({
  useDefinedActiveSafe: jest.fn(),
}))

const mockUseDefinedActiveSafe = require('@/src/store/hooks/activeSafe').useDefinedActiveSafe

const createMockSigner = (overrides: Partial<SignerInfo> = {}): SignerInfo => ({
  value: faker.finance.ethereumAddress() as `0x${string}`,
  name: faker.person.fullName(),
  logoUri: faker.image.avatar(),
  ...overrides,
})

const createMockActiveSafe = () => ({
  address: faker.finance.ethereumAddress() as `0x${string}`,
  chainId: faker.helpers.arrayElement(['1', '137', '10', '42161']),
  threshold: faker.number.int({ min: 1, max: 3 }),
  owners: faker.helpers.multiple(() => faker.finance.ethereumAddress() as `0x${string}`, { count: { min: 1, max: 5 } }),
})

describe('useTxSignerActions', () => {
  let mockActiveSafe: ReturnType<typeof createMockActiveSafe>
  let mockSigner: SignerInfo

  beforeEach(() => {
    jest.clearAllMocks()

    mockActiveSafe = createMockActiveSafe()
    mockSigner = createMockSigner()

    mockUseDefinedActiveSafe.mockReturnValue(mockActiveSafe)
  })

  describe('hook behavior', () => {
    it('should return setTxSigner function', () => {
      const { result } = renderHook(() => useTxSignerActions())

      expect(result.current).toHaveProperty('setTxSigner')
      expect(typeof result.current.setTxSigner).toBe('function')
    })

    it('should call dispatch with correct action when setTxSigner is called', () => {
      const mockDispatch = jest.fn()
      const useAppDispatchSpy = jest.spyOn(reduxHooks, 'useAppDispatch').mockReturnValue(mockDispatch)

      const { result } = renderHook(() => useTxSignerActions())

      result.current.setTxSigner(mockSigner)

      expect(mockDispatch).toHaveBeenCalledTimes(1)
      expect(mockDispatch).toHaveBeenCalledWith(
        setActiveSigner({
          safeAddress: mockActiveSafe.address,
          signer: mockSigner,
        }),
      )

      useAppDispatchSpy.mockRestore()
    })

    it('should work with different signers', () => {
      const mockDispatch = jest.fn()
      const useAppDispatchSpy = jest.spyOn(reduxHooks, 'useAppDispatch').mockReturnValue(mockDispatch)

      const { result } = renderHook(() => useTxSignerActions())

      const signerA = createMockSigner({ name: 'Signer A' })
      const signerB = createMockSigner({ name: 'Signer B' })

      result.current.setTxSigner(signerA)

      expect(mockDispatch).toHaveBeenCalledWith(
        setActiveSigner({
          safeAddress: mockActiveSafe.address,
          signer: signerA,
        }),
      )

      result.current.setTxSigner(signerB)

      expect(mockDispatch).toHaveBeenCalledWith(
        setActiveSigner({
          safeAddress: mockActiveSafe.address,
          signer: signerB,
        }),
      )

      expect(mockDispatch).toHaveBeenCalledTimes(2)

      useAppDispatchSpy.mockRestore()
    })
  })

  describe('integration scenarios', () => {
    it('should work correctly with different safe addresses', () => {
      const mockDispatch = jest.fn()
      const useAppDispatchSpy = jest.spyOn(reduxHooks, 'useAppDispatch').mockReturnValue(mockDispatch)

      const safe1 = createMockActiveSafe()
      mockUseDefinedActiveSafe.mockReturnValue(safe1)

      const { result: result1 } = renderHook(() => useTxSignerActions())
      result1.current.setTxSigner(mockSigner)

      expect(mockDispatch).toHaveBeenCalledWith(
        setActiveSigner({
          safeAddress: safe1.address,
          signer: mockSigner,
        }),
      )

      const safe2 = createMockActiveSafe()
      mockUseDefinedActiveSafe.mockReturnValue(safe2)

      const { result: result2 } = renderHook(() => useTxSignerActions())
      result2.current.setTxSigner(mockSigner)

      expect(mockDispatch).toHaveBeenCalledWith(
        setActiveSigner({
          safeAddress: safe2.address,
          signer: mockSigner,
        }),
      )

      expect(mockDispatch).toHaveBeenCalledTimes(2)

      useAppDispatchSpy.mockRestore()
    })

    it('should handle signer with minimal data', () => {
      const mockDispatch = jest.fn()
      const useAppDispatchSpy = jest.spyOn(reduxHooks, 'useAppDispatch').mockReturnValue(mockDispatch)

      const minimalSigner: SignerInfo = {
        value: faker.finance.ethereumAddress() as `0x${string}`,
        name: null,
        logoUri: null,
      }

      const { result } = renderHook(() => useTxSignerActions())
      result.current.setTxSigner(minimalSigner)

      expect(mockDispatch).toHaveBeenCalledWith(
        setActiveSigner({
          safeAddress: mockActiveSafe.address,
          signer: minimalSigner,
        }),
      )

      useAppDispatchSpy.mockRestore()
    })

    it('should handle signer with complete data', () => {
      const mockDispatch = jest.fn()
      const useAppDispatchSpy = jest.spyOn(reduxHooks, 'useAppDispatch').mockReturnValue(mockDispatch)

      const completeSigner: SignerInfo = {
        value: faker.finance.ethereumAddress() as `0x${string}`,
        name: faker.person.fullName(),
        logoUri: faker.image.avatar(),
      }

      const { result } = renderHook(() => useTxSignerActions())
      result.current.setTxSigner(completeSigner)

      expect(mockDispatch).toHaveBeenCalledWith(
        setActiveSigner({
          safeAddress: mockActiveSafe.address,
          signer: completeSigner,
        }),
      )

      useAppDispatchSpy.mockRestore()
    })
  })

  describe('functional behavior', () => {
    it('should dispatch action that updates the Redux store', () => {
      const initialStore: Partial<RootState> = {
        activeSigner: {},
        signers: {},
      }

      const { result } = renderHook(() => useTxSignerActions(), initialStore)

      // This test validates the action works with real Redux store
      expect(() => {
        result.current.setTxSigner(mockSigner)
      }).not.toThrow()
    })

    it('should work with different safe contexts', () => {
      // Test that the hook properly uses the activeSafe context
      const safe1 = createMockActiveSafe()
      const safe2 = createMockActiveSafe()

      mockUseDefinedActiveSafe.mockReturnValue(safe1)
      const { result: result1 } = renderHook(() => useTxSignerActions())

      mockUseDefinedActiveSafe.mockReturnValue(safe2)
      const { result: result2 } = renderHook(() => useTxSignerActions())

      // Both should work without throwing
      expect(() => {
        result1.current.setTxSigner(mockSigner)
        result2.current.setTxSigner(mockSigner)
      }).not.toThrow()
    })

    it('should return new function reference when activeSafe changes', () => {
      const { result, rerender } = renderHook(() => useTxSignerActions())

      const firstSetTxSigner = result.current.setTxSigner

      // Change the activeSafe address
      const newActiveSafe = createMockActiveSafe()
      mockUseDefinedActiveSafe.mockReturnValue(newActiveSafe)

      rerender({})

      const secondSetTxSigner = result.current.setTxSigner

      // Should be different function reference due to changed dependency
      expect(firstSetTxSigner).not.toBe(secondSetTxSigner)
    })
  })
})
