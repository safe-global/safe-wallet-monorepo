import type { JsonRpcProvider } from 'ethers'
import { AbiCoder, getAddress, id, Interface } from 'ethers'
import { faker } from '@faker-js/faker'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { logError } from '@/services/exceptions'
import { getRpcErrorContext } from '@/hooks/wallets/rpcEndpointInfo'
import { readHeldRoots } from '../readHeldRoots'

jest.mock('@/services/exceptions', () => ({ logError: jest.fn() }))

const guardIface = new Interface(['function rootConfigured(address safe, bytes32 root) view returns (uint256)'])
const GUARD = getAddress(faker.finance.ethereumAddress())
const SAFE = getAddress(faker.finance.ethereumAddress())
const HELD = id(faker.string.uuid())
const FREE = id(faker.string.uuid())

const encodeReadyAt = (readyAt: number) => AbiCoder.defaultAbiCoder().encode(['uint256'], [readyAt])

describe('readHeldRoots', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should, when the guard holds one of the roots, return only that root', async () => {
    const call = jest.fn(({ data }: { data: string }) => {
      const [, root] = guardIface.decodeFunctionData('rootConfigured', data)
      return Promise.resolve(encodeReadyAt(root === HELD ? faker.number.int({ min: 1, max: 2_000_000_000 }) : 0))
    })
    const provider = { call } as unknown as JsonRpcProvider

    await expect(readHeldRoots(provider, GUARD, SAFE, [HELD, FREE])).resolves.toEqual([HELD])
    expect(call).toHaveBeenCalledWith({
      to: GUARD,
      data: guardIface.encodeFunctionData('rootConfigured', [SAFE, HELD]),
    })
  })

  it('should, when a read fails, log and rethrow the error', async () => {
    const rpcError = new Error('rpc down')
    const provider = { call: jest.fn().mockRejectedValue(rpcError) } as unknown as JsonRpcProvider

    await expect(readHeldRoots(provider, GUARD, SAFE, [HELD])).rejects.toBe(rpcError)
    expect(logError).toHaveBeenCalledWith(ErrorCodes._659, rpcError, getRpcErrorContext(provider))
  })
})
