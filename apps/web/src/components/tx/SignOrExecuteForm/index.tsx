import { useContext } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import SignOrExecuteForm from './SignOrExecuteForm'
import type { SignOrExecuteProps, SubmitCallback } from './SignOrExecuteForm'
import SignOrExecuteSkeleton from './SignOrExecuteSkeleton'
import useTxDetails from '@/hooks/useTxDetails'
import useTxPreview from '../confirmation-views/useTxPreview'

type SignOrExecuteExtendedProps = SignOrExecuteProps & {
  onSubmit?: SubmitCallback
  txId?: string
  children?: React.ReactNode
  isExecutable?: boolean
  isRejection?: boolean
  isBatch?: boolean
  isBatchable?: boolean
  onlyExecute?: boolean
  disableSubmit?: boolean
  origin?: string
  isCreation?: boolean
  showMethodCall?: boolean
}

const SignOrExecute = (props: SignOrExecuteExtendedProps) => {
  const { safeTx, safeTxError } = useContext(SafeTxContext)
  const [txDetails, , txDetailsLoading] = useTxDetails(props.txId)
  const [txPreview, , txPreviewLoading] = useTxPreview(safeTx?.data, undefined, props.txId)

  if ((!safeTx && !safeTxError) || txDetailsLoading || txPreviewLoading) {
    return <SignOrExecuteSkeleton />
  }

  return (
    <SignOrExecuteForm
      {...props}
      isCreation={!props.txId}
      txId={props.txId}
      txDetails={txDetails}
      txPreview={txPreview}
    >
      {props.children}
    </SignOrExecuteForm>
  )
}

export default SignOrExecute
