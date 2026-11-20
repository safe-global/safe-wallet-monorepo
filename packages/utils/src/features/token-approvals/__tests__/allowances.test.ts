import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { AbiCoder, Interface, JsonRpcProvider, MaxUint256, encodeBytes32String, getAddress } from 'ethers'
import { ERC20__factory } from '@safe-global/utils/types/contracts'
import { MULTICALL_ABI } from '@safe-global/utils/utils/multicall'
import type { ApprovalRecord } from '../approvalHistory'
import { readTokenApprovals } from '../allowances'

const RPC_URL = 'https://rpc.token-approvals.test'
const erc20 = ERC20__factory.createInterface()
const multicall = new Interface(MULTICALL_ABI)
const abi = AbiCoder.defaultAbiCoder()

type TokenFixture = {
  allowances: Record<string, bigint>
  symbol?: string
  bytes32Symbol?: string
  decimals?: number
  totalSupply?: bigint
}

const randomAddress = () => getAddress(faker.finance.ethereumAddress())

const answerCall = (tokens: Record<string, TokenFixture>, to: string, data: string): string | null => {
  const token = tokens[getAddress(to)]
  if (!token) return null
  const { name, args } = erc20.parseTransaction({ data }) ?? {}
  switch (name) {
    case 'allowance': {
      const allowance = token.allowances[getAddress(args![1])]
      return allowance === undefined ? null : abi.encode(['uint256'], [allowance])
    }
    case 'symbol':
      if (token.bytes32Symbol) return encodeBytes32String(token.bytes32Symbol)
      return token.symbol === undefined ? null : abi.encode(['string'], [token.symbol])
    case 'decimals':
      return token.decimals === undefined ? null : abi.encode(['uint8'], [token.decimals])
    case 'totalSupply':
      return token.totalSupply === undefined ? null : abi.encode(['uint256'], [token.totalSupply])
    default:
      return null
  }
}

const rpcHandler = (tokens: Record<string, TokenFixture>) =>
  http.post(RPC_URL, async ({ request }) => {
    const body = (await request.json()) as { id: number; method: string; params: [{ to: string; data: string }] }
    if (body.method === 'eth_chainId') return HttpResponse.json({ jsonrpc: '2.0', id: body.id, result: '0x1' })

    const { to, data } = body.params[0]
    if (!data.startsWith(multicall.getFunction('aggregate3')!.selector)) {
      const result = answerCall(tokens, to, data)
      return HttpResponse.json(
        result === null
          ? { jsonrpc: '2.0', id: body.id, error: { code: 3, message: 'execution reverted' } }
          : { jsonrpc: '2.0', id: body.id, result },
      )
    }

    const [calls] = multicall.decodeFunctionData('aggregate3', data)
    const results = calls.map(([target, , callData]: [string, boolean, string]) => {
      const returnData = answerCall(tokens, target, callData)
      return { success: returnData !== null, returnData: returnData ?? '0x' }
    })
    return HttpResponse.json({
      jsonrpc: '2.0',
      id: body.id,
      result: multicall.encodeFunctionResult('aggregate3', [results]),
    })
  })

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const buildRecord = (token: string, spender: string, timestamp = faker.date.past().getTime()): ApprovalRecord => ({
  token: { value: token },
  spender: { value: spender },
  txHash: faker.string.hexadecimal({ length: 64 }),
  timestamp,
})

const read = (safe: string, records: ApprovalRecord[]) =>
  readTokenApprovals(new JsonRpcProvider(RPC_URL, 1, { staticNetwork: true }), safe, records)

describe('readTokenApprovals', () => {
  it('returns the on-chain allowance rather than the amount last approved', async () => {
    const [safe, token, spender] = [randomAddress(), randomAddress(), randomAddress()]
    server.use(
      rpcHandler({
        [token]: { allowances: { [spender]: 100n }, symbol: 'DAI', decimals: 18, totalSupply: 10n ** 27n },
      }),
    )

    const [approval] = await read(safe, [buildRecord(token, spender)])

    expect(approval).toMatchObject({
      token: { value: token, symbol: 'DAI', decimals: 18 },
      spender: { value: spender },
      allowance: 100n,
      isUnlimited: false,
    })
  })

  it('drops an approval that has been spent or revoked down to zero', async () => {
    const [safe, token, spentSpender, liveSpender] = [
      randomAddress(),
      randomAddress(),
      randomAddress(),
      randomAddress(),
    ]
    server.use(
      rpcHandler({
        [token]: { allowances: { [spentSpender]: 0n, [liveSpender]: 5n }, symbol: 'USDC', decimals: 6 },
      }),
    )

    const approvals = await read(safe, [buildRecord(token, spentSpender), buildRecord(token, liveSpender)])

    expect(approvals.map((approval) => approval.spender.value)).toEqual([liveSpender])
  })

  it('drops a contract whose allowance call fails, such as an ERC-721', async () => {
    const [safe, nft, spender] = [randomAddress(), randomAddress(), randomAddress()]
    server.use(rpcHandler({ [nft]: { allowances: {}, symbol: 'NFT' } }))

    expect(await read(safe, [buildRecord(nft, spender)])).toEqual([])
  })

  it.each([
    ['the maximum uint256', MaxUint256, 10n ** 24n],
    ['more than the total supply', 10n ** 30n, 10n ** 24n],
  ])('labels an allowance of %s as unlimited', async (_, allowance, totalSupply) => {
    const [safe, token, spender] = [randomAddress(), randomAddress(), randomAddress()]
    server.use(
      rpcHandler({ [token]: { allowances: { [spender]: allowance }, symbol: 'X', decimals: 18, totalSupply } }),
    )

    const [approval] = await read(safe, [buildRecord(token, spender)])

    expect(approval.isUnlimited).toBe(true)
  })

  it('reads a bytes32 symbol from an older token', async () => {
    const [safe, token, spender] = [randomAddress(), randomAddress(), randomAddress()]
    server.use(rpcHandler({ [token]: { allowances: { [spender]: 1n }, bytes32Symbol: 'MKR', decimals: 18 } }))

    const [approval] = await read(safe, [buildRecord(token, spender)])

    expect(approval.token.symbol).toBe('MKR')
  })

  it('still lists the allowance of a token without decimals, in whole units', async () => {
    const [safe, token, spender] = [randomAddress(), randomAddress(), randomAddress()]
    server.use(rpcHandler({ [token]: { allowances: { [spender]: MaxUint256 }, symbol: 'NODEC' } }))

    const [approval] = await read(safe, [buildRecord(token, spender)])

    expect(approval).toMatchObject({ token: { decimals: 0 }, isUnlimited: true })
  })

  it('lists unlimited approvals first, then the most recently approved', async () => {
    const [safe, token, oldSpender, newSpender, unlimitedSpender] = Array.from({ length: 5 }, randomAddress)
    server.use(
      rpcHandler({
        [token]: {
          allowances: { [oldSpender]: 1n, [newSpender]: 1n, [unlimitedSpender]: MaxUint256 },
          symbol: 'X',
          decimals: 18,
        },
      }),
    )

    const approvals = await read(safe, [
      buildRecord(token, oldSpender, 100),
      buildRecord(token, unlimitedSpender, 50),
      buildRecord(token, newSpender, 200),
    ])

    expect(approvals.map((approval) => approval.spender.value)).toEqual([unlimitedSpender, newSpender, oldSpender])
  })
})
