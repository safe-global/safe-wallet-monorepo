import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import { renderHook } from '@/tests/test-utils'
import { SafeProFeature } from '../index'

jest.mock('@/hooks/useChains', () => ({ useHasFeature: jest.fn() }))

// Every consumer test mocks this module wholesale, so nothing else evaluates the real handle:
// the folder name has to keep deriving the flag, and only this asserts it still does.
describe('SafeProFeature', () => {
  it('derives the announcement flag from the folder name', () => {
    renderHook(() => SafeProFeature.useIsEnabled())

    expect(useHasFeature).toHaveBeenCalledWith(FEATURES.SAFE_PRO_ANNOUNCEMENT)
  })
})
