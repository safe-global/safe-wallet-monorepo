import type { ReactElement } from 'react'
import { Box, Skeleton } from '@mui/material'

import css from './styles.module.css'
import Identicon, { type IdenticonProps } from '../Identicon'
import { useChain } from '@/hooks/useChains'

interface ThresholdProps {
  threshold: number | string
  owners: number | string
}
const Threshold = ({ threshold, owners }: ThresholdProps): ReactElement => (
  <Box className={css.threshold} sx={{ color: ({ palette }) => palette.static.main }}>
    {threshold}/{owners}
  </Box>
)

interface SafeIconProps extends IdenticonProps {
  threshold?: ThresholdProps['threshold']
  owners?: ThresholdProps['owners']
  size?: number
  chainId?: string
  isMultiChainItem?: boolean
}

export const ChainIcon = ({ chainId }: { chainId: string }) => {
  const chainConfig = useChain(chainId)

  if (!chainConfig) {
    return <Skeleton variant="circular" width={40} height={40} />
  }

  return (
    <img
      src={chainConfig.chainLogoUri ?? undefined}
      alt={`${chainConfig.chainName} Logo`}
      width={40}
      height={40}
      loading="lazy"
    />
  )
}

const SafeIcon = ({
  address,
  threshold,
  owners,
  size,
  chainId,
  isMultiChainItem = false,
}: SafeIconProps): ReactElement => {
  return (
    <div data-testid="safe-icon" className={css.container}>
      {threshold && owners ? <Threshold threshold={threshold} owners={owners} /> : null}
      {isMultiChainItem && chainId ? <ChainIcon chainId={chainId} /> : <Identicon address={address} size={size} />}
    </div>
  )
}

export default SafeIcon
