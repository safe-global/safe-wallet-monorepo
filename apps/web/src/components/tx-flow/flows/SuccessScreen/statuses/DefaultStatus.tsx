import { isTimeoutError } from '@/utils/ethers-utils'
import { DefaultStatusView } from '@views/components/tx-flow/flows/SuccessScreen/statuses/DefaultStatusView'

type Props = {
  error: undefined | Error
  willDeploySafe: boolean
}
export const DefaultStatus = ({ error, willDeploySafe }: Props) => (
  <DefaultStatusView error={error} isTimeout={!!error && isTimeoutError(error)} willDeploySafe={willDeploySafe} />
)
