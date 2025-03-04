import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '.'

const initialState = {
  isEdit: false,
}

const myAccountsSlice = createSlice({
  name: 'myAccounts',
  initialState,
  reducers: {
    toggleMode: (state) => {
      state.isEdit = !state.isEdit
    },
    setEditMode: (state, action: PayloadAction<boolean>) => {
      state.isEdit = action.payload
    },
  },
})

export const { toggleMode, setEditMode } = myAccountsSlice.actions

export const selectMyAccountsMode = (state: RootState) => state.myAccounts.isEdit

export default myAccountsSlice.reducer
