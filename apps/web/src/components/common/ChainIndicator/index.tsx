import type { ReactElement } from 'react'
import { useMemo } from 'react'
import classnames from 'classnames'
import css from './styles.module.css'
import useChainId from '@/hooks/useChainId'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import FiatValue from '../FiatValue'
import UnknownChainIcon from '@/public/images/common/unknown.svg'
import useChains from '@/hooks/useChains'
import { useChain } from '@/hooks/useChains'

type ChainIndicatorProps = {
  chainId?: string
  inline?: boolean
  className?: string
  showUnknown?: boolean
  showLogo?: boolean
  onlyLogo?: boolean
  responsive?: boolean
  fiatValue?: string
  imageSize?: number
}

const fallbackChainConfig = {
  chainName: 'Unknown network',
  chainId: '-1',
  theme: {
    backgroundColor: '#ddd',
    textColor: '#000',
  },
  chainLogoUri: null,
}

const ChainIndicator = ({
  chainId,
  fiatValue,
  className,
  inline = false,
  showUnknown = true,
  showLogo = true,
  responsive = false,
  onlyLogo = false,
  imageSize = 24,
}: ChainIndicatorProps): ReactElement | null => {
  const currentChainId = useChainId()
  const id = chainId || currentChainId
  const { configs: chains } = useChains()
  const chainConfig = useChain(id) || (showUnknown ? fallbackChainConfig : null)
  const noChains = chains.length === 0

  const style = useMemo(() => {
    if (!chainConfig) return
    const { theme } = chainConfig

    return {
      backgroundColor: theme.backgroundColor,
      color: theme.textColor,
    }
  }, [chainConfig])

  const logoComponent = chainConfig?.chainLogoUri ? (
    <img
      data-testid="chain-indicator-network-logo-img"
      src={chainConfig.chainLogoUri ?? undefined}
      alt={`${chainConfig.chainName} Logo`}
      width={imageSize}
      height={imageSize}
      loading="lazy"
      style={{ minWidth: imageSize }}
    />
  ) : (
    <UnknownChainIcon
      style={{ height: imageSize, width: imageSize }}
      className="rounded-full bg-[var(--color-background-main)]"
    />
  )

  return noChains ? (
    <Skeleton className="h-[22px] w-full shrink-0 rounded-none" />
  ) : chainConfig ? (
    <span
      data-testid="chain-logo"
      style={showLogo ? undefined : style}
      className={classnames(className || '', {
        [css.inlineIndicator]: inline,
        [css.indicator]: !inline,
        [css.withLogo]: showLogo,
        [css.responsive]: responsive,
        [css.onlyLogo]: onlyLogo,
      })}
    >
      {showLogo && logoComponent}
      {!onlyLogo && (
        <div className="flex flex-col">
          <span className={css.name}>{chainConfig.chainName}</span>
          {fiatValue && (
            <Typography variant="paragraph-small-bold" align="left">
              <FiatValue value={fiatValue} />
            </Typography>
          )}
        </div>
      )}
    </span>
  ) : null
}

export default ChainIndicator
