import { Box, Divider, Grid, IconButton, Paper, SvgIcon, Typography } from '@mui/material'
import css from './styles.module.css'
// import HiddenTokenButton from '@/components/balances/HiddenTokenButton'
// import CurrencySelect from '@/components/balances/CurrencySelect'
// import TokenListSelect from '@/components/balances/TokenListSelect'
import MoreIcon from '@/public/images/common/more.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import EthHashInfo from '../EthHashInfo'
import AddEOAModal from '@/components/superChain/AddEOAModal'
import { useState } from 'react'
import usePopulatedEOASRequest from '@/hooks/super-chain/usePopulatedEOASRequest'
import type { Address } from 'viem'
export const INITIAL_STATE = {
  open: false,
  currentAmountOfPopulatedOwners: 0,
}
const SuperChainEOAS = () => {
  const { safe } = useSafeInfo()

  const [addEOAContext, setAddEOAContext] = useState(INITIAL_STATE)
  const {
    data: populatedOwners,
    loading: populatedOwnersLoading,
    error,
  } = usePopulatedEOASRequest(safe.address.value as Address)

  return (
    <div className={css.container}>
      <Typography fontWeight={600} fontSize={16} marginBottom={1}>
        Account
      </Typography>
      <Paper
        style={{
          height: '100%',
        }}
      >
        <Grid container gap={2} height="100%" alignItems="center" justifyContent="center" flexDirection="column">
          <Box height="100%" width="100%">
            <Box
              p={2}
              alignItems="center"
              display="flex"
              justifyContent="space-between"
              width="100%"
              flexDirection="row"
            >
              <Typography fontSize={16} fontWeight="600">
                Connected wallets
              </Typography>
              <IconButton
                disabled={populatedOwnersLoading}
                onClick={() =>
                  setAddEOAContext({
                    open: true,
                    currentAmountOfPopulatedOwners: 3,
                  })
                }
                size="small"
              >
                <SvgIcon component={MoreIcon} inheritViewBox fontSize="medium" />
              </IconButton>
            </Box>
            <Divider />
            <Box
              p={2}
              gap={2}
              alignItems="center"
              display="flex"
              justifyContent="space-between"
              width="100%"
              flexDirection="column"
            >
              {safe.owners.map((owner, key) => (
                <EthHashInfo
                  avatarSize={30}
                  key={key}
                  address={owner.value}
                  showCopyButton
                  prefix=""
                  shortAddress={false}
                  showName={false}
                  hasExplorer
                />
              ))}
              {populatedOwners?.ownerPopulateds?.map((owner: { newOwner: string }, key: number) => (
                <EthHashInfo
                  isPopulated={true}
                  avatarSize={30}
                  key={key}
                  shortAddressSize={2}
                  address={owner.newOwner}
                  showCopyButton
                  prefix=""
                  shortAddress={false}
                  showName={false}
                  hasExplorer
                />
              ))}
            </Box>
          </Box>
        </Grid>
      </Paper>
      <AddEOAModal context={addEOAContext} onClose={() => setAddEOAContext(INITIAL_STATE)} />
    </div>
  )
}

export default SuperChainEOAS
