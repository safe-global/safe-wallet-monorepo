import { useState, type ReactElement } from 'react'
import {
  Box,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  SvgIcon,
  Typography,
  type ListItemIconProps,
} from '@mui/material'
import RadioButtonUncheckedOutlinedIcon from '@mui/icons-material/RadioButtonUncheckedOutlined'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import type {
  DetailedExecutionInfo,
  TransactionDetails,
  TransactionSummary,
} from '@safe-global/safe-gateway-typescript-sdk'

import useWallet from '@/hooks/wallets/useWallet'
import useIsPending from '@/hooks/useIsPending'
import { isCancellationTxInfo, isExecutable, isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import EthHashInfo from '@/components/common/EthHashInfo'

import css from './styles.module.css'
import txSignersCss from '@/components/transactions/TxSigners/styles.module.css'
import useSafeInfo from '@/hooks/useSafeInfo'
import palette from '@/styles/colors'
import CreatedIcon from '@/public/images/common/created.svg'
import DotIcon from '@/public/images/common/dot.svg'

// TODO: replace MUI icons by .svg
const TxRejectionIcon = () => <CancelIcon className={css.icon} />
const CheckIcon = () => <CheckCircleIcon className={css.icon} />
const CircleIcon = () => (
  <RadioButtonUncheckedOutlinedIcon className={css.icon} sx={{ stroke: 'currentColor', strokeWidth: '1px' }} />
)

// New Icons
const Created = () => <SvgIcon component={CreatedIcon} inheritViewBox className={css.icon} />
const Dot = () => <SvgIcon component={DotIcon} inheritViewBox className={css.dot} />

enum StepState {
  CONFIRMED = 'CONFIRMED',
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  ERROR = 'ERROR',
}

const getStepColor = (state: StepState): string => {
  const colors: { [key in StepState]: string } = {
    [StepState.CONFIRMED]: palette.primary.main,
    [StepState.ACTIVE]: palette.warning.dark,
    [StepState.DISABLED]: palette.border.main,
    [StepState.ERROR]: palette.error.main,
  }
  return colors[state]
}

const StyledListItemIcon = ({
  $state,
  ...rest
}: {
  $state: StepState
} & ListItemIconProps) => (
  <ListItemIcon
    sx={{
      '.MuiSvgIcon-root': {
        color: getStepColor($state),
        alignItems: 'center',
      },
    }}
    {...rest}
  />
)

const shouldHideConfirmations = (detailedExecutionInfo?: DetailedExecutionInfo): boolean => {
  if (!detailedExecutionInfo || !isMultisigDetailedExecutionInfo(detailedExecutionInfo)) {
    return true
  }

  const confirmationsNeeded = detailedExecutionInfo.confirmationsRequired - detailedExecutionInfo.confirmations.length
  const isConfirmed = confirmationsNeeded <= 0

  // Threshold reached or more than 3 confirmations
  return isConfirmed || detailedExecutionInfo.confirmations.length > 3
}

type TxSignersProps = {
  txDetails: TransactionDetails
  txSummary: TransactionSummary
}

export const TxSigners = ({ txDetails, txSummary }: TxSignersProps): ReactElement | null => {
  const { detailedExecutionInfo, txInfo, txId } = txDetails
  const [hideConfirmations, setHideConfirmations] = useState<boolean>(shouldHideConfirmations(detailedExecutionInfo))
  const isPending = useIsPending(txId)
  const wallet = useWallet()
  const { safe } = useSafeInfo()

  const toggleHide = () => {
    setHideConfirmations((prev) => !prev)
  }

  if (!detailedExecutionInfo || !isMultisigDetailedExecutionInfo(detailedExecutionInfo)) {
    return null
  }

  const { confirmations, confirmationsRequired, executor } = detailedExecutionInfo

  const confirmationsCount = confirmations.length
  const canExecute = wallet?.address ? isExecutable(txSummary, wallet.address, safe) : false
  const confirmationsNeeded = confirmationsRequired - confirmations.length
  const isConfirmed = confirmationsNeeded <= 0 || isPending || canExecute

  return (
    <>
      <List className={css.signers}>
        <ListItem>
          {isCancellationTxInfo(txInfo) ? (
            <>
              <StyledListItemIcon $state={StepState.ERROR}>
                <TxRejectionIcon />
              </StyledListItemIcon>
              <ListItemText primaryTypographyProps={{ fontWeight: 700 }}>On-chain rejection created</ListItemText>
            </>
          ) : (
            <>
              <StyledListItemIcon $state={StepState.CONFIRMED}>
                <Created />
              </StyledListItemIcon>
              <ListItemText primaryTypographyProps={{ fontWeight: 700 }}>Created</ListItemText>
            </>
          )}
        </ListItem>

        <ListItem>
          <StyledListItemIcon $state={isConfirmed ? StepState.CONFIRMED : StepState.ACTIVE}>
            {isConfirmed ? <CheckIcon /> : <CircleIcon />}
          </StyledListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 700 }}>
            Confirmations{' '}
            <Box className={txSignersCss.confirmationsTotal}>
              ({`${confirmationsCount} of ${confirmationsRequired}`})
            </Box>
          </ListItemText>
        </ListItem>
        {!hideConfirmations &&
          confirmations.map(({ signer }) => (
            <ListItem key={signer.value} sx={{ py: 0 }}>
              <StyledListItemIcon $state={StepState.CONFIRMED}>
                <Dot />
              </StyledListItemIcon>
              <ListItemText>
                <EthHashInfo address={signer.value} name={signer.name} hasExplorer showCopyButton />
              </ListItemText>
            </ListItem>
          ))}
        {confirmations.length > 0 && (
          <ListItem>
            <StyledListItemIcon $state={StepState.CONFIRMED}>
              <Dot />
            </StyledListItemIcon>
            <ListItemText>
              <Link component="button" onClick={toggleHide} fontSize="medium">
                {hideConfirmations ? 'Show all' : 'Hide all'}
              </Link>
            </ListItemText>
          </ListItem>
        )}
        <ListItem>
          <StyledListItemIcon $state={executor ? StepState.CONFIRMED : StepState.DISABLED}>
            {executor ? <CheckIcon /> : <CircleIcon />}
          </StyledListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 700 }}>
            {executor ? 'Executed' : isPending ? 'Executing' : 'Can be executed'}
          </ListItemText>
        </ListItem>
      </List>
      {executor ? (
        <Box className={css.listFooter}>
          <EthHashInfo
            address={executor.value}
            name={executor.name}
            customAvatar={executor.logoUri}
            hasExplorer
            showCopyButton
          />
        </Box>
      ) : (
        !isConfirmed && (
          <Box className={css.listFooter}>
            <Typography sx={({ palette }) => ({ color: palette.border.main })}>
              Can be executed once the threshold is reached
            </Typography>
          </Box>
        )
      )}
    </>
  )
}

export default TxSigners
