import { type ComponentType, type ReactElement, type ReactNode, useContext, useEffect, useState } from 'react'
import { Box, Container, Grid, Typography, Button, Paper, SvgIcon, IconButton, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import classnames from 'classnames'
import { ProgressBar } from '@/components/common/ProgressBar'
import SafeTxProvider, { SafeTxContext } from '../../SafeTxProvider'
import { TxInfoProvider } from '@/components/tx-flow/TxInfoProvider'
import TxNonce from '../TxNonce'
import TxStatusWidget from '../TxStatusWidget'
import css from './styles.module.css'
import SafeLogo from '@/public/images/logo-no-text.svg'
import { TxSecurityProvider } from '@/components/tx/security/shared/TxSecurityContext'
import ChainIndicator from '@/components/common/ChainIndicator'
import SecurityWarnings from '@/components/tx/security/SecurityWarnings'
import { EnableRecoveryFlowEmailHint } from '../../flows/EnableRecovery/EnableRecoveryFlowEmailHint'

const TxLayoutHeader = ({
  hideNonce,
  icon,
  subtitle,
}: {
  hideNonce: TxLayoutProps['hideNonce']
  icon: TxLayoutProps['icon']
  subtitle: TxLayoutProps['subtitle']
}) => {
  const { nonceNeeded } = useContext(SafeTxContext)

  if (hideNonce && !icon && !subtitle) return null

  return (
    <Box className={css.headerInner}>
      <Box display="flex" alignItems="center">
        {icon && (
          <div className={css.icon}>
            <SvgIcon component={icon} inheritViewBox />
          </div>
        )}

        <Typography variant="h4" component="div" fontWeight="bold">
          {subtitle}
        </Typography>
      </Box>

      {!hideNonce && nonceNeeded && <TxNonce />}
    </Box>
  )
}

type TxLayoutProps = {
  title: ReactNode
  children: ReactNode
  subtitle?: ReactNode
  icon?: ComponentType
  step?: number
  txSummary?: TransactionSummary
  onBack?: () => void
  hideNonce?: boolean
  hideProgress?: boolean
  isBatch?: boolean
  isReplacement?: boolean
  isMessage?: boolean
  isRecovery?: boolean
}

const TxLayout = ({
  title,
  subtitle,
  icon,
  children,
  step = 0,
  txSummary,
  onBack,
  hideNonce = false,
  hideProgress = false,
  isBatch = false,
  isReplacement = false,
  isMessage = false,
  isRecovery = false,
}: TxLayoutProps): ReactElement => {
  const [statusVisible, setStatusVisible] = useState<boolean>(true)

  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))

  const steps = Array.isArray(children) ? children : [children]
  const progress = Math.round(((step + 1) / steps.length) * 100)

  useEffect(() => {
    setStatusVisible(!isSmallScreen)
  }, [isSmallScreen])

  const toggleStatus = () => {
    setStatusVisible((prev) => !prev)
  }

  return (
    <SafeTxProvider>
      <TxInfoProvider>
        <TxSecurityProvider>
          <>
            {/* Header status button */}
            <IconButton
              className={css.statusButton}
              aria-label="Transaction status"
              size="large"
              onClick={toggleStatus}
            >
              <SafeLogo width={16} height={16} />
            </IconButton>

            <Container className={css.container}>
              <Grid container gap={3} justifyContent="center">
                {/* Main content */}
                <Grid item xs={12} md={7}>
                  <div className={css.titleWrapper}>
                    <Typography variant="h3" component="div" fontWeight="700" className={css.title}>
                      {title}
                    </Typography>

                    <ChainIndicator inline />
                  </div>

                  <Paper className={css.header}>
                    {!hideProgress && (
                      <Box className={css.progressBar}>
                        <ProgressBar value={progress} />
                      </Box>
                    )}

                    <TxLayoutHeader subtitle={subtitle} icon={icon} hideNonce={hideNonce} />
                  </Paper>

                  <div className={css.step}>
                    {steps[step]}

                    {onBack && step > 0 && (
                      <Button variant="contained" onClick={onBack} className={css.backButton}>
                        Back
                      </Button>
                    )}
                  </div>
                </Grid>

                {/* Sidebar */}
                <Grid item xs={12} md={4} className={classnames(css.widget, { [css.active]: statusVisible })}>
                  {statusVisible && (
                    <TxStatusWidget
                      step={step}
                      txSummary={txSummary}
                      handleClose={() => setStatusVisible(false)}
                      isReplacement={isReplacement}
                      isBatch={isBatch}
                      isMessage={isMessage}
                    />
                  )}

                  <Box className={css.sticky}>
                    <SecurityWarnings />

                    {isRecovery && <EnableRecoveryFlowEmailHint />}
                  </Box>
                </Grid>
              </Grid>
            </Container>
          </>
        </TxSecurityProvider>
      </TxInfoProvider>
    </SafeTxProvider>
  )
}

export default TxLayout
