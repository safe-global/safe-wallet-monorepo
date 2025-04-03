import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import classnames from 'classnames'
import { useCurrentChain } from '@/hooks/useChains'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import {
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

const PayNowPayLater = ({
  totalFee,
  canRelay,
  isMultiChain,
  payMethod,
  setPayMethod,
}: {
  totalFee: string
  canRelay: boolean
  isMultiChain: boolean
  payMethod: PayMethod
  setPayMethod: Dispatch<SetStateAction<PayMethod>>
}) => {
  const chain = useCurrentChain()

  const onChoosePayMethod = (_: ChangeEvent<HTMLInputElement>, newPayMethod: string) => {
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
      {!isMultiChain && (
        <FormControl fullWidth>
          <RadioGroup row value={payMethod} onChange={onChoosePayMethod} className={css.radioGroup}>
            <FormControlLabel
              data-testid="pay-now-execution-method"
              sx={{ flex: 1 }}
              value={PayMethod.PayNow}
              className={classnames(css.radioContainer, { [css.active]: payMethod === PayMethod.PayNow })}
              label={
                <>
                  <Typography className={css.radioTitle}>Pay now</Typography>
                  <Typography className={css.radioSubtitle} variant="body2" color="text.secondary">
                    {canRelay ? (
                      'Sponsored free transaction'
                    ) : (
                      <>
                        &asymp; {totalFee} {chain?.nativeCurrency.symbol}
                      </>
                    )}
                  </Typography>
                </>
              }
              control={<Radio />}
            />

            <FormControlLabel
              data-testid="connected-wallet-execution-method"
              sx={{ flex: 1 }}
              value={PayMethod.PayLater}
              className={classnames(css.radioContainer, { [css.active]: payMethod === PayMethod.PayLater })}
              label={
                <>
                  <Typography className={css.radioTitle}>Pay later</Typography>
                  <Typography className={css.radioSubtitle} variant="body2" color="text.secondary">
                    with the first transaction
                  </Typography>
                </>
              }
              control={<Radio />}
            />
          </RadioGroup>
        </FormControl>
      )}
    </>
  )
}

export default PayNowPayLater
