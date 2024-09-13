import { JsonRpcProvider } from 'ethers'
import * as contracts from '@/services/contracts/safeContracts'
import type { SafeProvider } from '@safe-global/protocol-kit'
import type { CompatibilityFallbackHandlerContractImplementationType } from '@safe-global/protocol-kit/dist/src/types'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import * as web3 from '@/hooks/wallets/web3'
import * as sdkHelpers from '@/services/tx/tx-sender/sdk'
import { SAFE_TO_L2_SETUP_INTERFACE, relaySafeCreation, getRedirect } from '@/components/new-safe/create/logic/index'
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
import { FEATURES, getLatestSafeVersion } from '@/utils/chains'
import { type FEATURES as GatewayFeatures } from '@safe-global/safe-gateway-typescript-sdk'
import { chainBuilder } from '@/tests/builders/chains'
import { getSafeL2SingletonDeployment } from '@safe-global/safe-deployments'
import { SAFE_TO_L2_SETUP_ADDRESS } from '@/config/constants'

const provider = new JsonRpcProvider(undefined, { name: 'ethereum', chainId: 1 })

const latestSafeVersion = getLatestSafeVersion(
  chainBuilder()
    .with({ chainId: '1', features: [FEATURES.SAFE_141 as unknown as GatewayFeatures] })
    .build(),
)

describe('createNewSafeViaRelayer', () => {
  const owner1 = toBeHex('0x1', 20)
  const owner2 = toBeHex('0x2', 20)

  const mockChainInfo = chainBuilder()
    .with({
      chainId: '1',
      l2: false,
      features: [FEATURES.SAFE_141 as unknown as GatewayFeatures],
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
    const l2Deployment = getSafeL2SingletonDeployment({ version: latestSafeVersion, network: mockChainInfo.chainId })

    const expectedInitializer = Gnosis_safe__factory.createInterface().encodeFunctionData('setup', [
      [owner1, owner2],
      expectedThreshold,
      SAFE_TO_L2_SETUP_ADDRESS,
      SAFE_TO_L2_SETUP_INTERFACE.encodeFunctionData('setupToL2', [l2Deployment?.defaultAddress]),
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

    const taskId = await relaySafeCreation(mockChainInfo, [owner1, owner2], expectedThreshold, expectedSaltNonce)

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

    expect(relaySafeCreation(mockChainInfo, [owner1, owner2], 1, 69)).rejects.toEqual(relayFailedError)
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
})
