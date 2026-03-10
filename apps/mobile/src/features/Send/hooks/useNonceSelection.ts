import { useCallback, useRef, useState } from 'react'
import { Keyboard } from 'react-native'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { TextInput } from 'react-native'
import { useNonce } from './useNonce'

interface UseNonceSelectionArgs {
  chainId: string
  safeAddress: string
  inputRef: React.RefObject<TextInput | null>
}

interface UseNonceSelectionResult {
  nonceSheetRef: React.RefObject<BottomSheetModal | null>
  recommendedNonce: number | undefined
  currentNonce: number | undefined
  queuedNonces: { nonce: number; label: string }[]
  fetchMore: () => void
  isFetchingMore: boolean
  displayNonce: number | undefined
  selectedNonce: number | undefined
  showCustomNonceModal: boolean
  handleOpenNonceSheet: () => void
  handleSelectNonce: (nonce: number) => void
  handleAddCustomNonce: () => void
  handleSaveCustomNonce: (nonce: number) => void
  handleCancelCustomNonce: () => void
}

export function useNonceSelection({ chainId, safeAddress, inputRef }: UseNonceSelectionArgs): UseNonceSelectionResult {
  const nonceSheetRef = useRef<BottomSheetModal>(null)
  const { recommendedNonce, currentNonce, queuedNonces, fetchMore, isFetchingMore } = useNonce(chainId, safeAddress)

  const [selectedNonce, setSelectedNonce] = useState<number | undefined>()
  const [showCustomNonceModal, setShowCustomNonceModal] = useState(false)

  const displayNonce = selectedNonce ?? recommendedNonce

  const refocusInput = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [inputRef])

  const handleOpenNonceSheet = useCallback(() => {
    Keyboard.dismiss()
    nonceSheetRef.current?.present()
  }, [])

  const handleSelectNonce = useCallback(
    (nonce: number) => {
      setSelectedNonce(nonce === recommendedNonce ? undefined : nonce)
      nonceSheetRef.current?.dismiss()
      refocusInput()
    },
    [recommendedNonce, refocusInput],
  )

  const handleAddCustomNonce = useCallback(() => {
    nonceSheetRef.current?.dismiss()
    setTimeout(() => {
      setShowCustomNonceModal(true)
    }, 300)
  }, [])

  const handleSaveCustomNonce = useCallback(
    (nonce: number) => {
      setSelectedNonce(nonce === recommendedNonce ? undefined : nonce)
      setShowCustomNonceModal(false)
      refocusInput()
    },
    [recommendedNonce, refocusInput],
  )

  const handleCancelCustomNonce = useCallback(() => {
    setShowCustomNonceModal(false)
    refocusInput()
  }, [refocusInput])

  return {
    nonceSheetRef,
    recommendedNonce,
    currentNonce,
    queuedNonces,
    fetchMore,
    isFetchingMore,
    displayNonce,
    selectedNonce,
    showCustomNonceModal,
    handleOpenNonceSheet,
    handleSelectNonce,
    handleAddCustomNonce,
    handleSaveCustomNonce,
    handleCancelCustomNonce,
  }
}
