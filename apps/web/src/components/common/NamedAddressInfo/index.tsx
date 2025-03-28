import useAsync from '@/hooks/useAsync'
import useChainId from '@/hooks/useChainId'
import { getContract } from '@safe-global/safe-gateway-typescript-sdk'
import EthHashInfo from '../EthHashInfo'
import type { EthHashInfoProps } from '../EthHashInfo/SrcEthHashInfo'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'

function useAddressName(address: string, name?: string | null, customAvatar?: string) {
  const chainId = useChainId()
  const web3 = useWeb3ReadOnly()

  const [contract, error] = useAsync(
    () => (!name && !customAvatar ? getContract(chainId, address) : undefined),
    [address, chainId, name, customAvatar],
  )

  const [isUnverifiedContract] = useAsync<boolean>(async () => {
    if (!error) return false // Only check via RPC if getContract returned an error
    const code = await web3?.getCode(address)
    return code !== '0x'
  }, [address, web3, error])

  return {
    name: name || contract?.displayName || contract?.name || (isUnverifiedContract ? 'Unverified contract' : undefined),
    avatar: customAvatar || contract?.logoUri,
  }
}

const NamedAddressInfo = ({ address, name, customAvatar, ...props }: EthHashInfoProps) => {
  const { name: finalName, avatar: finalAvatar } = useAddressName(address, name, customAvatar)

  return <EthHashInfo address={address} name={finalName} customAvatar={finalAvatar} {...props} />
}

export default NamedAddressInfo
