import { type ReactElement, type ReactNode, Fragment, useCallback, useContext } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowUpRight, ArrowDownLeft, Repeat, SquareDashedBottomCode } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { ActionBar, ActionButton } from '@/components/common/ActionBar'
import Track from '@/components/common/Track'
import QrCodeButton from '@/components/common/QrCodeButton'
import CheckWallet from '@/components/common/CheckWallet'
import { GeoblockingContext } from '@/components/common/GeoblockingProvider'
import { AppRoutes } from '@/config/routes'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import { SWAP_EVENTS, SWAP_LABELS } from '@/services/analytics/events/swaps'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { TxModalContext } from '@/components/tx-flow'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import { useTxBuilderApp } from '@/hooks/safe-apps/useTxBuilderApp'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
import { useAppDispatch } from '@/store'
import { ESafeAction, openSafeActionsModal } from '@/features/spaces/store'
import { useCurrentSpaceId } from '@/features/spaces'

const NOT_ALLOWED_COUNTRY_MESSAGE = 'is not allowed for your country'
const NO_ASSETS_MESSAGE = 'You have no assets or balance on this safe account.'
export const TRANSACTION_BUILDER_TOOLTIP = 'Open Transaction Builder'

const PassThrough = ({ children }: { children: (ok: boolean) => ReactNode }) => <Fragment>{children(true)}</Fragment>

interface ActionsTrayProps {
  noAssets: boolean
  variant?: 'safe' | 'space'
}

const ActionsTray = ({ noAssets, variant = 'safe' }: ActionsTrayProps): ReactElement => {
  const { setTxFlow } = useContext(TxModalContext)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const hasNativeSwapFeature = useHasFeature(FEATURES.NATIVE_SWAPS)
  const isBlockedCountry = Boolean(useContext(GeoblockingContext))
  const { link: txBuilderLink } = useTxBuilderApp()
  const isDarkMode = useDarkMode()

  const spaceId = useCurrentSpaceId()
  const isSpace = variant === 'space'
  const Wallet = isSpace ? PassThrough : CheckWallet
  const secondaryVariant = isSpace ? 'outline' : 'secondary'

  const getDisabledTooltip = (action: 'Send' | 'Swap') => {
    if (isBlockedCountry) return `${action} ${NOT_ALLOWED_COUNTRY_MESSAGE}`
    if (noAssets) return NO_ASSETS_MESSAGE
    return ''
  }
  const sendTooltip = getDisabledTooltip('Send')
  const swapTooltip = getDisabledTooltip('Swap')

  const openModal = useCallback(
    (type: ESafeAction) => {
      dispatch(openSafeActionsModal({ type }))
    },
    [dispatch],
  )

  const handleOnSend = useCallback(() => {
    if (isSpace) {
      trackEvent(SPACE_EVENTS.TRANSACTION_INITIATED, {
        workspace_id: spaceId,
        action: 'send',
        entry_point: 'actions_tray',
      })
      openModal(ESafeAction.Send)
      return
    }
    setTxFlow(<TokenTransferFlow />, undefined, false)
    trackEvent(OVERVIEW_EVENTS.NEW_TRANSACTION)
  }, [isSpace, openModal, setTxFlow, spaceId])

  const handleOnSwap = useCallback(() => {
    if (isSpace)
      trackEvent(SPACE_EVENTS.TRANSACTION_INITIATED, {
        workspace_id: spaceId,
        action: 'swap',
        entry_point: 'actions_tray',
      })
    openModal(ESafeAction.Swap)
  }, [openModal, isSpace, spaceId])

  const handleOnReceive = useCallback(() => {
    if (isSpace)
      trackEvent(SPACE_EVENTS.TRANSACTION_INITIATED, {
        workspace_id: spaceId,
        action: 'receive',
        entry_point: 'actions_tray',
      })
    openModal(ESafeAction.Receive)
  }, [openModal, isSpace, spaceId])

  const handleOnBuildTx = useCallback(() => {
    if (isSpace)
      trackEvent(SPACE_EVENTS.TRANSACTION_INITIATED, {
        workspace_id: spaceId,
        action: 'build_tx',
        entry_point: 'actions_tray',
      })
    openModal(ESafeAction.BuildTransaction)
  }, [openModal, isSpace, spaceId])

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <ActionBar>
        <Wallet>
          {(isOk) => {
            const sendDisabled = !isOk || isBlockedCountry || noAssets
            return (
              <Tooltip>
                <TooltipTrigger render={<span className={cn('inline-flex', { 'cursor-not-allowed': sendDisabled })} />}>
                  <ActionButton variant="default" onClick={handleOnSend} disabled={sendDisabled}>
                    <ArrowUpRight className="size-5 text-green-400" />
                    Send
                  </ActionButton>
                </TooltipTrigger>
                {sendTooltip ? <TooltipContent side="top">{sendTooltip}</TooltipContent> : null}
              </Tooltip>
            )
          }}
        </Wallet>

        <Track {...OVERVIEW_EVENTS.SHOW_QR} label="dashboard">
          {isSpace ? (
            <ActionButton variant={secondaryVariant} onClick={handleOnReceive} disabled={noAssets}>
              <ArrowDownLeft className="size-5" />
              Receive
            </ActionButton>
          ) : (
            <QrCodeButton>
              <ActionButton variant={secondaryVariant}>
                <ArrowDownLeft className="size-5" />
                Receive
              </ActionButton>
            </QrCodeButton>
          )}
        </Track>

        {hasNativeSwapFeature && (
          <Wallet>
            {(isOk) => {
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
                          onClick={handleOnSwap}
                        >
                          <Repeat className="size-5" strokeWidth={1.5} />
                          Swap
                        </ActionButton>
                      ) : (
                        <ActionButton
                          variant={secondaryVariant}
                          data-testid="overview-swap-btn"
                          disabled={swapDisabled}
                          render={
                            !swapDisabled ? (
                              <Link href={{ pathname: AppRoutes.swap, query: router.query }} />
                            ) : undefined
                          }
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
            }}
          </Wallet>
        )}

        <Wallet>
          {(isOk) => {
            const buildTxButton = isSpace ? (
              <ActionButton
                variant={secondaryVariant}
                disabled={!isOk || noAssets}
                onClick={handleOnBuildTx}
                aria-label="Transaction builder"
              >
                <SquareDashedBottomCode className="size-5" strokeWidth={1.5} />
                Build transaction
              </ActionButton>
            ) : (
              <Button
                variant={secondaryVariant}
                size="icon-lg"
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
          }}
        </Wallet>
      </ActionBar>
    </div>
  )
}

export default ActionsTray
