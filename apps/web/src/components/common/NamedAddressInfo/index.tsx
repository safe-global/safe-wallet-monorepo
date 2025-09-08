import useChainId from '@/hooks/useChainId'
import EthHashInfo from '../EthHashInfo'
import type { EthHashInfoProps } from '../EthHashInfo/SrcEthHashInfo'
import useSafeAddress from '@/hooks/useSafeAddress'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { memo, useMemo } from 'react'
import { isAddress } from 'ethers'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import { useContractsGetContractV1Query as useGetContractQuery } from '@safe-global/store/gateway/AUTO_GENERATED/contracts'

const useIsUnverifiedContract = (contract?: { contractAbi?: object | null } | null): boolean => {
  return !!contract && !contract.contractAbi
}

export function useAddressName(address?: string, name?: string | null, customAvatar?: string) {
  const chainId = useChainId()
  const safeAddress = useSafeAddress()
  const displayName = sameAddress(address, safeAddress) ? 'This Safe Account' : name

  const { data: contract } = useGetContractQuery(
    { chainId, contractAddress: address as string },
    { skip: !!displayName || !address || !isAddress(address) },
  )

  const nonEnsName = displayName || contract?.displayName || contract?.name

  const { ens: ensName } = useAddressResolver(nonEnsName ? undefined : address)

  const isUnverifiedContract = useIsUnverifiedContract(contract)

  return useMemo(
    () => ({
      name: nonEnsName || ensName || (isUnverifiedContract ? 'Unverified contract' : undefined),
      logoUri: customAvatar || contract?.logoUri,
      isUnverifiedContract,
    }),
    [nonEnsName, customAvatar, contract?.logoUri, isUnverifiedContract, ensName],
  )
}

const NamedAddressInfo = ({ address, name, customAvatar, ...props }: EthHashInfoProps) => {
  const { name: finalName, logoUri: finalAvatar } = useAddressName(address, name, customAvatar)

  return <EthHashInfo address={address} name={finalName} customAvatar={finalAvatar} {...props} />
}

export default memo(NamedAddressInfo)
