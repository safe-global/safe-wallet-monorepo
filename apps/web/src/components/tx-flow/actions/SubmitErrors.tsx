import { useContext } from 'react'
import WalletRejectionError from '@/components/tx/shared/errors/WalletRejectionError'
import TxSubmitError from '@/components/tx/TxSubmitError'
import { TxFlowContext } from '../TxFlowProvider'

const SubmitErrors = () => {
  const { submitError, isRejectedByUser } = useContext(TxFlowContext)

  return (
    <>
      {submitError && (
        <div className="mt-2">
          <TxSubmitError error={submitError} context="execution" />
        </div>
      )}

      {isRejectedByUser && (
        <div className="mt-2">
          <WalletRejectionError />
        </div>
      )}
    </>
  )
}

export default SubmitErrors
