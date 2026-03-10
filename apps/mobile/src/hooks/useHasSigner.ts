import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { selectSigners } from '@/src/store/signersSlice'
import { getSafeSigners } from '@/src/utils/signer'
import { RootState } from '@/src/store'

export function useHasSigner() {
  const activeSafe = useDefinedActiveSafe()
  const safeInfo = useAppSelector((state: RootState) => selectSafeInfo(state, activeSafe.address))
  const signers = useAppSelector(selectSigners)
  const chainSafe = safeInfo ? safeInfo[activeSafe.chainId] : undefined
  const safeSigners = chainSafe ? getSafeSigners(chainSafe, signers) : []

  return { hasSigner: safeSigners.length > 0, safeSigners }
}
