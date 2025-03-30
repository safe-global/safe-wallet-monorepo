import { useCallback, useContext, useEffect } from 'react'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import { SafeTxContext } from '../../SafeTxProvider'
import type { SignOrExecuteProps } from '@/components/tx/SignOrExecuteForm/SignOrExecuteFormV2'
import useWallet from '@/hooks/wallets/useWallet'
import useOnboard from '@/hooks/wallets/useOnboard'
import { dispatchSafeAppsTx } from '@/services/tx/tx-sender'
import { trackSafeAppTxCount } from '@/services/safe-apps/track-app-usage-count'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import type { SafeAppsTxParams } from '.'

export const ConfirmSafeAppsTxDetails = ({
  onSubmit,
  safeAppsTx: { requestId, appId },
  ...props
}: Omit<SignOrExecuteProps, 'onSubmit'> & {
  safeAppsTx: SafeAppsTxParams
  onSubmit?: (txId: string, safeTxHash: string) => void
}) => {
  const { txOrigin, setTxOrigin, safeTx, setSafeTxError } = useContext(SafeTxContext)
  const onboard = useOnboard()
  const wallet = useWallet()

  const handleSubmit = useCallback(
    async (txId: string) => {
      if (!safeTx || !onboard || !wallet?.provider) return
      trackSafeAppTxCount(Number(appId))

      let safeTxHash = ''
      try {
        safeTxHash = await dispatchSafeAppsTx(safeTx, requestId, wallet.provider, txId)
      } catch (error) {
        setSafeTxError(asError(error))
      }

      onSubmit?.(txId, safeTxHash)
    },
    [safeTx, appId, requestId, onboard, wallet?.provider, setSafeTxError, onSubmit],
  )

  useEffect(() => {
    return () => setTxOrigin(undefined)
  }, [setTxOrigin])

  return <ConfirmTxDetails origin={txOrigin} onSubmit={handleSubmit} {...props} />
}
