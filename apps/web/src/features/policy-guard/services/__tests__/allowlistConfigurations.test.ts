import { AbiCoder } from 'ethers'
// eslint-disable-next-line no-restricted-imports -- asserts the review step classifies every output
import { getRuleKind } from '@/features/spaces/components/Policies/RecipientAllowlistFlow/ReviewStep/ruleKind'
import { OperationType } from '@safe-global/types-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import {
  ALLOWLIST_UNAVAILABLE_ERROR,
  EMPTY_ALLOWLIST_ERROR,
  TOO_MANY_CONFIGURATIONS_ERROR,
  ZERO_ADDRESS_RECIPIENT_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { getPolicyEngineAddress } from '../policyEngineDeployments'
import {
  MAX_POLICY_CONFIGURATIONS,
  buildAllowlistChangeConfigurations,
  buildAllowlistConfigurations,
  buildAllowlistRemovalConfigurations,
  getAllowlistPairKeys,
  clearGuardExitConfigurations,
  decodeErc20TransferPolicyData,
  encodeErc20TransferPolicyData,
} from '../allowlistConfigurations'

const CHAIN_ID = '11155111'
const TOKEN = '0x1111111111111111111111111111111111111111'
const TOKEN_2 = '0x2222222222222222222222222222222222222222'
const ALICE = '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa'
const BOB = '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
const SAFE = '0x5afe5afE5afE5afE5afE5aFe5afe5Afe5afE5AFe'
const PERMISSION_NONE = 0

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
      ALLOWLIST_UNAVAILABLE_ERROR,
    )
  })

  it('throws when an ERC-20 rule is on a chain without the ERC-20 policy', () => {
    expect(() => buildAllowlistConfigurations('100', [{ tokenAddress: TOKEN, recipients: [ALICE] }])).toThrow(
      ALLOWLIST_UNAVAILABLE_ERROR,
    )
  })

  it.each([TOKEN, ZERO_ADDRESS])('throws when a rule for %s lists the zero address as a recipient', (tokenAddress) => {
    expect(() => buildAllowlistConfigurations(CHAIN_ID, [{ tokenAddress, recipients: [ALICE, ZERO_ADDRESS] }])).toThrow(
      ZERO_ADDRESS_RECIPIENT_ERROR,
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

  it('decodes the recipients it encoded, in order', () => {
    expect(decodeErc20TransferPolicyData(encodeErc20TransferPolicyData([ALICE, BOB]))).toEqual([ALICE, BOB])
  })
})

describe('buildAllowlistRemovalConfigurations', () => {
  const erc20Policy = getPolicyEngineAddress(CHAIN_ID, 'ERC20TransferPolicy')
  const allowPolicy = getPolicyEngineAddress(CHAIN_ID, 'AllowPolicy')
  const guardExit = [
    { target: SAFE, selector: '0xe19a9dd9', operation: OperationType.Call, policy: allowPolicy, data: '0x' },
    { target: SAFE, selector: '0xe068df37', operation: OperationType.Call, policy: allowPolicy, data: '0x' },
  ]

  it('should revoke the recipients, then unbind the token rule, then allow the guard setters, when a token is allowlisted', () => {
    expect(
      buildAllowlistRemovalConfigurations({
        chainId: CHAIN_ID,
        safeAddress: SAFE,
        rules: [{ tokenAddress: TOKEN, recipients: [ALICE, BOB] }],
      }),
    ).toEqual([
      {
        target: TOKEN,
        selector: '0xa9059cbb',
        operation: OperationType.Call,
        policy: erc20Policy,
        data: encodeErc20TransferPolicyData([ALICE, BOB], PERMISSION_NONE),
      },
      { target: TOKEN, selector: '0xa9059cbb', operation: OperationType.Call, policy: ZERO_ADDRESS, data: '0x' },
      ...guardExit,
    ])
  })

  it('should unbind one native rule per recipient, when ETH is allowlisted', () => {
    expect(
      buildAllowlistRemovalConfigurations({
        chainId: CHAIN_ID,
        safeAddress: SAFE,
        rules: [{ tokenAddress: ZERO_ADDRESS, recipients: [ALICE, BOB] }],
      }),
    ).toEqual([
      { target: ALICE, selector: '0x00000000', operation: OperationType.Call, policy: ZERO_ADDRESS, data: '0x' },
      { target: BOB, selector: '0x00000000', operation: OperationType.Call, policy: ZERO_ADDRESS, data: '0x' },
      ...guardExit,
    ])
  })

  it('should throw that the allowlist is unavailable, when the chain has no policy deployments', () => {
    expect(() =>
      buildAllowlistRemovalConfigurations({
        chainId: '999999',
        safeAddress: SAFE,
        rules: [{ tokenAddress: TOKEN, recipients: [ALICE] }],
      }),
    ).toThrow(ALLOWLIST_UNAVAILABLE_ERROR)
  })
})

describe('clearGuardExitConfigurations', () => {
  it('should unbind both guard setters, when a setup clears what a removal left', () => {
    expect(clearGuardExitConfigurations(SAFE)).toEqual([
      { target: SAFE, selector: '0xe19a9dd9', operation: OperationType.Call, policy: ZERO_ADDRESS, data: '0x' },
      { target: SAFE, selector: '0xe068df37', operation: OperationType.Call, policy: ZERO_ADDRESS, data: '0x' },
    ])
  })
})

describe('buildAllowlistChangeConfigurations', () => {
  const CAROL = '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
  const USDC = TOKEN
  const DAI = TOKEN_2
  const erc20Policy = getPolicyEngineAddress(CHAIN_ID, 'ERC20TransferPolicy')
  const nativePolicy = getPolicyEngineAddress(CHAIN_ID, 'NativeTransferPolicy')

  const rule = (tokenAddress: string, ...recipients: string[]) => ({ tokenAddress, recipients })
  const transfer = (token: string, recipients: string[], permission: number) => ({
    target: token,
    selector: '0xa9059cbb',
    operation: OperationType.Call,
    policy: erc20Policy,
    data: encodeErc20TransferPolicyData(recipients, permission),
  })
  const unbindConfig = (target: string, selector: string) => ({
    target,
    selector,
    operation: OperationType.Call,
    policy: ZERO_ADDRESS,
    data: '0x',
  })

  it('should return nothing, when the rules are unchanged', () => {
    const rules = [rule(USDC, ALICE, BOB), rule(ZERO_ADDRESS, ALICE)]

    expect(buildAllowlistChangeConfigurations(CHAIN_ID, rules, rules)).toEqual([])
  })

  it('should return nothing, when the same pairs differ only in case', () => {
    expect(
      buildAllowlistChangeConfigurations(
        CHAIN_ID,
        [rule(USDC.toLowerCase(), ALICE.toLowerCase(), BOB.toLowerCase()), rule(ZERO_ADDRESS, ALICE.toLowerCase())],
        [rule(USDC, ALICE, BOB), rule(ZERO_ADDRESS, ALICE)],
      ),
    ).toEqual([])
  })

  it('should allow only the added recipient, when one is added to a token', () => {
    expect(
      buildAllowlistChangeConfigurations(CHAIN_ID, [rule(USDC, ALICE, BOB)], [rule(USDC, ALICE, BOB, CAROL)]),
    ).toEqual([transfer(USDC, [CAROL], 2)])
  })

  it('should revoke only the removed recipient, when one is removed from a token', () => {
    expect(buildAllowlistChangeConfigurations(CHAIN_ID, [rule(USDC, ALICE, BOB)], [rule(USDC, ALICE)])).toEqual([
      transfer(USDC, [BOB], 0),
    ])
  })

  it('should allow before it revokes, when a recipient is added and another removed', () => {
    expect(buildAllowlistChangeConfigurations(CHAIN_ID, [rule(USDC, ALICE, BOB)], [rule(USDC, ALICE, CAROL)])).toEqual([
      transfer(USDC, [CAROL], 2),
      transfer(USDC, [BOB], 0),
    ])
  })

  it('should revoke every recipient, then unbind the token, when a token is removed', () => {
    expect(buildAllowlistChangeConfigurations(CHAIN_ID, [rule(USDC, ALICE, BOB)], [rule(DAI, ALICE)])).toEqual([
      transfer(DAI, [ALICE], 2),
      transfer(USDC, [ALICE, BOB], 0),
      unbindConfig(USDC, '0xa9059cbb'),
    ])
  })

  it('should allow the recipients of an added token', () => {
    expect(
      buildAllowlistChangeConfigurations(CHAIN_ID, [rule(USDC, ALICE)], [rule(USDC, ALICE), rule(DAI, ALICE)]),
    ).toEqual([transfer(DAI, [ALICE], 2)])
  })

  it('should unbind a removed native recipient and bind an added one', () => {
    expect(
      buildAllowlistChangeConfigurations(CHAIN_ID, [rule(ZERO_ADDRESS, ALICE)], [rule(ZERO_ADDRESS, CAROL)]),
    ).toEqual([
      { target: CAROL, selector: '0x00000000', operation: OperationType.Call, policy: nativePolicy, data: '0x' },
      unbindConfig(ALICE, '0x00000000'),
    ])
  })

  it('should compare against each token own recipients, when the live sets differ', () => {
    expect(
      buildAllowlistChangeConfigurations(
        CHAIN_ID,
        [rule(USDC, ALICE, BOB), rule(DAI, ALICE)],
        [rule(USDC, ALICE, BOB), rule(DAI, ALICE, BOB)],
      ),
    ).toEqual([transfer(DAI, [BOB], 2)])
  })

  it('should emit checksummed addresses, when the baseline is lowercase', () => {
    const [configuration] = buildAllowlistChangeConfigurations(
      CHAIN_ID,
      [rule(USDC.toLowerCase(), ALICE.toLowerCase())],
      [rule(USDC, ALICE, BOB)],
    )

    expect(configuration.target).toBe(USDC)
    expect(decodeErc20TransferPolicyData(configuration.data)).toEqual([BOB])
  })

  it('should throw, when a desired recipient is the zero address', () => {
    expect(() => buildAllowlistChangeConfigurations(CHAIN_ID, [rule(USDC, ALICE)], [rule(USDC, ZERO_ADDRESS)])).toThrow(
      ZERO_ADDRESS_RECIPIENT_ERROR,
    )
  })

  it('should throw, when the chain has no policy deployments', () => {
    expect(() => buildAllowlistChangeConfigurations('999999', [rule(USDC, ALICE)], [rule(USDC, ALICE, BOB)])).toThrow(
      ALLOWLIST_UNAVAILABLE_ERROR,
    )
  })

  it('should throw, when the change exceeds the configuration limit', () => {
    const recipients = Array.from(
      { length: MAX_POLICY_CONFIGURATIONS + 1 },
      (_, i) => `0x${(i + 1).toString(16).padStart(40, '0')}`,
    )

    expect(() => buildAllowlistChangeConfigurations(CHAIN_ID, [], [rule(ZERO_ADDRESS, ...recipients)])).toThrow(
      TOO_MANY_CONFIGURATIONS_ERROR,
    )
  })

  it('should give every configuration a known rule kind', () => {
    const configurations = buildAllowlistChangeConfigurations(
      CHAIN_ID,
      [rule(USDC, ALICE, BOB), rule(DAI, ALICE), rule(ZERO_ADDRESS, ALICE)],
      [rule(USDC, ALICE, CAROL), rule(ZERO_ADDRESS, CAROL)],
    )

    expect(configurations.map((configuration) => getRuleKind(CHAIN_ID, configuration))).toEqual([
      'erc20',
      'erc20Revoke',
      'erc20Revoke',
      'removal',
      'native',
      'removal',
    ])
  })
})

describe('getAllowlistPairKeys', () => {
  it('should key each token and recipient pair in lowercase', () => {
    expect([...getAllowlistPairKeys([{ tokenAddress: TOKEN, recipients: [ALICE, BOB] }])]).toEqual([
      `${TOKEN}:${ALICE.toLowerCase()}`,
      `${TOKEN}:${BOB.toLowerCase()}`,
    ])
  })

  it('should key the native token as the zero address', () => {
    expect(
      getAllowlistPairKeys([{ tokenAddress: ZERO_ADDRESS, recipients: [ALICE] }]).has(
        `${ZERO_ADDRESS}:${ALICE.toLowerCase()}`,
      ),
    ).toBe(true)
  })
})
