import { renderHook } from '@/tests/test-utils'
import { useSafeSetupHints } from '../useSafeSetupHints'

describe('useSafeSetupHints', () => {
  it('warns about a 1/n policy when the threshold is one', () => {
    const setHint = jest.fn()

    renderHook(() => useSafeSetupHints(setHint, 1, 1))

    expect(setHint).toHaveBeenLastCalledWith(
      expect.objectContaining({ steps: [expect.objectContaining({ title: '1/1 policy' })] }),
    )
  })

  it('adds no policy warning when the threshold is between one and the signer count', () => {
    const setHint = jest.fn()

    renderHook(() => useSafeSetupHints(setHint, 2, 3))

    expect(setHint).toHaveBeenLastCalledWith(expect.objectContaining({ steps: [] }))
  })
})
