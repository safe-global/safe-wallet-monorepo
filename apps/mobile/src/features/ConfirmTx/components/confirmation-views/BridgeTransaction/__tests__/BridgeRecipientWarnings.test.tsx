/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import config from '@/src/theme/tamagui.config'
import { BridgeRecipientWarnings } from '../BridgeRecipientWarnings'
import { BridgeWarnings } from '@safe-global/utils/components/confirmation-views/BridgeTransaction/BridgeWarnings'
import { BridgeAndSwapTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { faker } from '@faker-js/faker'

// Mock the RTK Query hook
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/safes', () => ({
  useSafesGetSafeV1Query: jest.fn(),
}))

// Mock the hooks and selectors
jest.mock('@/src/store/hooks/activeSafe', () => ({
  useDefinedActiveSafe: jest.fn(),
}))

jest.mock('@/src/store/hooks', () => ({
  useAppSelector: jest.fn(),
}))

const { useSafesGetSafeV1Query } = require('@safe-global/store/gateway/AUTO_GENERATED/safes')
const { useDefinedActiveSafe } = require('@/src/store/hooks/activeSafe')
const { useAppSelector } = require('@/src/store/hooks')

// Helper to wrap component with required providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(<TamaguiProvider config={config}>{ui}</TamaguiProvider>)
}

const mockActiveSafe = {
  address: faker.finance.ethereumAddress() as `0x${string}`,
  chainId: '1',
}

const mockTxInfo: BridgeAndSwapTransactionInfo = {
  type: 'SwapAndBridge',
  humanDescription: null,
  fromToken: {
    address: '0x0000000000000000000000000000000000000000',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    logoUri: '',
    trusted: true,
  },
  recipient: { value: mockActiveSafe.address },
  explorerUrl: null,
  status: 'PENDING',
  substatus: 'WAIT_SOURCE_CONFIRMATIONS',
  fees: null,
  fromAmount: '1000000000000000000',
  toChain: '100', // Gnosis Chain
  toToken: null,
  toAmount: null,
}

describe('BridgeRecipientWarnings', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    useDefinedActiveSafe.mockReturnValue(mockActiveSafe)

    useSafesGetSafeV1Query.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isError: false,
      isSuccess: false,
      isFetching: false,
      refetch: jest.fn(),
    })

    // Mock default state
    useAppSelector.mockImplementation((selector: any) => {
      // Mock selectAllChains to return supported chains
      if (selector.toString().includes('selectAllChains')) {
        return [
          { chainId: '1', chainName: 'Ethereum' },
          { chainId: '100', chainName: 'Gnosis Chain' },
        ]
      }
      // Mock selectSafeInfo to return safe info
      if (selector.toString().includes('selectSafeInfo')) {
        return {
          [mockActiveSafe.chainId]: {
            address: { value: mockActiveSafe.address },
            chainId: mockActiveSafe.chainId,
            threshold: 2,
            owners: [{ value: faker.finance.ethereumAddress() }, { value: faker.finance.ethereumAddress() }],
            fiatTotal: '0',
            queued: 0,
            awaitingConfirmation: null,
          },
        }
      }
      // Mock selectContactByAddress to return null (no contact)
      if (selector.toString().includes('selectContactByAddress')) {
        return null
      }
      return null
    })
  })

  it('should export bridge warnings constants', () => {
    expect(BridgeWarnings.DIFFERENT_SETUP).toBeDefined()
    expect(BridgeWarnings.NO_MULTICHAIN_SUPPORT).toBeDefined()
    expect(BridgeWarnings.SAFE_NOT_DEPLOYED).toBeDefined()
    expect(BridgeWarnings.DIFFERENT_ADDRESS).toBeDefined()
    expect(BridgeWarnings.UNKNOWN_CHAIN).toBeDefined()

    expect(BridgeWarnings.DIFFERENT_SETUP.title).toBe('Different Safe setup on target chain')
    expect(BridgeWarnings.DIFFERENT_SETUP.severity).toBe('warning')
  })

  it('should render component without crashing when no warning is needed', () => {
    // Mock that safe exists with same setup
    useSafesGetSafeV1Query.mockReturnValue({
      data: {
        address: { value: mockActiveSafe.address },
        chainId: '100',
        threshold: 2,
        owners: [{ value: faker.finance.ethereumAddress() }, { value: faker.finance.ethereumAddress() }],
        fiatTotal: '0',
        queued: 0,
        awaitingConfirmation: null,
      },
      error: undefined,
      isLoading: false,
      isError: false,
      isSuccess: true,
      isFetching: false,
      refetch: jest.fn(),
    })

    renderWithProviders(<BridgeRecipientWarnings txInfo={mockTxInfo} />)

    // Component should render without any warnings
    expect(screen.queryByText('Different Safe setup on target chain')).not.toBeOnTheScreen()
  })

  it('should show warning when bridging to different address not in address book', () => {
    const differentAddressTxInfo = {
      ...mockTxInfo,
      recipient: { value: faker.finance.ethereumAddress() },
    }

    renderWithProviders(<BridgeRecipientWarnings txInfo={differentAddressTxInfo} />)

    expect(screen.getByText('Unknown address')).toBeOnTheScreen()
    expect(screen.getByText(BridgeWarnings.DIFFERENT_ADDRESS.description)).toBeOnTheScreen()
  })

  it('should show error when bridging to unsupported chain', () => {
    const unsupportedChainTxInfo = {
      ...mockTxInfo,
      toChain: '999', // Unsupported chain
    }

    // Mock that the chain is not supported
    useAppSelector.mockImplementation((selector: any) => {
      if (selector.toString().includes('selectAllChains')) {
        return [
          { chainId: '1', chainName: 'Ethereum' },
          { chainId: '100', chainName: 'Gnosis Chain' },
        ]
        // Note: chain 999 is not in this list
      }
      if (selector.toString().includes('selectSafeInfo')) {
        return {
          [mockActiveSafe.chainId]: {
            address: { value: mockActiveSafe.address },
            chainId: mockActiveSafe.chainId,
            threshold: 2,
            owners: [{ value: faker.finance.ethereumAddress() }, { value: faker.finance.ethereumAddress() }],
            fiatTotal: '0',
            queued: 0,
            awaitingConfirmation: null,
          },
        }
      }
      if (selector.toString().includes('selectContactByAddress')) {
        return null
      }
      return null
    })

    renderWithProviders(<BridgeRecipientWarnings txInfo={unsupportedChainTxInfo} />)

    expect(screen.getByText('The target network is not supported')).toBeOnTheScreen()
    expect(screen.getByText(BridgeWarnings.UNKNOWN_CHAIN.description)).toBeOnTheScreen()
  })

  it('should show warnings correctly when Safe data is unavailable', () => {
    useSafesGetSafeV1Query.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isError: false,
      isSuccess: true,
      isFetching: false,
      refetch: jest.fn(),
    })

    renderWithProviders(<BridgeRecipientWarnings txInfo={mockTxInfo} />)

    // When safe data is unavailable and chains are not properly loaded,
    // the component should show some warning (either unsupported chain or safe not deployed)
    const warningElement = screen.getByTestId(/bridge-warning-/i)
    expect(warningElement).toBeOnTheScreen()
  })
})
