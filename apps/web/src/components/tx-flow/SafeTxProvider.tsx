import { createContext, useState, useEffect, useCallback } from 'react'
import type { Dispatch, ReactNode, SetStateAction, ReactElement } from 'react'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { createTx } from '@/services/tx/tx-sender'
import { useRecommendedNonce, useSafeTxGas } from '../tx/SignOrExecuteForm/hooks'
import { Errors, logError } from '@/services/exceptions'
import type { EIP712TypedData } from '@safe-global/safe-gateway-typescript-sdk'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCurrentChain } from '@/hooks/useChains'
import { prependSafeToL2Migration } from '@/utils/safe-migrations'
import { useSelectAvailableSigner } from '@/hooks/wallets/useSelectAvailableSigner'

export type SafeTxContextParams = {
  safeTx?: SafeTransaction
  setSafeTx: Dispatch<SetStateAction<SafeTransaction | undefined>>

  safeMessage?: EIP712TypedData
  setSafeMessage: Dispatch<SetStateAction<EIP712TypedData | undefined>>

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
}

export const SafeTxContext = createContext<SafeTxContextParams>({
  setSafeTx: () => {},
  setSafeMessage: () => {},
  setSafeTxError: () => {},
  setNonce: () => {},
  setNonceNeeded: () => {},
  setSafeTxGas: () => {},
  setTxOrigin: () => {},
})

const SafeTxProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [safeTx, setSafeTx] = useState<SafeTransaction>()
  const [safeMessage, setSafeMessage] = useState<EIP712TypedData>()
  const [safeTxError, setSafeTxError] = useState<Error>()
  const [nonce, setNonce] = useState<number>()
  const [nonceNeeded, setNonceNeeded] = useState<boolean>(true)
  const [safeTxGas, setSafeTxGas] = useState<string>()
  const [txOrigin, setTxOrigin] = useState<string>()

  const { safe } = useSafeInfo()
  const chain = useCurrentChain()
  const selectAvailableSigner = useSelectAvailableSigner()

  const setAndMigrateSafeTx: Dispatch<SetStateAction<SafeTransaction | undefined>> = useCallback(
    (
      value: SafeTransaction | undefined | ((prevState: SafeTransaction | undefined) => SafeTransaction | undefined),
    ) => {
      let safeTx: SafeTransaction | undefined
      if (typeof value === 'function') {
        safeTx = value(safeTx)
      } else {
        safeTx = value
      }

      prependSafeToL2Migration(safeTx, safe, chain).then(setSafeTx)

      // Select a matching signer when we update the transaction
      selectAvailableSigner(safeTx, safe)
    },
    [chain, safe, selectAvailableSigner],
  )

  // Signed txs cannot be updated
  const isSigned = safeTx && safeTx.signatures.size > 0

  // Recommended nonce and safeTxGas
  const recommendedNonce = useRecommendedNonce()
  const recommendedSafeTxGas = useSafeTxGas(safeTx)

  // Priority to external nonce, then to the recommended one
  const finalNonce = isSigned ? safeTx?.data.nonce : (nonce ?? recommendedNonce ?? safeTx?.data.nonce)
  const finalSafeTxGas = isSigned
    ? safeTx?.data.safeTxGas
    : (safeTxGas ?? recommendedSafeTxGas ?? safeTx?.data.safeTxGas)

  // Update the tx when the nonce or safeTxGas change
  useEffect(() => {
    if (isSigned || !safeTx?.data) return
    if (safeTx.data.nonce === finalNonce && safeTx.data.safeTxGas === finalSafeTxGas) return

    setSafeTxError(undefined)

    createTx({ ...safeTx.data, safeTxGas: String(finalSafeTxGas) }, finalNonce)
      .then((tx) => {
        setSafeTx(tx)
      })
      .catch(setSafeTxError)
  }, [isSigned, finalNonce, finalSafeTxGas, safeTx?.data])

  // Log errors
  useEffect(() => {
    safeTxError && logError(Errors._103, safeTxError)
  }, [safeTxError])

  return (
    <SafeTxContext.Provider
      value={{
        safeTx,
        safeTxError,
        setSafeTx: setAndMigrateSafeTx,
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
      }}
    >
      {children}
    </SafeTxContext.Provider>
  )
}

export default SafeTxProvider
