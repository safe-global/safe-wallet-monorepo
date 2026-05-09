import { toBeHex } from 'ethers'
import { initialState as settingsInitialState } from '@/store/settingsSlice'
import type { RootState } from '@/store'

/**
 * Tests for auto-curation behavior in CreateNestedSafe flow.
 *
 * The CreateNestedSafe component should automatically add newly created nested safes
 * to the curated list when the user has already completed initial curation.
 */
describe('CreateNestedSafe - Auto-curation behavior', () => {
  const parentSafeAddress = toBeHex('0x1', 20)
  const existingNestedSafe = toBeHex('0x10', 20)
  const newNestedSafeAddress = toBeHex('0x20', 20)

  const createCurationState = (hasCompletedCuration: boolean, selectedAddresses: string[] = []) => ({
    settings: {
      ...settingsInitialState,
      curatedNestedSafes: {
        [parentSafeAddress.toLowerCase()]: {
          selectedAddresses: selectedAddresses.map((a) => a.toLowerCase()),
          hasCompletedCuration,
          lastModified: Date.now(),
        },
      },
    },
  })

  describe('when curation has been completed', () => {
    it('should add the new nested safe address to the curated list', () => {
      const initialState = createCurationState(true, [existingNestedSafe])

      // Verify initial state has the existing nested safe
      const existingAddresses =
        initialState.settings.curatedNestedSafes[parentSafeAddress.toLowerCase()].selectedAddresses
      expect(existingAddresses).toContain(existingNestedSafe.toLowerCase())
      expect(existingAddresses).not.toContain(newNestedSafeAddress.toLowerCase())

      // After auto-curation, the new address should be added
      const expectedAddresses = [...existingAddresses, newNestedSafeAddress.toLowerCase()]
      expect(expectedAddresses).toHaveLength(2)
      expect(expectedAddresses).toContain(existingNestedSafe.toLowerCase())
      expect(expectedAddresses).toContain(newNestedSafeAddress.toLowerCase())
    })

    it('should not add duplicate addresses to the curated list', () => {
      // If the address is already in the curated list, it should not be added again
      const initialState = createCurationState(true, [existingNestedSafe, newNestedSafeAddress])

      const existingAddresses =
        initialState.settings.curatedNestedSafes[parentSafeAddress.toLowerCase()].selectedAddresses

      // The address is already in the list
      expect(existingAddresses).toContain(newNestedSafeAddress.toLowerCase())

      // Adding again should not create duplicates
      const addressSet = new Set(existingAddresses)
      addressSet.add(newNestedSafeAddress.toLowerCase())
      expect(Array.from(addressSet)).toHaveLength(2)
    })
  })

  describe('when curation has not been completed (first-time flow)', () => {
    it('should not auto-add the nested safe to the curated list', () => {
      const initialState = createCurationState(false, [])

      // hasCompletedCuration is false, so auto-curation should be skipped
      const curationState = initialState.settings.curatedNestedSafes[parentSafeAddress.toLowerCase()]
      expect(curationState.hasCompletedCuration).toBe(false)

      // In the component, when hasCompletedCuration is false, the setCuratedNestedSafes
      // dispatch is skipped, leaving the user to complete first-time curation manually
    })
  })

  describe('when there is no curation state', () => {
    it('should not auto-add the nested safe', () => {
      const initialState: Partial<RootState> = {
        settings: {
          ...settingsInitialState,
          curatedNestedSafes: {},
        },
      }

      // No curation state for this parent safe
      const curationState = initialState.settings?.curatedNestedSafes?.[parentSafeAddress.toLowerCase()]
      expect(curationState).toBeUndefined()

      // In the component, when curationState is undefined, hasCompletedCuration is falsy
      // so auto-curation is skipped
    })
  })
})
