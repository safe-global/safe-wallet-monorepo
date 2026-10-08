import { useIsBelowMd } from '@/hooks/useMediaQuery'
import useChainId from '@/hooks/useChainId'
import {
  useContractsGetContractV1Query as useGetContractQuery,
  type Contract,
} from '@safe-global/store/gateway/AUTO_GENERATED/contracts'
import { isAddress } from 'ethers'
import { useEffect, useState } from 'react'
import { SpenderFieldView } from '@views/components/tx/ApprovalEditor/SpenderFieldView'

export const SpenderField = ({ address }: { address: string }) => {
  const chainId = useChainId()
  const shouldSkip = !address || !isAddress(address)
  const { data: contract } = useGetContractQuery({ chainId, contractAddress: address }, { skip: shouldSkip })
  const [spendingContract, setSpendingContract] = useState<Contract>()

  useEffect(() => {
    if (shouldSkip) {
      setSpendingContract(undefined)
    } else {
      setSpendingContract(contract)
    }
  }, [contract, shouldSkip])
  const isSmallScreen = useIsBelowMd()

  return (
    <SpenderFieldView
      address={address}
      name={spendingContract?.displayName || spendingContract?.name}
      customAvatar={spendingContract?.logoUri}
      shortAddress={isSmallScreen}
    />
  )
}
