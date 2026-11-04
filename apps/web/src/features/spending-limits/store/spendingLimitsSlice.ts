import { createSelector } from '@reduxjs/toolkit'
import { makeLoadableSlice } from '@/store/common'
import type { SpendingLimitState } from '@safe-global/views/features/spending-limits/types'

export type { SpendingLimitState } from '@safe-global/views/features/spending-limits/types'

const initialState: SpendingLimitState[] = []

const { slice, selector } = makeLoadableSlice('spendingLimits', initialState)

export const spendingLimitSlice = slice

export const selectSpendingLimits = createSelector(selector, (spendingLimits) => spendingLimits.data)
export const selectSpendingLimitsLoading = createSelector(selector, (spendingLimits) => spendingLimits.loading)
