import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'

export const useIsSignedIn = (): boolean => useAppSelector(isAuthenticated)
