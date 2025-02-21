import { type ReactNode, useState, type ReactElement } from 'react'
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
  type ListItemTextProps,
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
import SafenetTxStatusSteps from '@/features/safenet/components/SafenetTxStatusSteps'

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

export enum StepState {
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

export const TxSignerStep = ({
  state,
  icon,
  children,
  textProps,
}: {
  icon: ReactElement
  state: StepState
  children: ReactNode | string
  textProps?: ListItemTextProps & { ['data-testid']?: string }
}) => {
  return (
    <ListItem>
      <StyledListItemIcon $state={state}>{icon}</StyledListItemIcon>
      <ListItemText {...textProps}>{children}</ListItemText>
    </ListItem>
  )
}

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

  const { confirmations, confirmationsRequired, executor, safeTxHash } = detailedExecutionInfo

  // TODO: Refactor to use `isConfirmableBy`
  const confirmationsCount = confirmations.length
  const canExecute = wallet?.address ? isExecutable(txSummary, wallet.address, safe) : false
  const confirmationsNeeded = confirmationsRequired - confirmations.length
  const isConfirmed = confirmationsNeeded <= 0 || canExecute

  return (
    <>
      <List data-testid="transaction-actions-list" className={css.signers}>
        {isCancellationTxInfo(txInfo) ? (
          <TxSignerStep
            icon={<Cancel />}
            textProps={{ primaryTypographyProps: { fontWeight: 700 } }}
            state={StepState.ERROR}
          >
            On-chain rejection created
          </TxSignerStep>
        ) : (
          <TxSignerStep
            icon={<Created />}
            textProps={{ primaryTypographyProps: { fontWeight: 700 }, ['data-testid']: 'create-action' }}
            state={StepState.CONFIRMED}
          >
            Created
          </TxSignerStep>
        )}

        {proposer && (
          <TxSignerStep
            key={proposer.value}
            icon={<Dot />}
            textProps={{ ['data-testid']: 'signer' }}
            state={StepState.CONFIRMED}
          >
            <EthHashInfo address={proposer.value} hasExplorer showCopyButton />
          </TxSignerStep>
        )}

        {confirmations.length > 0 && (
          <TxSignerStep
            icon={isConfirmed ? <Check /> : <MissingConfirmation />}
            textProps={{ primaryTypographyProps: { fontWeight: 700 }, ['data-testid']: 'confirmation-action' }}
            state={isConfirmed ? StepState.CONFIRMED : StepState.ACTIVE}
          >
            Confirmations{' '}
            <Box className={css.confirmationsTotal}>({`${confirmationsCount} of ${confirmationsRequired}`})</Box>
          </TxSignerStep>
        )}

        {!hideConfirmations &&
          confirmations.map(({ signer }) => (
            <TxSignerStep
              key={signer.value}
              icon={<Dot />}
              textProps={{ ['data-testid']: 'signer' }}
              state={StepState.CONFIRMED}
            >
              <EthHashInfo address={signer.value} name={signer.name} hasExplorer showCopyButton />
            </TxSignerStep>
          ))}
        {confirmations.length > 0 && (
          <TxSignerStep icon={<Dot />} state={StepState.CONFIRMED}>
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
          </TxSignerStep>
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
        {executor ? (
          <TxSignerStep icon={<Dot />} state={StepState.CONFIRMED}>
            <Box data-testid="executor">
              <EthHashInfo
                address={executor.value}
                name={executor.name}
                customAvatar={executor.logoUri}
                hasExplorer
                showCopyButton
              />
            </Box>
          </TxSignerStep>
        ) : (
          !isConfirmed && (
            <TxSignerStep icon={<Dot />} state={StepState.CONFIRMED}>
              <Box>
                <Typography sx={({ palette }) => ({ color: palette.border.main })}>
                  Can be executed once the threshold is reached
                </Typography>
              </Box>
            </TxSignerStep>
          )
        )}
        <SafenetTxStatusSteps safeTxHash={safeTxHash} />
      </List>
    </>
  )
}

export default TxSigners
