import { AbiCoder, Interface } from 'ethers'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { RECIPIENT_DATA_TYPE } from '../../components/Policies/ERC20TransferPolicy/contracts'
import {
  APPLY_CONFIGURATION_ABI,
  CONFIGURE_IMMEDIATELY_ABI,
  REQUEST_CONFIGURATION_ABI,
  SAFE_SET_GUARD_ABI,
} from '../../components/Policies/shared/guardTx'
import {
  canDecodePolicyTx,
  policyTxMethodOf,
  decodeConfigurations,
  decodeConfigureRoot,
  decodePolicyPayload,
  isClearedCosigner,
  isPolicyTxMethod,
} from '../policyTx'

const TOKEN = '0x51ff5573d2364108Dd4F294f28173F90E124b9F5'
const POLICY = '0x37AB4Fd7eFaDfC6cc35e09196f74c19F163EdA43'
const RECIPIENT = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const COSIGNER = '0x8b0aB586dF1Ca1f360cb26b34eEC2C3AF969E821'
const ROOT = `0x${'ab'.repeat(32)}`
const TRANSFER = '0xa9059cbb'

const recipientData = (recipients: Array<[string, boolean]>) =>
  AbiCoder.defaultAbiCoder().encode([RECIPIENT_DATA_TYPE], [recipients])

const configuration = (data: string) => [TOKEN, TRANSFER, 0, POLICY, data]

describe('isPolicyTxMethod', () => {
  it('matches the guard methods that carry a configuration', () => {
    expect(isPolicyTxMethod('requestConfiguration')).toBe(true)
    expect(isPolicyTxMethod('applyConfiguration')).toBe(true)
    expect(isPolicyTxMethod('configureImmediately')).toBe(true)
  })

  it('ignores anything else', () => {
    expect(isPolicyTxMethod('setGuard')).toBe(false)
    expect(isPolicyTxMethod(undefined)).toBe(false)
  })
})

describe('decodeConfigurations', () => {
  it('decodes a configureImmediately calldata', () => {
    const data = recipientData([[RECIPIENT, true]])
    const hexData = new Interface(CONFIGURE_IMMEDIATELY_ABI).encodeFunctionData('configureImmediately', [
      [configuration(data)],
    ])

    expect(decodeConfigurations(hexData)).toEqual([
      { target: TOKEN, selector: TRANSFER, operation: 0, policy: POLICY, data },
    ])
  })

  it('decodes an applyConfiguration calldata', () => {
    const hexData = new Interface(APPLY_CONFIGURATION_ABI).encodeFunctionData('applyConfiguration', [
      [configuration('0x')],
    ])

    expect(decodeConfigurations(hexData)).toHaveLength(1)
  })

  // The method name alone can't be trusted; the selector has to match our ABI.
  it('returns undefined for other calldata', () => {
    const setGuard = new Interface(SAFE_SET_GUARD_ABI).encodeFunctionData('setGuard', [POLICY])

    expect(decodeConfigurations(setGuard)).toBeUndefined()
    expect(decodeConfigurations('0x')).toBeUndefined()
    expect(decodeConfigurations(undefined)).toBeUndefined()
  })
})

describe('decodeConfigureRoot', () => {
  it('decodes the published root', () => {
    const hexData = new Interface(REQUEST_CONFIGURATION_ABI).encodeFunctionData('requestConfiguration', [ROOT])

    expect(decodeConfigureRoot(hexData)).toBe(ROOT)
  })

  it('returns undefined for other calldata', () => {
    expect(
      decodeConfigureRoot(new Interface(SAFE_SET_GUARD_ABI).encodeFunctionData('setGuard', [POLICY])),
    ).toBeUndefined()
  })
})

describe('canDecodePolicyTx', () => {
  it('is true only for calldata we can render', () => {
    const request = new Interface(REQUEST_CONFIGURATION_ABI).encodeFunctionData('requestConfiguration', [ROOT])
    const setGuard = new Interface(SAFE_SET_GUARD_ABI).encodeFunctionData('setGuard', [POLICY])

    expect(canDecodePolicyTx(request)).toBe(true)
    expect(canDecodePolicyTx(setGuard)).toBe(false)
  })
})

// The gateway can't decode the guard, so the method has to come from the selector.
describe('policyTxMethodOf', () => {
  it('names the method from the calldata alone', () => {
    const request = new Interface(REQUEST_CONFIGURATION_ABI).encodeFunctionData('requestConfiguration', [ROOT])
    const apply = new Interface(APPLY_CONFIGURATION_ABI).encodeFunctionData('applyConfiguration', [
      [configuration('0x')],
    ])
    const immediate = new Interface(CONFIGURE_IMMEDIATELY_ABI).encodeFunctionData('configureImmediately', [
      [configuration('0x')],
    ])

    expect(policyTxMethodOf(request)).toBe('requestConfiguration')
    expect(policyTxMethodOf(apply)).toBe('applyConfiguration')
    expect(policyTxMethodOf(immediate)).toBe('configureImmediately')
  })

  it('ignores anything that isn’t a guard configuration', () => {
    expect(policyTxMethodOf(new Interface(SAFE_SET_GUARD_ABI).encodeFunctionData('setGuard', [POLICY]))).toBeUndefined()
    expect(policyTxMethodOf('0x')).toBeUndefined()
    expect(policyTxMethodOf(undefined)).toBeUndefined()
  })

  // A matching selector isn't proof; the arguments have to decode too.
  it('rejects a matching selector with unreadable arguments', () => {
    const apply = new Interface(APPLY_CONFIGURATION_ABI).encodeFunctionData('applyConfiguration', [
      [configuration('0x')],
    ])

    expect(policyTxMethodOf(apply.slice(0, 42))).toBeUndefined()
  })
})

describe('decodePolicyPayload', () => {
  it('reads an ERC20 transfer allowlist, keeping removals distinct', () => {
    const data = recipientData([
      [RECIPIENT, true],
      [COSIGNER, false],
    ])

    expect(decodePolicyPayload(data, PolicyType.TokenWithdraw)).toEqual({
      kind: 'recipients',
      recipients: [
        { address: RECIPIENT, allowed: true },
        { address: COSIGNER, allowed: false },
      ],
    })
  })

  it('reads a cosigner address', () => {
    const data = AbiCoder.defaultAbiCoder().encode(['address'], [COSIGNER])

    expect(decodePolicyPayload(data, PolicyType.Cosigner)).toEqual({ kind: 'cosigner', cosigner: COSIGNER })
  })

  it('reports a cleared cosigner', () => {
    const data = AbiCoder.defaultAbiCoder().encode(['address'], [ZERO_ADDRESS])

    expect(isClearedCosigner(decodePolicyPayload(data, PolicyType.Cosigner))).toBe(true)
  })

  // Allow, Deny and native transfers read no payload at all.
  it.each([PolicyType.Allow, PolicyType.Deny, PolicyType.NativeTransfer] as const)(
    'reports no payload for %s',
    (type) => {
      expect(decodePolicyPayload('0x', type)).toEqual({ kind: 'none' })
    },
  )

  // Outside a space the policy type is unknown, so the shape has to carry it.
  it('falls back to the payload shape when the type is unknown', () => {
    const recipients = recipientData([[RECIPIENT, true]])
    const cosigner = AbiCoder.defaultAbiCoder().encode(['address'], [COSIGNER])

    expect(decodePolicyPayload(recipients).kind).toBe('recipients')
    expect(decodePolicyPayload(cosigner).kind).toBe('cosigner')
    expect(decodePolicyPayload('0x')).toEqual({ kind: 'none' })
  })

  // Better an honest hex dump than a wrong label.
  it('shows unattributable data raw', () => {
    expect(decodePolicyPayload('0xdeadbeef')).toEqual({ kind: 'raw', data: '0xdeadbeef' })
  })

  it('shows a mismatched payload raw rather than forcing the type', () => {
    expect(decodePolicyPayload('0xdeadbeef', PolicyType.TokenWithdraw)).toEqual({ kind: 'raw', data: '0xdeadbeef' })
  })
})
