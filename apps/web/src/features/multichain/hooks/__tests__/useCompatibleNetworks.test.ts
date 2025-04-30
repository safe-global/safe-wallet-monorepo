import { renderHook } from '@/tests/test-utils'
import { useCompatibleNetworks } from '../useCompatibleNetworks'
import { type ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'
import { faker } from '@faker-js/faker'
import { EMPTY_DATA, ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { ECOSYSTEM_ID_ADDRESS } from '@/config/constants'
import { chainBuilder } from '@/tests/builders/chains'
import {
  getSafeSingletonDeployments,
  getSafeL2SingletonDeployments,
  getProxyFactoryDeployments,
  getCompatibilityFallbackHandlerDeployments,
} from '@safe-global/safe-deployments'
import * as useChains from '@/hooks/useChains'

const L1_111_MASTERCOPY_DEPLOYMENTS = getSafeSingletonDeployments({ version: '1.1.1' })?.deployments
const L1_130_MASTERCOPY_DEPLOYMENTS = getSafeSingletonDeployments({ version: '1.3.0' })?.deployments
const L1_141_MASTERCOPY_DEPLOYMENTS = getSafeSingletonDeployments({ version: '1.4.1' })?.deployments

const L2_130_MASTERCOPY_DEPLOYMENTS = getSafeL2SingletonDeployments({ version: '1.3.0' })?.deployments
const L2_141_MASTERCOPY_DEPLOYMENTS = getSafeL2SingletonDeployments({ version: '1.4.1' })?.deployments

const PROXY_FACTORY_111_DEPLOYMENTS = getProxyFactoryDeployments({ version: '1.1.1' })?.deployments
const PROXY_FACTORY_130_DEPLOYMENTS = getProxyFactoryDeployments({ version: '1.3.0' })?.deployments
const PROXY_FACTORY_141_DEPLOYMENTS = getProxyFactoryDeployments({ version: '1.4.1' })?.deployments

const FALLBACK_HANDLER_130_DEPLOYMENTS = getCompatibilityFallbackHandlerDeployments({ version: '1.3.0' })?.deployments
const FALLBACK_HANDLER_141_DEPLOYMENTS = getCompatibilityFallbackHandlerDeployments({ version: '1.4.1' })?.deployments

describe('useCompatibleNetworks', () => {
  beforeAll(() => {
    jest.spyOn(useChains, 'default').mockReturnValue({
      configs: [
        chainBuilder().with({ chainId: '1', l2: false }).build(),
        chainBuilder().with({ chainId: '10', l2: true }).build(), // This has the eip155 and then the canonical addresses
        chainBuilder().with({ chainId: '100', l2: true }).build(), // This has the canonical and then the eip155 addresses
        chainBuilder().with({ chainId: '324', l2: true }).build(), // ZkSync has different addresses for all versions
        chainBuilder().with({ chainId: '480', l2: true }).build(), // Worldchain has 1.4.1 but not 1.1.1
        chainBuilder().with({ chainId: '10200', l2: true }).build(), // Gnosis Chiado has no migration contracts
      ],
    })
  })

  it('should return empty list without any creation data', () => {
    const { result } = renderHook(() => useCompatibleNetworks(undefined))
    expect(result.current).toHaveLength(0)
  })

  it('should set available to false for unknown contracts', () => {
    const callData = {
      owners: [faker.finance.ethereumAddress()],
      threshold: 1,
      to: ZERO_ADDRESS,
      data: EMPTY_DATA,
      fallbackHandler: faker.finance.ethereumAddress(),
      paymentToken: ZERO_ADDRESS,
      payment: 0,
      paymentReceiver: ECOSYSTEM_ID_ADDRESS,
    }

    const creationData: ReplayedSafeProps = {
      factoryAddress: faker.finance.ethereumAddress(),
      masterCopy: faker.finance.ethereumAddress(),
      saltNonce: '0',
      safeAccountConfig: callData,
      safeVersion: '1.4.1',
    }
    const { result } = renderHook(() => useCompatibleNetworks(creationData))
    expect(result.current.every((config) => config.available)).toEqual(false)
  })

  it('should set everything to available except zkSync and GnosisChain Chiado for 1.4.1 Safes', () => {
    const callData = {
      owners: [faker.finance.ethereumAddress()],
      threshold: 1,
      to: ZERO_ADDRESS,
      data: EMPTY_DATA,
      fallbackHandler: FALLBACK_HANDLER_141_DEPLOYMENTS?.canonical?.address!,
      paymentToken: ZERO_ADDRESS,
      payment: 0,
      paymentReceiver: ECOSYSTEM_ID_ADDRESS,
    }
    {
      const creationData: ReplayedSafeProps = {
        factoryAddress: PROXY_FACTORY_141_DEPLOYMENTS?.canonical?.address!,
        masterCopy: L1_141_MASTERCOPY_DEPLOYMENTS?.canonical?.address!,
        saltNonce: '0',
        safeAccountConfig: callData,
        safeVersion: '1.4.1',
      }
      const { result } = renderHook(() => useCompatibleNetworks(creationData))
      expect(result.current).toHaveLength(6)
      expect(result.current.map((chain) => chain.chainId)).toEqual(['1', '10', '100', '324', '480', '10200'])
      expect(result.current.map((chain) => chain.available)).toEqual([true, true, true, false, true, false])
    }

    {
      const creationData: ReplayedSafeProps = {
        factoryAddress: PROXY_FACTORY_141_DEPLOYMENTS?.canonical?.address!,
        masterCopy: L2_141_MASTERCOPY_DEPLOYMENTS?.canonical?.address!,
        saltNonce: '0',
        safeAccountConfig: callData,
        safeVersion: '1.4.1',
      }
      const { result } = renderHook(() => useCompatibleNetworks(creationData))
      expect(result.current).toHaveLength(6)
      expect(result.current.map((chain) => chain.chainId)).toEqual(['1', '10', '100', '324', '480', '10200'])
      expect(result.current.map((chain) => chain.available)).toEqual([true, true, true, false, true, false])
    }
  })

  it('should mark compatible chains as available', () => {
    const callData = {
      owners: [faker.finance.ethereumAddress()],
      threshold: 1,
      to: ZERO_ADDRESS,
      data: EMPTY_DATA,
      fallbackHandler: ZERO_ADDRESS,
      paymentToken: ZERO_ADDRESS,
      payment: 0,
      paymentReceiver: ECOSYSTEM_ID_ADDRESS,
    }

    // 1.3.0, L1 and canonical, not available on Chiado as no migration exists
    {
      const creationData: ReplayedSafeProps = {
        factoryAddress: PROXY_FACTORY_130_DEPLOYMENTS?.canonical?.address!,
        masterCopy: L1_130_MASTERCOPY_DEPLOYMENTS?.canonical?.address!,
        saltNonce: '0',
        safeAccountConfig: { ...callData, fallbackHandler: FALLBACK_HANDLER_130_DEPLOYMENTS?.canonical?.address! },
        safeVersion: '1.3.0',
      }
      const { result } = renderHook(() => useCompatibleNetworks(creationData))
      expect(result.current).toHaveLength(6)
      expect(result.current.map((chain) => chain.chainId)).toEqual(['1', '10', '100', '324', '480', '10200'])
      expect(result.current.map((chain) => chain.available)).toEqual([true, true, true, false, true, false])
    }

    // 1.3.0, L2 and canonical
    {
      const creationData: ReplayedSafeProps = {
        factoryAddress: PROXY_FACTORY_130_DEPLOYMENTS?.canonical?.address!,
        masterCopy: L2_130_MASTERCOPY_DEPLOYMENTS?.canonical?.address!,
        saltNonce: '0',
        safeAccountConfig: { ...callData, fallbackHandler: FALLBACK_HANDLER_130_DEPLOYMENTS?.canonical?.address! },
        safeVersion: '1.3.0',
      }
      const { result } = renderHook(() => useCompatibleNetworks(creationData))
      expect(result.current).toHaveLength(6)
      expect(result.current.map((chain) => chain.chainId)).toEqual(['1', '10', '100', '324', '480', '10200'])
      expect(result.current.map((chain) => chain.available)).toEqual([true, true, true, false, true, true])
    }

    // 1.3.0, L1 and EIP155 is not available on Worldchain and Chiado
    {
      const creationData: ReplayedSafeProps = {
        factoryAddress: PROXY_FACTORY_130_DEPLOYMENTS?.eip155?.address!,
        masterCopy: L1_130_MASTERCOPY_DEPLOYMENTS?.eip155?.address!,
        saltNonce: '0',
        safeAccountConfig: { ...callData, fallbackHandler: FALLBACK_HANDLER_130_DEPLOYMENTS?.eip155?.address! },
        safeVersion: '1.3.0',
      }
      const { result } = renderHook(() => useCompatibleNetworks(creationData))
      expect(result.current).toHaveLength(6)
      expect(result.current.map((chain) => chain.chainId)).toEqual(['1', '10', '100', '324', '480', '10200'])
      expect(result.current.map((chain) => chain.available)).toEqual([true, true, true, false, true, false])
    }

    // 1.3.0, L2 and EIP155
    {
      const creationData: ReplayedSafeProps = {
        factoryAddress: PROXY_FACTORY_130_DEPLOYMENTS?.eip155?.address!,
        masterCopy: L2_130_MASTERCOPY_DEPLOYMENTS?.eip155?.address!,
        saltNonce: '0',
        safeAccountConfig: { ...callData, fallbackHandler: FALLBACK_HANDLER_130_DEPLOYMENTS?.eip155?.address! },
        safeVersion: '1.3.0',
      }
      const { result } = renderHook(() => useCompatibleNetworks(creationData))
      expect(result.current).toHaveLength(6)
      expect(result.current.map((chain) => chain.chainId)).toEqual(['1', '10', '100', '324', '480', '10200'])
      expect(result.current.map((chain) => chain.available)).toEqual([true, true, true, false, true, false])
    }
  })

  it('should set everything to not available for 1.1.1 Safes', () => {
    const callData = {
      owners: [faker.finance.ethereumAddress()],
      threshold: 1,
      to: ZERO_ADDRESS,
      data: EMPTY_DATA,
      fallbackHandler: faker.finance.ethereumAddress(),
      paymentToken: ZERO_ADDRESS,
      payment: 0,
      paymentReceiver: ECOSYSTEM_ID_ADDRESS,
    }

    const creationData: ReplayedSafeProps = {
      factoryAddress: PROXY_FACTORY_111_DEPLOYMENTS?.canonical?.address!,
      masterCopy: L1_111_MASTERCOPY_DEPLOYMENTS?.canonical?.address!,
      saltNonce: '0',
      safeAccountConfig: callData,
      safeVersion: '1.1.1',
    }
    const { result } = renderHook(() => useCompatibleNetworks(creationData))
    expect(result.current).toHaveLength(6)
    expect(result.current.map((chain) => chain.chainId)).toEqual(['1', '10', '100', '324', '480', '10200'])
    expect(result.current.map((chain) => chain.available)).toEqual([false, false, false, false, false, false])
  })
})
