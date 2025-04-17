import { TxFlowContext } from '../../TxFlowProvider'
import { type ReactNode, useContext, useEffect, useState } from 'react'
import { Box, Container, Grid, Typography, Button, Paper, IconButton, useMediaQuery } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useTheme } from '@mui/material/styles'
import classnames from 'classnames'
import { ProgressBar } from '@/components/common/ProgressBar'
import css from './styles.module.css'
import SafeLogo from '@/public/images/logo-no-text.svg'
import ChainIndicator from '@/components/common/ChainIndicator'
import SecurityWarnings from '@/components/tx/security/SecurityWarnings'
import TxStatusWidget from '@/components/tx-flow/common/TxStatusWidget'
import { TxLayoutHeader } from '../TxLayout'
import { Slot, SlotName } from '../../slots'

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

  const [statusVisible, setStatusVisible] = useState<boolean>(true)

  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))
  const isDesktop = useMediaQuery(theme.breakpoints.down('lg'))

  useEffect(() => {
    setStatusVisible(!isSmallScreen)
  }, [isSmallScreen])

  const toggleStatus = () => {
    setStatusVisible((prev) => !prev)
  }

  return (
    <>
      {/* Header status button */}
      {!isReplacement && (
        <IconButton className={css.statusButton} aria-label="Transaction status" size="large" onClick={toggleStatus}>
          <SafeLogo width={16} height={16} />
        </IconButton>
      )}

      <Container className={css.container}>
        <Grid
          container
          sx={{
            gap: 3,
            justifyContent: 'center',
          }}
        >
          {/* Main content */}
          <Grid item xs={12} md={7}>
            <div className={css.titleWrapper}>
              <Typography
                data-testid="modal-title"
                variant="h3"
                component="div"
                className={css.title}
                sx={{
                  fontWeight: '700',
                }}
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
                  variant={isDesktop ? 'text' : 'outlined'}
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
            <Grid item xs={12} md={4} className={classnames(css.widget, { [css.active]: statusVisible })}>
              {statusVisible && (
                <TxStatusWidget
                  step={step}
                  txSummary={txSummary}
                  handleClose={() => setStatusVisible(false)}
                  isBatch={isBatch}
                  isMessage={isMessage}
                />
              )}

              <Slot name={SlotName.Sidebar} />

              <Box className={css.sticky}>
                <SecurityWarnings />
              </Box>
            </Grid>
          )}
        </Grid>
      </Container>
    </>
  )
}
