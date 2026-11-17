import { id } from 'ethers'
import { RHINESTONE_INTENT_EXECUTOR } from '../../constants'
import { isRelayedByRhinestone } from '../isRelayedByRhinestone'

const INTENT_EXECUTED = id('IntentExecuted(uint256,bytes32)')
const OTHER = '0x1111111111111111111111111111111111111111'

const receipt = (...logs: Array<{ address: string; topics: string[] }>) => ({ logs }) as never

describe('isRelayedByRhinestone', () => {
  it("is true when Rhinestone's executor logged IntentExecuted", () => {
    expect(isRelayedByRhinestone(receipt({ address: RHINESTONE_INTENT_EXECUTOR, topics: [INTENT_EXECUTED] }))).toBe(
      true,
    )
  })

  it('matches the executor address in any letter case', () => {
    expect(
      isRelayedByRhinestone(receipt({ address: RHINESTONE_INTENT_EXECUTOR.toLowerCase(), topics: [INTENT_EXECUTED] })),
    ).toBe(true)
  })

  it('is false for the same event from another contract', () => {
    expect(isRelayedByRhinestone(receipt({ address: OTHER, topics: [INTENT_EXECUTED] }))).toBe(false)
  })

  it("is false for another event from Rhinestone's executor", () => {
    expect(isRelayedByRhinestone(receipt({ address: RHINESTONE_INTENT_EXECUTOR, topics: [id('Other()')] }))).toBe(false)
  })

  it('is false without logs', () => {
    expect(isRelayedByRhinestone(receipt())).toBe(false)
  })
})
