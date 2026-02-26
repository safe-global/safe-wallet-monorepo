import useChainId from '@/hooks/useChainId'
import EthHashInfo from '../EthHashInfo'
import type { EthHashInfoProps } from '../EthHashInfo/SrcEthHashInfo'
import useSafeAddress from '@/hooks/useSafeAddress'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { memo, useMemo, useState } from 'react'
import { isAddress } from 'ethers'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import { useContractsGetContractV1Query as useGetContractQuery } from '@safe-global/store/gateway/AUTO_GENERATED/contracts'
import { isSmartContract } from '@/utils/wallets'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useAppSelector } from '@/store'
import { selectCustomAbisByChain } from '@/store/customAbiSlice'
import { IconButton, Tooltip } from '@mui/material'
import DataObjectIcon from '@mui/icons-material/DataObject'
import CustomAbiDialog from '@/components/settings/CustomAbis/CustomAbiDialog'

const THIS_SAFE_ACCOUNT = 'This Safe Account'
const UNVERIFIED_CONTRACT = 'Unverified contract'

const useIsContractAddress = (address?: string): boolean => {
  const [isContract] = useAsync(() => (address ? isSmartContract(address) : undefined), [address])
  return isContract ?? false
}

const useIsUnverifiedContract = (contract?: { contractAbi?: object | null } | null): boolean => {
  return !!contract && !contract.contractAbi
}

export function useAddressName(address?: string, name?: string | null, customAvatar?: string | null) {
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

const NamedAddressInfo = ({ address, name, customAvatar, ...props }: EthHashInfoProps & { showName?: boolean }) => {
  const chainId = useChainId()
  const { name: finalName, logoUri: finalAvatar, isUnverifiedContract } = useAddressName(address, name, customAvatar)
  const customAbis = useAppSelector((state) => selectCustomAbisByChain(state, chainId))
  const hasCustomAbi = !!address && !!customAbis[address]
  const [dialogOpen, setDialogOpen] = useState(false)

  const showAddAbi = isUnverifiedContract && !hasCustomAbi && !!address

  const abiButton = showAddAbi ? (
    <Tooltip title="Add custom ABI" placement="top">
      <IconButton size="small" onClick={() => setDialogOpen(true)} sx={{ p: 0.25 }}>
        <DataObjectIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  ) : undefined

  return (
    <>
      <EthHashInfo address={address} name={finalName} customAvatar={finalAvatar} nameExtra={abiButton} {...props} />
      {dialogOpen && <CustomAbiDialog onClose={() => setDialogOpen(false)} defaultAddress={address} />}
    </>
  )
}

export default memo(NamedAddressInfo)
