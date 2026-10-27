import { AbiCoder, Interface, getAddress } from 'ethers'
import type { Address } from 'viem'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { NO_SELECTOR, OPERATION_CALL } from '../../shared/accessSelector'
import { REQUEST_CONFIGURATION_ABI } from '../../shared/guardTx'
import { ERC20_TRANSFER_SELECTOR, PERMISSION_ALWAYS, RECIPIENT_DATA_TYPE } from '../../shared/erc20TransferPolicy'
import { buildRecipientAllowlistBatch } from '../buildBatch'

const SAFE = '0x1111111111111111111111111111111111111111' as Address
const GUARD = '0x2222222222222222222222222222222222222222' as Address
const ERC20_POLICY = '0x3333333333333333333333333333333333333333' as Address
const NATIVE_POLICY = '0x4444444444444444444444444444444444444444' as Address
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as Address
const DAI = '0x6b175474e89094c44da98b954eedeac495271d0f' as Address
const ALICE = '0x5555555555555555555555555555555555555555' as Address
const BOB = '0x6666666666666666666666666666666666666666' as Address

const base = {
  safeAddress: SAFE,
  safePolicyGuard: GUARD,
  fallbackPolicy: undefined,
  policyContract: ERC20_POLICY,
  nativePolicyContract: NATIVE_POLICY,
  tokens: [USDC],
  recipients: [ALICE, BOB],
}

const decodeRecipients = (data: string) =>
  (AbiCoder.defaultAbiCoder().decode([RECIPIENT_DATA_TYPE], data)[0] as Array<[string, bigint]>).map(
    ([recipient, permission]) => [recipient, Number(permission)],
  )

describe('buildRecipientAllowlistBatch', () => {
  it('binds each ERC-20 transfer to the recipients with an always permission', () => {
    const { configurations } = buildRecipientAllowlistBatch({ ...base, tokens: [USDC, DAI] })

    expect(configurations.map(({ target, selector, policy }) => ({ target, selector, policy }))).toEqual([
      { target: getAddress(USDC), selector: ERC20_TRANSFER_SELECTOR, policy: ERC20_POLICY },
      { target: getAddress(DAI), selector: ERC20_TRANSFER_SELECTOR, policy: ERC20_POLICY },
    ])
    expect(decodeRecipients(configurations[0].data)).toEqual([
      [ALICE, PERMISSION_ALWAYS],
      [BOB, PERMISSION_ALWAYS],
    ])
  })

  it('lists each recipient once', () => {
    const { configurations } = buildRecipientAllowlistBatch({ ...base, recipients: [ALICE, ALICE] })

    expect(decodeRecipients(configurations[0].data)).toEqual([[ALICE, PERMISSION_ALWAYS]])
  })

  it('keys the native coin per recipient and revokes a recipient left out', () => {
    const { configurations } = buildRecipientAllowlistBatch({
      ...base,
      tokens: [ZERO_ADDRESS as Address],
      recipients: [ALICE],
      currentNativeRecipients: [ALICE, BOB],
    })

    expect(configurations).toEqual([
      { target: ALICE, selector: NO_SELECTOR, operation: OPERATION_CALL, policy: NATIVE_POLICY, data: '0x' },
      { target: BOB, selector: NO_SELECTOR, operation: OPERATION_CALL, policy: ZERO_ADDRESS, data: '0x' },
    ])
  })

  it('requires the native policy to cover the native coin', () => {
    expect(() =>
      buildRecipientAllowlistBatch({ ...base, tokens: [ZERO_ADDRESS as Address], nativePolicyContract: undefined }),
    ).toThrow(/NativeTransferPolicy/)
  })

  it('applies at once and enables the guard when the Safe has none', () => {
    const { mode, txs } = buildRecipientAllowlistBatch(base)

    expect(mode).toBe('immediate')
    expect(txs).toHaveLength(3)
  })

  it('requests the change when the policy guard is already enabled', () => {
    const { mode, txs, configureRoot } = buildRecipientAllowlistBatch({
      ...base,
      currentGuard: GUARD,
      currentModuleGuard: GUARD,
    })

    expect(mode).toBe('request')
    const [root] = new Interface(REQUEST_CONFIGURATION_ABI).decodeFunctionData('requestConfiguration', txs[0].data)
    expect(root).toBe(configureRoot)
  })

  it.each([
    ['no token', { tokens: [] }, /at least one token/],
    ['no recipient', { recipients: [] }, /at least one recipient/],
    ['an invalid recipient', { recipients: ['0xnope' as Address] }, /Invalid address/],
  ])('rejects %s', (_, overrides, message) => {
    expect(() => buildRecipientAllowlistBatch({ ...base, ...overrides })).toThrow(message)
  })
})
