import { ErrorMessageView } from '@views/components/tx/ErrorMessage/ErrorMessageView'

export const RiskConfirmationErrorView = () => {
  return <ErrorMessageView level="warning">Please acknowledge the risk before proceeding.</ErrorMessageView>
}
