import { getAddress, Interface, type Log, type Provider } from 'ethers'
import { faker } from '@faker-js/faker'
import { readPreviousFallbackHandler } from '../previousFallbackHandler'

const SAFE = getAddress(faker.finance.ethereumAddress())
const TOKEN_CALLBACK_HANDLER = '0x54e86d004d71a8D2112ec75FaCE57D730b0433F3'
const COMPATIBILITY_HANDLER = '0x3EfCBb83A4A7AfcB4F68D501E2c2203a38be77f4'

const safeEvents = new Interface([
  'event SafeSetup(address indexed initiator, address[] owners, uint256 threshold, address initializer, address fallbackHandler)',
  'event ChangedFallbackHandler(address indexed handler)',
])

const logAt = (blockNumber: number, { topics, data }: { topics: string[]; data: string }) =>
  ({ address: SAFE, blockNumber, index: 0, topics, data }) as unknown as Log

const setupLog = (blockNumber: number, fallbackHandler: string) =>
  logAt(
    blockNumber,
    safeEvents.encodeEventLog('SafeSetup', [
      getAddress(faker.finance.ethereumAddress()),
      [getAddress(faker.finance.ethereumAddress())],
      1,
      getAddress(faker.finance.ethereumAddress()),
      fallbackHandler,
    ]),
  )

const changeLog = (blockNumber: number, handler: string) =>
  logAt(blockNumber, safeEvents.encodeEventLog('ChangedFallbackHandler', [handler]))

const providerWith = (logs: Log[]) => ({ getLogs: jest.fn().mockResolvedValue(logs) }) as unknown as Provider

describe('readPreviousFallbackHandler', () => {
  it('should return the handler of the setup, when the Safe changed from it to the TokenCallbackHandler', async () => {
    const provider = providerWith([setupLog(10, COMPATIBILITY_HANDLER), changeLog(20, TOKEN_CALLBACK_HANDLER)])

    await expect(readPreviousFallbackHandler(provider, SAFE, TOKEN_CALLBACK_HANDLER)).resolves.toBe(
      COMPATIBILITY_HANDLER,
    )
  })

  it('should return the handler before the latest change to the TokenCallbackHandler, when the Safe changed several times', async () => {
    const custom = getAddress(faker.finance.ethereumAddress())
    const provider = providerWith([
      changeLog(40, TOKEN_CALLBACK_HANDLER),
      setupLog(10, COMPATIBILITY_HANDLER),
      changeLog(20, TOKEN_CALLBACK_HANDLER),
      changeLog(30, custom),
    ])

    await expect(readPreviousFallbackHandler(provider, SAFE, TOKEN_CALLBACK_HANDLER)).resolves.toBe(custom)
  })

  it('should read the events of the Safe from the first block', async () => {
    const provider = providerWith([setupLog(10, COMPATIBILITY_HANDLER), changeLog(20, TOKEN_CALLBACK_HANDLER)])

    await readPreviousFallbackHandler(provider, SAFE, TOKEN_CALLBACK_HANDLER)

    expect(provider.getLogs).toHaveBeenCalledWith({
      address: SAFE,
      fromBlock: 0,
      toBlock: 'latest',
      topics: [[safeEvents.getEvent('SafeSetup')?.topicHash, safeEvents.getEvent('ChangedFallbackHandler')?.topicHash]],
    })
  })

  it('should return nothing, when the Safe never changed to the TokenCallbackHandler', async () => {
    const provider = providerWith([setupLog(10, COMPATIBILITY_HANDLER)])

    await expect(readPreviousFallbackHandler(provider, SAFE, TOKEN_CALLBACK_HANDLER)).resolves.toBeUndefined()
  })

  it('should reject, when the logs cannot be read', async () => {
    const error = new Error('block range too large')
    const provider = { getLogs: jest.fn().mockRejectedValue(error) } as unknown as Provider

    await expect(readPreviousFallbackHandler(provider, SAFE, TOKEN_CALLBACK_HANDLER)).rejects.toBe(error)
  })
})
