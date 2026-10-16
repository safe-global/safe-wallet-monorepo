import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import * as gateway from '@safe-global/store/gateway'
import { renderHook } from '@/tests/test-utils'
import * as useChains from '@/hooks/useChains'
import * as useChainId from '@/hooks/useChainId'
import { chainBuilder } from '@/tests/builders/chains'
import { useIsAllowlistAvailableInSpace, useIsAllowlistEnabled } from '../useAllowlistAvailability'

const sepolia = chainBuilder()
  .with({ chainId: '11155111', features: [FEATURES.POLICY_RECIPIENT_ALLOWLIST] })
  .build()
const mainnetFlagged = chainBuilder()
  .with({ chainId: '1', features: [FEATURES.POLICY_RECIPIENT_ALLOWLIST] })
  .build()
const sepoliaOff = chainBuilder().with({ chainId: '11155111', features: [] }).build()
const mainnet = chainBuilder().with({ chainId: '1', features: [] }).build()

const mockChains = (configs: Chain[]) => jest.spyOn(useChains, 'default').mockReturnValue({ configs, loading: false })

describe('useIsAllowlistAvailableInSpace', () => {
  beforeEach(() => jest.restoreAllMocks())

  it('is true when at least one chain is enabled', () => {
    mockChains([mainnetFlagged, sepolia])
    expect(renderHook(() => useIsAllowlistAvailableInSpace()).result.current).toBe(true)
  })

  it('is false when the only flagged chain has no deployment', () => {
    mockChains([mainnetFlagged, sepoliaOff])
    expect(renderHook(() => useIsAllowlistAvailableInSpace()).result.current).toBe(false)
  })

  it('is false before chains load', () => {
    mockChains([])
    expect(renderHook(() => useIsAllowlistAvailableInSpace()).result.current).toBe(false)
  })
})

describe('useIsAllowlistEnabled', () => {
  beforeEach(() => jest.restoreAllMocks())

  it("reads the given chain, not the open Safe's chain", () => {
    jest.spyOn(useChainId, 'default').mockReturnValue(sepolia.chainId)
    jest.spyOn(gateway, 'useGetChainsConfigV2Query').mockReturnValue({
      data: {
        ids: [sepolia.chainId, mainnet.chainId],
        entities: { [sepolia.chainId]: sepolia, [mainnet.chainId]: mainnet },
      },
    } as unknown as ReturnType<typeof gateway.useGetChainsConfigV2Query>)
    expect(renderHook(() => useIsAllowlistEnabled(mainnet.chainId)).result.current).toBe(false)
    expect(renderHook(() => useIsAllowlistEnabled(sepolia.chainId)).result.current).toBe(true)
  })

  it('is false when the flag is off for that chain', () => {
    jest.spyOn(useChains, 'useChain').mockReturnValue(sepoliaOff)
    expect(renderHook(() => useIsAllowlistEnabled('11155111')).result.current).toBe(false)
  })
})
