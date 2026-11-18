import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

/**
 * Redux slice for managing Calendly widget state.
 * Tracks widget loading status, page navigation, and booking events.
 */

export type CalendlyState = {
  /** Whether the Calendly widget script is loaded and initialized */
  isLoaded: boolean
  /** Whether the user has progressed to the 2nd step (date/time selection) */
  isSecondStep: boolean
  /** Whether a booking has been scheduled (prevents duplicate callbacks) */
  hasScheduled: boolean
  /** Whether there was an error loading the Calendly widget */
  hasError: boolean
}

const initialState: CalendlyState = {
  isLoaded: false,
  isSecondStep: false,
  hasScheduled: false,
  hasError: false,
}

export const calendlySlice = createSlice({
  name: 'calendly',
  initialState,
  reducers: {
    /**
     * Sets the widget loaded state.
     * Dispatched when the Calendly script is loaded and initialized.
     */
    setLoaded: (state, action: PayloadAction<boolean>) => {
      state.isLoaded = action.payload
    },
    /**
     * Sets the second step state.
     * Dispatched when user progresses to date/time selection (event_type_viewed event).
     */
    setSecondStep: (state, action: PayloadAction<boolean>) => {
      state.isSecondStep = action.payload
    },
    /**
     * Sets the booking scheduled state.
     * Dispatched when a booking is successfully scheduled (event_scheduled event).
     */
    setHasScheduled: (state, action: PayloadAction<boolean>) => {
      state.hasScheduled = action.payload
    },
    /**
     * Sets the error state.
     * Dispatched when the Calendly script fails to load or widget fails to initialize.
     */
    setError: (state, action: PayloadAction<boolean>) => {
      state.hasError = action.payload
    },
    /**
     * Resets all Calendly state to initial values.
     * Useful for cleanup when unmounting or resetting the widget.
     */
    reset: (state) => {
      state.isLoaded = false
      state.isSecondStep = false
      state.hasScheduled = false
      state.hasError = false
    },
  },
})

export const { setLoaded, setSecondStep, setHasScheduled, setError, reset } = calendlySlice.actions

export const selectCalendlyState = (state: RootState): CalendlyState => {
  return state[calendlySlice.name] || initialState
}

export const selectCalendlyIsLoaded = (state: RootState): boolean => {
  return selectCalendlyState(state).isLoaded
}

export const selectCalendlyIsSecondStep = (state: RootState): boolean => {
  return selectCalendlyState(state).isSecondStep
}

export const selectCalendlyHasScheduled = (state: RootState): boolean => {
  return selectCalendlyState(state).hasScheduled
}

export const selectCalendlyHasError = (state: RootState): boolean => {
  return selectCalendlyState(state).hasError
}
