import { Box, Step, StepConnector, Stepper, Typography } from '@mui/material'
import css from '@/components/new-safe/create/steps/StatusStep/styles.module.css'
import EthHashInfo from '@/components/common/EthHashInfo'
import { SafeCreationStatus } from '@/components/new-safe/create/steps/StatusStep/useSafeCreation'
import StatusStep from '@/components/new-safe/create/steps/StatusStep/StatusStep'
import { usePendingSafe } from './usePendingSafe'

const StatusStepper = ({ status }: { status: SafeCreationStatus }) => {
  const [pendingSafe] = usePendingSafe()
  if (!pendingSafe?.safeAddress) return null

  return (
    <Stepper orientation="vertical" nonLinear connector={<StepConnector className={css.connector} />}>
      <Step>
        <StatusStep isLoading={!pendingSafe.safeAddress} safeAddress={pendingSafe.safeAddress}>
          <Box>
            <Typography variant="body2" fontWeight="700">
              Your Superchain Account address
            </Typography>
            <EthHashInfo
              address={pendingSafe.safeAddress}
              hasExplorer
              showCopyButton
              showName={false}
              shortAddress={false}
              showAvatar={false}
            />
          </Box>
        </StatusStep>
      </Step>
      <Step>
        <StatusStep isLoading={!(pendingSafe.txHash || pendingSafe.taskId)} safeAddress={pendingSafe.safeAddress}>
          <Box>
            <Typography variant="body2" fontWeight="700">
              Validating transaction
            </Typography>
            {pendingSafe.txHash && (
              <EthHashInfo
                address={pendingSafe.txHash}
                hasExplorer
                showCopyButton
                showName={false}
                shortAddress={true}
                showAvatar={false}
              />
            )}
          </Box>
        </StatusStep>
      </Step>
      <Step>
        <StatusStep isLoading={status < SafeCreationStatus.SUCCESS} safeAddress={pendingSafe.safeAddress}>
          <Typography variant="body2" fontWeight="700">
            Indexing
          </Typography>
        </StatusStep>
      </Step>
      <Step>
        <StatusStep isLoading={status !== SafeCreationStatus.INDEXED} safeAddress={pendingSafe.safeAddress}>
          <Typography variant="body2" fontWeight="700">
            Superchain Account is ready
          </Typography>
        </StatusStep>
      </Step>
    </Stepper>
  )
}

export default StatusStepper
