import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { createContext, useState, useEffect } from 'react'
import type { Dispatch, ReactNode, SetStateAction, ReactElement } from 'react'
import type { SafeTransaction } from '@safe-global/types-kit'
import { createTx } from '@/services/tx/tx-sender'
import { useRecommendedNonce, useSafeTxGas } from '@/components/tx/shared/hooks'
import { Errors, logError } from '@/services/exceptions'
import { useEnsureSafeSDK } from '@/hooks/coreSDK/useEnsureSafeSDK'
import useSafeAddress from '@/hooks/useSafeAddress'
import useChainId from '@/hooks/useChainId'

export type SafeTxContextParams = {
  safeTx?: SafeTransaction
  setSafeTx: Dispatch<SetStateAction<SafeTransaction | undefined>>

  safeMessage?: TypedData
  setSafeMessage: Dispatch<SetStateAction<TypedData | undefined>>

  safeTxError?: Error
  setSafeTxError: Dispatch<SetStateAction<Error | undefined>>

  nonce?: number
  setNonce: Dispatch<SetStateAction<number | undefined>>
  nonceNeeded?: boolean
  setNonceNeeded: Dispatch<SetStateAction<boolean>>

  safeTxGas?: string
  setSafeTxGas: Dispatch<SetStateAction<string | undefined>>

  recommendedNonce?: number

  txOrigin?: string
  setTxOrigin: Dispatch<SetStateAction<string | undefined>>

  isReadOnly: boolean
  setIsReadOnly: Dispatch<SetStateAction<boolean>>
  isMassPayout?: boolean
  setIsMassPayout: Dispatch<SetStateAction<boolean | undefined>>
}

export const SafeTxContext = createContext<SafeTxContextParams>({
  setSafeTx: () => {},
  setSafeMessage: () => {},
  setSafeTxError: () => {},
  setNonce: () => {},
  setNonceNeeded: () => {},
  setSafeTxGas: () => {},
  setTxOrigin: () => {},
  isReadOnly: false,
  setIsReadOnly: () => {},
  setIsMassPayout: () => {},
})

const SafeTxProvider = ({ children }: { children: ReactNode }): ReactElement | null => {
  // Ensure SDK is initialized before rendering children
  // This prevents race conditions where child components try to create transactions
  // before the SDK is ready
  const [sdk, isSDKLoading] = useEnsureSafeSDK()
  const safeAddress = useSafeAddress()
  const chainId = useChainId()

  const [safeTx, setSafeTx] = useState<SafeTransaction>()
  const [safeMessage, setSafeMessage] = useState<TypedData>()
  const [safeTxError, setSafeTxError] = useState<Error>()
  const [nonce, setNonce] = useState<number>()
  const [nonceNeeded, setNonceNeeded] = useState<boolean>(true)
  const [safeTxGas, setSafeTxGas] = useState<string>()
  const [txOrigin, setTxOrigin] = useState<string>()
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false)
  const [isMassPayout, setIsMassPayout] = useState<boolean>()

  // Signed txs cannot be updated
  const isSigned = Boolean(safeTx && safeTx.signatures.size > 0)

  // Recommended nonce and safeTxGas
  const recommendedNonce = useRecommendedNonce()
  const recommendedSafeTxGas = useSafeTxGas(safeTx)

  const canEdit = !isSigned && !isReadOnly

  // Priority to external nonce, then to the recommended one
  const finalNonce = canEdit ? (nonce ?? recommendedNonce ?? safeTx?.data.nonce) : safeTx?.data.nonce
  const finalSafeTxGas = canEdit
    ? (safeTxGas ?? recommendedSafeTxGas ?? safeTx?.data.safeTxGas)
    : safeTx?.data.safeTxGas

  // Update the tx when the nonce or safeTxGas change
  useEffect(() => {
    if (!canEdit || !safeTx?.data) return
    if (safeTx.data.nonce === finalNonce && safeTx.data.safeTxGas === finalSafeTxGas) return
    // Don't update while SDK is loading
    if (isSDKLoading || !sdk) return

    setSafeTxError(undefined)

    createTx({ ...safeTx.data, safeTxGas: String(finalSafeTxGas) }, finalNonce)
      .then((tx) => {
        setSafeTx(tx)
      })
      .catch(setSafeTxError)
  }, [canEdit, finalNonce, finalSafeTxGas, safeTx?.data, isSDKLoading, sdk])

  // Log errors
  useEffect(() => {
    safeTxError && logError(Errors._103, safeTxError)
  }, [safeTxError])

  // Reset state when Safe address or chain changes to prevent stale data
  useEffect(() => {
    setSafeTx(undefined)
    setSafeMessage(undefined)
    setSafeTxError(undefined)
    setNonce(undefined)
    setNonceNeeded(true)
    setSafeTxGas(undefined)
    setTxOrigin(undefined)
    setIsReadOnly(false)
    setIsMassPayout(undefined)
  }, [safeAddress, chainId])

  // Don't render children until SDK is initialized to prevent race conditions
  if (isSDKLoading || !sdk) {
    return null
  }

  return (
    <SafeTxContext.Provider
      value={{
        safeTx,
        safeTxError,
        setSafeTx,
        setSafeTxError,
        safeMessage,
        setSafeMessage,
        nonce: finalNonce,
        setNonce,
        nonceNeeded,
        setNonceNeeded,
        safeTxGas: finalSafeTxGas,
        setSafeTxGas,
        recommendedNonce,
        txOrigin,
        setTxOrigin,
        isReadOnly,
        setIsReadOnly,
        isMassPayout,
        setIsMassPayout,
      }}
    >
      {children}
    </SafeTxContext.Provider>
  )
}

export default SafeTxProvider
