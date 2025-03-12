import type { ReactNode } from 'react'
import { useContext } from 'react'
import { TxSecurityContext } from '@/components/tx/security/shared/TxSecurityContext'
import groupBy from 'lodash/groupBy'
import { Alert, AlertTitle, Box, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material'
import { FEATURES } from '@/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import { ErrorBoundary } from '@sentry/react'
import css from './styles.module.css'

import Track from '@/components/common/Track'
import { MODALS_EVENTS } from '@/services/analytics'

import BlockaidIcon from '@/public/images/transactions/blockaid-icon.svg'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { type SecurityWarningProps, mapSecuritySeverity } from '../utils'
import { BlockaidHint } from './BlockaidHint'
import { ContractChangeWarning } from './ContractChangeWarning'

export const REASON_MAPPING: Record<string, string> = {
  raw_ether_transfer: 'transfers native currency',
  signature_farming: 'is a raw signed transaction',
  transfer_farming: 'transfers tokens',
  approval_farming: 'approves erc20 tokens',
  set_approval_for_all: 'approves all tokens of the account',
  permit_farming: 'authorizes access or permissions',
  seaport_farming: 'authorizes transfer of assets via Opeansea marketplace',
  blur_farming: 'authorizes transfer of assets via Blur marketplace',
  delegatecall_execution: 'involves a delegate call',
}

export const CLASSIFICATION_MAPPING: Record<string, string> = {
  known_malicious: 'to a known malicious address',
  unverified_contract: 'to an unverified contract',
  new_address: 'to a new address',
  untrusted_address: 'to an untrusted address',
  address_poisoning: 'to a poisoned address',
  losing_mint: 'resulting in a mint for a new token with a significantly higher price than the known price',
  losing_assets: 'resulting in a loss of assets without any compensation',
  losing_trade: 'resulting in a losing trade',
  drainer_contract: 'to a known drainer contract',
  user_mistake: 'resulting in a loss of assets due to an innocent mistake',
  gas_farming_attack: 'resulting in a waste of the account address’ gas to generate tokens for a scammer',
  other: 'resulting in a malicious outcome',
}

export const Warning = ({
  title,
  content,
  severityProps,
  needsRiskConfirmation = false,
  isRiskConfirmed = true,
  isTransaction = true,
  toggleConfirmation,
}: {
  title: ReactNode
  content: ReactNode
  severityProps?: SecurityWarningProps
  needsRiskConfirmation?: boolean
  isRiskConfirmed?: boolean
  isTransaction?: boolean
  toggleConfirmation?: () => void
}) => {
  return (
    <Box>
      <Alert
        severity={severityProps?.color}
        className={css.customAlert}
        sx={needsRiskConfirmation ? { borderBottomLeftRadius: '0px', borderBottomRightRadius: '0px' } : undefined}
      >
        <AlertTitle fontWeight="700 !important" mb={1}>
          {title}
        </AlertTitle>
        {content}
      </Alert>
      {needsRiskConfirmation && (
        <Box className={css.riskConfirmationBlock} sx={{ pl: 2 }}>
          <Track {...MODALS_EVENTS.ACCEPT_RISK}>
            <FormControlLabel
              label={
                <Typography variant="body2" color="static.main">
                  I understand the risks and would like to sign this {isTransaction ? 'transaction' : 'message'}
                </Typography>
              }
              control={<Checkbox checked={isRiskConfirmed} onChange={toggleConfirmation} color="primary" />}
            />
          </Track>
        </Box>
      )}
    </Box>
  )
}

const ResultDescription = ({
  description,
  reason,
  classification,
}: {
  description: string | undefined
  reason: string | undefined
  classification: string | undefined
}) => {
  let text: string | undefined = ''
  if (reason && classification && REASON_MAPPING[reason] && CLASSIFICATION_MAPPING[classification]) {
    text = `The transaction ${REASON_MAPPING[reason]} ${CLASSIFICATION_MAPPING[classification]}.`
  } else {
    text = description
  }

  return (
    <Typography
      variant="subtitle1"
      sx={{
        fontWeight: 700,
        lineHeight: '20px',
      }}
    >
      {text ?? 'The transaction is malicious.'}
    </Typography>
  )
}

const BlockaidError = () => {
  return (
    <Alert severity="warning" className={css.customAlert}>
      <AlertTitle>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
          }}
        >
          Proceed with caution
        </Typography>
      </AlertTitle>
      <Typography variant="body2">
        The transaction could not be checked for security alerts. Verify the details and addresses before proceeding.
      </Typography>
      <BlockaidMessage />
    </Alert>
  )
}

export const Blockaid = () => {
  const isFeatureEnabled = useHasFeature(FEATURES.RISK_MITIGATION)

  if (!isFeatureEnabled) {
    return null
  }

  return (
    <ErrorBoundary fallback={<div>Error showing scan result</div>}>
      <BlockaidWarning />
    </ErrorBoundary>
  )
}

const BlockaidWarning = () => {
  const { blockaidResponse, setIsRiskConfirmed, needsRiskConfirmation, isRiskConfirmed } = useContext(TxSecurityContext)
  const { severity, isLoading, error } = blockaidResponse ?? {}

  const { safeTx } = useContext(SafeTxContext)

  // We either scan a tx or a message if tx is undefined
  const isTransaction = !!safeTx

  const severityProps = severity !== undefined ? mapSecuritySeverity[severity] : undefined

  const toggleConfirmation = () => {
    setIsRiskConfirmed((prev) => !prev)
  }

  if (error) {
    return <BlockaidError />
  }

  if (isLoading || !blockaidResponse) {
    return null
  }

  return (
    <>
      {!!blockaidResponse.severity ? (
        <Box>
          <Warning
            isRiskConfirmed={isRiskConfirmed}
            isTransaction={isTransaction}
            needsRiskConfirmation={needsRiskConfirmation}
            toggleConfirmation={toggleConfirmation}
            title={
              <ResultDescription
                classification={blockaidResponse.classification}
                reason={blockaidResponse.reason}
                description={blockaidResponse.description}
              />
            }
            content={<BlockaidMessage />}
            severityProps={severityProps}
          />
          <PoweredByBlockaid />
        </Box>
      ) : blockaidResponse?.contractManagement && blockaidResponse.contractManagement.length > 0 ? (
        <Box>
          <Stack direction="column" spacing={1}>
            {blockaidResponse?.contractManagement.map((contractChange) => (
              <ContractChangeWarning key={contractChange.type} contractChange={contractChange} />
            ))}
          </Stack>
          <PoweredByBlockaid />
        </Box>
      ) : null}
    </>
  )
}

const PoweredByBlockaid = () => (
  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 1 }}>
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
      Powered by
    </Typography>
    <BlockaidIcon />
  </Stack>
)

export const BlockaidMessage = () => {
  const { blockaidResponse } = useContext(TxSecurityContext)
  if (!blockaidResponse) {
    return null
  }

  const { warnings } = blockaidResponse

  /* Evaluate security warnings */
  const groupedShownWarnings = groupBy(warnings, (warning) => warning.severity)
  const sortedSeverities = Object.keys(groupedShownWarnings).sort((a, b) => (Number(a) < Number(b) ? 1 : -1))

  if (sortedSeverities.length === 0) return null

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {sortedSeverities.map((key) => (
        <BlockaidHint key={key} warnings={groupedShownWarnings[key].map((warning) => warning.description)} />
      ))}
    </Box>
  )
}
