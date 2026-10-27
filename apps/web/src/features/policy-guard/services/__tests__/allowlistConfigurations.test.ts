import { AbiCoder } from 'ethers'
import { OperationType } from '@safe-global/types-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import {
  EMPTY_ALLOWLIST_ERROR,
  NATIVE_POLICY_UNAVAILABLE_ERROR,
  TOO_MANY_CONFIGURATIONS_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { getPolicyEngineAddress } from '../policyEngineDeployments'
import {
  MAX_POLICY_CONFIGURATIONS,
  buildAllowlistConfigurations,
  encodeErc20TransferPolicyData,
} from '../allowlistConfigurations'

const CHAIN_ID = '11155111'
const TOKEN = '0x1111111111111111111111111111111111111111'
const TOKEN_2 = '0x2222222222222222222222222222222222222222'
const ALICE = '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa'
const BOB = '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'

describe('allowlistConfigurations', () => {
  const erc20Policy = getPolicyEngineAddress(CHAIN_ID, 'ERC20TransferPolicy')
  const nativePolicy = getPolicyEngineAddress(CHAIN_ID, 'NativeTransferPolicy')

  it('maps an ERC-20 rule to one transfer configuration', () => {
    expect(buildAllowlistConfigurations(CHAIN_ID, [{ tokenAddress: TOKEN, recipients: [ALICE, BOB] }])).toEqual([
      {
        target: TOKEN,
        selector: '0xa9059cbb',
        operation: OperationType.Call,
        policy: erc20Policy,
        data: encodeErc20TransferPolicyData([ALICE, BOB]),
      },
    ])
  })

  it('maps a native rule to one configuration per recipient', () => {
    const configurations = buildAllowlistConfigurations(CHAIN_ID, [
      { tokenAddress: ZERO_ADDRESS, recipients: [ALICE, BOB] },
    ])

    expect(configurations).toEqual(
      [ALICE, BOB].map((target) => ({
        target,
        selector: '0x00000000',
        operation: OperationType.Call,
        policy: nativePolicy,
        data: '0x',
      })),
    )
  })

  it('keeps ERC-20 and native configurations in rule order', () => {
    const configurations = buildAllowlistConfigurations(CHAIN_ID, [
      { tokenAddress: TOKEN, recipients: [ALICE] },
      { tokenAddress: ZERO_ADDRESS, recipients: [BOB] },
      { tokenAddress: TOKEN_2, recipients: [BOB] },
    ])

    expect(configurations.map((c) => c.target)).toEqual([TOKEN, BOB, TOKEN_2])
  })

  it('throws when a native rule is on a chain without the native policy', () => {
    expect(() => buildAllowlistConfigurations('100', [{ tokenAddress: ZERO_ADDRESS, recipients: [ALICE] }])).toThrow(
      NATIVE_POLICY_UNAVAILABLE_ERROR,
    )
  })

  it('throws when there are no rules', () => {
    expect(() => buildAllowlistConfigurations(CHAIN_ID, [])).toThrow(EMPTY_ALLOWLIST_ERROR)
  })

  it.each([TOKEN, ZERO_ADDRESS])('throws when a rule for %s has no recipients', (tokenAddress) => {
    expect(() => buildAllowlistConfigurations(CHAIN_ID, [{ tokenAddress, recipients: [] }])).toThrow(
      EMPTY_ALLOWLIST_ERROR,
    )
  })

  it('allows exactly the maximum number of configurations', () => {
    const recipients = Array.from(
      { length: MAX_POLICY_CONFIGURATIONS },
      (_, i) => `0x${(i + 1).toString(16).padStart(40, '0')}`,
    )

    expect(buildAllowlistConfigurations(CHAIN_ID, [{ tokenAddress: ZERO_ADDRESS, recipients }])).toHaveLength(
      MAX_POLICY_CONFIGURATIONS,
    )
  })

  it('throws when there are more configurations than the maximum', () => {
    const recipients = Array.from(
      { length: MAX_POLICY_CONFIGURATIONS + 1 },
      (_, i) => `0x${(i + 1).toString(16).padStart(40, '0')}`,
    )

    expect(() => buildAllowlistConfigurations(CHAIN_ID, [{ tokenAddress: ZERO_ADDRESS, recipients }])).toThrow(
      TOO_MANY_CONFIGURATIONS_ERROR,
    )
  })

  it('encodes the recipients as ALWAYS-permission tuples', () => {
    const data = encodeErc20TransferPolicyData([ALICE, BOB])

    const [decoded] = AbiCoder.defaultAbiCoder().decode(['tuple(address recipient, uint8 permission)[]'], data)

    expect(decoded.map(([recipient, permission]: [string, bigint]) => [recipient, Number(permission)])).toEqual([
      [ALICE, 2],
      [BOB, 2],
    ])
  })
})
