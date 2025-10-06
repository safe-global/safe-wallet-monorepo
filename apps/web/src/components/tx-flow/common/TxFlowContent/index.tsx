import { TxFlowContext } from '../../TxFlowProvider'
import { type ReactNode, useContext } from 'react'
import { Box, Container, Grid, Typography, Button, Paper, useMediaQuery, Card, Stack } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useTheme } from '@mui/material/styles'
import classnames from 'classnames'
import { ProgressBar } from '@/components/common/ProgressBar'
import css from './styles.module.css'
import ChainIndicator from '@/components/common/ChainIndicator'
import SecurityWarnings from '@/components/tx/security/SecurityWarnings'
import TxStatusWidget from '@/components/tx-flow/common/TxStatusWidget'
import SafeShieldWidget from '@/components/tx-flow/common/SafeShieldWidget'
import { TxLayoutHeader } from '../TxLayout'
import { Slot, SlotName } from '../../slots'
import SafeHeaderInfo from '@/components/sidebar/SidebarHeader/SafeHeaderInfo'

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
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Stack direction="row" className={css.container}>
      {!isReplacement && !isSmallScreen && (
        <aside style={{ minWidth: 220, paddingTop: '46px' }}>
          <Stack gap={3} position="fixed">
            <Card
              sx={{
                p: '4px 8px 4px 4px',
                maxWidth: 214,
                mx: '-12px',
                overflow: 'visible',
                position: 'fixed',
                top: 62,
              }}
            >
              <SafeHeaderInfo />
            </Card>

            <TxStatusWidget
              isLastStep={step === childrenArray.length - 1}
              txSummary={txSummary}
              isBatch={isBatch}
              isMessage={isMessage}
            />
          </Stack>
        </aside>
      )}

      <Box width="fill-available" gap={3} mr={isSmallScreen ? 0 : 6}>
        <Container className={css.contentContainer}>
          <Grid container spacing={3} justifyContent="center">
            {/* Main content */}
            <Grid item xs={12} md={8}>
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
                    variant={isSmallScreen ? 'text' : 'outlined'}
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
              <Grid item xs={12} md={4} className={classnames(css.widget)}>
                <Slot name={SlotName.Sidebar} />

                <Box className={css.sticky}>
                  <SafeShieldWidget />
                  <SecurityWarnings />
                </Box>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>
    </Stack>
  )
}
