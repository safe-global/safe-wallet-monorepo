import { renderHook } from '@/tests/test-utils'
import { useHasDefaultChainFeature } from '../useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useGetChainsConfigV2Query } from '@safe-global/store/gateway'
import { DEFAULT_CHAIN_ID } from '@/config/constants'

jest.mock('@safe-global/store/gateway')

describe('useHasDefaultChainFeature', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns true when the default chain has the feature enabled', () => {
    jest.mocked(useGetChainsConfigV2Query).mockReturnValue({
      data: {
        ids: [String(DEFAULT_CHAIN_ID)],
        entities: {
          [String(DEFAULT_CHAIN_ID)]: {
            chainId: String(DEFAULT_CHAIN_ID),
            chainName: 'Ethereum',
            isTestnet: false,
            features: ['DISABLE_SPACES_LOGIN'],
          },
        },
      },
    } as never)

    const { result } = renderHook(() => useHasDefaultChainFeature(FEATURES.DISABLE_SPACES_LOGIN))
    expect(result.current).toBe(true)
  })

  it('returns false when the default chain does not have the feature', () => {
    jest.mocked(useGetChainsConfigV2Query).mockReturnValue({
      data: {
        ids: [String(DEFAULT_CHAIN_ID)],
        entities: {
          [String(DEFAULT_CHAIN_ID)]: {
            chainId: String(DEFAULT_CHAIN_ID),
            chainName: 'Ethereum',
            isTestnet: false,
            features: ['SPACES'],
          },
        },
      },
    } as never)

    const { result } = renderHook(() => useHasDefaultChainFeature(FEATURES.DISABLE_SPACES_LOGIN))
    expect(result.current).toBe(false)
  })

  it('returns undefined when chains have not loaded', () => {
    jest.mocked(useGetChainsConfigV2Query).mockReturnValue({
      data: undefined,
    } as never)

    const { result } = renderHook(() => useHasDefaultChainFeature(FEATURES.DISABLE_SPACES_LOGIN))
    expect(result.current).toBeUndefined()
  })

  it('looks up DEFAULT_CHAIN_ID regardless of the user current chain', () => {
    const useGetChainsConfigV2QueryMock = jest.mocked(useGetChainsConfigV2Query)
    useGetChainsConfigV2QueryMock.mockReturnValue({
      data: {
        ids: [String(DEFAULT_CHAIN_ID)],
        entities: {
          [String(DEFAULT_CHAIN_ID)]: {
            chainId: String(DEFAULT_CHAIN_ID),
            chainName: 'Ethereum',
            isTestnet: false,
            features: [],
          },
        },
      },
    } as never)

    renderHook(() => useHasDefaultChainFeature(FEATURES.DISABLE_CLASSIC_UI))

    expect(useGetChainsConfigV2QueryMock).toHaveBeenCalledWith('WALLET_WEB')
  })
})
