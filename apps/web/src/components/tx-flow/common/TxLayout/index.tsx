import useSafeInfo from '@/hooks/useSafeInfo'
import { type ComponentType, type ReactElement, type ReactNode, useContext } from 'react'
import { Box, Container, Grid, Typography, Button, Paper, SvgIcon, useMediaQuery, Card, Stack } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useTheme } from '@mui/material/styles'
import type { TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import classnames from 'classnames'
import { ProgressBar } from '@/components/common/ProgressBar'
import SafeTxProvider, { SafeTxContext } from '../../SafeTxProvider'
import { TxInfoProvider } from '@/components/tx-flow/TxInfoProvider'
import TxNonce from '../TxNonce'
import TxStatusWidget from '../TxStatusWidget'
import css from './styles.module.css'
import { TxSecurityProvider } from '@/components/tx/security/shared/TxSecurityContext'
import ChainIndicator from '@/components/common/ChainIndicator'
import SecurityWarnings from '@/components/tx/security/SecurityWarnings'
import SafeHeaderInfo from '@/components/sidebar/SidebarHeader/SafeHeaderInfo'
import SafeShieldWidget from '../SafeShieldWidget'

export const TxLayoutHeader = ({
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

type TxLayoutProps = {
  title: ReactNode
  children: ReactNode
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
  txSummary,
  onBack,
  hideNonce = false,
  fixedNonce = false,
  hideProgress = false,
  isBatch = false,
  isReplacement = false,
  isMessage = false,
}: TxLayoutProps): ReactElement => {
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))

  const steps = Array.isArray(children) ? children : [children]
  const progress = Math.round(((step + 1) / steps.length) * 100)

  return (
    <SafeTxProvider>
      <TxInfoProvider>
        <TxSecurityProvider>
          <Stack direction="row" gap={3} className={css.container}>
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
                    isLastStep={step === steps.length - 1}
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
                      {steps[step]}

                      {onBack && step > 0 && (
                        <Button
                          data-testid="modal-back-btn"
                          variant={isSmallScreen ? 'text' : 'outlined'}
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
                    <Grid item xs={12} md={4} className={classnames(css.widget)}>
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
        </TxSecurityProvider>
      </TxInfoProvider>
    </SafeTxProvider>
  )
}

export default TxLayout
