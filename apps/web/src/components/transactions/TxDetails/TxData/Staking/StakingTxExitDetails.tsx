import type { NativeStakingValidatorsExitTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getBeaconChainLink } from '@safe-global/utils/features/stake/utils/beaconChain'
import useChainId from '@/hooks/useChainId'
import {
  BeaconChainLinkView,
  StakingTxExitDetailsView,
} from '@views/components/transactions/TxDetails/TxData/Staking/StakingTxExitDetailsView'

const StakingTxExitDetails = ({ info }: { info: NativeStakingValidatorsExitTransactionInfo }) => {
  return (
    <StakingTxExitDetailsView
      info={info}
      renderBeaconChainLink={(props, key) => <BeaconChainLink {...props} key={key} />}
    />
  )
}

export const BeaconChainLink = ({ validator, name }: { validator: string; name: string }) => {
  const chainId = useChainId()
  return <BeaconChainLinkView href={getBeaconChainLink(chainId, validator)} name={name} />
}

export default StakingTxExitDetails
