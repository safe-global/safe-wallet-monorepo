import useAsync from '@safe-global/utils/hooks/useAsync'
import useChainId from '@/hooks/useChainId'
import { getContract } from '@safe-global/safe-gateway-typescript-sdk'
import EthHashInfo from '../EthHashInfo'
import type { EthHashInfoProps } from '../EthHashInfo/SrcEthHashInfo'

const NamedAddressInfo = ({ address, name, customAvatar, ...props }: EthHashInfoProps) => {
  const chainId = useChainId()
  const [contract] = useAsync(
    () => (!name && !customAvatar ? getContract(chainId, address) : undefined),
    [address, chainId, name, customAvatar],
  )

  const finalName = name || contract?.displayName || contract?.name
  const finalAvatar = customAvatar || contract?.logoUri

  return <EthHashInfo address={address} name={finalName} customAvatar={finalAvatar} {...props} />
}

export default NamedAddressInfo
