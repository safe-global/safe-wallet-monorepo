import * as sdkHelpers from '@/services/tx/tx-sender/sdk'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SafeProvider } from '@safe-global/protocol-kit'
import {
  getFallbackHandlerDeployment,
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment,
} from '@safe-global/safe-deployments'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { Interface, JsonRpcProvider } from 'ethers'
import { createUpdateSafeTxs, extractTargetVersionFromUpdateSafeTx } from '../safeUpdateParams'
import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import * as web3 from '@/hooks/wallets/web3'
import { chainBuilder } from '@/tests/builders/chains'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'

const MOCK_SAFE_ADDRESS = '0x0000000000000000000000000000000000005AFE'

const getMockSafeProviderForChain = (chainId: number) => {
  return {
    getExternalProvider: jest.fn(),
    getExternalSigner: jest.fn(),
    getChainId: jest.fn().mockReturnValue(BigInt(chainId)),
    isContractDeployed: jest.fn().mockResolvedValue(true),
  } as unknown as SafeProvider
}

describe('safeUpgradeParams', () => {
  jest
    .spyOn(web3, 'getWeb3ReadOnly')
    .mockImplementation(() => new JsonRpcProvider(undefined, { name: 'ethereum', chainId: 1 }))

  jest.spyOn(sdkHelpers, 'getSafeProvider').mockImplementation(() => getMockSafeProviderForChain(1))

  it('Should add setFallbackHandler transaction data for 1.0.0 Safes', async () => {
    const mockSafe = {
      address: {
        value: MOCK_SAFE_ADDRESS,
      },
      version: '1.0.0',
    } as SafeState

    const mockChainInfo = chainBuilder()
      .with({ chainId: '1', l2: false, recommendedMasterCopyVersion: '1.4.1' })
      .build()
    const txs = await createUpdateSafeTxs(mockSafe, mockChainInfo)
    const [masterCopyTx, fallbackHandlerTx] = txs
    // Safe upgrades mastercopy and fallbackhandler
    expect(txs).toHaveLength(2)
    // Check change masterCopy
    expect(sameAddress(masterCopyTx.to, MOCK_SAFE_ADDRESS)).toBeTruthy()
    expect(masterCopyTx.value).toEqual('0')
    expect(
      sameAddress(
        decodeChangeMasterCopyAddress(masterCopyTx.data),
        getSafeSingletonDeployment({ version: '1.4.1', network: '1' })?.defaultAddress,
      ),
    ).toBeTruthy()

    // Check setFallbackHandler
    expect(sameAddress(fallbackHandlerTx.to, MOCK_SAFE_ADDRESS)).toBeTruthy()
    expect(fallbackHandlerTx.value).toEqual('0')
    expect(
      sameAddress(
        decodeSetFallbackHandlerAddress(fallbackHandlerTx.data),
        getFallbackHandlerDeployment({ version: getLatestSafeVersion(mockChainInfo), network: '1' })?.defaultAddress,
      ),
    ).toBeTruthy()
  })

  it('Should upgrade L1 safe to L1 1.4.1', async () => {
    const mockSafe = {
      address: {
        value: MOCK_SAFE_ADDRESS,
      },
      version: '1.1.1',
    } as SafeState
    const mockChainInfo = chainBuilder()
      .with({ chainId: '1', l2: false, recommendedMasterCopyVersion: '1.4.1' })
      .build()
    const txs = await createUpdateSafeTxs(mockSafe, mockChainInfo)
    const [masterCopyTx, fallbackHandlerTx] = txs
    // Safe upgrades mastercopy and fallbackhandler
    expect(txs).toHaveLength(2)
    // Check change masterCopy
    expect(sameAddress(masterCopyTx.to, MOCK_SAFE_ADDRESS)).toBeTruthy()
    expect(masterCopyTx.value).toEqual('0')
    expect(
      sameAddress(
        decodeChangeMasterCopyAddress(masterCopyTx.data),
        getSafeSingletonDeployment({ version: '1.4.1', network: '1' })?.defaultAddress,
      ),
    ).toBeTruthy()

    // Check setFallbackHandler
    expect(sameAddress(fallbackHandlerTx.to, MOCK_SAFE_ADDRESS)).toBeTruthy()
    expect(fallbackHandlerTx.value).toEqual('0')
    expect(
      sameAddress(
        decodeSetFallbackHandlerAddress(fallbackHandlerTx.data),
        getFallbackHandlerDeployment({ version: getLatestSafeVersion(mockChainInfo), network: '1' })?.defaultAddress,
      ),
    ).toBeTruthy()
  })

  it('Should upgrade L2 safe to L2 1.4.1', async () => {
    jest.spyOn(sdkHelpers, 'getSafeProvider').mockImplementation(() => getMockSafeProviderForChain(100))

    const mockSafe = {
      address: {
        value: MOCK_SAFE_ADDRESS,
      },
      version: '1.1.1',
    } as SafeState
    const mockChainInfo = chainBuilder()
      .with({ chainId: '100', l2: true, recommendedMasterCopyVersion: '1.4.1' })
      .build()

    const txs = await createUpdateSafeTxs(mockSafe, mockChainInfo)
    const [masterCopyTx, fallbackHandlerTx] = txs
    // Safe upgrades mastercopy and fallbackhandler
    expect(txs).toHaveLength(2)
    // Check change masterCopy
    expect(sameAddress(masterCopyTx.to, MOCK_SAFE_ADDRESS)).toBeTruthy()
    expect(masterCopyTx.value).toEqual('0')
    expect(
      sameAddress(
        decodeChangeMasterCopyAddress(masterCopyTx.data),
        getSafeL2SingletonDeployment({ version: '1.4.1', network: '100' })?.defaultAddress,
      ),
    ).toBeTruthy()

    // Check setFallbackHandler
    expect(sameAddress(fallbackHandlerTx.to, MOCK_SAFE_ADDRESS)).toBeTruthy()
    expect(fallbackHandlerTx.value).toEqual('0')
    expect(
      sameAddress(
        decodeSetFallbackHandlerAddress(fallbackHandlerTx.data),
        getFallbackHandlerDeployment({ version: '1.4.1', network: '100' })?.defaultAddress,
      ),
    ).toBeTruthy()
  })
})

const decodeChangeMasterCopyAddress = (data: string): string => {
  const CHANGE_MASTER_COPY_ABI = 'function changeMasterCopy(address _masterCopy)'

  const multiSendInterface = new Interface([CHANGE_MASTER_COPY_ABI])
  const decodedAddress = multiSendInterface.decodeFunctionData('changeMasterCopy', data)[0]
  return decodedAddress.toString()
}

const decodeSetFallbackHandlerAddress = (data: string): string => {
  const CHANGE_FALLBACK_HANDLER_ABI = 'function setFallbackHandler(address handler)'

  const multiSendInterface = new Interface([CHANGE_FALLBACK_HANDLER_ABI])
  const decodedAddress = multiSendInterface.decodeFunctionData('setFallbackHandler', data)[0]
  return decodedAddress.toString()
}

describe('createUpdateSafeTxs for 1.4.1 Safes', () => {
  const OFFICIAL_L1_141 = '0x41675C099F32341bf84BFc5382aF534df5C7461a'
  const CANONICAL_MIGRATION_150 = '0x6439e7ABD8Bb915A5263094784C5CF561c4172AC'
  const MIGRATE_WITH_FALLBACK_HANDLER = '0xed007fc6'

  it('upgrades 1.4.1 → 1.5.0 via the SafeMigration delegate call, NOT the legacy changeMasterCopy path', async () => {
    const mockSafe = {
      address: { value: MOCK_SAFE_ADDRESS },
      version: '1.4.1',
      implementation: { value: OFFICIAL_L1_141 },
    } as SafeState

    const mockChainInfo = chainBuilder()
      .with({ chainId: '1', l2: false, recommendedMasterCopyVersion: '1.5.0' })
      .build()

    const txs = await createUpdateSafeTxs(mockSafe, mockChainInfo)

    expect(txs).toHaveLength(1)
    expect(txs[0]).toEqual({
      operation: 1,
      data: MIGRATE_WITH_FALLBACK_HANDLER,
      to: CANONICAL_MIGRATION_150,
      value: '0',
    })
  })
})

describe('extractTargetVersionFromUpdateSafeTx', () => {
  const CANONICAL_MIGRATION_141 = '0x526643F69b81B008F46d95CD5ced5eC0edFFDaC6'
  const ZKSYNC_MIGRATION_141 = '0x817756C6c555A94BCEE39eB5a102AbC1678b09A7'
  const MIGRATE_L2_WITH_FALLBACK_HANDLER = '0x68cb3d94'

  const zkSafe = { chainId: '324', address: { value: MOCK_SAFE_ADDRESS }, version: '1.3.0+L2' } as SafeState

  const migrationTx = (to: string, operation = 1): TransactionData =>
    ({
      hexData: MIGRATE_L2_WITH_FALLBACK_HANDLER,
      to: { value: to },
      value: '0',
      operation,
    }) as TransactionData

  it('detects the target version for the canonical migration variant on zkSync (canonical Safes)', () => {
    expect(extractTargetVersionFromUpdateSafeTx(migrationTx(CANONICAL_MIGRATION_141), zkSafe)).toBe('1.4.1')
  })

  it('detects the target version for the zksync migration variant on zkSync (EraVM Safes)', () => {
    expect(extractTargetVersionFromUpdateSafeTx(migrationTx(ZKSYNC_MIGRATION_141), zkSafe)).toBe('1.4.1')
  })

  it('returns undefined for a delegate call to an unknown contract', () => {
    expect(
      extractTargetVersionFromUpdateSafeTx(migrationTx('0x000000000000000000000000000000000000dEaD'), zkSafe),
    ).toBeUndefined()
  })

  it('returns undefined for a regular call to the migration contract (not a delegate call)', () => {
    expect(extractTargetVersionFromUpdateSafeTx(migrationTx(CANONICAL_MIGRATION_141, 0), zkSafe)).toBeUndefined()
  })
})
