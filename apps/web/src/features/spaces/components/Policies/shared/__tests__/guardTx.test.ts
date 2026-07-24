import { AbiCoder, Interface, keccak256 } from 'ethers'
import {
  buildSetGuardTx,
  encodeConfiguration,
  encodeRequestConfiguration,
  encodeApplyConfiguration,
  computeConfigureRoot,
  SAFE_SET_GUARD_ABI,
  CONFIGURE_IMMEDIATELY_ABI,
  REQUEST_CONFIGURATION_ABI,
  APPLY_CONFIGURATION_ABI,
  OPERATION_CALL,
  type PolicyConfiguration,
} from '../guardTx'

const ERC20_TRANSFER_SELECTOR = '0xa9059cbb'

const SAFE = '0x1111111111111111111111111111111111111111'
const GUARD = '0x2222222222222222222222222222222222222222'
const POLICY = '0x3333333333333333333333333333333333333333'
const TOKEN = '0x4444444444444444444444444444444444444444'

describe('buildSetGuardTx', () => {
  it('encodes setGuard(guard) as a call to the Safe itself', () => {
    const tx = buildSetGuardTx(SAFE, GUARD)

    expect(tx.to).toBe(SAFE)
    expect(tx.value).toBe('0')

    const [decodedGuard] = new Interface(SAFE_SET_GUARD_ABI).decodeFunctionData('setGuard', tx.data)
    expect(decodedGuard.toLowerCase()).toBe(GUARD.toLowerCase())
  })
})

describe('encodeConfiguration', () => {
  const config: PolicyConfiguration = {
    target: TOKEN,
    selector: ERC20_TRANSFER_SELECTOR,
    operation: OPERATION_CALL,
    policy: POLICY,
    data: '0x',
  }

  it('encodes configureImmediately against the guard address', () => {
    const tx = encodeConfiguration(GUARD, [config])
    expect(tx.to).toBe(GUARD)
    expect(tx.value).toBe('0')
  })

  it('round-trips the Configuration[] through the ABI', () => {
    const tx = encodeConfiguration(GUARD, [config])
    const [decoded] = new Interface(CONFIGURE_IMMEDIATELY_ABI).decodeFunctionData('configureImmediately', tx.data)

    expect(decoded).toHaveLength(1)
    const [target, selector, operation, policy, data] = decoded[0]
    expect(target.toLowerCase()).toBe(TOKEN.toLowerCase())
    expect(selector).toBe(ERC20_TRANSFER_SELECTOR)
    expect(Number(operation)).toBe(OPERATION_CALL)
    expect(policy.toLowerCase()).toBe(POLICY.toLowerCase())
    expect(data).toBe('0x')
  })

  it('encodes multiple configurations preserving order', () => {
    const second: PolicyConfiguration = { ...config, target: '0x5555555555555555555555555555555555555555' }
    const tx = encodeConfiguration(GUARD, [config, second])
    const [decoded] = new Interface(CONFIGURE_IMMEDIATELY_ABI).decodeFunctionData('configureImmediately', tx.data)

    expect(decoded).toHaveLength(2)
    expect(decoded[0][0].toLowerCase()).toBe(TOKEN.toLowerCase())
    expect(decoded[1][0].toLowerCase()).toBe(second.target.toLowerCase())
  })
})

describe('delayed configuration (request / apply)', () => {
  const config: PolicyConfiguration = {
    target: TOKEN,
    selector: ERC20_TRANSFER_SELECTOR,
    operation: OPERATION_CALL,
    policy: POLICY,
    data: '0x',
  }

  const CONFIGURATION_TUPLE_ARRAY =
    'tuple(address target, bytes4 selector, uint8 operation, address policy, bytes data)[]'

  describe('computeConfigureRoot', () => {
    it('is keccak256(abi.encode(Configuration[])) — matching the on-chain root', () => {
      const root = computeConfigureRoot([config])

      const expected = keccak256(
        AbiCoder.defaultAbiCoder().encode(
          [CONFIGURATION_TUPLE_ARRAY],
          [[[config.target, config.selector, config.operation, config.policy, config.data]]],
        ),
      )
      expect(root).toBe(expected)
    })

    it('changes when any configuration field changes', () => {
      const a = computeConfigureRoot([config])
      const b = computeConfigureRoot([{ ...config, data: '0x01' }])
      expect(a).not.toBe(b)
    })

    it('is order-sensitive', () => {
      const second: PolicyConfiguration = { ...config, target: '0x5555555555555555555555555555555555555555' }
      expect(computeConfigureRoot([config, second])).not.toBe(computeConfigureRoot([second, config]))
    })
  })

  describe('encodeRequestConfiguration', () => {
    it('encodes requestConfiguration(root) against the guard, committing to the config root', () => {
      const tx = encodeRequestConfiguration(GUARD, [config])
      expect(tx.to).toBe(GUARD)
      expect(tx.value).toBe('0')

      const [root] = new Interface(REQUEST_CONFIGURATION_ABI).decodeFunctionData('requestConfiguration', tx.data)
      expect(root).toBe(computeConfigureRoot([config]))
    })
  })

  describe('encodeApplyConfiguration', () => {
    it('encodes applyConfiguration(Configuration[]) whose re-hash matches the requested root', () => {
      const tx = encodeApplyConfiguration(GUARD, [config])
      expect(tx.to).toBe(GUARD)
      expect(tx.value).toBe('0')

      const [decoded] = new Interface(APPLY_CONFIGURATION_ABI).decodeFunctionData('applyConfiguration', tx.data)
      expect(decoded).toHaveLength(1)
      const [target, selector, operation, policy, data] = decoded[0]
      expect(target.toLowerCase()).toBe(TOKEN.toLowerCase())
      expect(selector).toBe(ERC20_TRANSFER_SELECTOR)
      expect(Number(operation)).toBe(OPERATION_CALL)
      expect(policy.toLowerCase()).toBe(POLICY.toLowerCase())
      expect(data).toBe('0x')

      // The Configuration array applied re-hashes to the same root that was requested.
      const rehash = keccak256(
        AbiCoder.defaultAbiCoder().encode([CONFIGURATION_TUPLE_ARRAY], [[[target, selector, operation, policy, data]]]),
      )
      expect(rehash).toBe(computeConfigureRoot([config]))
    })
  })
})
