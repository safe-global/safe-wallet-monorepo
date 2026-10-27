import { toGuardCheckCalls } from '../toGuardCheckCalls'

const safeTx = (data: Record<string, unknown>) => ({ data }) as never

describe('toGuardCheckCalls', () => {
  it('has nothing to check before a transaction is built', () => {
    expect(toGuardCheckCalls(undefined)).toBeUndefined()
  })

  it('checks a built transaction as the single call the Safe will make', () => {
    expect(
      toGuardCheckCalls(safeTx({ to: '0xabc', value: '1', data: '0x', operation: 0, nonce: 3, safeTxGas: '0' })),
    ).toEqual([{ to: '0xabc', value: '1', data: '0x', operation: 0 }])
  })

  // A batch reaches the guard as one delegatecall; MultiSendPolicy re-checks what is inside it.
  it('keeps a batch as the delegatecall the guard sees', () => {
    const calls = toGuardCheckCalls(safeTx({ to: '0xmultisend', value: '0', data: '0x8d80ff0a', operation: 1 }))

    expect(calls).toEqual([{ to: '0xmultisend', value: '0', data: '0x8d80ff0a', operation: 1 }])
  })

  it('defaults a missing operation to a call', () => {
    expect(toGuardCheckCalls(safeTx({ to: '0xabc', value: '0', data: '0x' }))?.[0].operation).toBe(0)
  })
})
