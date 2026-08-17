import { FEATURES } from '@safe-global/utils/utils/chains'
import {
  featureFlagOverridesSlice,
  setOverride,
  clearOverride,
  clearAllOverrides,
  selectFeatureFlagOverrides,
  selectOverrideCount,
  type FeatureFlagOverridesState,
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

  it('counts nothing when there are no overrides', () => {
    expect(selectOverrideCount({} as RootState)).toBe(0)
  })

  // Overrides are persisted, so a flag overridden on a branch that declares it survives the switch
  // to a branch that does not. The editor never lists such a flag, so the badge must not count it.
  it('ignores persisted overrides of flags this build does not declare', () => {
    const state = {
      [featureFlagOverridesSlice.name]: { FLAG_FROM_ANOTHER_BRANCH: true, ANOTHER_UNKNOWN_FLAG: false },
    } as unknown as RootState
    expect(selectOverrideCount(state)).toBe(0)
  })

  it('counts only the known flags in a mixed state', () => {
    const state = {
      [featureFlagOverridesSlice.name]: {
        [FEATURES.EARN]: true,
        FLAG_FROM_ANOTHER_BRANCH: true,
        [FEATURES.BRIDGE]: false,
      },
    } as unknown as RootState
    expect(selectOverrideCount(state)).toBe(2)
  })

  it('matches the number of flags the editor lists as overridden', () => {
    const overrides = { [FEATURES.EARN]: true, FLAG_FROM_ANOTHER_BRANCH: true } as FeatureFlagOverridesState
    const state = { [featureFlagOverridesSlice.name]: overrides } as unknown as RootState

    const editorRows = Object.values(FEATURES).filter((feature) => overrides[feature] !== undefined)

    expect(selectOverrideCount(state)).toBe(editorRows.length)
  })
})
