import { useAppSelector } from '@/store'
import { selectHasOwnTenderly } from '@/store/settingsSlice'

/** The user brought their own Tenderly project (URL and access token in Settings › Environment variables). */
export const useHasOwnTenderly = (): boolean => useAppSelector(selectHasOwnTenderly)
