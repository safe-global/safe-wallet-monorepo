import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { createContext, useState, useEffect, useCallback } from 'react'
import type { Dispatch, ReactNode, SetStateAction, ReactElement } from 'react'
import type { SafeTransaction } from '@safe-global/types-kit'
import { createTx } from '@/services/tx/tx-sender'
import { useRecommendedNonce, useSafeTxGas } from '@/components/tx/shared/hooks'
import { Errors, logError } from '@/services/exceptions'
import { getTxOrigin } from '@/utils/transactions'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectGtfPaymentSourcePreference, setGtfPaymentSourcePreference } from '@/features/gtf/store'
import type { GtfPaymentMode } from '@/features/gtf/types'
import useWallet from '@/hooks/wallets/useWallet'

export type SafeTxContextParams = {
  safeTx?: SafeTransaction
  setSafeTx: Dispatch<SetStateAction<SafeTransaction | undefined>>

  safeMessage?: TypedData
  setSafeMessage: Dispatch<SetStateAction<TypedData | undefined>>

  safeMessageHash?: `0x${string}`
  setSafeMessageHash: Dispatch<SetStateAction<`0x${string}` | undefined>>

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

  // GTF: proposer's payment choice. Meaningful only for the first signer; confirmers
  // read the locked fee fields directly from safeTx.data.
  gtfPaymentMode: GtfPaymentMode
  setGtfPaymentMode: (source: GtfPaymentMode) => void
  gtfSelectedGasToken?: string
  setGtfSelectedGasToken: Dispatch<SetStateAction<string | undefined>>
}

export const SafeTxContext = createContext<SafeTxContextParams>({
  setSafeTx: () => {},
  setSafeMessage: () => {},
  setSafeMessageHash: () => {},
  setSafeTxError: () => {},
  setNonce: () => {},
  setNonceNeeded: () => {},
  setSafeTxGas: () => {},
  setTxOrigin: () => {},
  isReadOnly: false,
  gtfPaymentMode: 'safe',
  setGtfPaymentMode: () => {},
  setGtfSelectedGasToken: () => {},
})

const SafeTxProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [safeTx, setSafeTx] = useState<SafeTransaction>()
  const [safeMessage, setSafeMessage] = useState<TypedData>()
  const [safeMessageHash, setSafeMessageHash] = useState<`0x${string}`>()
  const [safeTxError, setSafeTxError] = useState<Error>()
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
