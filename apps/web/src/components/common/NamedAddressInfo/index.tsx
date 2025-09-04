import useAsync from '@safe-global/utils/hooks/useAsync'
import useChainId from '@/hooks/useChainId'
import { getContract } from '@safe-global/safe-gateway-typescript-sdk'
import EthHashInfo from '../EthHashInfo'
import type { EthHashInfoProps } from '../EthHashInfo/SrcEthHashInfo'
import useSafeAddress from '@/hooks/useSafeAddress'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { memo, useMemo } from 'react'
import { isAddress } from 'ethers'
import { lookupAddress } from '@/services/ens'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'

const useIsUnverifiedContract = (contract?: { contractAbi?: object | null } | null): boolean => {
  return !!contract && !contract.contractAbi
}

export function useAddressName(address?: string, name?: string | null, customAvatar?: string) {
  const chainId = useChainId()
  const safeAddress = useSafeAddress()
  const web3 = useWeb3ReadOnly()
  const displayName = sameAddress(address, safeAddress) ? 'This Safe Account' : name

  const [contract] = useAsync(
    () => (!displayName && address && isAddress(address) ? getContract(chainId, address) : undefined),
    [address, chainId, displayName],
    false,
  )

  const [ensName] = useAsync(async () => {
    if (contract?.displayName || !address || !isAddress(address) || !web3) return undefined
    return lookupAddress(web3, address)
  }, [address, web3, contract])

  const isUnverifiedContract = useIsUnverifiedContract(contract)

  return useMemo(
    () => ({
      name:
        displayName ||
        contract?.displayName ||
        contract?.name ||
        ensName ||
        (isUnverifiedContract ? 'Unverified contract' : undefined),
      logoUri: customAvatar || contract?.logoUri,
      isUnverifiedContract,
    }),
    [displayName, contract, customAvatar, isUnverifiedContract, ensName],
  )
}

const NamedAddressInfo = ({ address, name, customAvatar, ...props }: EthHashInfoProps) => {
  const { name: finalName, logoUri: finalAvatar } = useAddressName(address, name, customAvatar)

  return <EthHashInfo address={address} name={finalName} customAvatar={finalAvatar} {...props} />
}

export default memo(NamedAddressInfo)
