import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectSafeSigners } from '@/src/store/signersSlice'

export function useHasSigner() {
  const activeSafe = useDefinedActiveSafe()
  const safeSigners = useAppSelector((state) => selectSafeSigners(state, activeSafe))

  return { hasSigner: safeSigners.length > 0, safeSigners }
}
