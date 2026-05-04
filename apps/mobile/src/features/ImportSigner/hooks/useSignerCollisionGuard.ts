import { useCallback } from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { selectSigners, type Signer } from '@/src/store/signersSlice'
import { findCollidingSigner } from '../utils/findCollidingSigner'
import { showCollisionAlert } from '../utils/showCollisionAlert'

type SignerKind = Signer['type']

export const useSignerCollisionGuard = () => {
  const signers = useAppSelector(selectSigners)

  const guardAgainstCollision = useCallback(
    (address: string, newType: SignerKind): boolean => {
      const existing = findCollidingSigner(signers, address, newType)
      if (!existing) {
        return false
      }
      showCollisionAlert(existing)
      return true
    },
    [signers],
  )

  return { guardAgainstCollision }
}
