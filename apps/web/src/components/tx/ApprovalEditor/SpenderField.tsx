import EthHashInfo from '@/components/common/EthHashInfo'
import { Typography } from '@/components/ui/typography'
import { useIsBelowMd } from '@/hooks/useMediaQuery'

import css from './styles.module.css'
import useChainId from '@/hooks/useChainId'
import {
  useContractsGetContractV1Query as useGetContractQuery,
  type Contract,
} from '@safe-global/store/gateway/AUTO_GENERATED/contracts'
import { isAddress } from 'ethers'
import { useEffect, useState } from 'react'

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
    <div className={`${css.approvalField} flex flex-row items-center justify-between gap-4`}>
      <Typography variant="paragraph-small" className="text-muted-foreground">
        Spender
      </Typography>
      <div>
        <EthHashInfo
          avatarSize={24}
          address={address}
          name={spendingContract?.displayName || spendingContract?.name}
          customAvatar={spendingContract?.logoUri}
          shortAddress={isSmallScreen}
          hasExplorer
        />
      </div>
    </div>
  )
}
