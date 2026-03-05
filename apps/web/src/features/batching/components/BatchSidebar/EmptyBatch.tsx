import { type ReactNode } from 'react'
import EmptyBatchIcon from '@/public/images/common/empty-batch.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import AssetsIcon from '@/public/images/sidebar/assets.svg'
import AppsIcon from '@/public/images/apps/apps-icon.svg'
import SettingsIcon from '@/public/images/sidebar/settings.svg'
import { Box, SvgIcon, Typography } from '@mui/material'

const EmptyBatch = ({ children }: { children: ReactNode }) => (
  <Box display="flex" flexWrap="wrap" justifyContent="center" textAlign="center" mt={3} px={4}>
    <SvgIcon component={EmptyBatchIcon} inheritViewBox sx={{ fontSize: 110 }} />

    <Typography variant="h4" fontWeight={700}>
      Add an initial transaction to the batch
    </Typography>

    <Typography variant="body2" mt={2} mb={4} px={8} sx={{ textWrap: 'balance' }}>
      Save gas and signatures by adding multiple Safe transactions to a single batch transaction. You can reorder and
      delete individual transactions in a batch.
    </Typography>

    {children}

    <Typography variant="body2" color="border.main" mt={8}>
      <Box mb={1}>
        <SvgIcon component={InfoIcon} inheritViewBox />
      </Box>

      <b>What type of transactions can you add to the batch?</b>

      <Box display="flex" mt={3} gap={6}>
        <div>
          <SvgIcon component={AssetsIcon} inheritViewBox />
          <div>Token and NFT transfers</div>
        </div>

        <div>
          <SvgIcon component={AppsIcon} inheritViewBox />
          <div>Safe App transactions</div>
        </div>

        <div>
          <SvgIcon component={SettingsIcon} inheritViewBox />
          <div>Safe Account settings</div>
        </div>
      </Box>
    </Typography>
  </Box>
)

export default EmptyBatch
