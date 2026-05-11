import { recoveryScanner } from '../recovery'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { createMockContext } from '../test-helpers'

describe('recoveryScanner', () => {
  it('returns not_applicable when chain does not support recovery', async () => {
    const result = await recoveryScanner.scan(createMockContext({ chainSupportsRecovery: false }))
    expect(result.status).toBe('not_applicable')
    expect(result.score).toBe(100)
  })

  it('returns issue when no modules are installed', async () => {
    const result = await recoveryScanner.scan(createMockContext({ chainSupportsRecovery: true, modules: [] }))
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('High')
    expect(result.score).toBe(20)
  })

  it('returns issue when modules is null', async () => {
    const result = await recoveryScanner.scan(createMockContext({ chainSupportsRecovery: true, modules: null }))
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('High')
  })

  it('ignores zero address modules', async () => {
    const result = await recoveryScanner.scan(
      createMockContext({
        chainSupportsRecovery: true,
        modules: [{ value: ZERO_ADDRESS }],
      }),
    )
    expect(result.status).toBe('issue')
  })

  it('returns clear when a Delay module is detected by name', async () => {
    const result = await recoveryScanner.scan(
      createMockContext({
        chainSupportsRecovery: true,
        modules: [{ value: '0xabcdef1234567890abcdef1234567890abcdef12', name: 'Delay Modifier' }],
      }),
    )
    expect(result.status).toBe('clear')
    expect(result.score).toBe(100)
  })

  it('returns partial when modules exist but none are recognized as recovery', async () => {
    const result = await recoveryScanner.scan(
      createMockContext({
        chainSupportsRecovery: true,
        modules: [{ value: '0xabcdef1234567890abcdef1234567890abcdef12', name: 'SomeOtherModule' }],
      }),
    )
    expect(result.status).toBe('partial')
    expect(result.severity).toBe('Medium')
  })
})
