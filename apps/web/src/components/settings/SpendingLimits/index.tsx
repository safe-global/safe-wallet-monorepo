import CheckWallet from '@/components/common/CheckWallet'
import Track from '@/components/common/Track'
import { NoSpendingLimits } from '@/components/settings/SpendingLimits/NoSpendingLimits'
import { SpendingLimitsTable } from '@/components/settings/SpendingLimits/SpendingLimitsTable'
import { TxModalContext } from '@/components/tx-flow'
import { NewSpendingLimitFlow } from '@/components/tx-flow/flows'
import useIsSafenetEnabled from '@/features/safenet/hooks/useIsSafenetEnabled'
import { useHasFeature } from '@/hooks/useChains'
import { SETTINGS_EVENTS } from '@/services/analytics'
import { selectSpendingLimits, selectSpendingLimitsLoading } from '@/store/spendingLimitsSlice'
import { FEATURES } from '@/utils/chains'
import { Box, Button, Grid, Paper, Typography } from '@mui/material'
import { useContext } from 'react'
import { useSelector } from 'react-redux'

const SpendingLimits = () => {
  const { setTxFlow } = useContext(TxModalContext)
  const spendingLimits = useSelector(selectSpendingLimits)
  const spendingLimitsLoading = useSelector(selectSpendingLimitsLoading)
  const isEnabled = useHasFeature(FEATURES.SPENDING_LIMIT)
  const isSafenetEnabled = useIsSafenetEnabled()

  return (
    <Paper data-testid="spending-limit-section" sx={{ padding: 4 }}>
      <Grid
        container
        direction="row"
        spacing={3}
        sx={{
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Grid item lg={4} xs={12}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
            }}
          >
            Spending limits
          </Typography>
        </Grid>

        <Grid item xs>
          {!isEnabled ? (
            <Typography>The spending limit module is not yet available on this chain.</Typography>
          ) : isSafenetEnabled ? (
            <Typography>To add a spending limit, you must first disable the Safenet Guard and Module.</Typography>
          ) : (
            <Box>
              <Typography>
                You can set rules for specific beneficiaries to access funds from this Safe Account without having to
                collect all signatures.
              </Typography>

              <CheckWallet>
                {(isOk) => (
                  <Track {...SETTINGS_EVENTS.SPENDING_LIMIT.NEW_LIMIT}>
                    <Button
                      data-testid="new-spending-limit"
                      onClick={() => setTxFlow(<NewSpendingLimitFlow />)}
                      sx={{ mt: 2 }}
                      variant="contained"
                      disabled={!isOk}
                      size="small"
                    >
                      New spending limit
                    </Button>
                  </Track>
                )}
              </CheckWallet>

              {!spendingLimits.length && !spendingLimitsLoading && <NoSpendingLimits />}
            </Box>
          )}
        </Grid>
      </Grid>
      <SpendingLimitsTable isLoading={spendingLimitsLoading} spendingLimits={spendingLimits} />
    </Paper>
  )
}

export default SpendingLimits
