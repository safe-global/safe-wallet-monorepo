import Step, { StepProps } from '@mui/material/Step'
import StepConnector from '@mui/material/StepConnector'
import StepContent from '@mui/material/StepContent'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import RadioButtonUncheckedOutlinedIcon from '@mui/icons-material/RadioButtonUncheckedOutlined'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import Box from '@mui/material/Box'
import { useState, type ReactElement } from 'react'
import type {
  AddressEx,
  DetailedExecutionInfo,
  TransactionDetails,
  TransactionSummary,
} from '@gnosis.pm/safe-react-gateway-sdk'
import theme from '@/styles/theme'

import useWallet from '@/hooks/wallets/useWallet'
import useAddressBook from '@/hooks/useAddressBook'
import useIsPending from '@/hooks/useIsPending'
import { isCancellationTxInfo, isExecutable, isMultisigExecutionDetails } from '@/utils/transaction-guards'
import { Button } from '@mui/material'
import { AddressInfo } from '../TxDetails/TxData'

import css from './styles.module.css'

// Icons

const TxCreationIcon = () => <AddCircleIcon className={css.icon} />
const TxRejectionIcon = () => <CancelIcon className={css.icon} />
const CheckIcon = () => <CheckCircleIcon className={css.icon} />

const CircleIcon = () => (
  <RadioButtonUncheckedOutlinedIcon className={css.icon} sx={{ stroke: 'currentColor', strokeWidth: '1px' }} />
)
const DotIcon = () => <FiberManualRecordIcon className={css.icon} sx={{ height: '14px', width: '14px' }} />

type StepState = 'confirmed' | 'active' | 'disabled' | 'error'
const getStepColor = (state: StepState): string => {
  const { palette } = theme

  const colors = {
    confirmed: palette.primary.main,
    active: palette.warning.dark,
    disabled: palette.border.main,
    error: palette.error.main,
  }
  return colors[state]
}

type StyledStepProps = {
  $bold?: boolean
  $state: StepState
}
const StyledStep = ({ $bold, $state, children, sx, ...rest }: StyledStepProps & StepProps) => (
  <Step
    sx={{
      '.MuiStepLabel-label': {
        fontWeight: `${$bold ? 'bold' : 'normal'} !important`,
        fontSize: '16px !important',
        color: `${getStepColor($state)} !important`,
      },
      '.MuiStepLabel-iconContainer': {
        color: getStepColor($state),
        alignItems: 'center',
      },
      ...sx,
    }}
    {...rest}
  >
    {children}
  </Step>
)

const shouldHideConfirmations = (detailedExecutionInfo: DetailedExecutionInfo | null): boolean => {
  if (!detailedExecutionInfo || !isMultisigExecutionDetails(detailedExecutionInfo)) {
    return true
  }

  const confirmationsNeeded = detailedExecutionInfo.confirmationsRequired - detailedExecutionInfo.confirmations.length
  const isConfirmed = confirmationsNeeded <= 0

  // Threshold reached or more than 3 confirmations
  return isConfirmed || detailedExecutionInfo.confirmations.length > 3
}

const getConfirmationStep = ({ value, name }: AddressEx, key: string | undefined = undefined): ReactElement => (
  <StyledStep key={key} $bold $state="confirmed">
    <StepLabel icon={<DotIcon />}>
      <AddressInfo address={value} name={name} />
    </StepLabel>
  </StyledStep>
)

export const TxSigners = ({
  txDetails,
  txSummary,
}: {
  txDetails: TransactionDetails
  txSummary: TransactionSummary
}): ReactElement | null => {
  const { detailedExecutionInfo, txInfo, txId } = txDetails
  const [hideConfirmations, setHideConfirmations] = useState<boolean>(shouldHideConfirmations(detailedExecutionInfo))
  const isPending = useIsPending({ txId })
  const wallet = useWallet()
  const account = wallet?.address || ''
  const { [account]: name } = useAddressBook()

  const toggleHide = () => {
    setHideConfirmations((prev) => !prev)
  }

  if (!detailedExecutionInfo || !isMultisigExecutionDetails(detailedExecutionInfo)) {
    return null
  }

  const canExecute = wallet?.address ? isExecutable(txSummary, wallet.address) : false
  const numberOfConfirmations = detailedExecutionInfo.confirmations.length
  const confirmationsNeeded = detailedExecutionInfo.confirmationsRequired - detailedExecutionInfo.confirmations.length
  const isConfirmed = confirmationsNeeded <= 0 || isPending || canExecute
  const isExecuted = !!detailedExecutionInfo.executor

  return (
    <Stepper
      orientation="vertical"
      nonLinear
      connector={
        <StepConnector
          sx={({ palette }) => ({
            padding: '3px 0',
            '.MuiStepConnector-line': {
              marginLeft: '-3px',
              borderColor: palette.border.light,
              borderLeftWidth: '2px',
              minHeight: '14px',
            },
          })}
        />
      }
      sx={{ padding: 0 }}
    >
      {isCancellationTxInfo(txInfo) ? (
        <StyledStep $bold $state="error">
          <StepLabel icon={<TxRejectionIcon />}>On-chain rejection created</StepLabel>
        </StyledStep>
      ) : (
        <StyledStep $bold $state="confirmed">
          <StepLabel icon={<TxCreationIcon />}>Created</StepLabel>
        </StyledStep>
      )}
      <StyledStep $bold $state={isConfirmed ? 'confirmed' : 'active'}>
        <StepLabel icon={isConfirmed ? <CheckIcon /> : <CircleIcon />}>
          Confirmations{' '}
          <Box
            sx={({ palette }) => ({
              color: palette.border.main,
              display: 'inline',
              fontWeight: 'normal',
            })}
          >
            ({`${numberOfConfirmations} of ${detailedExecutionInfo.confirmationsRequired}`})
          </Box>
        </StepLabel>
      </StyledStep>
      {!hideConfirmations &&
        detailedExecutionInfo.confirmations.map(({ signer }) => getConfirmationStep(signer, signer.value))}
      {detailedExecutionInfo.confirmations.length > 0 && (
        <StyledStep $state="confirmed">
          <StepLabel icon={<DotIcon />}>
            <Button variant="text" size="large" onClick={toggleHide}>
              {hideConfirmations ? 'Show all' : 'Hide all'}
            </Button>
          </StepLabel>
        </StyledStep>
      )}
      <StyledStep expanded $bold $state={isExecuted ? 'confirmed' : 'disabled'}>
        <StepLabel icon={isExecuted ? <CheckIcon /> : <CircleIcon />}>
          {isExecuted ? 'Executed' : isPending ? 'Executing' : 'Execution'}
        </StepLabel>
        {
          // isExecuted
          detailedExecutionInfo.executor ? (
            <StepContent>
              <AddressInfo
                address={detailedExecutionInfo.executor.value}
                name={detailedExecutionInfo.executor.name}
                avatarUrl={detailedExecutionInfo.executor.logoUri}
              />
            </StepContent>
          ) : (
            !isConfirmed && (
              <StepContent sx={({ palette }) => ({ color: palette.border.main })}>
                Can be executed once the threshold is reached
              </StepContent>
            )
          )
        }
      </StyledStep>
    </Stepper>
  )
}

export default TxSigners
