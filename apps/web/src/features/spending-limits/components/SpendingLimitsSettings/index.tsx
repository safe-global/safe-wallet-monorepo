import { useContext } from 'react'
import { Paper, Grid, Typography, Box, Button } from '@mui/material'
import { NoSpendingLimits } from './NoSpendingLimits'
import { SpendingLimitsTable } from './SpendingLimitsTable'
import { useHasFeature } from '@/hooks/useChains'
import { NewSpendingLimitFlow } from '@/components/tx-flow/flows'
import { SETTINGS_EVENTS } from '@/services/analytics'
import CheckWallet from '@/components/common/CheckWallet'
import Track from '@/components/common/Track'
import { TxModalContext } from '@/components/tx-flow'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useAppSelector } from '@/store'
import { selectSpendingLimits, selectSpendingLimitsLoading } from '../../store/spendingLimitsSlice'

const SpendingLimitsSettings = () => {
  const { setTxFlow } = useContext(TxModalContext)
  const isEnabled = useHasFeature(FEATURES.SPENDING_LIMIT)

  // Read data from store (loaded on app start via SpendingLimitsLoader)
  const spendingLimits = useAppSelector(selectSpendingLimits)
  const spendingLimitsLoading = useAppSelector(selectSpendingLimitsLoading)

  return (
    <Paper data-testid="spending-limit-section" sx={{ padding: 4 }}>
      <Grid
        container
        direction="row"
        spacing={3}
        sx={{
          justifyContent: 'space-between',
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
          {isEnabled ? (
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
                      sx={{ mt: 2, mb: 2 }}
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
              {spendingLimits.length > 0 && (
                <SpendingLimitsTable isLoading={spendingLimitsLoading} spendingLimits={spendingLimits} />
              )}
            </Box>
          ) : (
            <Typography>The spending limit feature is not yet available on this chain.</Typography>
          )}
        </Grid>
      </Grid>
    </Paper>
  )
}

export default SpendingLimitsSettings
