import type { ReactElement } from 'react'
import { useMemo } from 'react'
import classnames from 'classnames'
import css from './styles.module.css'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import FiatValue from '@/components/common/FiatValue'
import UnknownChainIcon from '@/public/images/common/unknown.svg'

export type ChainIndicatorChain = {
  chainName: string
  chainLogoUri?: string | null
  theme: {
    backgroundColor: string
    textColor: string
  }
}

export type ChainIndicatorViewProps = {
  chain?: ChainIndicatorChain
  isLoading: boolean
  inline: boolean
  indicatorClassName?: string
  showUnknown: boolean
  showLogo: boolean
  onlyLogo: boolean
  responsive: boolean
  fiatValue?: string
  imageSize: number
}

const fallbackChainConfig: ChainIndicatorChain = {
  chainName: 'Unknown network',
  theme: {
    backgroundColor: '#ddd',
    textColor: '#000',
  },
  chainLogoUri: null,
}

export const ChainIndicatorView = ({
  chain,
  isLoading,
  fiatValue,
  indicatorClassName,
  inline,
  showUnknown,
  showLogo,
  responsive,
  onlyLogo,
  imageSize,
}: ChainIndicatorViewProps): ReactElement | null => {
  const chainConfig = chain || (showUnknown ? fallbackChainConfig : null)

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

  return isLoading ? (
    <Skeleton className="h-[22px] w-full shrink-0 rounded-none" />
  ) : chainConfig ? (
    <span
      data-testid="chain-logo"
      style={showLogo ? undefined : style}
      className={classnames(indicatorClassName || '', {
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
