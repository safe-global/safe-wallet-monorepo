import { useAppSelector } from '@/store'
import { selectTenderly } from '@/store/settingsSlice'

/** The user brought their own Tenderly project (URL and access token in Settings › Environment variables). */
export const useHasOwnTenderly = (): boolean => {
  const tenderly = useAppSelector(selectTenderly)
  return Boolean(tenderly?.url && tenderly?.accessToken)
}
