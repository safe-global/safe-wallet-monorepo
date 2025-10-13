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

const mockChain: Chain = {
  chainId: '1',
  chainName: 'Ethereum',
  description: 'Ethereum Mainnet',
  l2: false,
  isTestnet: false,
  zk: false,
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    logoUri: '',
  },
  transactionService: 'https://safe-transaction-mainnet.safe.global',
  blockExplorerUriTemplate: {
    address: 'https://etherscan.io/address/{{address}}',
    txHash: 'https://etherscan.io/tx/{{txHash}}',
    api: 'https://api.etherscan.io/api?module={{module}}&action={{action}}&address={{address}}&apiKey={{apiKey}}',
  },
  beaconChainExplorerUriTemplate: {},
  disabledWallets: [],
  ensRegistryAddress: null,
  balancesProvider: {
    chainName: 'mainnet',
    enabled: true,
  },
  contractAddresses: {
    safeSingletonAddress: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
    safeProxyFactoryAddress: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
    multiSendAddress: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761',
    multiSendCallOnlyAddress: '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D',
    fallbackHandlerAddress: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
    signMessageLibAddress: '0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2',
    createCallAddress: '0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4',
    simulateTxAccessorAddress: '0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da',
    safeWebAuthnSignerFactoryAddress: null,
  },
  features: [],
  gasPrice: [],
  publicRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://ethereum.publicnode.com' },
  rpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://ethereum.publicnode.com' },
  safeAppsRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://ethereum.publicnode.com' },
  shortName: 'eth',
  theme: {
    backgroundColor: '#E8E7E6',
    textColor: '#001428',
  },
  recommendedMasterCopyVersion: '1.3.0',
}

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
