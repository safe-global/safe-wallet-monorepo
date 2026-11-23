import { AbiCoder, getAddress } from 'ethers'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { PolicyConfigurationDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { AllowlistPolicyData, PolicyTokenInfo } from '@safe-global/views/features/spaces/components/Policies/types'
import { applyAllowlistRequest } from '../applyAllowlistRequest'

const ERC20_TRANSFER_SELECTOR = '0xa9059cbb'
const NATIVE_TRANSFER_SELECTOR = '0x00000000'
const ERC20_POLICY = getAddress('0x' + 'e1'.repeat(20))
const NATIVE_POLICY = getAddress('0x' + 'e2'.repeat(20))

const address = (byte: string) => getAddress('0x' + byte.repeat(20))

const USDC = address('ac')
const DAI = address('da')
const ALICE = address('a1')
const BOB = address('b0')
const CAROL = address('ca')

const token = (tokenAddress: string, symbol: string): PolicyTokenInfo => ({
  address: tokenAddress,
  symbol,
  decimals: 18,
  logoUri: `https://logo/${symbol}`,
})

const TOKENS: Record<string, PolicyTokenInfo> = {
  [USDC]: token(USDC, 'USDC'),
  [DAI]: token(DAI, 'DAI'),
  [ZERO_ADDRESS]: token(ZERO_ADDRESS, 'ETH'),
}

const resolveToken = (tokenAddress: string): PolicyTokenInfo =>
  TOKENS[getAddress(tokenAddress)] ?? token(tokenAddress, 'UNKNOWN')

const encode = (entries: Array<[string, number]>): string =>
  AbiCoder.defaultAbiCoder().encode(['tuple(address recipient, uint8 permission)[]'], [entries])

const allow = (target: string, recipients: string[]): PolicyConfigurationDto => ({
  target,
  selector: ERC20_TRANSFER_SELECTOR,
  operation: 0,
  policy: ERC20_POLICY,
  data: encode(recipients.map((recipient) => [recipient, 2])),
})

const revoke = (target: string, recipients: string[]): PolicyConfigurationDto => ({
  ...allow(target, []),
  data: encode(recipients.map((recipient) => [recipient, 0])),
})

const unbind = (target: string, selector: string): PolicyConfigurationDto => ({
  target,
  selector,
  operation: 0,
  policy: ZERO_ADDRESS,
  data: '0x',
})

const allowNative = (recipient: string): PolicyConfigurationDto => ({
  target: recipient,
  selector: NATIVE_TRANSFER_SELECTOR,
  operation: 0,
  policy: NATIVE_POLICY,
  data: '0x',
})

const always = (account: string) => ({ account, permission: 'ALWAYS' as const })

const LIVE: AllowlistPolicyData = {
  entries: [
    { token: TOKENS[USDC], recipients: [always(ALICE), always(BOB)] },
    { token: TOKENS[DAI], recipients: [always(ALICE)] },
  ],
}

describe('applyAllowlistRequest', () => {
  it('should mark a recipient added, when the request allows a new one', () => {
    const result = applyAllowlistRequest(LIVE, [allow(USDC, [CAROL])], resolveToken)

    expect(result.entries).toEqual([
      { token: TOKENS[USDC], recipients: [always(ALICE), always(BOB), always(CAROL)] },
      { token: TOKENS[DAI], recipients: [always(ALICE)] },
    ])
    expect(result.changes).toEqual({
      recipients: [{ address: ALICE }, { address: BOB }, { address: CAROL, change: 'added' }],
      tokens: [TOKENS[USDC], TOKENS[DAI]],
    })
  })

  it('should mark a recipient removed, when the request revokes its only token', () => {
    const result = applyAllowlistRequest(LIVE, [revoke(USDC, [BOB])], resolveToken)

    expect(result.entries).toEqual([
      { token: TOKENS[USDC], recipients: [always(ALICE)] },
      { token: TOKENS[DAI], recipients: [always(ALICE)] },
    ])
    expect(result.changes?.recipients).toEqual([{ address: ALICE }, { address: BOB, change: 'removed' }])
  })

  it('should mark one recipient added and another removed, when the request adds and revokes', () => {
    const result = applyAllowlistRequest(LIVE, [allow(USDC, [CAROL]), revoke(USDC, [BOB])], resolveToken)

    expect(result.changes?.recipients).toEqual([
      { address: ALICE },
      { address: CAROL, change: 'added' },
      { address: BOB, change: 'removed' },
    ])
  })

  it('should mark a token removed with its symbol and only the recipients no other token allows, when the request unbinds it', () => {
    const result = applyAllowlistRequest(
      LIVE,
      [revoke(USDC, [ALICE, BOB]), unbind(USDC, ERC20_TRANSFER_SELECTOR)],
      resolveToken,
    )

    expect(result.entries).toEqual([{ token: TOKENS[DAI], recipients: [always(ALICE)] }])
    expect(result.changes).toEqual({
      recipients: [{ address: ALICE }, { address: BOB, change: 'removed' }],
      tokens: [TOKENS[DAI], { ...TOKENS[USDC], change: 'removed' }],
    })
  })

  it('should mark a native recipient and the native token added, when the request allows a native recipient', () => {
    const result = applyAllowlistRequest(LIVE, [allowNative(CAROL)], resolveToken)

    expect(result.entries).toContainEqual({ token: TOKENS[ZERO_ADDRESS], recipients: [always(CAROL)] })
    expect(result.changes).toEqual({
      recipients: [{ address: ALICE }, { address: BOB }, { address: CAROL, change: 'added' }],
      tokens: [TOKENS[USDC], TOKENS[DAI], { ...TOKENS[ZERO_ADDRESS], change: 'added' }],
    })
  })

  it('should remove a native recipient and the native token, when the request unbinds its last recipient', () => {
    const live: AllowlistPolicyData = {
      entries: [...LIVE.entries, { token: TOKENS[ZERO_ADDRESS], recipients: [always(CAROL)] }],
    }

    const result = applyAllowlistRequest(live, [unbind(CAROL, NATIVE_TRANSFER_SELECTOR)], resolveToken)

    expect(result.entries).toEqual(LIVE.entries)
    expect(result.changes).toEqual({
      recipients: [{ address: ALICE }, { address: BOB }, { address: CAROL, change: 'removed' }],
      tokens: [TOKENS[USDC], TOKENS[DAI], { ...TOKENS[ZERO_ADDRESS], change: 'removed' }],
    })
  })

  it('should keep a native token, when the request unbinds one of its recipients', () => {
    const live: AllowlistPolicyData = {
      entries: [{ token: TOKENS[ZERO_ADDRESS], recipients: [always(ALICE), always(CAROL)] }],
    }

    const result = applyAllowlistRequest(live, [unbind(CAROL, NATIVE_TRANSFER_SELECTOR)], resolveToken)

    expect(result.entries).toEqual([{ token: TOKENS[ZERO_ADDRESS], recipients: [always(ALICE)] }])
    expect(result.changes?.tokens).toEqual([TOKENS[ZERO_ADDRESS]])
  })

  it('should treat addresses that differ only in case as unchanged', () => {
    const result = applyAllowlistRequest(
      LIVE,
      [allow(USDC.toLowerCase(), [ALICE.toLowerCase()]), allow(DAI.toLowerCase(), [BOB.toLowerCase()])],
      resolveToken,
    )

    expect(result.entries).toEqual([
      { token: TOKENS[USDC], recipients: [always(ALICE), always(BOB)] },
      { token: TOKENS[DAI], recipients: [always(ALICE), always(BOB)] },
    ])
    expect(result.changes).toEqual({
      recipients: [{ address: ALICE }, { address: BOB }],
      tokens: [TOKENS[USDC], TOKENS[DAI]],
    })
  })

  it('should mark nothing, when the request changes no pair', () => {
    const result = applyAllowlistRequest(LIVE, [], resolveToken)

    expect(result.entries).toEqual(LIVE.entries)
    expect(result.changes).toEqual({
      recipients: [{ address: ALICE }, { address: BOB }],
      tokens: [TOKENS[USDC], TOKENS[DAI]],
    })
  })
})
