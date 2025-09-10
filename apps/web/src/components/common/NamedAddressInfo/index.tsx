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

const useIsUnverifiedContract = (contract?: { address: string; contractAbi?: object | null } | null): boolean => {
  const address = contract?.address
  const [isContract = false] = useAsync(() => (address ? isSmartContract(address) : undefined), [address])
  return isContract && !!contract && !contract.contractAbi
}

const THIS_SAFE_ACCOUNT = 'This Safe Account'
const UNVERIFIED_CONTRACT = 'Unverified contract'

export function useAddressName(address?: string, name?: string | null, customAvatar?: string) {
  const chainId = useChainId()
  const safeAddress = useSafeAddress()
  const displayName = sameAddress(address, safeAddress) ? THIS_SAFE_ACCOUNT : name
  const { ens: ensName } = useAddressResolver(displayName ? undefined : address)

  const shouldSkip = Boolean(displayName || ensName) || !address || !isAddress(address)
  const { data: contract } = useGetContractQuery({ chainId, contractAddress: address as string }, { skip: shouldSkip })
  const contractData = shouldSkip ? undefined : contract
  const isUnverifiedContract = useIsUnverifiedContract(contractData)

  const finalName =
    displayName ||
    ensName ||
    contractData?.displayName ||
    contractData?.name ||
    (isUnverifiedContract ? UNVERIFIED_CONTRACT : undefined)
  const logoUri = customAvatar || contractData?.logoUri

  return useMemo(
    () => ({
      name: finalName,
      logoUri,
      isUnverifiedContract,
    }),
    [finalName, logoUri, isUnverifiedContract],
  )
}

const NamedAddressInfo = ({ address, name, customAvatar, ...props }: EthHashInfoProps) => {
  const { name: finalName, logoUri: finalAvatar } = useAddressName(address, name, customAvatar)

  return <EthHashInfo address={address} name={finalName} customAvatar={finalAvatar} {...props} />
}

export default memo(NamedAddressInfo)
