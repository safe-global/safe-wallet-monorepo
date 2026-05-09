import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/src/store'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { ReadOnly, ReadOnlyProps } from './ReadOnly'
import { selectReadOnlyWarningDismissed, dismissReadOnlyWarning } from '@/src/store/safesSettingsSlice'
import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { useHasSigner } from '@/src/hooks/useHasSigner'

export const ReadOnlyContainer = ({
  marginBottom,
  marginTop,
}: Omit<ReadOnlyProps, 'signers' | 'isDismissed' | 'onAddSigner' | 'onDismiss'>) => {
  const activeSafe = useDefinedActiveSafe()
  const { safeSigners } = useHasSigner()
  const isDismissed = useSelector((state: RootState) => selectReadOnlyWarningDismissed(state, activeSafe?.address))
  const dispatch = useDispatch()
  const router = useRouter()

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
