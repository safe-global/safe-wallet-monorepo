import { useAppSelector } from '@/store'
import { selectIsOfflineWorkspace } from '../store/offlineWorkspaceSlice'

export const useIsOfflineWorkspace = (): boolean => useAppSelector(selectIsOfflineWorkspace)
