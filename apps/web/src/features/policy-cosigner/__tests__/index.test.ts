import { renderHook } from '@/tests/test-utils'
import { useIsPolicyCosignerEnabled } from '../index'

describe('useIsPolicyCosignerEnabled', () => {
  it('is disabled when no co-signer service URL is configured', () => {
    const { result } = renderHook(() => useIsPolicyCosignerEnabled())

    expect(result.current).toBe(false)
  })
})
