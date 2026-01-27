import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useSafeInfo from '@/hooks/useSafeInfo'
import { type ComponentType, type ReactElement, type ReactNode, useContext } from 'react'
import {
  Box,
  Container,
  Grid2 as Grid,
  Typography,
  Button,
  Paper,
  SvgIcon,
  useMediaQuery,
  Card,
  Stack,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useTheme } from '@mui/material/styles'
import classnames from 'classnames'
import { ProgressBar } from '@/components/common/ProgressBar'
import SafeTxProvider, { SafeTxContext } from '../../SafeTxProvider'
import { TxInfoProvider } from '@/components/tx-flow/TxInfoProvider'
import TxNonce from '../TxNonce'
import TxStatusWidget from '../TxStatusWidget'
import css from './styles.module.css'
import ChainIndicator from '@/components/common/ChainIndicator'
import SafeInfo from '@/components/tx-flow/common/SafeInfo'
import SafeShieldWidget from '@/features/safe-shield'
import { SafeShieldProvider } from '@/features/safe-shield/SafeShieldContext'

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
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {icon && (
          <div className={css.icon}>
            <SvgIcon component={icon} inheritViewBox />
          </div>
        )}

        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
          {subtitle}
        </Typography>
      </Box>
      {!hideNonce && safe.deployed && nonceNeeded && <TxNonce canEdit={!fixedNonce} />}
    </Box>
  )
}

type TxLayoutProps = {
  title: ReactNode
  children: ReactNode
  subtitle?: ReactNode
  icon?: ComponentType
  step?: number
  txSummary?: Transaction
  onBack?: () => void
  hideNonce?: boolean
  fixedNonce?: boolean
  hideProgress?: boolean
  isBatch?: boolean
  isReplacement?: boolean
  isMessage?: boolean
  hideSafeShield?: boolean
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
  hideSafeShield = false,
}: TxLayoutProps): ReactElement => {
  const smallScreenBreakpoint = 'md'
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down(smallScreenBreakpoint))
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))

  const steps = Array.isArray(children) ? children : [children]
  const progress = Math.round(((step + 1) / steps.length) * 100)

  return (
    <SafeTxProvider>
      <TxInfoProvider>
        <SafeShieldProvider>
          <Grid container className={css.container}>
            {!isReplacement && !isSmallScreen && (
              <Grid sx={{ width: 200 }} pt={5}>
                <aside>
                  <Stack gap={3} position="fixed">
                    <Card className={css.safeInfoCard}>
                      <SafeInfo />
                    </Card>

                    <TxStatusWidget
                      isLastStep={step === steps.length - 1}
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
                      {steps[step]}

                      {onBack && step > 0 && (
                        <Button
                          data-testid="modal-back-btn"
                          variant={isDesktop ? 'outlined' : 'text'}
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
                  {!isReplacement && !hideSafeShield && (
                    <Grid
                      size={{ xs: 12, [smallScreenBreakpoint]: 4.5 }}
                      sx={{ width: { lg: 320 } }}
                      className={classnames(css.widget)}
                    >
                      <Box className={css.sticky}>
                        <SafeShieldWidget />
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Container>
            </Grid>
          </Grid>
        </SafeShieldProvider>
      </TxInfoProvider>
    </SafeTxProvider>
  )
}

export default TxLayout
