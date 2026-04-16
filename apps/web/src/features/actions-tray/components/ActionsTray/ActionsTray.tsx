import { type ReactElement, type ReactNode, Fragment, useCallback, useContext } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowUpRight, ArrowDownLeft, Repeat, SquareDashedBottomCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Track from '@/components/common/Track'
import QrCodeButton from '@/components/sidebar/QrCodeButton'
import CheckWallet from '@/components/common/CheckWallet'
import { AppRoutes } from '@/config/routes'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import { SWAP_EVENTS, SWAP_LABELS } from '@/services/analytics/events/swaps'
import { useIsSwapFeatureEnabled } from '@/features/swap'
import { TxModalContext } from '@/components/tx-flow'
import { NewTxFlow } from '@/components/tx-flow/flows'
import { useTxBuilderApp } from '@/hooks/safe-apps/useTxBuilderApp'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
import { useAppDispatch } from '@/store'
import { ESafeAction, openSafeActionsModal } from '@/features/spaces/store'

const PassThrough = ({ children }: { children: (ok: boolean) => ReactNode }) => <Fragment>{children(true)}</Fragment>

interface ActionsTrayProps {
  noAssets: boolean
  variant?: 'safe' | 'space'
}

const ActionsTray = ({ noAssets, variant = 'safe' }: ActionsTrayProps): ReactElement => {
  const { setTxFlow } = useContext(TxModalContext)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()
  const { link: txBuilderLink } = useTxBuilderApp()
  const isDarkMode = useDarkMode()

  const isSpace = variant === 'space'
  const Wallet = isSpace ? PassThrough : CheckWallet
  const secondaryVariant = isSpace ? 'outline' : 'secondary'

  const openModal = useCallback(
    (type: ESafeAction) => {
      dispatch(openSafeActionsModal({ type }))
    },
    [dispatch],
  )

  const handleOnSend = useCallback(() => {
    if (isSpace) {
      openModal(ESafeAction.Send)
      return
    }
    setTxFlow(<NewTxFlow />, undefined, false)
    trackEvent(OVERVIEW_EVENTS.NEW_TRANSACTION)
  }, [isSpace, openModal, setTxFlow])

  const handleOnSwap = useCallback(() => {
    openModal(ESafeAction.Swap)
  }, [openModal])

  const handleOnReceive = useCallback(() => {
    openModal(ESafeAction.Receive)
  }, [openModal])

  const handleOnBuildTx = useCallback(() => {
    openModal(ESafeAction.BuildTransaction)
  }, [openModal])

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className="flex items-center gap-2">
        {!noAssets && (
          <Wallet>
            {(isOk) => (
              <Button variant="default" className="px-6" onClick={handleOnSend} disabled={!isOk}>
                <ArrowUpRight className="size-5 text-green-400" />
                Send
              </Button>
            )}
          </Wallet>
        )}

        <Track {...OVERVIEW_EVENTS.SHOW_QR} label="dashboard">
          {isSpace ? (
            <Button variant={secondaryVariant} className={cn('px-6 hover:bg-border')} onClick={handleOnReceive}>
              <ArrowDownLeft className="size-5" />
              Receive
            </Button>
          ) : (
            <QrCodeButton>
              <Button variant={secondaryVariant} className={cn('px-6 hover:bg-border')}>
                <ArrowDownLeft className="size-5" />
                Receive
              </Button>
            </QrCodeButton>
          )}
        </Track>

        {isSwapFeatureEnabled && !noAssets && (
          <Wallet>
            {(isOk) => (
              <Track {...SWAP_EVENTS.OPEN_SWAPS} label={SWAP_LABELS.dashboard}>
                {isSpace ? (
                  <Button
                    variant={secondaryVariant}
                    className={cn('px-6 hover:bg-border')}
                    data-testid="overview-swap-btn"
                    disabled={!isOk}
                    onClick={handleOnSwap}
                  >
                    <Repeat className="size-5" strokeWidth={1.5} />
                    Swap
                  </Button>
                ) : (
                  <Button
                    variant={secondaryVariant}
                    className={cn('px-6 hover:bg-border')}
                    data-testid="overview-swap-btn"
                    disabled={!isOk}
                    render={isOk ? <Link href={{ pathname: AppRoutes.swap, query: router.query }} /> : undefined}
                  >
                    <Repeat className="size-5" strokeWidth={1.5} />
                    Swap
                  </Button>
                )}
              </Track>
            )}
          </Wallet>
        )}

        <Wallet>
          {(isOk) =>
            isSpace ? (
              <Button
                variant={secondaryVariant}
                className="px-6 hover:bg-border"
                disabled={!isOk}
                onClick={handleOnBuildTx}
                aria-label="Transaction builder"
              >
                <SquareDashedBottomCode className="size-5" strokeWidth={1.5} />
                Build transaction
              </Button>
            ) : (
              <Button
                variant={secondaryVariant}
                size="icon"
                className="rounded-lg hover:bg-border"
                disabled={!isOk}
                render={isOk ? <Link href={txBuilderLink} /> : undefined}
                aria-label="Transaction builder"
              >
                <SquareDashedBottomCode className="size-5 text-muted-foreground" strokeWidth={1.5} />
              </Button>
            )
          }
        </Wallet>
      </div>
    </div>
  )
}

export default ActionsTray
