import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/src/store'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectSigners } from '@/src/store/signersSlice'
import { getSafeSigners } from '@/src/utils/signer'
import { ReadOnly, ReadOnlyProps } from './ReadOnly'
import { selectReadOnlyWarningDismissed, dismissReadOnlyWarning } from '@/src/store/safesSettingsSlice'
import { useRouter } from 'expo-router'
import { useCallback } from 'react'

export const ReadOnlyContainer = ({
  marginBottom,
  marginTop,
}: Omit<ReadOnlyProps, 'signers' | 'isDismissed' | 'onAddSigner' | 'onDismiss'>) => {
  const activeSafe = useDefinedActiveSafe()
  const safeInfo = useSelector((state: RootState) => selectSafeInfo(state, activeSafe?.address))
  const signers = useSelector(selectSigners)
  const isDismissed = useSelector((state: RootState) => selectReadOnlyWarningDismissed(state, activeSafe?.address))
  const dispatch = useDispatch()
  const router = useRouter()

  const chainSafe = safeInfo ? safeInfo[activeSafe.chainId] : undefined
  const safeSigners = chainSafe ? getSafeSigners(chainSafe, signers) : []

  const handleAddSigner = useCallback(() => {
    router.push('/signers')
  }, [router])

  const handleDismiss = useCallback(() => {
    if (activeSafe?.address) {
      dispatch(dismissReadOnlyWarning({ safeAddress: activeSafe.address }))
    }
  }, [dispatch, activeSafe?.address])

  return (
    <ReadOnly
      signers={safeSigners}
      marginBottom={marginBottom}
      marginTop={marginTop}
      isDismissed={isDismissed}
      onAddSigner={handleAddSigner}
      onDismiss={handleDismiss}
    />
  )
}
