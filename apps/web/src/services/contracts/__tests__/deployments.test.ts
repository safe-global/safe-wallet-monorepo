import * as safeDeployments from '@safe-global/safe-deployments'
import { type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'

import * as deployments from '@safe-global/utils/services/contracts/deployments'
import { chainBuilder } from '@/tests/builders/chains'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'

const mainnetInfo = chainBuilder().with({ chainId: '1', l2: false, recommendedMasterCopyVersion: '1.4.1' }).build()
const l2ChainInfo = chainBuilder().with({ chainId: '137', l2: true, recommendedMasterCopyVersion: '1.4.1' }).build()
const unsupportedChainInfo = chainBuilder()
  .with({ chainId: '69420', l2: false, recommendedMasterCopyVersion: '1.3.0' })
  .build()

const unsupportedL2ChainInfo = chainBuilder()
  .with({ chainId: '69420', l2: true, recommendedMasterCopyVersion: '1.3.0' })
  .build()
const latestSafeVersion = getLatestSafeVersion(mainnetInfo)

describe('deployments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('tryDeploymentVersions', () => {
    const getSafeSpy = jest.spyOn(safeDeployments, 'getSafeSingletonDeployment')

    it('should call the deployment getter with a supported version/network', () => {
      deployments._tryDeploymentVersions(
        getSafeSpy as unknown as typeof safeDeployments.getSafeSingletonDeployment,
        mainnetInfo,
        '1.1.1',
      )

      expect(getSafeSpy).toHaveBeenCalledTimes(1)

      expect(getSafeSpy).toHaveBeenNthCalledWith(1, {
        version: '1.1.1',
        network: '1',
      })
    })

    it('should call the deployment getter with a supported version/unsupported network', () => {
      deployments._tryDeploymentVersions(
        getSafeSpy as unknown as typeof safeDeployments.getSafeSingletonDeployment,
        unsupportedChainInfo,
        '1.1.1',
      )

      expect(getSafeSpy).toHaveBeenCalledTimes(1)

      expect(getSafeSpy).toHaveBeenNthCalledWith(1, {
        version: '1.1.1',
        network: '69420',
      })
    })

    it('should call the deployment getter with an unsupported version/unsupported', () => {
      deployments._tryDeploymentVersions(
        getSafeSpy as unknown as typeof safeDeployments.getSafeSingletonDeployment,
        unsupportedChainInfo,
        '1.2.3',
      )

      expect(getSafeSpy).toHaveBeenCalledTimes(1)

      expect(getSafeSpy).toHaveBeenNthCalledWith(1, {
        version: '1.2.3',
        network: '69420',
      })
    })

    it('should call the deployment getter with the latest version/supported network if no version is provider', () => {
      deployments._tryDeploymentVersions(
        getSafeSpy as unknown as typeof safeDeployments.getSafeSingletonDeployment,
        mainnetInfo,
        null,
      )

      expect(getSafeSpy).toHaveBeenCalledTimes(2)

      expect(getSafeSpy).toHaveBeenNthCalledWith(2, {
        version: '1.4.1',
        network: '1',
      })
    })

    it('should call the deployment getter with the latest version/unsupported network if no version is provider', () => {
      deployments._tryDeploymentVersions(
        getSafeSpy as unknown as typeof safeDeployments.getSafeSingletonDeployment,
        mainnetInfo,
        null,
      )

      expect(getSafeSpy).toHaveBeenCalledTimes(2)

      expect(getSafeSpy).toHaveBeenNthCalledWith(2, {
        network: '1',
        version: '1.4.1',
      })
    })
  })

  describe('isLegacy', () => {
    it('should return true for legacy versions', () => {
      expect(deployments._isLegacy('0.0.1')).toBe(true)
      expect(deployments._isLegacy('1.0.0')).toBe(true)
    })

    it('should return false for non-legacy versions', () => {
      expect(deployments._isLegacy('1.1.1')).toBe(false)
      expect(deployments._isLegacy('1.2.0')).toBe(false)
      expect(deployments._isLegacy('1.3.0')).toBe(false)
      expect(deployments._isLegacy('1.4.1')).toBe(false)
    })

    it('should return false for unsupported versions', () => {
      expect(deployments._isLegacy(null)).toBe(false)
    })
  })

  describe('isL2', () => {
    it('should return true for L2 versions', () => {
      expect(deployments._isL2({ l2: true } as ChainInfo, '1.3.0')).toBe(true)
      expect(deployments._isL2({ l2: true } as ChainInfo, '1.3.0+L2')).toBe(true)
      expect(deployments._isL2({ l2: true } as ChainInfo, '1.4.1+L2')).toBe(true)
    })

    it('should return true for unsupported L2 versions', () => {
      expect(deployments._isL2({ l2: true } as ChainInfo, null)).toBe(true)
    })

    it('should return false for non-L2 versions', () => {
      expect(deployments._isL2({ l2: false } as ChainInfo, '1.0.0')).toBe(false)
      expect(deployments._isL2({ l2: false } as ChainInfo, '1.1.1')).toBe(false)
      expect(deployments._isL2({ l2: false } as ChainInfo, '1.2.0')).toBe(false)
      expect(deployments._isL2({ l2: false } as ChainInfo, '1.3.0')).toBe(false)
      expect(deployments._isL2({ l2: false } as ChainInfo, '1.4.1+L2')).toBe(false)
    })
  })

  describe('getSafeContractDeployment', () => {
    describe('L1', () => {
      it('should return the versioned deployment for supported version/chain', () => {
        const expected = safeDeployments.getSafeSingletonDeployment({
          version: '1.1.1',
          network: '1',
        })

        expect(expected).toBeDefined()
        const deployment = deployments.getSafeContractDeployment(mainnetInfo, '1.1.1')
        expect(deployment).toStrictEqual(expected)
      })

      it('should return undefined for supported version/unsupported chain', () => {
        const deployment = deployments.getSafeContractDeployment(unsupportedChainInfo, '1.1.1')
        expect(deployment).toBe(undefined)
      })

      it('should return the oldest deployment for legacy version/supported chain', () => {
        const expected = safeDeployments.getSafeSingletonDeployment({
          version: '1.0.0', // First available version
        })

        expect(expected).toBeDefined()
        const deployment = deployments.getSafeContractDeployment(mainnetInfo, '0.0.1')
        expect(deployment).toStrictEqual(expected)
      })

      it('should return the oldest deployment for legacy version/unsupported chain', () => {
        const expected = safeDeployments.getSafeSingletonDeployment({
          version: '1.0.0', // First available version
        })

        expect(expected).toBeDefined()
        const deployment = deployments.getSafeContractDeployment(unsupportedChainInfo, '0.0.1')
        expect(deployment).toStrictEqual(expected)
      })

      it('should return undefined for unsupported version/chain', () => {
        const deployment = deployments.getSafeContractDeployment(unsupportedChainInfo, '1.2.3')
        expect(deployment).toStrictEqual(undefined)
      })

      it('should return the latest deployment for no version/supported chain', () => {
        const expected = safeDeployments.getSafeSingletonDeployment({
          version: latestSafeVersion,
          network: '1',
        })

        expect(expected).toBeDefined()
        const deployment = deployments.getSafeContractDeployment(mainnetInfo, null)
        expect(deployment).toStrictEqual(expected)
      })

      it('should return undefined for no version/unsupported chain', () => {
        const deployment = deployments.getSafeContractDeployment(unsupportedChainInfo, null)
        expect(deployment).toBe(undefined)
      })
    })

    describe('L2', () => {
      it('should return the versioned deployment for supported version/chain', () => {
        const expected = safeDeployments.getSafeL2SingletonDeployment({
          version: '1.3.0', // First available version
          network: '137',
        })

        expect(expected).toBeDefined()
        const deployment = deployments.getSafeContractDeployment(l2ChainInfo, '1.3.0')
        expect(deployment).toStrictEqual(expected)
      })

      it('should return undefined for supported version/unsupported chain', () => {
        const deployment = deployments.getSafeContractDeployment(unsupportedL2ChainInfo, '1.3.0')
        expect(deployment).toBe(undefined)
      })

      it('should return undefined for unsupported version/chain', () => {
        const deployment = deployments.getSafeContractDeployment(unsupportedL2ChainInfo, '1.2.3')
        expect(deployment).toBe(undefined)
      })

      it('should return the latest deployment for no version/supported chain', () => {
        const expected = safeDeployments.getSafeL2SingletonDeployment({
          version: latestSafeVersion,
          network: '137',
        })

        expect(expected).toBeDefined()
        const deployment = deployments.getSafeContractDeployment(l2ChainInfo, null)
        expect(deployment).toStrictEqual(expected)
      })

      it('should return undefined no version/unsupported chain', () => {
        const deployment = deployments.getSafeContractDeployment(unsupportedL2ChainInfo, null)
        expect(deployment).toStrictEqual(undefined)
      })
    })
  })

  describe('getMultiSendCallOnlyContractDeployment', () => {
    it('should return the versioned deployment for supported version/chain', () => {
      const expected = safeDeployments.getMultiSendCallOnlyDeployment({
        version: '1.3.0', // First available version
        network: '1',
      })

      expect(expected).toBeDefined()
      const deployment = deployments.getMultiSendCallOnlyContractDeployment(mainnetInfo, '1.3.0')
      expect(deployment).toStrictEqual(expected)
    })

    it('should return undefined for supported version/unsupported chain', () => {
      const deployment = deployments.getMultiSendCallOnlyContractDeployment(unsupportedChainInfo, '1.3.0')
      expect(deployment).toBe(undefined)
    })

    it('should return undefined for unsupported version/chain', () => {
      const deployment = deployments.getMultiSendCallOnlyContractDeployment(unsupportedChainInfo, '1.2.3')
      expect(deployment).toBe(undefined)
    })

    it('should return the latest deployment for no version/supported chain', () => {
      const expected = safeDeployments.getMultiSendCallOnlyDeployment({
        version: latestSafeVersion,
        network: '1',
      })

      expect(expected).toBeDefined()
      const deployment = deployments.getMultiSendCallOnlyContractDeployment(mainnetInfo, null)
      expect(deployment).toStrictEqual(expected)
    })

    it('should return undefined for no version/unsupported chain', () => {
      const deployment = deployments.getMultiSendCallOnlyContractDeployment(unsupportedChainInfo, null)
      expect(deployment).toBe(undefined)
    })
  })

  describe('getFallbackHandlerContractDeployment', () => {
    it('should return the versioned deployment for supported version/chain', () => {
      const expected = safeDeployments.getFallbackHandlerDeployment({
        version: '1.3.0', // First available version
        network: '1',
      })

      expect(expected).toBeDefined()
      const deployment = deployments.getFallbackHandlerContractDeployment(mainnetInfo, '1.3.0')
      expect(deployment).toStrictEqual(expected)
    })

    it('should return undefined for supported version/unsupported chain', () => {
      const deployment = deployments.getFallbackHandlerContractDeployment(unsupportedChainInfo, '1.3.0')
      expect(deployment).toBe(undefined)
    })

    it('should return undefined for unsupported version/chain', () => {
      const deployment = deployments.getFallbackHandlerContractDeployment(unsupportedChainInfo, '1.2.3')
      expect(deployment).toBe(undefined)
    })

    it('should return the latest deployment for no version/supported chain', () => {
      const expected = safeDeployments.getFallbackHandlerDeployment({
        version: latestSafeVersion,
        network: '1',
      })

      expect(expected).toBeDefined()
      const deployment = deployments.getFallbackHandlerContractDeployment(mainnetInfo, null)
      expect(deployment).toStrictEqual(expected)
    })

    it('should return undefined for no version/unsupported chain', () => {
      const deployment = deployments.getFallbackHandlerContractDeployment(unsupportedChainInfo, null)
      expect(deployment).toBe(undefined)
    })
  })

  describe('getProxyFactoryContractDeployment', () => {
    it('should return the versioned deployment for supported version/chain', () => {
      const expected = safeDeployments.getProxyFactoryDeployment({
        version: '1.1.1', // First available version
        network: '1',
      })

      expect(expected).toBeDefined()
      const deployment = deployments.getProxyFactoryContractDeployment(mainnetInfo, '1.1.1')
      expect(deployment).toStrictEqual(expected)
    })

    it('should return undefined for supported version/unsupported chain', () => {
      const deployment = deployments.getProxyFactoryContractDeployment(unsupportedChainInfo, '1.1.1')
      expect(deployment).toBe(undefined)
    })

    it('should return undefined for unsupported version/chain', () => {
      const deployment = deployments.getProxyFactoryContractDeployment(unsupportedChainInfo, '1.2.3')
      expect(deployment).toBe(undefined)
    })

    it('should return the latest deployment for no version/supported chain', () => {
      const expected = safeDeployments.getProxyFactoryDeployment({
        version: latestSafeVersion,
        network: '1',
      })

      expect(expected).toBeDefined()
      const deployment = deployments.getProxyFactoryContractDeployment(mainnetInfo, null)
      expect(deployment).toStrictEqual(expected)
    })

    it('should return undefined for no version/unsupported chain', () => {
      const deployment = deployments.getProxyFactoryContractDeployment(unsupportedChainInfo, null)
      expect(deployment).toBe(undefined)
    })
  })

  describe('getSignMessageLibContractDeployment', () => {
    it('should return the versioned deployment for supported version/chain', () => {
      const expected = safeDeployments.getSignMessageLibDeployment({
        version: '1.3.0', // First available version
        network: '1',
      })

      expect(expected).toBeDefined()
      const deployment = deployments.getSignMessageLibContractDeployment(mainnetInfo, '1.3.0')
      expect(deployment).toStrictEqual(expected)
    })

    it('should return undefined for supported version/unsupported chain', () => {
      const deployment = deployments.getSignMessageLibContractDeployment(unsupportedChainInfo, '1.3.0')
      expect(deployment).toBe(undefined)
    })

    it('should return undefined for unsupported version/chain', () => {
      const deployment = deployments.getSignMessageLibContractDeployment(unsupportedChainInfo, '1.2.3')
      expect(deployment).toBe(undefined)
    })

    it('should return the latest deployment for no version/supported chain', () => {
      const expected = safeDeployments.getSignMessageLibDeployment({
        version: latestSafeVersion,
        network: '1',
      })

      expect(expected).toBeDefined()
      const deployment = deployments.getSignMessageLibContractDeployment(mainnetInfo, null)
      expect(deployment).toStrictEqual(expected)
    })

    it('should return undefined for no version/unsupported chain', () => {
      const deployment = deployments.getSignMessageLibContractDeployment(unsupportedChainInfo, null)
      expect(deployment).toBe(undefined)
    })
  })
})
