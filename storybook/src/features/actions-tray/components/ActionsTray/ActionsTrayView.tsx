import { type ReactElement, type ReactNode } from 'react'
import type { UrlObject } from 'url'
import Link from 'next/link'
import { ArrowUpRight, QrCode, Repeat, SquareDashedBottomCode } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { ActionBar, ActionButton } from '@/components/common/ActionBar'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import { SWAP_EVENTS, SWAP_LABELS } from '@/services/analytics/events/swaps'
import { cn } from '@/utils/cn'

const NOT_ALLOWED_COUNTRY_MESSAGE = 'is not allowed for your country'
const NO_ASSETS_MESSAGE = 'You have no assets or balance on this safe account.'
export const TRANSACTION_BUILDER_TOOLTIP = 'Open Transaction Builder'

export type ActionsTrayViewProps = {
  noAssets: boolean
  isSpace: boolean
  isBlockedCountry: boolean
  isDarkMode: boolean
  hasNativeSwapFeature?: boolean
  swapHref: UrlObject
  txBuilderLink: UrlObject
  wallet: (render: (isOk: boolean) => ReactElement) => ReactNode
  renderQrCodeButton: (children: ReactNode) => ReactElement
  onSend: () => void
  onSwap: () => void
  onReceive: () => void
  onBuildTx: () => void
}

export const ActionsTrayView = ({
  noAssets,
  isSpace,
  isBlockedCountry,
  isDarkMode,
  hasNativeSwapFeature,
  swapHref,
  txBuilderLink,
  wallet,
  renderQrCodeButton,
  onSend,
  onSwap,
  onReceive,
  onBuildTx,
}: ActionsTrayViewProps): ReactElement => {
  const secondaryVariant = isSpace ? 'outline' : 'secondary'

  const getDisabledTooltip = (action: 'Send' | 'Swap') => {
    if (isBlockedCountry) return `${action} ${NOT_ALLOWED_COUNTRY_MESSAGE}`
    if (noAssets) return NO_ASSETS_MESSAGE
    return ''
  }
  const sendTooltip = getDisabledTooltip('Send')
  const swapTooltip = getDisabledTooltip('Swap')

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <ActionBar>
        {wallet((isOk) => {
          const sendDisabled = !isOk || isBlockedCountry || noAssets
          return (
            <Tooltip>
              <TooltipTrigger render={<span className={cn('inline-flex', { 'cursor-not-allowed': sendDisabled })} />}>
                <ActionButton variant="default" onClick={onSend} disabled={sendDisabled}>
                  <ArrowUpRight className="size-5 text-green-400" />
                  Send
                </ActionButton>
              </TooltipTrigger>
              {sendTooltip ? <TooltipContent side="top">{sendTooltip}</TooltipContent> : null}
            </Tooltip>
          )
        })}

        <Track {...OVERVIEW_EVENTS.SHOW_QR} label="dashboard">
          {isSpace ? (
            <ActionButton variant={secondaryVariant} onClick={onReceive} disabled={noAssets}>
              <QrCode className="size-5" />
              Receive
            </ActionButton>
          ) : (
            renderQrCodeButton(
              <ActionButton variant={secondaryVariant}>
                <QrCode className="size-5" />
                Receive
              </ActionButton>,
            )
          )}
        </Track>

        {hasNativeSwapFeature &&
          wallet((isOk) => {
            const swapDisabled = !isOk || isBlockedCountry || noAssets
            return (
              <Track {...SWAP_EVENTS.OPEN_SWAPS} label={SWAP_LABELS.dashboard}>
                <Tooltip>
                  <TooltipTrigger
                    render={<span className={cn('inline-flex', { 'cursor-not-allowed': swapDisabled })} />}
                  >
                    {isSpace ? (
                      <ActionButton
                        variant={secondaryVariant}
                        data-testid="overview-swap-btn"
                        disabled={swapDisabled}
                        onClick={onSwap}
                      >
                        <Repeat className="size-5" strokeWidth={1.5} />
                        Swap
                      </ActionButton>
                    ) : (
                      <ActionButton
                        variant={secondaryVariant}
                        data-testid="overview-swap-btn"
                        disabled={swapDisabled}
                        render={!swapDisabled ? <Link href={swapHref} /> : undefined}
                      >
                        <Repeat className="size-5" strokeWidth={1.5} />
                        Swap
                      </ActionButton>
                    )}
                  </TooltipTrigger>
                  {swapTooltip ? <TooltipContent side="top">{swapTooltip}</TooltipContent> : null}
                </Tooltip>
              </Track>
            )
          })}

        {wallet((isOk) => {
          const buildTxButton = isSpace ? (
            <ActionButton
              variant={secondaryVariant}
              disabled={!isOk || noAssets}
              onClick={onBuildTx}
              aria-label="Transaction builder"
            >
              <SquareDashedBottomCode className="size-5" strokeWidth={1.5} />
              Build transaction
            </ActionButton>
          ) : (
            <Button
              variant={secondaryVariant}
              size="icon"
              disabled={!isOk}
              render={isOk ? <Link href={txBuilderLink} /> : undefined}
              aria-label="Transaction builder"
            >
              <SquareDashedBottomCode className="size-5 text-muted-foreground" strokeWidth={1.5} />
            </Button>
          )

          if (!isOk) {
            return buildTxButton
          }

          return (
            <Tooltip>
              <TooltipTrigger render={<span className="inline-flex" />}>{buildTxButton}</TooltipTrigger>
              <TooltipContent side="top">{TRANSACTION_BUILDER_TOOLTIP}</TooltipContent>
            </Tooltip>
          )
        })}
      </ActionBar>
    </div>
  )
}
