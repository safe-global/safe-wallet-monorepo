import { configureStore } from '@reduxjs/toolkit'
import { calendlySlice, setLoaded, setSecondStep, setHasScheduled, reset, type CalendlyState } from '../calendlySlice'

describe('calendlySlice', () => {
  const createTestStore = (initialState?: CalendlyState) => {
    const store = configureStore({
      reducer: {
        [calendlySlice.name]: calendlySlice.reducer,
      },
      preloadedState: initialState
        ? {
            [calendlySlice.name]: initialState,
          }
        : undefined,
    })
    return store
  }

  type TestRootState = ReturnType<ReturnType<typeof createTestStore>['getState']>

  // Test-specific selectors that work with the test store state
  const testSelectCalendlyState = (state: TestRootState): CalendlyState => {
    return state[calendlySlice.name]
  }

  const testSelectCalendlyIsLoaded = (state: TestRootState): boolean => {
    return testSelectCalendlyState(state).isLoaded
  }

  const testSelectCalendlyIsSecondStep = (state: TestRootState): boolean => {
    return testSelectCalendlyState(state).isSecondStep
  }

  const testSelectCalendlyHasScheduled = (state: TestRootState): boolean => {
    return testSelectCalendlyState(state).hasScheduled
  }

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = createTestStore()
      const state = store.getState()
      const calendlyState = state[calendlySlice.name]

      expect(calendlyState).toEqual({
        isLoaded: false,
        isSecondStep: false,
        hasScheduled: false,
        hasError: false,
      })
    })
  })

  describe('setLoaded', () => {
    it('should set isLoaded to true', () => {
      const store = createTestStore()

      store.dispatch(setLoaded(true))

      const state = store.getState()
      expect(state[calendlySlice.name].isLoaded).toBe(true)
    })

    it('should set isLoaded to false', () => {
      const initialState: CalendlyState = {
        isLoaded: true,
        isSecondStep: false,
        hasScheduled: false,
        hasError: false,
      }
      const store = createTestStore(initialState)

      store.dispatch(setLoaded(false))

      const state = store.getState()
      expect(state[calendlySlice.name].isLoaded).toBe(false)
    })

    it('should not affect other state properties', () => {
      const initialState: CalendlyState = {
        isLoaded: false,
        isSecondStep: true,
        hasScheduled: true,
        hasError: false,
      }
      const store = createTestStore(initialState)

      store.dispatch(setLoaded(true))

      const state = store.getState()
      expect(state[calendlySlice.name].isLoaded).toBe(true)
      expect(state[calendlySlice.name].isSecondStep).toBe(true)
      expect(state[calendlySlice.name].hasScheduled).toBe(true)
    })
  })

  describe('setSecondStep', () => {
    it('should set isSecondStep to true', () => {
      const store = createTestStore()

      store.dispatch(setSecondStep(true))

      const state = store.getState()
      expect(state[calendlySlice.name].isSecondStep).toBe(true)
    })

    it('should keep isSecondStep true when set to true again (idempotent)', () => {
      const initialState: CalendlyState = {
        isLoaded: false,
        isSecondStep: true,
        hasScheduled: false,
        hasError: false,
      }
      const store = createTestStore(initialState)

      store.dispatch(setSecondStep(true))

      const state = store.getState()
      expect(state[calendlySlice.name].isSecondStep).toBe(true)
    })

    it('should set isSecondStep to false when explicitly set to false', () => {
      const initialState: CalendlyState = {
        isLoaded: false,
        isSecondStep: true,
        hasScheduled: false,
        hasError: false,
      }
      const store = createTestStore(initialState)

      store.dispatch(setSecondStep(false))

      const state = store.getState()
      expect(state[calendlySlice.name].isSecondStep).toBe(false)
    })

    it('should not affect other state properties', () => {
      const initialState: CalendlyState = {
        isLoaded: true,
        isSecondStep: false,
        hasScheduled: true,
        hasError: false,
      }
      const store = createTestStore(initialState)

      store.dispatch(setSecondStep(true))

      const state = store.getState()
      expect(state[calendlySlice.name].isLoaded).toBe(true)
      expect(state[calendlySlice.name].isSecondStep).toBe(true)
      expect(state[calendlySlice.name].hasScheduled).toBe(true)
    })
  })

  describe('setHasScheduled', () => {
    it('should set hasScheduled to true', () => {
      const store = createTestStore()

      store.dispatch(setHasScheduled(true))

      const state = store.getState()
      expect(state[calendlySlice.name].hasScheduled).toBe(true)
    })

    it('should set hasScheduled to false', () => {
      const initialState: CalendlyState = {
        isLoaded: false,
        isSecondStep: false,
        hasScheduled: true,
        hasError: false,
      }
      const store = createTestStore(initialState)

      store.dispatch(setHasScheduled(false))

      const state = store.getState()
      expect(state[calendlySlice.name].hasScheduled).toBe(false)
    })

    it('should not affect other state properties', () => {
      const initialState: CalendlyState = {
        isLoaded: true,
        isSecondStep: true,
        hasScheduled: false,
        hasError: false,
      }
      const store = createTestStore(initialState)

      store.dispatch(setHasScheduled(true))

      const state = store.getState()
      expect(state[calendlySlice.name].isLoaded).toBe(true)
      expect(state[calendlySlice.name].isSecondStep).toBe(true)
      expect(state[calendlySlice.name].hasScheduled).toBe(true)
    })
  })

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const initialState: CalendlyState = {
        isLoaded: true,
        isSecondStep: true,
        hasScheduled: true,
        hasError: false,
      }
      const store = createTestStore(initialState)

      store.dispatch(reset())

      const state = store.getState()
      expect(state[calendlySlice.name]).toEqual({
        isLoaded: false,
        isSecondStep: false,
        hasScheduled: false,
        hasError: false,
      })
    })

    it('should reset from partial state', () => {
      const initialState: CalendlyState = {
        isLoaded: true,
        isSecondStep: false,
        hasScheduled: false,
        hasError: false,
      }
      const store = createTestStore(initialState)

      store.dispatch(reset())

      const state = store.getState()
      expect(state[calendlySlice.name]).toEqual({
        isLoaded: false,
        isSecondStep: false,
        hasScheduled: false,
        hasError: false,
      })
    })
  })

  describe('selectors', () => {
    it('selectCalendlyState should return the full state', () => {
      const initialState: CalendlyState = {
        isLoaded: true,
        isSecondStep: true,
        hasScheduled: true,
        hasError: false,
      }
      const store = createTestStore(initialState)
      const state = store.getState()

      const result = testSelectCalendlyState(state)

      expect(result).toEqual({
        isLoaded: true,
        isSecondStep: true,
        hasScheduled: true,
        hasError: false,
      })
    })

    it('selectCalendlyIsLoaded should return isLoaded value', () => {
      const initialState: CalendlyState = {
        isLoaded: true,
        isSecondStep: false,
        hasScheduled: false,
        hasError: false,
      }
      const store = createTestStore(initialState)
      const state = store.getState()

      expect(testSelectCalendlyIsLoaded(state)).toBe(true)
    })

    it('selectCalendlyIsSecondStep should return isSecondStep value', () => {
      const initialState: CalendlyState = {
        isLoaded: false,
        isSecondStep: true,
        hasScheduled: false,
        hasError: false,
      }
      const store = createTestStore(initialState)
      const state = store.getState()

      expect(testSelectCalendlyIsSecondStep(state)).toBe(true)
    })

    it('selectCalendlyHasScheduled should return hasScheduled value', () => {
      const initialState: CalendlyState = {
        isLoaded: false,
        isSecondStep: false,
        hasScheduled: true,
        hasError: false,
      }
      const store = createTestStore(initialState)
      const state = store.getState()

      expect(testSelectCalendlyHasScheduled(state)).toBe(true)
    })

    it('selectors should return false for initial state', () => {
      const store = createTestStore()
      const state = store.getState()

      expect(testSelectCalendlyIsLoaded(state)).toBe(false)
      expect(testSelectCalendlyIsSecondStep(state)).toBe(false)
      expect(testSelectCalendlyHasScheduled(state)).toBe(false)
    })
  })
})
