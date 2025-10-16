import { faker } from '@faker-js/faker'
import { renderHook, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import React from 'react'

// Mock ethers provider
const mockGetBalance = jest.fn()
jest.mock('@/src/services/web3', () => ({
  createWeb3ReadOnly: jest.fn(() => ({
    getBalance: mockGetBalance,
  })),
}))

import { makeStore } from '@/src/store'
import { useExecutionFunds } from './useExecutionFunds'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { mockedChains } from '@/src/store/constants'

const mockChain = mockedChains[0] as unknown as Chain

describe('useExecutionFunds', () => {
  const mockSignerAddress = faker.finance.ethereumAddress() as `0x${string}`
  const totalFeeRaw = BigInt('1000000000000000000') // 1 ETH
  let store: ReturnType<typeof makeStore>

  beforeEach(() => {
    jest.clearAllMocks()
    store = makeStore()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>

  describe('WITH_RELAY execution method', () => {
    it('should return hasSufficientFunds as true when using relay', () => {
      const { result } = renderHook(
        () =>
          useExecutionFunds({
            signerAddress: mockSignerAddress,
            totalFeeRaw,
            executionMethod: ExecutionMethod.WITH_RELAY,
            chain: mockChain,
          }),
        { wrapper },
      )

      expect(result.current.hasSufficientFunds).toBe(true)
      expect(result.current.isCheckingFunds).toBe(false)
    })

    it('should skip balance check when using relay', () => {
      renderHook(
        () =>
          useExecutionFunds({
            signerAddress: mockSignerAddress,
            totalFeeRaw,
            executionMethod: ExecutionMethod.WITH_RELAY,
            chain: mockChain,
          }),
        { wrapper },
      )

      // Should not call getBalance when using relay
      expect(mockGetBalance).not.toHaveBeenCalled()
    })
  })

  describe('WITH_PK execution method', () => {
    it('should return hasSufficientFunds as true when balance is sufficient', async () => {
      const sufficientBalance = BigInt('2000000000000000000') // 2 ETH
      mockGetBalance.mockResolvedValue(sufficientBalance)

      const { result } = renderHook(
        () =>
          useExecutionFunds({
            signerAddress: mockSignerAddress,
            totalFeeRaw,
            executionMethod: ExecutionMethod.WITH_PK,
            chain: mockChain,
          }),
        { wrapper },
      )

      await waitFor(() => expect(result.current.isCheckingFunds).toBe(false))

      expect(result.current.hasSufficientFunds).toBe(true)
      expect(result.current.signerBalance).toBe(sufficientBalance)
    })

    it('should return hasSufficientFunds as false when balance is insufficient', async () => {
      const insufficientBalance = BigInt('500000000000000000') // 0.5 ETH
      mockGetBalance.mockResolvedValue(insufficientBalance)

      const { result } = renderHook(
        () =>
          useExecutionFunds({
            signerAddress: mockSignerAddress,
            totalFeeRaw,
            executionMethod: ExecutionMethod.WITH_PK,
            chain: mockChain,
          }),
        { wrapper },
      )

      await waitFor(() => expect(result.current.isCheckingFunds).toBe(false))

      expect(result.current.hasSufficientFunds).toBe(false)
      expect(result.current.signerBalance).toBe(insufficientBalance)
    })

    it('should return hasSufficientFunds as true when balance equals fee', async () => {
      const exactBalance = totalFeeRaw
      mockGetBalance.mockResolvedValue(exactBalance)

      const { result } = renderHook(
        () =>
          useExecutionFunds({
            signerAddress: mockSignerAddress,
            totalFeeRaw,
            executionMethod: ExecutionMethod.WITH_PK,
            chain: mockChain,
          }),
        { wrapper },
      )

      await waitFor(() => expect(result.current.isCheckingFunds).toBe(false))

      expect(result.current.hasSufficientFunds).toBe(true)
    })

    it('should set isCheckingFunds to true while loading', () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      mockGetBalance.mockImplementation(() => new Promise(() => {})) // Never resolves

      const { result } = renderHook(
        () =>
          useExecutionFunds({
            signerAddress: mockSignerAddress,
            totalFeeRaw,
            executionMethod: ExecutionMethod.WITH_PK,
            chain: mockChain,
          }),
        { wrapper },
      )

      expect(result.current.isCheckingFunds).toBe(true)
      expect(result.current.hasSufficientFunds).toBe(true) // Assume sufficient until we know otherwise
    })

    it('should handle zero fee correctly', async () => {
      mockGetBalance.mockResolvedValue(BigInt('0'))

      const { result } = renderHook(
        () =>
          useExecutionFunds({
            signerAddress: mockSignerAddress,
            totalFeeRaw: BigInt('0'),
            executionMethod: ExecutionMethod.WITH_PK,
            chain: mockChain,
          }),
        { wrapper },
      )

      await waitFor(() => expect(result.current.isCheckingFunds).toBe(false))

      expect(result.current.hasSufficientFunds).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should skip balance check when signer address is not provided', () => {
      const { result } = renderHook(
        () =>
          useExecutionFunds({
            signerAddress: undefined,
            totalFeeRaw,
            executionMethod: ExecutionMethod.WITH_PK,
            chain: mockChain,
          }),
        { wrapper },
      )

      expect(result.current.hasSufficientFunds).toBe(true)
      expect(result.current.isCheckingFunds).toBe(false)
      expect(mockGetBalance).not.toHaveBeenCalled()
    })

    it('should skip balance check when chain is not provided', () => {
      const { result } = renderHook(
        () =>
          useExecutionFunds({
            signerAddress: mockSignerAddress,
            totalFeeRaw,
            executionMethod: ExecutionMethod.WITH_PK,
            chain: undefined,
          }),
        { wrapper },
      )

      expect(result.current.hasSufficientFunds).toBe(true)
      expect(result.current.isCheckingFunds).toBe(false)
      expect(mockGetBalance).not.toHaveBeenCalled()
    })
  })
})
