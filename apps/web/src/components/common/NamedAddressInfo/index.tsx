import useAsync from '@safe-global/utils/hooks/useAsync'
import useChainId from '@/hooks/useChainId'
import { getContract } from '@safe-global/safe-gateway-typescript-sdk'
import EthHashInfo from '../EthHashInfo'
import type { EthHashInfoProps } from '../EthHashInfo/SrcEthHashInfo'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import useSafeAddress from '@/hooks/useSafeAddress'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { memo, useMemo } from 'react'

const useIsUnverifiedContract = (address?: string, error?: Error): boolean => {
  const web3 = useWeb3ReadOnly()

  const [isUnverifiedContract] = useAsync<boolean>(async () => {
    if (!error || !address) return false // Only check via RPC if getContract returned an error
    const code = await web3?.getCode(address)
    return code !== '0x'
  }, [address, web3, error])

  return isUnverifiedContract ?? false
}

export function useAddressName(address?: string, name?: string | null, customAvatar?: string) {
  const chainId = useChainId()
  const safeAddress = useSafeAddress()
  const displayName = sameAddress(address, safeAddress) ? 'This Safe Account' : name

  const [contract, error] = useAsync(
    () => (!displayName && address ? getContract(chainId, address) : undefined),
    [address, chainId, displayName],
    false,
  )

  const isUnverifiedContract = useIsUnverifiedContract(address, error)

  return useMemo(
    () => ({
      name:
        displayName ||
        contract?.displayName ||
        contract?.name ||
        (isUnverifiedContract ? 'Unverified contract' : undefined),
      logoUri: customAvatar || contract?.logoUri,
      isUnverifiedContract,
    }),
    [displayName, contract, customAvatar, isUnverifiedContract],
  )
}

const NamedAddressInfo = ({ address, name, customAvatar, ...props }: EthHashInfoProps) => {
  const { name: finalName, logoUri: finalAvatar } = useAddressName(address, name, customAvatar)

  return <EthHashInfo address={address} name={finalName} customAvatar={finalAvatar} {...props} />
}

export default memo(NamedAddressInfo)
