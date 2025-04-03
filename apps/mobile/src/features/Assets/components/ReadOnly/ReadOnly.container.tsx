import { useSelector } from 'react-redux'
import { RootState } from '@/src/store'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectSigners } from '@/src/store/signersSlice'
import { getSafeSigners } from '@/src/utils/signer'
import { ReadOnly } from './ReadOnly'

export const ReadOnlyContainer = () => {
  const activeSafe = useDefinedActiveSafe()
  const safeInfo = useSelector((state: RootState) => selectSafeInfo(state, activeSafe?.address))
  const signers = useSelector(selectSigners)

  const safeSigners = safeInfo?.SafeInfo ? getSafeSigners(safeInfo.SafeInfo, signers) : []

  return <ReadOnly signers={safeSigners} />
}
