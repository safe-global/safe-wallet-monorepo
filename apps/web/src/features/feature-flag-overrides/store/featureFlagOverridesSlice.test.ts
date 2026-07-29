import { FEATURES } from '@safe-global/utils/utils/chains'
import {
  featureFlagOverridesSlice,
  setOverride,
  clearOverride,
  clearAllOverrides,
  selectFeatureFlagOverrides,
  selectOverrideCount,
} from './featureFlagOverridesSlice'
import type { RootState } from '@/store'

describe('featureFlagOverridesSlice', () => {
  const { reducer } = featureFlagOverridesSlice

  it('starts empty', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({})
  })

  it('sets an override on', () => {
    const state = reducer(undefined, setOverride({ feature: FEATURES.EARN, value: true }))
    expect(state).toEqual({ [FEATURES.EARN]: true })
  })

  it('sets an override off', () => {
    const state = reducer(undefined, setOverride({ feature: FEATURES.EARN, value: false }))
    expect(state).toEqual({ [FEATURES.EARN]: false })
  })

  it('clears a single override', () => {
    const start = reducer(undefined, setOverride({ feature: FEATURES.EARN, value: true }))
    const state = reducer(start, clearOverride(FEATURES.EARN))
    expect(state).toEqual({})
  })

  it('clears all overrides', () => {
    let state = reducer(undefined, setOverride({ feature: FEATURES.EARN, value: true }))
    state = reducer(state, setOverride({ feature: FEATURES.BRIDGE, value: false }))
    state = reducer(state, clearAllOverrides())
    expect(state).toEqual({})
  })

  it('selector falls back to empty object when the slice is absent', () => {
    expect(selectFeatureFlagOverrides({} as RootState)).toEqual({})
  })

  it('counts active overrides', () => {
    const state = {
      [featureFlagOverridesSlice.name]: { [FEATURES.EARN]: true, [FEATURES.BRIDGE]: false },
    } as unknown as RootState
    expect(selectOverrideCount(state)).toBe(2)
  })
})
