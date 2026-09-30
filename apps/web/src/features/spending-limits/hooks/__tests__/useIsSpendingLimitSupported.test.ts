import { renderHook } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import { getAllowanceModuleDeployment } from '@safe-global/safe-modules-deployments'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as useChainId from '@/hooks/useChainId'
import { addressExBuilder, extendedSafeInfoBuilder } from '@/tests/builders/safe'
import useIsSpendingLimitSupported from '../useIsSpendingLimitSupported'

// A chain that has the AllowanceModule registered in @safe-global/safe-modules-deployments
const SUPPORTED_CHAIN_ID = '11155111' // Sepolia
// Not a real chain: deployment bumps keep registering new networks, so any real id we
// pick as "unsupported" eventually becomes supported and breaks these assertions.
const UNSUPPORTED_CHAIN_ID = '999999999999'

// The CREATE2 address the deployment package falls back to for unregistered chains
const FALLBACK_MODULE_ADDRESS = Object.values(
  getAllowanceModuleDeployment({ version: '0.1.0' })!.networkAddresses,
)[0] as string

const mockSafeInfo = ({
  chainId,
  moduleAddresses = null,
  deployed = true,
}: {
  chainId: string
  moduleAddresses?: string[] | null
  deployed?: boolean
}) => {
  jest.spyOn(useChainId, 'default').mockReturnValue(chainId)

  const modules = moduleAddresses?.map((value) => addressExBuilder().with({ value }).build()) ?? null
  const safe = extendedSafeInfoBuilder().with({ chainId, modules, deployed }).build()

  const safeInfo: ReturnType<typeof useSafeInfo.default> = {
    safe,
    safeAddress: safe.address.value,
    safeLoaded: true,
    safeLoading: false,
    safeError: undefined,
  }

  jest.spyOn(useSafeInfo, 'default').mockReturnValue(safeInfo)
}

describe('useIsSpendingLimitSupported', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns true on a chain with a registered deployment', () => {
    mockSafeInfo({ chainId: SUPPORTED_CHAIN_ID })

    const { result } = renderHook(() => useIsSpendingLimitSupported())

    expect(result.current).toBe(true)
  })

  it('returns false on a chain without a registered deployment and no enabled module', () => {
    mockSafeInfo({ chainId: UNSUPPORTED_CHAIN_ID })

    const { result } = renderHook(() => useIsSpendingLimitSupported())

    expect(result.current).toBe(false)
  })

  it('returns false when an unrelated module is enabled on an unsupported chain', () => {
    mockSafeInfo({ chainId: UNSUPPORTED_CHAIN_ID, moduleAddresses: [faker.finance.ethereumAddress()] })

    const { result } = renderHook(() => useIsSpendingLimitSupported())

    expect(result.current).toBe(false)
  })

  it('returns true when the AllowanceModule is already enabled on an unsupported chain', () => {
    mockSafeInfo({ chainId: UNSUPPORTED_CHAIN_ID, moduleAddresses: [FALLBACK_MODULE_ADDRESS] })

    const { result } = renderHook(() => useIsSpendingLimitSupported())

    expect(result.current).toBe(true)
  })
})
