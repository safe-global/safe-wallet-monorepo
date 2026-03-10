import { useCallback, useRef } from 'react'
import { Keyboard, TextInput } from 'react-native'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useAppDispatch } from '@/src/store/hooks'
import { setActiveSigner } from '@/src/store/activeSignerSlice'
import { Signer } from '@/src/store/signersSlice'
import { Address } from '@/src/types/address'

interface UseProposerSheetArgs {
  safeAddress: Address
  inputRef: React.RefObject<TextInput | null>
}

interface UseProposerSheetResult {
  proposerSheetRef: React.RefObject<BottomSheetModal | null>
  handleOpenProposerSheet: () => void
  handleSelectProposer: (signer: Signer) => void
  handleProposerSheetChange: (index: number) => void
}

export function useProposerSheet({ safeAddress, inputRef }: UseProposerSheetArgs): UseProposerSheetResult {
  const dispatch = useAppDispatch()
  const proposerSheetRef = useRef<BottomSheetModal>(null)

  const handleOpenProposerSheet = useCallback(() => {
    Keyboard.dismiss()
    proposerSheetRef.current?.present()
  }, [])

  const handleSelectProposer = useCallback(
    (signer: Signer) => {
      dispatch(setActiveSigner({ safeAddress, signer }))
      proposerSheetRef.current?.dismiss()
    },
    [dispatch, safeAddress],
  )

  const handleProposerSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        inputRef.current?.focus()
      }
    },
    [inputRef],
  )

  return {
    proposerSheetRef,
    handleOpenProposerSheet,
    handleSelectProposer,
    handleProposerSheetChange,
  }
}
