import useWallet from '@/hooks/wallets/useWallet'
import type { ReactElement } from 'react'
import { useContext } from 'react'
import { type RequestId } from '@safe-global/safe-apps-sdk'
import { dispatchSafeAppsTx } from '@/services/tx/tx-sender'
import useOnboard from '@/hooks/wallets/useOnboard'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import type { SignOrExecuteProps } from '@/components/tx/SignOrExecuteForm/SignOrExecuteFormV2'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'

export const ConfirmSignMessageOnChainDetails = ({
  requestId,
  ...props
}: SignOrExecuteProps & { requestId: RequestId }): ReactElement => {
  const onboard = useOnboard()
  const wallet = useWallet()
  const { safeTx, setSafeTxError } = useContext(SafeTxContext)

  const handleSubmit = async () => {
    if (!safeTx || !onboard || !wallet) return

    try {
      await dispatchSafeAppsTx(safeTx, requestId, wallet.provider)
    } catch (error) {
      setSafeTxError(asError(error))
    }
  }

  return <ConfirmTxDetails {...props} onSubmit={handleSubmit} showMethodCall />
}
