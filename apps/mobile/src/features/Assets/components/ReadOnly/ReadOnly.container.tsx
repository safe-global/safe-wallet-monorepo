import { useSelector } from 'react-redux'
import { RootState } from '@/src/store'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectSigners } from '@/src/store/signersSlice'
import { getSafeSigners } from '@/src/utils/signer'
import { ReadOnly, ReadOnlyProps } from './ReadOnly'

export const ReadOnlyContainer = ({ marginBottom, marginTop }: Omit<ReadOnlyProps, 'signers'>) => {
  const activeSafe = useDefinedActiveSafe()
  const safeInfo = useSelector((state: RootState) => selectSafeInfo(state, activeSafe?.address))
  const signers = useSelector(selectSigners)

  const chainSafe = safeInfo ? safeInfo[activeSafe.chainId] : undefined
  const safeSigners = chainSafe ? getSafeSigners(chainSafe, signers) : []

  return <ReadOnly signers={safeSigners} marginBottom={marginBottom} marginTop={marginTop} />
}
