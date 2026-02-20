import { TxFlowContext } from '../../TxFlowProvider'
import { type ReactNode, useContext } from 'react'
import { Box, Container, Grid2 as Grid, Typography, Button, Paper, useMediaQuery, Card, Stack } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useTheme } from '@mui/material/styles'
import classnames from 'classnames'
import { ProgressBar } from '@/components/common/ProgressBar'
import css from './styles.module.css'
import ChainIndicator from '@/components/common/ChainIndicator'
import TxStatusWidget from '@/components/tx-flow/common/TxStatusWidget'
import SafeShieldWidget from '@/features/safe-shield'
import { TxLayoutHeader } from '../TxLayout'
import { Slot, SlotName } from '../../slots'
import SafeInfo from '@/components/tx-flow/common/SafeInfo'

/**
 * TxFlowContent is a component that renders the main content of the transaction flow.
 * It uses the TxFlowContext to manage the transaction state and layout properties.
 * The component also handles the transaction steps and progress.
 * It accepts children components to be rendered within the flow.
 */
export const TxFlowContent = ({ children }: { children?: ReactNode[] | ReactNode }) => {
  const {
    txLayoutProps: {
      title = '',
      subtitle,
      txSummary,
      icon,
      fixedNonce,
      hideNonce,
      hideProgress,
      isReplacement,
      isMessage,
    },
    isBatch,
    step,
    progress,
    onPrev,
  } = useContext(TxFlowContext)
  const childrenArray = Array.isArray(children) ? children : [children]

  const smallScreenBreakpoint = 'md'
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down(smallScreenBreakpoint))
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))

  return (
    <Grid container className={css.container}>
      {!isReplacement && !isSmallScreen && (
        <Grid sx={{ width: 200 }} pt={5}>
          <aside>
            <Stack gap={3} position="fixed">
              <Card className={css.safeInfoCard}>
                <SafeInfo />
              </Card>

              <TxStatusWidget
                isLastStep={step === childrenArray.length - 1}
                txSummary={txSummary}
                isBatch={isBatch}
                isMessage={isMessage}
              />
            </Stack>
          </aside>
        </Grid>
      )}

      <Grid size={{ xs: 12, [smallScreenBreakpoint]: 'grow' }} px={{ [smallScreenBreakpoint]: 5 }}>
        <Container className={css.contentContainer}>
          <Grid container spacing={3} justifyContent="center">
            {/* Main content */}
            <Grid size="grow" sx={{ maxWidth: { [smallScreenBreakpoint]: 672 } }}>
              <div className={css.titleWrapper}>
                <Typography
                  data-testid="modal-title"
                  variant="h3"
                  component="div"
                  className={css.title}
                  sx={{ fontWeight: '700' }}
                >
                  {title}
                </Typography>

                <ChainIndicator inline />
              </div>

              <Paper data-testid="modal-header" className={css.header}>
                {!hideProgress && (
                  <Box className={css.progressBar}>
                    <ProgressBar value={progress} />
                  </Box>
                )}

                <TxLayoutHeader subtitle={subtitle} icon={icon} hideNonce={hideNonce} fixedNonce={fixedNonce} />
              </Paper>

              <div className={css.step}>
                {childrenArray[step]}

                {onPrev && step > 0 && (
                  <Button
                    data-testid="modal-back-btn"
                    variant={isDesktop ? 'outlined' : 'text'}
                    onClick={onPrev}
                    className={css.backButton}
                    startIcon={<ArrowBackIcon fontSize="small" />}
                  >
                    Back
                  </Button>
                )}
              </div>
            </Grid>

            {/* Sidebar */}
            {!isReplacement && (
              <Grid
                size={{ xs: 12, [smallScreenBreakpoint]: 4.5 }}
                sx={{ width: { lg: 320 } }}
                className={classnames(css.widget)}
              >
                <Box className={css.sidebarSlot}>
                  <Slot name={SlotName.Sidebar} />
                </Box>

                <Box className={css.sticky}>
                  <SafeShieldWidget />
                </Box>
              </Grid>
            )}
          </Grid>
        </Container>
      </Grid>
    </Grid>
  )
}
