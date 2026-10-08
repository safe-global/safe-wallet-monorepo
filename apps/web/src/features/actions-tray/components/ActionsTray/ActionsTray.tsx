import { type ReactElement, type ReactNode, Fragment, useCallback, useContext } from 'react'
import { useRouter } from 'next/router'
import QrCodeButton from '@/components/common/QrCodeButton'
import CheckWallet from '@/components/common/CheckWallet'
import { GeoblockingContext } from '@/components/common/GeoblockingProvider'
import { AppRoutes } from '@/config/routes'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { TxModalContext } from '@/components/tx-flow'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import { useTxBuilderApp } from '@/hooks/safe-apps/useTxBuilderApp'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useAppDispatch } from '@/store'
import { ESafeAction, openSafeActionsModal } from '@/features/spaces/store'
import { useCurrentSpaceId } from '@/features/spaces'
import { ActionsTrayView } from '@views/features/actions-tray/components/ActionsTray/ActionsTrayView'

export { TRANSACTION_BUILDER_TOOLTIP } from '@views/features/actions-tray/components/ActionsTray/ActionsTrayView'

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
    <ActionsTrayView
      noAssets={noAssets}
      isSpace={isSpace}
      isBlockedCountry={isBlockedCountry}
      isDarkMode={isDarkMode}
      hasNativeSwapFeature={hasNativeSwapFeature}
      swapHref={{ pathname: AppRoutes.swap, query: router.query }}
      txBuilderLink={txBuilderLink}
      wallet={(render) => <Wallet>{render}</Wallet>}
      renderQrCodeButton={(children) => <QrCodeButton>{children}</QrCodeButton>}
      onSend={handleOnSend}
      onSwap={handleOnSwap}
      onReceive={handleOnReceive}
      onBuildTx={handleOnBuildTx}
    />
  )
}

export default ActionsTray
