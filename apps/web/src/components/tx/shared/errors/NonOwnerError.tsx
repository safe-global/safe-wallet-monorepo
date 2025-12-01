import ErrorMessage from '@/components/tx/ErrorMessage'

const NonOwnerError = () => {
  return (
    <ErrorMessage>
      You are currently not a signer of this Safe Account and won&apos;t be able to submit this transaction.
    </ErrorMessage>
  )
}

export default NonOwnerError
