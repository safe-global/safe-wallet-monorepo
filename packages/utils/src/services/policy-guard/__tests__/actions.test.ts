import { classifyGuardAction, isGuardSelfCall } from '../actions'

const SAFE = '0xB4117948d9977ad44b4dadBA5D6E7e3793b78e97'
const TOKEN = '0x58e48F88bF943367f05F31164d2943FF4008EEc6'
const RECIPIENT = '0x8b0aB586dF1Ca1f360cb26b34eEC2C3AF969E821'
const MULTI_SEND = '0xA83c336B20401Af773B6219BA5027174338D1836'

const tx = (overrides: Partial<Parameters<typeof classifyGuardAction>[0]> = {}) => ({
  to: TOKEN,
  value: 0n,
  data: '0x',
  operation: 0,
  ...overrides,
})

describe('classifyGuardAction', () => {
  it('recognises an ERC20 transfer and transferFrom', () => {
    expect(classifyGuardAction(tx({ data: '0xa9059cbb0000' }), SAFE)).toBe('erc20-transfer')
    expect(classifyGuardAction(tx({ data: '0x23b872dd0000' }), SAFE)).toBe('erc20-transfer')
  })

  it('recognises a plain value transfer', () => {
    expect(classifyGuardAction(tx({ to: RECIPIENT, value: 1n, data: '0x' }), SAFE)).toBe('native-transfer')
  })

  // A zero-value call with no data moves nothing, so it is not a transfer.
  it('does not call a zero-value empty call a native transfer', () => {
    expect(classifyGuardAction(tx({ to: RECIPIENT, value: 0n, data: '0x' }), SAFE)).toBe('other')
  })

  it('recognises a batch by its delegatecall to multiSend', () => {
    expect(classifyGuardAction(tx({ to: MULTI_SEND, data: '0x8d80ff0a0000', operation: 1 }), SAFE)).toBe('multisend')
  })

  // A delegatecall anywhere else is arbitrary code, not a batch.
  it('does not call any other delegatecall a batch', () => {
    expect(classifyGuardAction(tx({ to: MULTI_SEND, data: '0xdeadbeef', operation: 1 }), SAFE)).toBe('other')
  })

  it('recognises a management call the Safe makes to itself', () => {
    expect(classifyGuardAction(tx({ to: SAFE, data: '0x0d582f13' }), SAFE)).toBe('safe-management')
    expect(classifyGuardAction(tx({ to: SAFE.toLowerCase(), data: '0x694e80c3' }), SAFE)).toBe('safe-management')
  })

  // The same selector aimed at another contract is not this Safe's management.
  it('does not call a management selector on another contract Safe management', () => {
    expect(classifyGuardAction(tx({ to: TOKEN, data: '0x0d582f13' }), SAFE)).toBe('other')
  })

  it('reports anything else as other', () => {
    expect(classifyGuardAction(tx({ data: '0xdeadbeef' }), SAFE)).toBe('other')
  })
})

describe('isGuardSelfCall', () => {
  const GUARD = '0x5202B1ebE100812437d47eae769e155945fbba6a'
  const selfCall = (over: Record<string, unknown> = {}) => ({
    to: GUARD,
    value: 0n as string | bigint,
    data: '0xa809eb8e',
    operation: 0,
    ...over,
  })

  // Confirmed against the guard on Sepolia: these three pass without a policy being consulted.
  it.each([
    ['requestConfiguration', '0xa809eb8e'],
    ['applyConfiguration', '0xb9ba2798'],
    ['invalidateRoot', '0x3eefdcce'],
  ])('recognises %s as the Safe managing its own policies', (_name, selector) => {
    expect(isGuardSelfCall(selfCall({ data: selector }), GUARD)).toBe(true)
    expect(isGuardSelfCall(selfCall({ data: selector, to: GUARD.toLowerCase() }), GUARD)).toBe(true)
  })

  // The guard refuses these outright rather than exempting them, as Sepolia confirms.
  it('does not exempt configureImmediately, which the guard refuses once it is enabled', () => {
    expect(isGuardSelfCall(selfCall({ data: '0x8446dc43' }), GUARD)).toBe(false)
  })

  it('does not exempt a call carrying value', () => {
    expect(isGuardSelfCall(selfCall({ value: 1n }), GUARD)).toBe(false)
  })

  it('does not exempt a delegatecall', () => {
    expect(isGuardSelfCall(selfCall({ operation: 1 }), GUARD)).toBe(false)
  })

  // The same selector aimed anywhere else is an ordinary transaction.
  it('does not exempt the same call to another contract', () => {
    expect(isGuardSelfCall(selfCall({ to: '0x1111111111111111111111111111111111111111' }), GUARD)).toBe(false)
  })

  it('exempts nothing when the Safe runs no guard', () => {
    expect(isGuardSelfCall(selfCall(), undefined)).toBe(false)
  })
})
