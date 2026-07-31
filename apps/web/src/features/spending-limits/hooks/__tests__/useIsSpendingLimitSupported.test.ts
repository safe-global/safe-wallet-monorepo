import { renderHook } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import { getAllowanceModuleDeployment } from '@safe-global/safe-modules-deployments'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as useChainId from '@/hooks/useChainId'
import useIsSpendingLimitSupported from '../useIsSpendingLimitSupported'

// A chain that has the AllowanceModule registered in @safe-global/safe-modules-deployments
const SUPPORTED_CHAIN_ID = '11155111' // Sepolia
// A chain that does NOT have the AllowanceModule registered yet
const UNSUPPORTED_CHAIN_ID = '42161' // Arbitrum One

// The CREATE2 address the deployment package falls back to for unregistered chains
const FALLBACK_MODULE_ADDRESS = Object.values(
  getAllowanceModuleDeployment({ version: '0.1.0' })!.networkAddresses,
)[0] as string

const mockSafeInfo = ({
  chainId,
  modules,
  deployed = true,
}: {
  chainId: string
  modules: Array<{ value: string }> | null
  deployed?: boolean
}) => {
  jest.spyOn(useChainId, 'default').mockReturnValue(chainId)
  jest.spyOn(useSafeInfo, 'default').mockReturnValue({
    safe: {
      address: { value: faker.finance.ethereumAddress() },
      chainId,
      modules,
      deployed,
      txHistoryTag: '0',
    },
    safeAddress: faker.finance.ethereumAddress(),
    safeLoaded: true,
    safeLoading: false,
    safeError: undefined,
  } as any)
}

describe('useIsSpendingLimitSupported', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns true on a chain with a registered deployment', () => {
    mockSafeInfo({ chainId: SUPPORTED_CHAIN_ID, modules: null })

    const { result } = renderHook(() => useIsSpendingLimitSupported())

    expect(result.current).toBe(true)
  })

  it('returns false on a chain without a registered deployment and no enabled module', () => {
    mockSafeInfo({ chainId: UNSUPPORTED_CHAIN_ID, modules: null })

    const { result } = renderHook(() => useIsSpendingLimitSupported())

    expect(result.current).toBe(false)
  })

  it('returns false when an unrelated module is enabled on an unsupported chain', () => {
    mockSafeInfo({ chainId: UNSUPPORTED_CHAIN_ID, modules: [{ value: faker.finance.ethereumAddress() }] })

    const { result } = renderHook(() => useIsSpendingLimitSupported())

    expect(result.current).toBe(false)
  })

  it('returns true when the AllowanceModule is already enabled on an unsupported chain', () => {
    mockSafeInfo({ chainId: UNSUPPORTED_CHAIN_ID, modules: [{ value: FALLBACK_MODULE_ADDRESS }] })

    const { result } = renderHook(() => useIsSpendingLimitSupported())

    expect(result.current).toBe(true)
  })
})
