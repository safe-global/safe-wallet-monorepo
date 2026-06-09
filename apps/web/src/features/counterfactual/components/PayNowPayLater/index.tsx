import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import classnames from 'classnames'
import { useCurrentChain } from '@/hooks/useChains'
import { useNativeTokenDisplay } from '@/hooks/useNativeTokenDisplay'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import {
  Box,
  CircularProgress,
  FormControl,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material'

import css from './styles.module.css'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import { useSiwe } from '@/services/siwe/useSiwe'
import { useAppDispatch } from '@/store'
import { setAuthenticated, SESSION_LIFETIME_MS } from '@/store/authSlice'

const PayNowPayLater = ({
  totalFee,
  canRelay,
  isMultiChain = false,
  payMethod,
  setPayMethod,
  isUserAuthenticated = true,
}: {
  totalFee: string
  canRelay: boolean
  isMultiChain?: boolean
  payMethod: PayMethod
  setPayMethod: Dispatch<SetStateAction<PayMethod>>
  isUserAuthenticated?: boolean
}) => {
  const chain = useCurrentChain()
  const dispatch = useAppDispatch()
  const { showGasFeeEstimation, showStablecoinFeeInfo } = useNativeTokenDisplay()
  const { signIn, loading: signingIn } = useSiwe()

  const signInAndSelectPayLater = async () => {
    if (signingIn) return
    const result = await signIn()
    if (result && !result.error) {
      dispatch(setAuthenticated(Date.now() + SESSION_LIFETIME_MS))
      setPayMethod(PayMethod.PayLater)
    }
  }

  const onChoosePayMethod = async (_: ChangeEvent<HTMLInputElement>, newPayMethod: string) => {
    if (newPayMethod === PayMethod.PayLater && !isUserAuthenticated) {
      await signInAndSelectPayLater()
      return
    }
    setPayMethod(newPayMethod as PayMethod)
  }

  return (
    <>
      <Typography variant="h4" fontWeight="bold">
        Before we continue...
      </Typography>
      {isMultiChain && (
        <ErrorMessage level="info">
          You will need to <b>activate your account</b> separately on each network. Make sure you have funds on your
          wallet to pay the network fee.
        </ErrorMessage>
      )}
      {showStablecoinFeeInfo && (
        <Box mt={2}>
          <ErrorMessage level="info">
            This network uses USD stablecoins for transaction fees instead of a native token. Ensure your connected
            wallet holds a supported stablecoin to cover fees.
          </ErrorMessage>
        </Box>
      )}
      <List>
        {isMultiChain && (
          <ListItem disableGutters>
            <ListItemIcon className={css.listItem}>
              <CheckRoundedIcon fontSize="small" color="inherit" />
            </ListItemIcon>
            <Typography variant="body2">
              Start exploring the accounts now, and activate them later to start making transactions
            </Typography>
          </ListItem>
        )}
        <ListItem disableGutters>
          <ListItemIcon className={css.listItem}>
            <CheckRoundedIcon fontSize="small" color="inherit" />
          </ListItemIcon>
          <Typography variant="body2">There will be a one-time activation fee</Typography>
        </ListItem>
        {!isMultiChain && (
          <ListItem disableGutters>
            <ListItemIcon className={css.listItem}>
              <CheckRoundedIcon fontSize="small" color="inherit" />
            </ListItemIcon>
            <Typography variant="body2">
              If you choose to pay later, the fee will be included with the first transaction you make.
            </Typography>
          </ListItem>
        )}
        <ListItem disableGutters>
          <ListItemIcon className={css.listItem}>
            <CheckRoundedIcon fontSize="small" color="inherit" />
          </ListItemIcon>
          <Typography variant="body2">Safe doesn&apos;t profit from the fees.</Typography>
        </ListItem>
      </List>
      <FormControl fullWidth>
        <RadioGroup row value={payMethod} onChange={onChoosePayMethod} className={css.radioGroup}>
          <FormControlLabel
            data-testid="pay-now-execution-method"
            sx={{ flex: 1 }}
            value={PayMethod.PayNow}
            disabled={isMultiChain}
            className={classnames(css.radioContainer, { [css.active]: payMethod === PayMethod.PayNow })}
            label={
              <>
                <Typography className={css.radioTitle}>Pay now</Typography>
                {isMultiChain ? (
                  <Typography className={css.radioSubtitle} variant="body2" color="text.secondary">
                    Not available for multiple networks
                  </Typography>
                ) : (
                  showGasFeeEstimation && (
                    <Typography className={css.radioSubtitle} variant="body2" color="text.secondary">
                      {canRelay ? (
                        'Sponsored free transaction'
                      ) : (
                        <>
                          &asymp; {totalFee} {chain?.nativeCurrency.symbol}
                        </>
                      )}
                    </Typography>
                  )
                )}
              </>
            }
            control={<Radio />}
          />

          <FormControlLabel
            data-testid="connected-wallet-execution-method"
            sx={{ flex: 1 }}
            value={PayMethod.PayLater}
            disabled={signingIn}
            className={classnames(css.radioContainer, {
              [css.active]: payMethod === PayMethod.PayLater,
            })}
            label={
              <>
                <Typography className={css.radioTitle}>
                  Pay later {signingIn && <CircularProgress size={14} sx={{ ml: 0.5 }} />}
                </Typography>
                <Typography className={css.radioSubtitle} variant="body2" color="text.secondary">
                  {isUserAuthenticated ? 'with the first transaction' : 'Sign in to enable'}
                </Typography>
              </>
            }
            control={<Radio />}
          />
        </RadioGroup>
        {!isUserAuthenticated && (
          <Box mt={1}>
            <ErrorMessage level="info">
              <Typography
                variant="body2"
                component="span"
                onClick={signInAndSelectPayLater}
                sx={{
                  color: 'primary.main',
                  cursor: signingIn ? 'default' : 'pointer',
                  textDecoration: 'underline',
                  fontWeight: 'bold',
                  opacity: signingIn ? 0.6 : 1,
                }}
              >
                Sign in
              </Typography>{' '}
              to create a Safe without immediate deployment.
            </ErrorMessage>
          </Box>
        )}
      </FormControl>
    </>
  )
}

export default PayNowPayLater
