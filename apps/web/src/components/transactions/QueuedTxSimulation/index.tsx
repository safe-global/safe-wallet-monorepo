import useSafeInfo from '@/hooks/useSafeInfo'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { type SafeInfo, type TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { createExistingTx } from '@/services/tx/tx-sender'
import useChainId from '@/hooks/useChainId'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useSimulation } from '@/components/tx/security/tenderly/useSimulation'
import TenderlyIcon from '@/public/images/transactions/tenderly-small.svg'
import { ButtonBase, CircularProgress, Stack, SvgIcon, Typography } from '@mui/material'
import { useSigner } from '@/hooks/wallets/useWallet'
import ExternalLink from '@/components/common/ExternalLink'
import CheckIcon from '@/public/images/common/check.svg'
import CloseIcon from '@/public/images/common/close.svg'
import { getSimulationStatus } from '@safe-global/utils/components/tx/security/tenderly/utils'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { useIsNestedSafeOwner } from '@/hooks/useIsNestedSafeOwner'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useMemo } from 'react'

const CompactSimulationButton = ({
  label,
  iconComponent,
  disabled = false,
  onClick,
}: {
  label: string
  iconComponent: React.ReactNode
  disabled?: boolean
  onClick?: () => void
}) => {
  return (
    <ButtonBase
      disabled={disabled}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        flexDirection: 'row',
        borderRadius: '8px',
        backgroundColor: 'background.main',
        padding: '4px 16px',
        // This is required as the icon otherwise disappears when the first tx accordion is closed
        visibility: 'visible !important',
      }}
      onClick={onClick}
    >
      {iconComponent}
      <Typography variant="subtitle2" fontWeight={700}>
        {label}
      </Typography>
    </ButtonBase>
  )
}

export const QueuedTxSimulation = ({ transaction }: { transaction: TransactionDetails }) => {
  const { safe } = useSafeInfo()
  const isSafeOwner = useIsSafeOwner()
  const isNestedSafeOwner = useIsNestedSafeOwner()
  const chainId = useChainId()
  const signer = useSigner()
  const sdk = useSafeSDK()

  const canSimulate = isSafeOwner || isNestedSafeOwner

  const [safeTransaction, safeTransactionError] = useAsync(
    () => (sdk ? createExistingTx(chainId, transaction.txId, transaction) : undefined),
    [chainId, transaction, sdk],
  )

  const executionOwner = useMemo(
    () =>
      safe.owners.some((owner) => sameAddress(owner.value, signer?.address)) ? signer?.address : safe.owners[0]?.value,
    [safe.owners, signer?.address],
  )

  const simulation = useSimulation()
  const { simulationLink, simulateTransaction } = simulation
  const status = simulation ? getSimulationStatus(simulation) : undefined

  const handleSimulation = () => {
    if (safeTransaction && executionOwner) {
      simulateTransaction({ executionOwner, transactions: safeTransaction, safe: safe as SafeInfo })
    }
  }

  if (safeTransactionError || !canSimulate || !executionOwner) {
    return null
  }

  if (status?.isLoading) {
    return <CompactSimulationButton label="Simulating" iconComponent={<CircularProgress size={16} />} disabled={true} />
  }

  if (!status?.isFinished) {
    return (
      <CompactSimulationButton
        label="Simulate"
        iconComponent={<SvgIcon component={TenderlyIcon} inheritViewBox sx={{ height: '16px' }} />}
        disabled={!safeTransaction}
        onClick={handleSimulation}
      />
    )
  }

  if (status?.isFinished && !status.isError) {
    return (
      <ExternalLink href={simulationLink}>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <SvgIcon
            color={status.isSuccess ? 'success' : 'error'}
            component={status.isSuccess ? CheckIcon : CloseIcon}
            inheritViewBox
            sx={{ height: '16px' }}
          />
          {status.isSuccess ? 'Simulation successful' : 'Simulation failed'}
        </Stack>
      </ExternalLink>
    )
  }

  if (status?.isError) {
    return (
      <Stack direction="row" alignItems="center" gap={0.5}>
        <SvgIcon color="error" component={CloseIcon} inheritViewBox sx={{ height: '16px' }} />
        Error while simulating
      </Stack>
    )
  }

  return null
}
