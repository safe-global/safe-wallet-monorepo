import { Interface, ZeroAddress } from 'ethers'
import { decodeGuardCheckFailure, encodeGuardCheck } from '../checkTransaction'
import { isKnownPolicyGuard, SAFE_POLICY_GUARD_BY_DELAY } from '../guards'

const ERC20_TRANSFER_POLICY = '0x25DDa3b8974a10E93ca188F9C149A42F938Bd187'
const MULTISEND_POLICY = '0xF933Ec646F9cd6Dd27Ae2f808D133D3f5847210c'
const DENY_POLICY = '0x348d9F0B2fECb0bF88655C74Ed3eFD5052A9E436'
const COSIGNER_POLICY = '0xd9f2A31C5C68422a466754cd4F4965Be2b6024FB'

const errs = new Interface([
  'error AccessDenied(address policy)',
  'error PolicyReverted(address policy, bytes reason)',
  'error NonZeroGasPrice()',
  'error Unauthorized()',
])
const accessDenied = (policy: string) => errs.encodeErrorResult('AccessDenied', [policy])
const policyReverted = (policy: string, reason: string) => errs.encodeErrorResult('PolicyReverted', [policy, reason])
const unauthorized = () => errs.encodeErrorResult('Unauthorized', [])

describe('encodeGuardCheck', () => {
  // The guard refuses any transaction carrying a gas price or safeTxGas, so the check must send zero.
  it('checks with no gas refund and no signature context', () => {
    const data = encodeGuardCheck({ to: ZeroAddress, value: 0n, data: '0x', operation: 0 })
    const iface = new Interface([
      'function checkTransaction(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,bytes signatures,address msgSender)',
    ])
    const [, , , , safeTxGas, , gasPrice, , , signatures] = iface.decodeFunctionData('checkTransaction', data)

    expect(safeTxGas).toBe(0n)
    expect(gasPrice).toBe(0n)
    expect(signatures).toBe('0x')
  })

  it('carries the operation, so a delegatecall is checked as one', () => {
    const data = encodeGuardCheck({ to: ZeroAddress, value: 0n, data: '0x', operation: 1 })

    expect(data).toContain('1'.padStart(2, '0'))
  })
})

describe('decodeGuardCheckFailure', () => {
  // Captured from Sepolia: a native transfer to an address no policy covers, on a Safe with no fallback.
  it('reads a zero-policy AccessDenied as nothing covering the action', () => {
    expect(decodeGuardCheckFailure(accessDenied(ZeroAddress))).toEqual({ status: 'no-policy' })
  })

  // Captured from Sepolia: enableModule, which that Safe binds to DenyPolicy.
  it('names the policy that denied the action', () => {
    expect(decodeGuardCheckFailure(accessDenied(DENY_POLICY))).toEqual({ status: 'denied', policy: DENY_POLICY })
  })

  // Captured from Sepolia: an ERC20 transfer to a recipient outside the allowlist.
  it('names the policy and its reason when a policy reverts', () => {
    expect(decodeGuardCheckFailure(policyReverted(ERC20_TRANSFER_POLICY, unauthorized()))).toEqual({
      status: 'denied',
      policy: ERC20_TRANSFER_POLICY,
      reason: 'Unauthorized',
    })
  })

  // Captured from Sepolia: a batch whose inner transfer no policy covers. Reporting the wrapper
  // would blame MultiSendPolicy; the inner verdict is what the user has to act on.
  it('unwraps a recursing policy to the verdict on the inner call', () => {
    const nested = policyReverted(MULTISEND_POLICY, accessDenied(ZeroAddress))

    expect(decodeGuardCheckFailure(nested)).toEqual({ status: 'no-policy' })
  })

  it('unwraps to the inner policy when the inner call is denied by one', () => {
    const nested = policyReverted(MULTISEND_POLICY, accessDenied(DENY_POLICY))

    expect(decodeGuardCheckFailure(nested)).toEqual({ status: 'denied', policy: DENY_POLICY })
  })

  // Captured from Sepolia: a cosigner-protected action checked before it has been cosigned.
  it('keeps the policy that reverted rather than losing it to the inner error', () => {
    expect(decodeGuardCheckFailure(policyReverted(COSIGNER_POLICY, unauthorized()))).toEqual({
      status: 'denied',
      policy: COSIGNER_POLICY,
      reason: 'Unauthorized',
    })
  })

  it('separates a refusal of the transaction shape from a policy verdict', () => {
    const result = decodeGuardCheckFailure(errs.encodeErrorResult('NonZeroGasPrice', []))

    expect(result.status).toBe('unsupported')
  })

  it.each([['0x'], [undefined], ['0xdeadbeef']])('claims nothing from %s', (data) => {
    expect(decodeGuardCheckFailure(data).status).toBe('unknown')
  })
})

describe('isKnownPolicyGuard', () => {
  it('recognises every deployed guard, whatever the case', () => {
    for (const address of Object.values(SAFE_POLICY_GUARD_BY_DELAY)) {
      expect(isKnownPolicyGuard(address)).toBe(true)
      expect(isKnownPolicyGuard(address.toLowerCase())).toBe(true)
    }
  })

  // An unknown guard behaves unpredictably, so nothing may be claimed about it.
  it.each([[ZeroAddress], ['0x1111111111111111111111111111111111111111'], [null], [undefined], ['']])(
    'does not recognise %s',
    (guard) => {
      expect(isKnownPolicyGuard(guard)).toBe(false)
    },
  )
})
