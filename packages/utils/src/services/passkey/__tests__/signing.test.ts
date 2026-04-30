import type { SafeTransaction } from '@safe-global/types-kit'
import { signSafeTxWithPasskey } from '../signing'
import type { PasskeyMetadata, PasskeyStorage, RelayClient } from '../types'

const SIGNED_TX = { signed: true } as unknown as SafeTransaction

const initMock = jest.fn()

jest.mock('@safe-global/protocol-kit', () => {
  const actual = jest.requireActual('@safe-global/protocol-kit')
  return {
    ...actual,
    __esModule: true,
    default: { init: (...args: unknown[]) => initMock(...args) },
    getP256VerifierAddress: jest.fn(() => '0x0000000000000000000000000000000000000B71'),
  }
})

jest.mock('../identity', () => ({
  buildPasskeyArg: jest.fn(({ passkey, chainId, getFn }) => ({
    rawId: passkey.rawId,
    coordinates: passkey.coordinates,
    verifierAddress: '0xVerifier',
    chainIdMarker: chainId,
    getFn,
  })),
  isIdentityDeployed: jest.fn(),
  resolveIdentityForChain: jest.fn(({ passkey, chainId }) =>
    Promise.resolve(passkey.identityContractAddresses[chainId] ?? '0xDerivedFor' + chainId),
  ),
}))

jest.mock('../deployment', () => ({
  deployIdentity: jest.fn(),
  awaitDeployment: jest.fn(),
}))

import { isIdentityDeployed } from '../identity'
import { awaitDeployment, deployIdentity } from '../deployment'

const isIdentityDeployedMock = isIdentityDeployed as jest.Mock
const deployIdentityMock = deployIdentity as jest.Mock
const awaitDeploymentMock = awaitDeployment as jest.Mock

const buildArgs = (overrides: Partial<Parameters<typeof signSafeTxWithPasskey>[0]> = {}) => {
  const passkey: PasskeyMetadata = {
    rawId: 'raw',
    coordinates: { x: '1', y: '2' },
    identityContractAddresses: { '11155111': '0xIdentity' },
    deployedOnChains: [],
  }
  const storage: PasskeyStorage = {
    getAll: jest.fn(),
    getByRawId: jest.fn(),
    add: jest.fn(),
    removeByRawId: jest.fn(),
    markDeployedOnChain: jest.fn(),
    setIdentityForChain: jest.fn(),
  }
  const relay: RelayClient = { relay: jest.fn() }
  return {
    rpcUrl: 'https://rpc.example',
    chainId: '11155111',
    safeAddress: '0xSafe',
    safeTx: { tx: true } as unknown as SafeTransaction,
    passkey,
    getFn: jest.fn(),
    relay,
    storage,
    cgwBaseUrl: 'https://cgw.example',
    ...overrides,
  }
}

describe('signSafeTxWithPasskey', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    initMock.mockResolvedValue({
      signTransaction: jest.fn().mockResolvedValue(SIGNED_TX),
      getTransactionHash: jest.fn().mockResolvedValue('0xHash'),
    })
  })

  it('signs first, then skips deployment when chainId is in cache', async () => {
    const args = buildArgs({
      passkey: {
        rawId: 'raw',
        coordinates: { x: '1', y: '2' },
        identityContractAddresses: { '11155111': '0xIdentity' },
        deployedOnChains: ['11155111'],
      },
    })

    const result = await signSafeTxWithPasskey(args)

    expect(result.signedTx).toBe(SIGNED_TX)
    expect(result.deployment).toBeUndefined()
    expect(isIdentityDeployedMock).not.toHaveBeenCalled()
    expect(deployIdentityMock).not.toHaveBeenCalled()
    expect(args.storage.markDeployedOnChain).not.toHaveBeenCalled()
  })

  it('derives and caches per-chain address when signing on a chain not yet seen', async () => {
    isIdentityDeployedMock.mockResolvedValueOnce(false)
    deployIdentityMock.mockResolvedValueOnce({ taskId: 'task-1' })
    awaitDeploymentMock.mockResolvedValueOnce({ transactionHash: '0xTxHash' })

    const args = buildArgs({
      chainId: '10', // Optimism — not in identityContractAddresses
      passkey: {
        rawId: 'raw',
        coordinates: { x: '1', y: '2' },
        identityContractAddresses: { '11155111': '0xSepoliaAddr' },
        deployedOnChains: [],
      },
    })

    await signSafeTxWithPasskey(args)

    // setIdentityForChain must be called with the freshly-derived address for chain 10
    expect(args.storage.setIdentityForChain).toHaveBeenCalledWith('raw', '10', '0xDerivedFor10')
    // isIdentityDeployed must check the chain-10 address, NOT the cached Sepolia one
    expect(isIdentityDeployedMock).toHaveBeenCalledWith(expect.objectContaining({ address: '0xDerivedFor10' }))
  })

  it('does not re-cache when the per-chain address is already in metadata', async () => {
    isIdentityDeployedMock.mockResolvedValueOnce(true)
    const args = buildArgs({
      passkey: {
        rawId: 'raw',
        coordinates: { x: '1', y: '2' },
        identityContractAddresses: { '11155111': '0xIdentity' },
        deployedOnChains: [],
      },
    })

    await signSafeTxWithPasskey(args)

    expect(args.storage.setIdentityForChain).not.toHaveBeenCalled()
    expect(isIdentityDeployedMock).toHaveBeenCalledWith(expect.objectContaining({ address: '0xIdentity' }))
  })

  it('skips deployment when on-chain check confirms contract exists, but updates cache', async () => {
    isIdentityDeployedMock.mockResolvedValueOnce(true)
    const args = buildArgs()

    const result = await signSafeTxWithPasskey(args)

    expect(result.signedTx).toBe(SIGNED_TX)
    expect(result.deployment).toBeUndefined()
    expect(deployIdentityMock).not.toHaveBeenCalled()
    expect(args.storage.markDeployedOnChain).toHaveBeenCalledWith('raw', '11155111')
  })

  it('deploys via relay and updates cache when not yet deployed', async () => {
    isIdentityDeployedMock.mockResolvedValueOnce(false)
    deployIdentityMock.mockResolvedValueOnce({ taskId: 'task-1' })
    awaitDeploymentMock.mockResolvedValueOnce({ transactionHash: '0xTxHash' })
    const args = buildArgs()

    const result = await signSafeTxWithPasskey(args)

    expect(result.signedTx).toBe(SIGNED_TX)
    expect(result.deployment).toEqual({ taskId: 'task-1', transactionHash: '0xTxHash' })
    expect(deployIdentityMock).toHaveBeenCalledWith(
      expect.objectContaining({ chainId: '11155111', coordinates: args.passkey.coordinates }),
    )
    expect(awaitDeploymentMock).toHaveBeenCalledWith(
      expect.objectContaining({ taskId: 'task-1', chainId: '11155111', cgwBaseUrl: 'https://cgw.example' }),
    )
    expect(args.storage.markDeployedOnChain).toHaveBeenCalledWith('raw', '11155111')
  })

  it('signs before deploying (biometric prompt is the first awaited side-effect)', async () => {
    const order: string[] = []
    initMock.mockResolvedValue({
      signTransaction: jest.fn(async () => {
        order.push('sign')
        return SIGNED_TX
      }),
      getTransactionHash: jest.fn().mockResolvedValue('0xHash'),
    })
    isIdentityDeployedMock.mockImplementationOnce(async () => {
      order.push('check')
      return false
    })
    deployIdentityMock.mockImplementationOnce(async () => {
      order.push('deploy')
      return { taskId: 'task-1' }
    })
    awaitDeploymentMock.mockImplementationOnce(async () => {
      order.push('await')
      return { transactionHash: '0xTxHash' }
    })

    await signSafeTxWithPasskey(buildArgs())

    expect(order).toEqual(['sign', 'check', 'deploy', 'await'])
  })
})
