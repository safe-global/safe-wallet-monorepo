import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { createContext, useState, useEffect } from 'react'
import type { Dispatch, ReactNode, SetStateAction, ReactElement } from 'react'
import type { SafeTransaction } from '@safe-global/types-kit'
import { createTx } from '@/services/tx/tx-sender'
import { useRecommendedNonce, useSafeTxGas } from '../tx/SignOrExecuteForm/hooks'
import { Errors, logError } from '@/services/exceptions'

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

const SafeTxProvider = ({ children }: { children: ReactNode }): ReactElement => {
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

    setSafeTxError(undefined)

    createTx({ ...safeTx.data, safeTxGas: String(finalSafeTxGas) }, finalNonce)
      .then((tx) => {
        setSafeTx(tx)
      })
      .catch(setSafeTxError)
  }, [canEdit, finalNonce, finalSafeTxGas, safeTx?.data])

  // Log errors
  useEffect(() => {
    safeTxError && logError(Errors._103, safeTxError)
  }, [safeTxError])

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
