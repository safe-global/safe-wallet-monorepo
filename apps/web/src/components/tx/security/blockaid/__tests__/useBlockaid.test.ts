import * as useChains from '@/hooks/useChains'
import * as useWallet from '@/hooks/wallets/useWallet'
import { SecuritySeverity } from '@safe-global/utils/services/security/modules/types'
import { eip712TypedDataBuilder } from '@/tests/builders/messages'
import { safeTxBuilder } from '@/tests/builders/safeTx'
import { parseUnits, toBeHex } from 'ethers'
import { useBlockaid } from '../useBlockaid'
import {
  type AssetDiff,
  type TransactionScanResponse,
} from '@safe-global/utils/services/security/modules/BlockaidModule/types'
import { faker } from '@faker-js/faker/locale/af_ZA'
import useSafeInfo from '@/hooks/useSafeInfo'
import { safeInfoBuilder } from '@/tests/builders/safe'
import { renderHook, waitFor } from '@/tests/test-utils'
import { type SignerWallet } from '@/components/common/WalletProvider'
import { CLASSIFICATION_MAPPING, REASON_MAPPING } from '@safe-global/utils/components/tx/security/blockaid/utils'

const setupFetchStub = (data: any) => () => {
  return Promise.resolve({
    json: () => Promise.resolve(data),
    status: 200,
    ok: true,
  })
}

// Mock BLOCKAID_API
jest.mock('@safe-global/utils/config/constants', () => ({
  ...jest.requireActual('@safe-global/utils/config/constants'),
  BLOCKAID_CLIENT_ID: 'some-client-id',
}))

enum TEST_CASES {
  MESSAGE = 'EIP 712 Message',
  TRANSACTION = 'SafeTransaction',
}

jest.mock('@/hooks/useSafeInfo')

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>

describe.each([TEST_CASES.MESSAGE, TEST_CASES.TRANSACTION])('useBlockaid for %s', (testCase) => {
  let mockUseSigner: jest.SpyInstance<SignerWallet | null, []>

  const mockPayload = testCase === TEST_CASES.TRANSACTION ? safeTxBuilder().build() : eip712TypedDataBuilder().build()

  const mockSafeInfo = safeInfoBuilder().with({ chainId: '1' }).build()

  beforeEach(() => {
    jest.resetAllMocks()
    jest.useFakeTimers()
    mockUseSigner = jest.spyOn(useWallet, 'useSigner')
    mockUseSigner.mockImplementation(() => null)
    mockUseSafeInfo.mockReturnValue({
      safe: { ...mockSafeInfo, deployed: true },
      safeAddress: mockSafeInfo.address.value,
      safeLoaded: true,
      safeLoading: false,
    })

    global.fetch = jest.fn()
  })

  it('should return undefined without data', async () => {
    const { result } = renderHook(() => useBlockaid(undefined))

    await waitFor(() => {
      expect(result.current[0]).toBeUndefined()
      expect(result.current[1]).toBeUndefined()
      expect(result.current[2]).toBeFalsy()
    })
  })

  it('should return undefined without connected wallet', async () => {
    const { result } = renderHook(() => useBlockaid(mockPayload))

    await waitFor(() => {
      expect(result.current[0]).toBeUndefined()
      expect(result.current[1]).toBeUndefined()
      expect(result.current[2]).toBeFalsy()
    })
  })

  it('should return undefined without feature enabled', async () => {
    const walletAddress = toBeHex('0x1', 20)

    mockUseSigner.mockImplementation(() => ({
      address: walletAddress,
      chainId: '1',
      label: 'Testwallet',
      provider: {} as any,
    }))

    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)

    const { result } = renderHook(() => useBlockaid(mockPayload))

    await waitFor(() => {
      expect(result.current[0]).toBeUndefined()
      expect(result.current[1]).toEqual(undefined)
      expect(result.current[2]).toBeFalsy()
    })
  })

  it('should handle request errors', async () => {
    const walletAddress = toBeHex('0x1', 20)

    mockUseSigner.mockImplementation(() => ({
      address: walletAddress,
      chainId: '1',
      label: 'Testwallet',
      provider: {} as any,
    }))

    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)

    const mockFetch = jest.spyOn(global, 'fetch')
    mockFetch.mockImplementation(() => Promise.reject({ message: '403 not authorized' }))

    const { result } = renderHook(() => useBlockaid(mockPayload))

    await waitFor(() => {
      expect(result.current[0]).toBeUndefined()
      expect(result.current[1]).toEqual(new Error('Unavailable'))
      expect(result.current[2]).toBeFalsy()
    })
  })

  it('should handle failed simulations', async () => {
    const walletAddress = toBeHex('0x1', 20)

    mockUseSigner.mockImplementation(() => ({
      address: walletAddress,
      chainId: '1',
      label: 'Testwallet',
      provider: {} as any,
    }))

    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)

    const mockBlockaidResponse: TransactionScanResponse = {
      chain: '1',
      block: faker.number.int().toString(),
      simulation: {
        status: 'Error',
        error: 'Simulation failed: GS13',
      },
      validation: {
        status: 'Success',
        features: [],
        result_type: 'Benign',
        classification: '',
        description: '',
        reason: '',
      },
    }

    global.fetch = jest.fn().mockImplementation(setupFetchStub(mockBlockaidResponse))

    const { result } = renderHook(() => useBlockaid(mockPayload))

    await waitFor(() => {
      expect(result.current[0]).toBeDefined()
      expect(result.current[1]).toEqual(new Error('Simulation failed'))
      expect(result.current[2]).toBeFalsy()
    })
  })

  it('should return the redefine issues and balance change', async () => {
    const walletAddress = toBeHex('0x1', 20)

    const accountDiff = {
      asset: {
        address: faker.finance.ethereumAddress(),
        decimals: 18,
        type: 'ERC20',
        name: 'Safe Token',
        symbol: 'SAFE',
      },
      out: [
        {
          raw_value: parseUnits('1', 18).toString(),
          value: '1',
        },
      ],
      in: [],
    } as AssetDiff

    const mockBlockaidResponse: TransactionScanResponse = {
      chain: '1',
      block: faker.number.int().toString(),
      simulation: {
        status: 'Success',
        assets_diffs: {
          [mockSafeInfo.address.value]: [accountDiff],
        },
        account_summary: {
          assets_diffs: [accountDiff],
          exposures: [],
          total_usd_diff: {
            in: '0',
            out: '0',
            total: '0',
          },
          total_usd_exposure: {},
        },
        address_details: {},
        exposures: {},
        total_usd_diff: {},
        total_usd_exposure: {},
      },
      validation: {
        status: 'Success',
        features: [],
        result_type: 'Malicious',
        classification: Object.keys(CLASSIFICATION_MAPPING)[0],
        description: 'Malicious tx detected',
        reason: Object.keys(REASON_MAPPING)[0],
      },
    }

    mockUseSigner.mockImplementation(() => ({
      address: walletAddress,
      chainId: '1',
      label: 'Testwallet',
      provider: {} as any,
    }))

    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)

    global.fetch = jest.fn().mockImplementation(setupFetchStub(mockBlockaidResponse))

    const mockFetch = jest.spyOn(global, 'fetch')
    const { result } = renderHook(() => useBlockaid(mockPayload))

    await waitFor(() => {
      expect(result.current[1]).toBeUndefined()
      expect(result.current[0]).toBeDefined()
      const response = result.current[0]
      expect(response?.severity).toEqual(SecuritySeverity.HIGH)
      expect(response?.payload?.issues).toHaveLength(0)
      expect(response?.payload?.balanceChange[0]).toEqual(accountDiff)
      expect(result.current[2]).toBeFalsy()
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })
})
