import type Safe from '@safe-global/protocol-kit'
import type { MetaTransactionData, SafeTransaction } from '@safe-global/types-kit'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { getAddress, parseUnits } from 'ethers'
import { AllowanceModule__factory } from '@safe-global/utils/types/contracts'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import * as safeCoreSDK from '@/hooks/coreSDK/safeCoreSDK'
import * as txSender from '@/services/tx/tx-sender/create'
import { chainBuilder } from '@/tests/builders/chains'
import { addressExBuilder } from '@/tests/builders/safe'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import type { NewSpendingLimitData, SpendingLimitState } from '../types'
import { getLatestSpendingLimitAddress } from './spendingLimitDeployments'
import {
  createNewSpendingLimitTx,
  createSpendingLimitsTx,
  DUPLICATE_SPENDING_LIMIT_ERROR,
  EMPTY_SPENDING_LIMITS_ERROR,
  NO_ALLOWANCE_MODULE_ERROR,
  UNKNOWN_TOKEN_DECIMALS_ERROR,
  type SpendingLimitPair,
} from './spendingLimitExecution'

// Sepolia — the AllowanceModule is registered for it in @safe-global/safe-modules-deployments
const REGISTERED_CHAIN_ID = '11155111'
// Not a real chain: deployment bumps keep registering new networks, so any real id picked as
// "unregistered" eventually becomes registered (Optimism and Arbitrum did, in v3.0.9).
const UNREGISTERED_CHAIN_ID = '999999999999'

const SAFE_ADDRESS = getAddress('0x1000000000000000000000000000000000000001')
const ALICE = getAddress('0x00000000000000000000000000000000000000a1')
const BOB = getAddress('0x00000000000000000000000000000000000000b0')
const USDC = getAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
/** `enableModule(address)` selector: the mocked SDK returns it so the decoder can name the call. */
const ENABLE_MODULE_DATA = '0x610b5925'
const NOW_MS = Date.UTC(2026, 8, 21, 12, 0, 0)
const NOW_MIN = Math.floor(NOW_MS / 60_000)

const mockChain = chainBuilder().build()
const allowanceInterface = AllowanceModule__factory.createInterface()

const requireModuleAddress = (): string => {
  const address = getLatestSpendingLimitAddress(REGISTERED_CHAIN_ID)
  if (!address) throw new Error('fixture: Sepolia has no AllowanceModule deployment')
  return address
}

type DecodedCall = { to: string; name: string; args: unknown[] }

/** The batch handed to `createMultiSendCallOnlyTx`, call by call. */
const decodeBatch = (): DecodedCall[] => {
  const [txs] = (txSender.createMultiSendCallOnlyTx as jest.Mock).mock.calls[0] as [MetaTransactionData[]]
  return txs.map((tx) => {
    if (tx.data.startsWith(ENABLE_MODULE_DATA)) return { to: tx.to, name: 'enableModule', args: [] }
    const parsed = allowanceInterface.parseTransaction({ data: tx.data })
    if (!parsed) throw new Error(`cannot decode ${tx.data}`)
    return { to: tx.to, name: parsed.name, args: Array.from(parsed.args) }
  })
}

const names = (): string[] => decodeBatch().map((call) => call.name)

const pair = (overrides: Partial<SpendingLimitPair> = {}): SpendingLimitPair => ({
  beneficiary: ALICE,
  tokenAddress: ZERO_ADDRESS,
  amount: '1',
  decimals: 18,
  resetTime: '0',
  ...overrides,
})

const limitFor = (beneficiary: string, tokenAddress: string, spent = '0') =>
  spendingLimitStateBuilder()
    .with({ beneficiary, spent, token: { ...spendingLimitStateBuilder().build().token, address: tokenAddress } })
    .build()

let mockSDK: Safe

beforeEach(() => {
  jest.resetAllMocks()
  jest.spyOn(Date, 'now').mockReturnValue(NOW_MS)
  mockSDK = {
    createEnableModuleTx: jest.fn(async () => ({ data: { data: ENABLE_MODULE_DATA, to: SAFE_ADDRESS } })),
  } as unknown as Safe
  jest.spyOn(safeCoreSDK, 'getSafeSDK').mockReturnValue(mockSDK)
  jest
    .spyOn(txSender, 'createMultiSendCallOnlyTx')
    .mockResolvedValue({ data: { to: ZERO_ADDRESS } } as unknown as SafeTransaction)
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('createSpendingLimitsTx', () => {
  const build = (
    pairs: SpendingLimitPair[],
    existing: SpendingLimitState[] = [],
    safeModules: SafeState['modules'] = [],
  ) => createSpendingLimitsTx(pairs, existing, REGISTERED_CHAIN_ID, mockChain, safeModules, true)

  it('enables the module once, adds each spender once and sets every pair, in that order', async () => {
    await build([
      pair(),
      pair({ tokenAddress: USDC, decimals: 6, amount: '2.5', resetTime: '10080' }),
      pair({ beneficiary: BOB, resetTime: '1440' }),
    ])

    expect(names()).toEqual([
      'enableModule',
      'addDelegate',
      'addDelegate',
      'setAllowance',
      'setAllowance',
      'setAllowance',
    ])
    expect(mockSDK.createEnableModuleTx).toHaveBeenCalledTimes(1)
    const [aliceAdd, bobAdd] = decodeBatch().filter((call) => call.name === 'addDelegate')
    expect(aliceAdd.args[0]).toBe(ALICE)
    expect(bobAdd.args[0]).toBe(BOB)
  })

  it('does not enable a module the Safe already has, and sends every call to it', async () => {
    const moduleAddress = requireModuleAddress()

    await build([pair()], [], [addressExBuilder().with({ value: moduleAddress }).build()])

    expect(names()).toEqual(['addDelegate', 'setAllowance'])
    expect(decodeBatch().every((call) => call.to === moduleAddress)).toBe(true)
    expect(mockSDK.createEnableModuleTx).not.toHaveBeenCalled()
  })

  it('adds only the spenders that are not delegates yet', async () => {
    await build([pair(), pair({ beneficiary: BOB })], [limitFor(ALICE, USDC)])

    const adds = decodeBatch().filter((call) => call.name === 'addDelegate')
    expect(adds).toHaveLength(1)
    expect(adds[0].args[0]).toBe(BOB)
  })

  it('resets an existing allowance with spend before setting it, and leaves an unspent one alone', async () => {
    await build(
      [pair(), pair({ tokenAddress: USDC, decimals: 6 })],
      [limitFor(ALICE, ZERO_ADDRESS, '5'), limitFor(ALICE, USDC, '0')],
    )

    expect(names()).toEqual(['enableModule', 'resetAllowance', 'setAllowance', 'setAllowance'])
    const reset = decodeBatch()[1]
    expect(reset.args).toEqual([ALICE, ZERO_ADDRESS])
  })

  it('encodes each row with its own amount, decimals and reset period', async () => {
    await build([
      pair({ amount: '1.5', resetTime: '0' }),
      pair({ tokenAddress: USDC, decimals: 6, amount: '250', resetTime: '10080' }),
    ])

    const [eth, usdc] = decodeBatch().filter((call) => call.name === 'setAllowance')
    // setAllowance(delegate, token, allowanceAmount, resetTimeMin, resetBaseMin)
    expect(eth.args).toEqual([ALICE, ZERO_ADDRESS, parseUnits('1.5', 18), BigInt(0), BigInt(0)])
    expect(usdc.args).toEqual([ALICE, USDC, parseUnits('250', 6), BigInt(10080), BigInt(NOW_MIN - 30)])
  })

  it('rejects an empty policy', async () => {
    await expect(build([])).rejects.toThrow(EMPTY_SPENDING_LIMITS_ERROR)
  })

  it('rejects the same spender and token twice, whatever the address casing', async () => {
    await expect(build([pair(), pair({ beneficiary: ALICE.toLowerCase() })])).rejects.toThrow(
      DUPLICATE_SPENDING_LIMIT_ERROR,
    )
  })

  it('rejects a token whose decimals are unknown instead of guessing', async () => {
    await expect(build([pair({ decimals: Number.NaN })])).rejects.toThrow(UNKNOWN_TOKEN_DECIMALS_ERROR)
  })

  it('rejects when no module address resolves for the chain', async () => {
    await expect(createSpendingLimitsTx([pair()], [], UNREGISTERED_CHAIN_ID, mockChain, [], true)).rejects.toThrow(
      NO_ALLOWANCE_MODULE_ERROR,
    )
  })

  it('builds on the scoped SDK and forwards the scope to the multisend when a scope is passed', async () => {
    const scopedSdk = {
      createEnableModuleTx: jest.fn(async () => ({ data: { data: ENABLE_MODULE_DATA, to: SAFE_ADDRESS } })),
    } as unknown as Safe
    const scope = { chainId: REGISTERED_CHAIN_ID, safeAddress: SAFE_ADDRESS, sdk: scopedSdk }

    await createSpendingLimitsTx([pair()], [], REGISTERED_CHAIN_ID, mockChain, [], true, scope)

    expect(scopedSdk.createEnableModuleTx).toHaveBeenCalled()
    expect(mockSDK.createEnableModuleTx).not.toHaveBeenCalled()
    expect(txSender.createMultiSendCallOnlyTx).toHaveBeenCalledWith(expect.any(Array), scope)
  })
})

/**
 * WA-2305 / CUS-132 — "spending limits UI stuck at transaction creation".
 *
 * The review step does `createNewSpendingLimitTx(...).then(setSafeTx).catch(setSafeTxError)`, and
 * `ReviewTransaction` renders its skeleton while `!safeTx && !safeTxError`. A builder that resolves
 * `undefined` therefore parks the flow on an indefinite spinner. Every unmet precondition must reject instead.
 */
describe('createNewSpendingLimitTx', () => {
  const data: NewSpendingLimitData = { beneficiary: ALICE, tokenAddress: USDC, amount: '12.5', resetTime: '1440' }

  it('rejects instead of resolving undefined when the Safe SDK is unavailable', async () => {
    jest.spyOn(safeCoreSDK, 'getSafeSDK').mockReturnValue(undefined)

    await expect(createNewSpendingLimitTx(data, [], REGISTERED_CHAIN_ID, mockChain, [], true, 6)).rejects.toThrow(
      /Safe SDK could not be initialized/,
    )
  })

  it('rejects instead of resolving undefined when no module address resolves for the chain', async () => {
    await expect(createNewSpendingLimitTx(data, [], UNREGISTERED_CHAIN_ID, mockChain, [], true, 6)).rejects.toThrow(
      NO_ALLOWANCE_MODULE_ERROR,
    )
  })

  it('rejects when the token decimals are unknown', async () => {
    await expect(
      createNewSpendingLimitTx(data, [], REGISTERED_CHAIN_ID, mockChain, [], true, undefined),
    ).rejects.toThrow(UNKNOWN_TOKEN_DECIMALS_ERROR)
  })

  it('produces the same batch as the multi-pair builder for one pair', async () => {
    await createNewSpendingLimitTx(data, [limitFor(ALICE, USDC, '3')], REGISTERED_CHAIN_ID, mockChain, [], true, 6)

    expect(names()).toEqual(['enableModule', 'resetAllowance', 'setAllowance'])
    const set = decodeBatch()[2]
    expect(set.args).toEqual([ALICE, USDC, parseUnits('12.5', 6), BigInt(1440), BigInt(NOW_MIN - 30)])
  })

  it('builds on the scoped SDK and forwards the scope when a scope is passed', async () => {
    const scopedSdk = {
      createEnableModuleTx: jest.fn(async () => ({ data: { data: ENABLE_MODULE_DATA, to: SAFE_ADDRESS } })),
    } as unknown as Safe
    const scope = { chainId: REGISTERED_CHAIN_ID, safeAddress: SAFE_ADDRESS, sdk: scopedSdk }

    await createNewSpendingLimitTx(data, [], REGISTERED_CHAIN_ID, mockChain, [], true, 6, scope)

    expect(scopedSdk.createEnableModuleTx).toHaveBeenCalled()
    expect(txSender.createMultiSendCallOnlyTx).toHaveBeenCalledWith(expect.any(Array), scope)
  })
})
