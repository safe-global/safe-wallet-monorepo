import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { useState, useEffect, useCallback } from 'react'
import type { ReactNode, ReactElement } from 'react'
import { SafeTxContext } from './SafeTxContext'
import type { SafeTransaction } from '@safe-global/types-kit'
import { createTx } from '@/services/tx/tx-sender'
import { useRecommendedNonce, useSafeTxGas } from '@/components/tx/shared/hooks'
import { Errors, logError } from '@/services/exceptions'
import { getTxOrigin } from '@/utils/transactions'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectGtfPaymentSourcePreference, setGtfPaymentSourcePreference } from '@/features/gtf/store'
import type { GtfPaymentMode } from '@/features/gtf/types'
import useWallet from '@/hooks/wallets/useWallet'

export { SafeTxContext } from './SafeTxContext'
export type { SafeTxContextParams } from './SafeTxContext'

const SafeTxProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [safeTx, setSafeTx] = useState<SafeTransaction>()
  const [safeMessage, setSafeMessage] = useState<TypedData>()
  const [safeMessageHash, setSafeMessageHash] = useState<`0x${string}`>()
  const [safeTxError, setSafeTxErrorState] = useState<Error>()
  const [nonce, setNonce] = useState<number>()
  const [nonceNeeded, setNonceNeeded] = useState<boolean>(true)
  const [safeTxGas, setSafeTxGas] = useState<string>()
  const [txOrigin, setTxOrigin] = useState<string | undefined>(() =>
    typeof window !== 'undefined' ? getTxOrigin({ url: window.location.origin, name: '' }) : undefined,
  )
  const dispatch = useAppDispatch()
  const signerAddress = useWallet()?.address
  const gtfPaymentMode = useAppSelector((state) => selectGtfPaymentSourcePreference(state, signerAddress)) ?? 'safe'
  const setGtfPaymentMode = useCallback(
    (source: GtfPaymentMode) => {
      if (!signerAddress) return
      dispatch(setGtfPaymentSourcePreference({ signerAddress, source }))
    },
    [dispatch, signerAddress],
  )
  const [gtfSelectedGasToken, setGtfSelectedGasToken] = useState<string>()

  // Every flow routes a failed tx build here, so this is the one place it is reported.
  const setSafeTxError = useCallback((error: Error | undefined) => {
    if (error) logError(Errors._103, error)
    setSafeTxErrorState(error)
  }, [])

  // Signed txs cannot be updated
  const isSigned = Boolean(safeTx && safeTx.signatures.size > 0)

  // Recommended nonce and safeTxGas
  const recommendedNonce = useRecommendedNonce()
  const recommendedSafeTxGas = useSafeTxGas(safeTx)

  const canEdit = !isSigned
  const isReadOnly = !canEdit

  // Priority to external nonce, then to the recommended one
  const finalNonce = canEdit ? (nonce ?? recommendedNonce ?? safeTx?.data.nonce) : safeTx?.data.nonce
  const finalSafeTxGas = canEdit
    ? (safeTxGas ?? recommendedSafeTxGas ?? safeTx?.data.safeTxGas)
    : safeTx?.data.safeTxGas

  // Update the tx when the nonce or safeTxGas change
  useEffect(() => {
    if (!canEdit) return
    if (!safeTx?.data) return
    if (safeTx.data.nonce === finalNonce && safeTx.data.safeTxGas === finalSafeTxGas) return

    setSafeTxError(undefined)

    createTx({ ...safeTx.data, safeTxGas: String(finalSafeTxGas) }, finalNonce)
      .then((tx) => {
        setSafeTx(tx)
      })
      .catch(setSafeTxError)
  }, [canEdit, finalNonce, finalSafeTxGas, safeTx?.data, setSafeTxError])

  return (
    <SafeTxContext.Provider
      value={{
        safeTx,
        safeTxError,
        setSafeTx,
        setSafeTxError,
        safeMessage,
        setSafeMessage,
        safeMessageHash,
        setSafeMessageHash,
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
        gtfPaymentMode,
        setGtfPaymentMode,
        gtfSelectedGasToken,
        setGtfSelectedGasToken,
      }}
    >
      {children}
    </SafeTxContext.Provider>
  )
}

export default SafeTxProvider
