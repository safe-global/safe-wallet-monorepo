// Lives in @safe-global/views, which has no test runner of its own, so it is covered here —
// beside the edit flow that is its only caller.
import { toTokenAllowlistFormValues } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/types'

const SAFE = '11155111:0x1111111111111111111111111111111111111111'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const R1 = '0xdeAD00000000000000000000000000000000DE01'
const R2 = '0xdeAD00000000000000000000000000000000DE02'

describe('toTokenAllowlistFormValues', () => {
  it('starts the form on the policy that is being edited', () => {
    expect(toTokenAllowlistFormValues(SAFE, USDC, [{ address: R1 }, { address: R2 }])).toEqual({
      safe: SAFE,
      tokens: [{ address: USDC }],
      recipients: [{ address: R1 }, { address: R2 }],
    })
  })

  // The recipients field renders a row per entry, so an empty list still needs one to type into.
  it('leaves an empty row when the policy permits nobody', () => {
    expect(toTokenAllowlistFormValues(SAFE, USDC, []).recipients).toEqual([{ address: '' }])
  })

  it('keeps only the address, dropping anything else the row carries', () => {
    const values = toTokenAllowlistFormValues(SAFE, USDC, [
      { address: R1, permission: 'ALWAYS' } as { address: string },
    ])

    expect(values.recipients).toEqual([{ address: R1 }])
  })
})
