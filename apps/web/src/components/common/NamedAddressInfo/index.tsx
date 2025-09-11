import useChainId from '@/hooks/useChainId'
import EthHashInfo from '../EthHashInfo'
import type { EthHashInfoProps } from '../EthHashInfo/SrcEthHashInfo'
import useSafeAddress from '@/hooks/useSafeAddress'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { memo, useMemo } from 'react'
import { isAddress } from 'ethers'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import { useContractsGetContractV1Query as useGetContractQuery } from '@safe-global/store/gateway/AUTO_GENERATED/contracts'
import { isSmartContract } from '@/utils/wallets'
import useAsync from '@safe-global/utils/hooks/useAsync'

const THIS_SAFE_ACCOUNT = 'This Safe Account'
const UNVERIFIED_CONTRACT = 'Unverified contract'

const useIsContractAddress = (address?: string): boolean => {
  const [isContract] = useAsync(() => (address ? isSmartContract(address) : undefined), [address])
  return isContract ?? false
}

const useIsUnverifiedContract = (contract?: { contractAbi?: object | null } | null): boolean => {
  return !!contract && !contract.contractAbi
}

export function useAddressName(address?: string, name?: string | null, customAvatar?: string) {
  const chainId = useChainId()
  const safeAddress = useSafeAddress()
  const displayName = sameAddress(address, safeAddress) ? THIS_SAFE_ACCOUNT : name
  const shouldSkipContractCheck = !!displayName || !address || !isAddress(address)
  const isContract = useIsContractAddress(shouldSkipContractCheck ? undefined : address)

  const shouldSkipContractData = shouldSkipContractCheck || !isContract
  const { data: contract } = useGetContractQuery(
    { chainId, contractAddress: address as string },
    { skip: shouldSkipContractData },
  )
  const contractData = shouldSkipContractData ? undefined : contract
  const nonEnsName = displayName || contractData?.displayName || contractData?.name

  const { ens: ensName } = useAddressResolver(nonEnsName ? undefined : address)

  const isUnverifiedContract = useIsUnverifiedContract(contractData)

  return useMemo(
    () => ({
      name: nonEnsName || ensName || (isUnverifiedContract ? UNVERIFIED_CONTRACT : undefined),
      logoUri: customAvatar || contractData?.logoUri,
      isUnverifiedContract,
    }),
    [nonEnsName, customAvatar, contractData?.logoUri, isUnverifiedContract, ensName],
  )
}

const NamedAddressInfo = ({ address, name, customAvatar, ...props }: EthHashInfoProps) => {
  const { name: finalName, logoUri: finalAvatar } = useAddressName(address, name, customAvatar)

  return <EthHashInfo address={address} name={finalName} customAvatar={finalAvatar} {...props} />
}

export default memo(NamedAddressInfo)
