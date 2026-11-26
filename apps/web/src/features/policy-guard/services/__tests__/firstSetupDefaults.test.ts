import { getAddress } from 'ethers'
import { faker } from '@faker-js/faker'
import { OperationType } from '@safe-global/types-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { ALLOWLIST_UNAVAILABLE_ERROR } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { PolicyConfiguration } from '../../public/types'
import {
  getOfficialMultiSendCallOnlyAddresses,
  MULTI_SEND_SELECTOR,
  withFirstSetupDefaults,
} from '../firstSetupDefaults'

const CHAIN_ID = '11155111'
const SAFE = getAddress(faker.finance.ethereumAddress())
const ALLOW_POLICY = '0x92e94Af03982C2486dffa8DcBc5d069D33996eF2'
const DENY_POLICY = '0x348d9F0B2fECb0bF88655C74Ed3eFD5052A9E436'
const MULTI_SEND_POLICY = '0xF933Ec646F9cd6Dd27Ae2f808D133D3f5847210c'
const MULTI_SEND_CALL_ONLY = {
  '1.3.0 canonical': '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D',
  '1.3.0 eip155': '0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B',
  '1.4.1': '0x9641d764fc13c8B624c04430C7356C1C7C8102e2',
  '1.5.0': '0xA83c336B20401Af773B6219BA5027174338D1836',
}

const transfer: PolicyConfiguration = {
  target: '0x1111111111111111111111111111111111111111',
  selector: '0xa9059cbb',
  operation: OperationType.Call,
  policy: '0x25DDa3b8974a10E93ca188F9C149A42F938Bd187',
  data: '0x1234',
}

const binding = (target: string): PolicyConfiguration => ({
  target,
  selector: '0x8d80ff0a',
  operation: OperationType.DelegateCall,
  policy: MULTI_SEND_POLICY,
  data: '0x',
})

const rejectAccess = (policy = ALLOW_POLICY): PolicyConfiguration => ({
  target: SAFE,
  selector: '0x00000000',
  operation: OperationType.Call,
  policy,
  data: '0x',
})

const fallback = (operation: OperationType, policy = DENY_POLICY): PolicyConfiguration => ({
  target: ZERO_ADDRESS,
  selector: '0x00000000',
  operation,
  policy,
  data: '0x',
})

describe('getOfficialMultiSendCallOnlyAddresses', () => {
  it.each(['1', '137', '11155111'])(
    'lists every official MultiSendCallOnly once, checksummed, on chain %s',
    (chainId) => {
      const addresses = getOfficialMultiSendCallOnlyAddresses(chainId)

      expect([...addresses].sort()).toEqual(Object.values(MULTI_SEND_CALL_ONLY).sort())
    },
  )

  it('is empty on a chain without a deployment', () => {
    expect(getOfficialMultiSendCallOnlyAddresses('100000000000')).toEqual([])
  })
})

describe('withFirstSetupDefaults', () => {
  it('derives the multiSend selector from its ABI', () => {
    expect(MULTI_SEND_SELECTOR).toBe('0x8d80ff0a')
  })

  it('appends a MultiSendPolicy binding per official MultiSendCallOnly, the reject access, then the CALL and DELEGATECALL deny fallbacks', () => {
    const installed = withFirstSetupDefaults(CHAIN_ID, SAFE, [transfer])

    expect(installed).toEqual([
      transfer,
      ...getOfficialMultiSendCallOnlyAddresses(CHAIN_ID).map(binding),
      rejectAccess(),
      fallback(OperationType.Call),
      fallback(OperationType.DelegateCall),
    ])
  })

  it('should, when it is a first setup, let the Safe call itself with no data through the AllowPolicy, so the signers can reject', () => {
    const installed = withFirstSetupDefaults(CHAIN_ID, SAFE, [transfer])

    expect(installed.filter(({ target }) => target === SAFE)).toEqual([
      { target: SAFE, selector: '0x00000000', operation: OperationType.Call, policy: ALLOW_POLICY, data: '0x' },
    ])
  })

  it('should, when the caller configured the Safe calling itself with no data, install the reject access in its place', () => {
    const own = rejectAccess(DENY_POLICY)

    const installed = withFirstSetupDefaults(CHAIN_ID, SAFE, [transfer, own])

    expect(installed.filter(({ target }) => target === SAFE)).toEqual([rejectAccess()])
  })

  it('should, when the caller configured a fallback that allows, install the two deny fallbacks in its place', () => {
    const own = fallback(OperationType.Call, ALLOW_POLICY)

    const installed = withFirstSetupDefaults(CHAIN_ID, SAFE, [transfer, own])

    expect(installed.filter(({ target }) => target === ZERO_ADDRESS)).toEqual([
      fallback(OperationType.Call, DENY_POLICY),
      fallback(OperationType.DelegateCall, DENY_POLICY),
    ])
  })

  it('does not duplicate a MultiSend access the caller already configured', () => {
    const own = { ...binding(MULTI_SEND_CALL_ONLY['1.5.0'].toLowerCase()), policy: ALLOW_POLICY }

    const installed = withFirstSetupDefaults(CHAIN_ID, SAFE, [own])

    const bound = installed.filter(({ selector }) => selector === MULTI_SEND_SELECTOR)
    expect(bound).toHaveLength(Object.keys(MULTI_SEND_CALL_ONLY).length)
    expect(bound[0]).toBe(own)
  })

  it('throws when the policies are not deployed on the chain', () => {
    expect(() => withFirstSetupDefaults('100', SAFE, [transfer])).toThrow(ALLOWLIST_UNAVAILABLE_ERROR)
  })
})
