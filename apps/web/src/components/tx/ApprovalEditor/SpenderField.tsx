import EthHashInfo from '@/components/common/EthHashInfo'
import { Stack, Typography, useMediaQuery, useTheme } from '@mui/material'

import css from './styles.module.css'
import useChainId from '@/hooks/useChainId'
import { useContractsGetContractV1Query as useGetContractQuery } from '@safe-global/store/gateway/AUTO_GENERATED/contracts'
import { isAddress } from 'ethers'

export const SpenderField = ({ address }: { address: string }) => {
  const chainId = useChainId()
  const shouldSkip = !address || !isAddress(address)
  const { data: spendingContract } = useGetContractQuery({ chainId, contractAddress: address }, { skip: shouldSkip })
  const contractData = shouldSkip ? undefined : spendingContract
  const { breakpoints } = useTheme()
  const isSmallScreen = useMediaQuery(breakpoints.down('md'))

  return (
    <Stack
      direction="row"
      className={css.approvalField}
      sx={{
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
        }}
      >
        Spender
      </Typography>
      <div>
        <EthHashInfo
          avatarSize={24}
          address={address}
          name={contractData?.displayName || contractData?.name}
          customAvatar={contractData?.logoUri}
          shortAddress={isSmallScreen}
          hasExplorer
        />
      </div>
    </Stack>
  )
}
