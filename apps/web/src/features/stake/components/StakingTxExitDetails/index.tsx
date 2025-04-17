import { Box, Link } from '@mui/material'
import type { StakingTxExitInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { NativeStakingStatus } from '@safe-global/safe-gateway-typescript-sdk'
import FieldsGrid from '@/components/tx/FieldsGrid'
import StakingStatus from '@/features/stake/components/StakingStatus'
import { formatDurationFromMilliseconds } from '@safe-global/utils/utils/formatters'
import { BEACON_CHAIN_EXPLORERS } from '@/features/stake/constants'
import useChainId from '@/hooks/useChainId'

const StakingTxExitDetails = ({ info }: { info: StakingTxExitInfo }) => {
  const withdrawIn = formatDurationFromMilliseconds(info.estimatedExitTime + info.estimatedWithdrawalTime, [
    'days',
    'hours',
  ])

  return (
    <Box pr={5} display="flex" flexDirection="column" gap={1}>
      <FieldsGrid title="Exit">
        {info.validators.map((validator: string, index: number) => {
          return (
            <>
              <BeaconChainLink name={`Validator ${index + 1}`} validator={validator} key={index} />
              {index < info.validators.length - 1 && ' | '}
            </>
          )
        })}
      </FieldsGrid>
      {info.status !== NativeStakingStatus.EXITED && <FieldsGrid title="Est. exit time">Up to {withdrawIn}</FieldsGrid>}

      <FieldsGrid title="Validator status">
        <StakingStatus status={info.status} />
      </FieldsGrid>
    </Box>
  )
}

export const BeaconChainLink = ({ validator, name }: { validator: string; name: string }) => {
  const chainId = useChainId()
  return (
    <Link
      variant="body1"
      target="_blank"
      href={`${
        BEACON_CHAIN_EXPLORERS[chainId as keyof typeof BEACON_CHAIN_EXPLORERS] ?? 'https://beaconcha.in'
      }/validator/${validator}`}
    >
      {name}
    </Link>
  )
}
export default StakingTxExitDetails
