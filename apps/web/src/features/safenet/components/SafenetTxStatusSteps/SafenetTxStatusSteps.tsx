import { StepState, TxSignerStep } from '@/components/transactions/TxSigners'
import useIsSafenetEnabled from '../../hooks/useIsSafenetEnabled'
import { useGetSafenetTransactionDetailsQuery } from '@/store/safenet'
import useChainId from '@/hooks/useChainId'
import { skipToken } from '@reduxjs/toolkit/query'
import DotIcon from '@/public/images/common/dot.svg'
import CheckIcon from '@/public/images/common/circle-check.svg'
import CircleIcon from '@/public/images/common/circle.svg'
import SafenetLogo from '@/public/images/safenet/logo-safenet.svg'

import { Box, CircularProgress, Stack, SvgIcon, Typography } from '@mui/material'
import css from './styles.module.css'

const PoweredBySafenet = () => {
  return (
    <Stack direction="row" alignItems="center" spacing={1} className={css.safenetLogo} justifyContent="start">
      <Typography variant="caption">Powered by</Typography>
      <SvgIcon component={SafenetLogo} inheritViewBox sx={{ width: '60px' }} />
    </Stack>
  )
}

const Dot = () => <SvgIcon component={DotIcon} inheritViewBox className={css.dot} />
const Check = () => (
  <SvgIcon
    component={CheckIcon}
    inheritViewBox
    className={css.icon}
    sx={{
      '& path:last-of-type': { fill: ({ palette }) => palette.background.paper },
    }}
  />
)

const Incomplete = () => <SvgIcon component={CircleIcon} inheritViewBox className={css.icon} />

const SafenetTxStatusSteps = ({ safeTxHash }: { safeTxHash: string }) => {
  const isSafenetEnabled = useIsSafenetEnabled()
  const chainId = useChainId()

  const { data: safenetTxData } = useGetSafenetTransactionDetailsQuery(
    isSafenetEnabled ? { chainId, safeTxHash } : skipToken,
  )

  if (!isSafenetEnabled || !safenetTxData) {
    return null
  }
  const totalDebits = safenetTxData.debits.length
  const settledDebits = safenetTxData.debits.filter((debit) => debit.status === 'EXECUTED').length
  const isFullySettled = totalDebits === settledDebits

  return (
    <>
      <TxSignerStep icon={<Dot />} state={isFullySettled ? StepState.CONFIRMED : StepState.ACTIVE}>
        <Box>
          <Typography variant="body2">{isFullySettled ? 'You have been debited' : 'You are being debited'}</Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption">
              {isFullySettled ? 'Debited' : 'Debiting'} on {totalDebits} network{totalDebits > 1 ? 's' : ''}.{' '}
              {totalDebits > 1 && `(${settledDebits} of ${totalDebits})`}
            </Typography>
            {totalDebits > 1 && (
              <CircularProgress
                color="success"
                size={16}
                variant="determinate"
                value={(settledDebits / totalDebits) * 100}
              />
            )}
          </Stack>
        </Box>
      </TxSignerStep>
      <TxSignerStep
        icon={isFullySettled ? <Check /> : <Incomplete />}
        state={isFullySettled ? StepState.CONFIRMED : StepState.DISABLED}
        textProps={{ primaryTypographyProps: { fontWeight: 700 } }}
      >
        Completed
      </TxSignerStep>
      <Box>
        <PoweredBySafenet />
      </Box>
    </>
  )
}

export default SafenetTxStatusSteps
