import { makeLoadableSlice } from './common'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'

const { slice, selector } = makeLoadableSlice('safeInfo', undefined as ExtendedSafeInfo | undefined)

export const safeInfoSlice = slice
export const selectSafeInfo = selector
