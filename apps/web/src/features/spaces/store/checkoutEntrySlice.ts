import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type CheckoutEntry = Record<string, unknown>

/** Where the user started the checkout; only the UI knows it, so the click stores it for the tracking listener. */
export const checkoutEntrySlice = createSlice({
  name: 'checkoutEntry',
  initialState: null as CheckoutEntry | null,
  reducers: {
    checkoutEntrySet: (_, action: PayloadAction<CheckoutEntry>) => action.payload,
  },
})

export const { checkoutEntrySet } = checkoutEntrySlice.actions
