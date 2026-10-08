import { ErrorMessageView } from '@views/components/tx/ErrorMessage/ErrorMessageView'

const NonOwnerError = () => {
  return (
    <ErrorMessageView>
      You are currently not a signer of this Safe account and won&apos;t be able to submit this transaction.
    </ErrorMessageView>
  )
}

export default NonOwnerError
