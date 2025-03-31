import useSafeInfo from '@/hooks/useSafeInfo'
import { type ComponentType, type ReactElement, type ReactNode, useContext, useEffect, useState } from 'react'
import { Box, Container, Grid, Typography, Button, Paper, SvgIcon, IconButton, useMediaQuery } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useTheme } from '@mui/material/styles'
import type { TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import classnames from 'classnames'
import { ProgressBar } from '@/components/common/ProgressBar'
import css from './styles.module.css'
import SafeLogo from '@/public/images/logo-no-text.svg'
import ChainIndicator from '@/components/common/ChainIndicator'
import SecurityWarnings from '@/components/tx/security/SecurityWarnings'
import TxStatusWidget from '@/components/tx-flow/common/TxStatusWidget'
import TxNonce from '@/components/tx-flow/common/TxNonce'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'

const TxLayoutHeader = ({
  hideNonce,
  fixedNonce,
  icon,
  subtitle,
}: {
  hideNonce: TxLayoutProps['hideNonce']
  fixedNonce: TxLayoutProps['fixedNonce']
  icon: TxLayoutProps['icon']
  subtitle: TxLayoutProps['subtitle']
}) => {
  const { safe } = useSafeInfo()
  const { nonceNeeded } = useContext(SafeTxContext)

  if (hideNonce && !icon && !subtitle) return null

  return (
    <Box className={css.headerInner}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {icon && (
          <div className={css.icon}>
            <SvgIcon component={icon} inheritViewBox />
          </div>
        )}

        <Typography
          variant="h4"
          component="div"
          sx={{
            fontWeight: 'bold',
          }}
        >
          {subtitle}
        </Typography>
      </Box>
      {!hideNonce && safe.deployed && nonceNeeded && <TxNonce canEdit={!fixedNonce} />}
    </Box>
  )
}

export type TxStep = {
  txLayoutProps: Omit<TxLayoutProps, 'children'>
  content: ReactElement
}

export type TxLayoutProps = {
  title: ReactNode
  children: ReactNode
  progress: number
  subtitle?: ReactNode
  icon?: ComponentType
  step?: number
  txSummary?: TransactionSummary
  onBack?: () => void
  hideNonce?: boolean
  fixedNonce?: boolean
  hideProgress?: boolean
  isBatch?: boolean
  isReplacement?: boolean
  isMessage?: boolean
}

const TxLayout = ({
  title,
  subtitle,
  icon,
  children,
  step = 0,
  progress,
  txSummary,
  onBack,
  hideNonce = false,
  fixedNonce = false,
  hideProgress = false,
  isBatch = false,
  isReplacement = false,
  isMessage = false,
}: TxLayoutProps): ReactElement => {
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
              {children}

              {onBack && step > 0 && (
                <Button
                  data-testid="modal-back-btn"
                  variant={isDesktop ? 'text' : 'outlined'}
                  onClick={onBack}
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

export default TxLayout
