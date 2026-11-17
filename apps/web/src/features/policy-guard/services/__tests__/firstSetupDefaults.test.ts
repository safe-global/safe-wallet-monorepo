import { OperationType } from '@safe-global/types-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { ALLOWLIST_UNAVAILABLE_ERROR } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { PolicyConfiguration } from '../../types'
import {
  getOfficialMultiSendCallOnlyAddresses,
  MULTI_SEND_SELECTOR,
  withFirstSetupDefaults,
} from '../firstSetupDefaults'

let mockDefaultFallback = 'allow'
jest.mock('@/config/constants', () => ({
  ...jest.requireActual('@/config/constants'),
  get POLICY_DEFAULT_FALLBACK() {
    return mockDefaultFallback
  },
}))

const CHAIN_ID = '11155111'
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

const fallback = (operation: OperationType, policy = ALLOW_POLICY): PolicyConfiguration => ({
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
  beforeEach(() => {
    mockDefaultFallback = 'allow'
  })

  it('derives the multiSend selector from its ABI', () => {
    expect(MULTI_SEND_SELECTOR).toBe('0x8d80ff0a')
  })

  it('appends a MultiSendPolicy binding per official MultiSendCallOnly, then the CALL and DELEGATECALL fallbacks', () => {
    const installed = withFirstSetupDefaults(CHAIN_ID, [transfer])

    expect(installed).toEqual([
      transfer,
      ...getOfficialMultiSendCallOnlyAddresses(CHAIN_ID).map(binding),
      fallback(OperationType.Call),
      fallback(OperationType.DelegateCall),
    ])
  })

  it('installs DenyPolicy as the fallback when the env says deny', () => {
    mockDefaultFallback = 'deny'

    const installed = withFirstSetupDefaults(CHAIN_ID, [transfer])

    expect(installed.slice(-2)).toEqual([
      fallback(OperationType.Call, DENY_POLICY),
      fallback(OperationType.DelegateCall, DENY_POLICY),
    ])
  })

  it('takes an explicit fallback over the env', () => {
    mockDefaultFallback = 'deny'

    expect(withFirstSetupDefaults(CHAIN_ID, [transfer], 'allow').slice(-1)).toEqual([
      fallback(OperationType.DelegateCall, ALLOW_POLICY),
    ])
  })

  it.each([OperationType.Call, OperationType.DelegateCall])(
    'adds no fallback when the caller already configured one for operation %s',
    (operation) => {
      const own = fallback(operation, DENY_POLICY)

      const installed = withFirstSetupDefaults(CHAIN_ID, [transfer, own])

      expect(installed.filter(({ target }) => target === ZERO_ADDRESS)).toEqual([own])
    },
  )

  it('does not duplicate a MultiSend access the caller already configured', () => {
    const own = { ...binding(MULTI_SEND_CALL_ONLY['1.5.0'].toLowerCase()), policy: ALLOW_POLICY }

    const installed = withFirstSetupDefaults(CHAIN_ID, [own])

    const bound = installed.filter(({ selector }) => selector === MULTI_SEND_SELECTOR)
    expect(bound).toHaveLength(Object.keys(MULTI_SEND_CALL_ONLY).length)
    expect(bound[0]).toBe(own)
  })

  it('throws when the policies are not deployed on the chain', () => {
    expect(() => withFirstSetupDefaults('100', [transfer])).toThrow(ALLOWLIST_UNAVAILABLE_ERROR)
  })
})
