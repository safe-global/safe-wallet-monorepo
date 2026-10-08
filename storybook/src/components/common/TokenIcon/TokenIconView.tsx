import type { ReactElement, ReactNode } from 'react'
import IframeIcon from '@views/components/common/IframeIcon'
import css from './styles.module.css'
import classNames from 'classnames'
import type { ChainIndicatorSlotProps } from '@views/components/common/NetworkSelector/NetworkMultiSelectorInputView'

const FALLBACK_ICON = '/images/common/token-placeholder.svg'

export type TokenIconViewProps = {
  src?: string
  tokenSymbol?: string | null
  size: number
  fallbackSrc?: string
  chainId?: string
  noRadius?: boolean
  badgeUri?: string | null
  /** Renders the ChainIndicator container */
  renderChainIndicator: (
    props: ChainIndicatorSlotProps & { showLogo: boolean; showUnknown: boolean; imageSize: number },
  ) => ReactNode
}

export function TokenIconView({
  src,
  tokenSymbol,
  size,
  fallbackSrc,
  chainId,
  noRadius,
  badgeUri,
  renderChainIndicator,
}: TokenIconViewProps): ReactElement {
  const fallback = fallbackSrc || FALLBACK_ICON

  return (
    <div className={classNames('relative', { 'mr-2': chainId })}>
      <IframeIcon
        src={src || fallback}
        alt={tokenSymbol ?? ''}
        width={size}
        height={size}
        borderRadius={noRadius ? undefined : '100%'}
        fallbackSrc={fallback}
      />
      {chainId && (
        <div className={css.chainIcon}>
          {renderChainIndicator({
            chainId,
            onlyLogo: true,
            showLogo: true,
            showUnknown: true,
            imageSize: size * 0.666667,
          })}
        </div>
      )}
      {badgeUri && (
        <div className={css.badge}>
          <IframeIcon src={badgeUri} alt="badge" width={12} height={12} borderRadius="100%" />
        </div>
      )}
    </div>
  )
}
