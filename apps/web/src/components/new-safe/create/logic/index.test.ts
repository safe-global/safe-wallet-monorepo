import { JsonRpcProvider } from 'ethers'
import * as contracts from '@/services/contracts/safeContracts'
import type { SafeProvider } from '@safe-global/protocol-kit'
import type { CompatibilityFallbackHandlerContractImplementationType } from '@safe-global/protocol-kit/dist/src/types'
import { EMPTY_DATA, ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import * as web3 from '@/hooks/wallets/web3'
import * as sdkHelpers from '@/services/tx/tx-sender/sdk'
import {
  relaySafeCreation,
  getRedirect,
  createNewUndeployedSafeWithoutSalt,
} from '@/components/new-safe/create/logic/index'
import { relayTransaction } from '@safe-global/safe-gateway-typescript-sdk'
import { toBeHex } from 'ethers'
import {
  Gnosis_safe__factory,
  Proxy_factory__factory,
} from '@/types/contracts/factories/@safe-global/safe-deployments/dist/assets/v1.3.0'
import {
  getReadOnlyFallbackHandlerContract,
  getReadOnlyGnosisSafeContract,
  getReadOnlyProxyFactoryContract,
} from '@/services/contracts/safeContracts'
import * as gateway from '@safe-global/safe-gateway-typescript-sdk'
import { FEATURES } from '@/utils/chains'
import { chainBuilder } from '@/tests/builders/chains'
import { type ReplayedSafeProps } from '@/store/slices'
import { faker } from '@faker-js/faker'
import { ECOSYSTEM_ID_ADDRESS } from '@/config/constants'
import {
  getFallbackHandlerDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment,
  getSafeToL2SetupDeployment,
} from '@safe-global/safe-deployments'
import { Safe_to_l2_setup__factory } from '@/types/contracts'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'

const provider = new JsonRpcProvider(undefined, { name: 'ethereum', chainId: 1 })

const latestSafeVersion = getLatestSafeVersion(
  chainBuilder().with({ chainId: '1', recommendedMasterCopyVersion: '1.4.1' }).build(),
)

const safeToL2SetupDeployment = getSafeToL2SetupDeployment()
const safeToL2SetupAddress = safeToL2SetupDeployment?.defaultAddress
const safeToL2SetupInterface = Safe_to_l2_setup__factory.createInterface()

describe('create/logic', () => {
  describe('createNewSafeViaRelayer', () => {
    const owner1 = toBeHex('0x1', 20)
    const owner2 = toBeHex('0x2', 20)

    const mockChainInfo = chainBuilder()
      .with({
        chainId: '1',
        l2: false,
        recommendedMasterCopyVersion: '1.4.1',
      })
      .build()

    beforeAll(() => {
      jest.resetAllMocks()
      jest.spyOn(web3, 'getWeb3ReadOnly').mockImplementation(() => provider)
    })

    it('returns taskId if create Safe successfully relayed', async () => {
      const mockSafeProvider = {
        getExternalProvider: jest.fn(),
        getExternalSigner: jest.fn(),
        getChainId: jest.fn().mockReturnValue(BigInt(1)),
      } as unknown as SafeProvider

      jest.spyOn(gateway, 'relayTransaction').mockResolvedValue({ taskId: '0x123' })
      jest.spyOn(sdkHelpers, 'getSafeProvider').mockImplementation(() => mockSafeProvider)

      jest.spyOn(contracts, 'getReadOnlyFallbackHandlerContract').mockResolvedValue({
        getAddress: () => '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
      } as unknown as CompatibilityFallbackHandlerContractImplementationType)

      const expectedSaltNonce = 69
      const expectedThreshold = 1
      const proxyFactoryAddress = await (await getReadOnlyProxyFactoryContract(latestSafeVersion)).getAddress()
      const readOnlyFallbackHandlerContract = await getReadOnlyFallbackHandlerContract(latestSafeVersion)
      const safeContractAddress = await (
        await getReadOnlyGnosisSafeContract(mockChainInfo, latestSafeVersion)
      ).getAddress()

      const undeployedSafeProps: ReplayedSafeProps = {
        safeAccountConfig: {
          owners: [owner1, owner2],
          threshold: 1,
          data: EMPTY_DATA,
          to: ZERO_ADDRESS,
          fallbackHandler: await readOnlyFallbackHandlerContract.getAddress(),
          paymentReceiver: ZERO_ADDRESS,
          payment: 0,
          paymentToken: ZERO_ADDRESS,
        },
        safeVersion: latestSafeVersion,
        factoryAddress: proxyFactoryAddress,
        masterCopy: safeContractAddress,
        saltNonce: '69',
      }

      const expectedInitializer = Gnosis_safe__factory.createInterface().encodeFunctionData('setup', [
        [owner1, owner2],
        expectedThreshold,
        ZERO_ADDRESS,
        EMPTY_DATA,
        await readOnlyFallbackHandlerContract.getAddress(),
        ZERO_ADDRESS,
        0,
        ZERO_ADDRESS,
      ])

      const expectedCallData = Proxy_factory__factory.createInterface().encodeFunctionData('createProxyWithNonce', [
        safeContractAddress,
        expectedInitializer,
        expectedSaltNonce,
      ])

      const taskId = await relaySafeCreation(mockChainInfo, undeployedSafeProps)

      expect(taskId).toEqual('0x123')
      expect(relayTransaction).toHaveBeenCalledTimes(1)
      expect(relayTransaction).toHaveBeenCalledWith('1', {
        to: proxyFactoryAddress,
        data: expectedCallData,
        version: latestSafeVersion,
      })
    })

    it('should throw an error if relaying fails', () => {
      const relayFailedError = new Error('Relay failed')
      jest.spyOn(gateway, 'relayTransaction').mockRejectedValue(relayFailedError)

      const undeployedSafeProps: ReplayedSafeProps = {
        safeAccountConfig: {
          owners: [owner1, owner2],
          threshold: 1,
          data: EMPTY_DATA,
          to: ZERO_ADDRESS,
          fallbackHandler: faker.finance.ethereumAddress(),
          paymentReceiver: ZERO_ADDRESS,
          payment: 0,
          paymentToken: ZERO_ADDRESS,
        },
        safeVersion: latestSafeVersion,
        factoryAddress: faker.finance.ethereumAddress(),
        masterCopy: faker.finance.ethereumAddress(),
        saltNonce: '69',
      }

      expect(relaySafeCreation(mockChainInfo, undeployedSafeProps)).rejects.toEqual(relayFailedError)
    })
  })
  describe('getRedirect', () => {
    it("should redirect to home for any redirect that doesn't start with /apps", () => {
      const expected = {
        pathname: '/home',
        query: {
          safe: 'sep:0x1234',
        },
      }
      expect(getRedirect('sep', '0x1234', 'https://google.com')).toEqual(expected)
      expect(getRedirect('sep', '0x1234', '/queue')).toEqual(expected)
    })

    it('should redirect to an app if an app URL is passed', () => {
      expect(getRedirect('sep', '0x1234', '/apps?appUrl=https://safe-eth.everstake.one/?chain=eth')).toEqual(
        '/apps?appUrl=https://safe-eth.everstake.one/?chain=eth&safe=sep:0x1234',
      )

      expect(getRedirect('sep', '0x1234', '/apps?appUrl=https://safe-eth.everstake.one')).toEqual(
        '/apps?appUrl=https://safe-eth.everstake.one&safe=sep:0x1234',
      )
    })
  })

  describe('createNewUndeployedSafeWithoutSalt', () => {
    it('should throw errors if no deployments are found', () => {
      expect(() =>
        createNewUndeployedSafeWithoutSalt(
          '1.4.1',
          {
            owners: [faker.finance.ethereumAddress()],
            threshold: 1,
          },
          chainBuilder().with({ chainId: 'NON_EXISTING' }).build(),
        ),
      ).toThrowError(new Error('No Safe deployment found'))
    })

    it('should use l1 masterCopy and no migration on l1s without multichain feature', () => {
      const safeSetup = {
        owners: [faker.finance.ethereumAddress()],
        threshold: 1,
      }
      expect(
        createNewUndeployedSafeWithoutSalt(
          '1.4.1',
          safeSetup,
          chainBuilder()
            .with({ chainId: '1' })
            // Multichain creation is toggled off
            .with({ features: [FEATURES.COUNTERFACTUAL] as any })
            .with({ l2: false })
            .build(),
        ),
      ).toEqual({
        safeAccountConfig: {
          ...safeSetup,
          fallbackHandler: getFallbackHandlerDeployment({ version: '1.4.1', network: '1' })?.defaultAddress,
          to: ZERO_ADDRESS,
          data: EMPTY_DATA,
          paymentReceiver: ECOSYSTEM_ID_ADDRESS,
        },
        safeVersion: '1.4.1',
        masterCopy: getSafeSingletonDeployment({ version: '1.4.1', network: '1' })?.defaultAddress,
        factoryAddress: getProxyFactoryDeployment({ version: '1.4.1', network: '1' })?.defaultAddress,
      })
    })

    it('should use l2 masterCopy and no migration on l2s without multichain feature', () => {
      const safeSetup = {
        owners: [faker.finance.ethereumAddress()],
        threshold: 1,
      }
      expect(
        createNewUndeployedSafeWithoutSalt(
          '1.4.1',
          safeSetup,
          chainBuilder()
            .with({ chainId: '137' })
            // Multichain creation is toggled off
            .with({ features: [FEATURES.COUNTERFACTUAL] as any })
            .with({ recommendedMasterCopyVersion: '1.4.1' })
            .with({ l2: true })
            .build(),
        ),
      ).toEqual({
        safeAccountConfig: {
          ...safeSetup,
          fallbackHandler: getFallbackHandlerDeployment({ version: '1.4.1', network: '137' })?.defaultAddress,
          to: ZERO_ADDRESS,
          data: EMPTY_DATA,
          paymentReceiver: ECOSYSTEM_ID_ADDRESS,
        },
        safeVersion: '1.4.1',
        masterCopy: getSafeL2SingletonDeployment({ version: '1.4.1', network: '137' })?.defaultAddress,
        factoryAddress: getProxyFactoryDeployment({ version: '1.4.1', network: '137' })?.defaultAddress,
      })
    })

    it('should use l2 masterCopy and no migration on l2s with multichain feature but on old version', () => {
      const safeSetup = {
        owners: [faker.finance.ethereumAddress()],
        threshold: 1,
      }
      expect(
        createNewUndeployedSafeWithoutSalt(
          '1.3.0',
          safeSetup,
          chainBuilder()
            .with({ chainId: '137' })
            // Multichain creation is toggled on
            .with({ features: [FEATURES.COUNTERFACTUAL, FEATURES.MULTI_CHAIN_SAFE_CREATION] as any })
            .with({ recommendedMasterCopyVersion: '1.3.0' })
            .with({ l2: true })
            .build(),
        ),
      ).toEqual({
        safeAccountConfig: {
          ...safeSetup,
          fallbackHandler: getFallbackHandlerDeployment({ version: '1.3.0', network: '137' })?.defaultAddress,
          to: ZERO_ADDRESS,
          data: EMPTY_DATA,
          paymentReceiver: ECOSYSTEM_ID_ADDRESS,
        },
        safeVersion: '1.3.0',
        masterCopy: getSafeL2SingletonDeployment({ version: '1.3.0', network: '137' })?.defaultAddress,
        factoryAddress: getProxyFactoryDeployment({ version: '1.3.0', network: '137' })?.defaultAddress,
      })
    })

    it('should use l1 masterCopy and migration on l2s with multichain feature', () => {
      const safeSetup = {
        owners: [faker.finance.ethereumAddress()],
        threshold: 1,
      }
      const safeL2SingletonDeployment = getSafeL2SingletonDeployment({
        version: '1.4.1',
        network: '137',
      })?.defaultAddress
      expect(
        createNewUndeployedSafeWithoutSalt(
          '1.4.1',
          safeSetup,
          chainBuilder()
            .with({ chainId: '137' })
            // Multichain creation is toggled on
            .with({ features: [FEATURES.COUNTERFACTUAL, FEATURES.MULTI_CHAIN_SAFE_CREATION] as any })
            .with({ recommendedMasterCopyVersion: '1.4.1' })
            .with({ l2: true })
            .build(),
        ),
      ).toEqual({
        safeAccountConfig: {
          ...safeSetup,
          fallbackHandler: getFallbackHandlerDeployment({ version: '1.4.1', network: '137' })?.defaultAddress,
          to: safeToL2SetupAddress,
          data:
            safeL2SingletonDeployment &&
            safeToL2SetupInterface.encodeFunctionData('setupToL2', [safeL2SingletonDeployment]),
          paymentReceiver: ECOSYSTEM_ID_ADDRESS,
        },
        safeVersion: '1.4.1',
        masterCopy: getSafeSingletonDeployment({ version: '1.4.1', network: '137' })?.defaultAddress,
        factoryAddress: getProxyFactoryDeployment({ version: '1.4.1', network: '137' })?.defaultAddress,
      })
    })

    it('should use l2 masterCopy and no migration on zkSync', () => {
      const safeSetup = {
        owners: [faker.finance.ethereumAddress()],
        threshold: 1,
      }
      expect(
        createNewUndeployedSafeWithoutSalt(
          '1.3.0',
          safeSetup,
          chainBuilder()
            .with({ chainId: '324' })
            // Multichain and 1.4.1 creation is toggled off
            .with({ features: [FEATURES.COUNTERFACTUAL] as any })
            .with({ recommendedMasterCopyVersion: '1.3.0' })
            .with({ l2: true })
            .build(),
        ),
      ).toEqual({
        safeAccountConfig: {
          ...safeSetup,
          fallbackHandler: getFallbackHandlerDeployment({ version: '1.3.0', network: '324' })?.networkAddresses['324'],
          to: ZERO_ADDRESS,
          data: EMPTY_DATA,
          paymentReceiver: ECOSYSTEM_ID_ADDRESS,
        },
        safeVersion: '1.3.0',
        masterCopy: getSafeL2SingletonDeployment({ version: '1.3.0', network: '324' })?.networkAddresses['324'],
        factoryAddress: getProxyFactoryDeployment({ version: '1.3.0', network: '324' })?.networkAddresses['324'],
      })
    })
  })
})
