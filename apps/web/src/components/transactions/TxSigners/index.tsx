import { useState, type ReactElement } from 'react'
import {
  Box,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  type Palette,
  SvgIcon,
  Typography,
  type ListItemIconProps,
} from '@mui/material'
import type {
  AddressEx,
  DetailedExecutionInfo,
  TransactionDetails,
  TransactionSummary,
} from '@safe-global/safe-gateway-typescript-sdk'

import useWallet from '@/hooks/wallets/useWallet'
import useIsPending from '@/hooks/useIsPending'
import { isCancellationTxInfo, isExecutable, isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import EthHashInfo from '@/components/common/EthHashInfo'

import css from './styles.module.css'
import useSafeInfo from '@/hooks/useSafeInfo'
import CreatedIcon from '@/public/images/common/created.svg'
import DotIcon from '@/public/images/common/dot.svg'
import CircleIcon from '@/public/images/common/circle.svg'
import CheckIcon from '@/public/images/common/circle-check.svg'
import CancelIcon from '@/public/images/common/cancel.svg'
import useTransactionStatus from '@/hooks/useTransactionStatus'

// Icons
const Created = () => (
  <SvgIcon
    component={CreatedIcon}
    inheritViewBox
    className={css.icon}
    sx={{
      '& path:last-of-type': { fill: ({ palette }) => palette.background.paper },
    }}
  />
)
const MissingConfirmation = () => <SvgIcon component={CircleIcon} inheritViewBox className={css.icon} />
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
const Cancel = () => <SvgIcon component={CancelIcon} inheritViewBox className={css.icon} />
const Dot = () => <SvgIcon component={DotIcon} inheritViewBox className={css.dot} />

enum StepState {
  CONFIRMED = 'CONFIRMED',
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  ERROR = 'ERROR',
}

const getStepColor = (state: StepState, palette: Palette): string => {
  const colors: { [_key in StepState]: string } = {
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
    sx={({ palette }) => ({
      '.MuiSvgIcon-root': {
        color: getStepColor($state, palette),
        alignItems: 'center',
      },
    })}
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
  isTxFromProposer: boolean
  proposer?: AddressEx
}

export const TxSigners = ({
  txDetails,
  txSummary,
  isTxFromProposer,
  proposer,
}: TxSignersProps): ReactElement | null => {
  const { detailedExecutionInfo, txInfo, txId } = txDetails
  const [hideConfirmations, setHideConfirmations] = useState<boolean>(shouldHideConfirmations(detailedExecutionInfo))
  const isPending = useIsPending(txId)
  const txStatus = useTransactionStatus(txSummary)
  const wallet = useWallet()
  const { safe } = useSafeInfo()

  const toggleHide = () => {
    setHideConfirmations((prev) => !prev)
  }

  if (!detailedExecutionInfo || !isMultisigDetailedExecutionInfo(detailedExecutionInfo)) {
    return null
  }

  const { confirmations, confirmationsRequired, executor } = detailedExecutionInfo

  // TODO: Refactor to use `isConfirmableBy`
  const confirmationsCount = confirmations.length
  const canExecute = wallet?.address ? isExecutable(txSummary, wallet.address, safe) : false
  const confirmationsNeeded = confirmationsRequired - confirmations.length
  const isConfirmed = confirmationsNeeded <= 0 || canExecute

  return (
    <Box mb={2}>
      <List data-testid="transaction-actions-list" className={css.signers}>
        <ListItem>
          {isCancellationTxInfo(txInfo) ? (
            <>
              <StyledListItemIcon $state={StepState.ERROR}>
                <Cancel />
              </StyledListItemIcon>
              <ListItemText primaryTypographyProps={{ fontWeight: 700 }}>On-chain rejection created</ListItemText>
            </>
          ) : (
            <>
              <StyledListItemIcon $state={StepState.CONFIRMED}>
                <Created />
              </StyledListItemIcon>
              <ListItemText data-testid="create-action" primaryTypographyProps={{ fontWeight: 700 }}>
                Created
              </ListItemText>
            </>
          )}
        </ListItem>

        {proposer && (
          <ListItem key={proposer.value} sx={{ py: 0 }}>
            <StyledListItemIcon $state={StepState.CONFIRMED}>
              <Dot />
            </StyledListItemIcon>
            <ListItemText data-testid="signer">
              <EthHashInfo address={proposer.value} hasExplorer showCopyButton />
            </ListItemText>
          </ListItem>
        )}

        {confirmations.length > 0 && (
          <ListItem>
            <StyledListItemIcon $state={isConfirmed ? StepState.CONFIRMED : StepState.ACTIVE}>
              {isConfirmed ? <Check /> : <MissingConfirmation />}
            </StyledListItemIcon>
            <ListItemText data-testid="confirmation-action" primaryTypographyProps={{ fontWeight: 700 }}>
              Confirmations{' '}
              <Box className={css.confirmationsTotal}>({`${confirmationsCount} of ${confirmationsRequired}`})</Box>
            </ListItemText>
          </ListItem>
        )}

        {!hideConfirmations &&
          confirmations.map(({ signer }) => (
            <ListItem key={signer.value} sx={{ py: 0 }}>
              <StyledListItemIcon $state={StepState.CONFIRMED}>
                <Dot />
              </StyledListItemIcon>
              <ListItemText data-testid="signer">
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
              <Link
                data-testid="confirmation-visibility-btn"
                component="button"
                onClick={toggleHide}
                sx={{
                  fontSize: 'medium',
                }}
              >
                {hideConfirmations ? 'Show all' : 'Hide all'}
              </Link>
            </ListItemText>
          </ListItem>
        )}
        <ListItem sx={{ alignItems: 'flex-start' }}>
          <StyledListItemIcon $state={executor ? StepState.CONFIRMED : StepState.DISABLED}>
            {executor ? <Check /> : <MissingConfirmation />}
          </StyledListItemIcon>
          <ListItemText
            primary={
              executor ? 'Executed' : isPending ? txStatus : isTxFromProposer ? 'Signer review' : 'Can be executed'
            }
            secondary={
              isTxFromProposer
                ? 'This transaction was created by a Proposer. Please review and either confirm or reject it. Once confirmed, it can be finalized and executed.'
                : undefined
            }
            data-testid="tx-action-status"
            primaryTypographyProps={{ fontWeight: 700 }}
            secondaryTypographyProps={{ mt: 1 }}
          />
        </ListItem>
      </List>
      {executor ? (
        <Box data-testid="executor" className={css.listFooter}>
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
    </Box>
  )
}

export default TxSigners
