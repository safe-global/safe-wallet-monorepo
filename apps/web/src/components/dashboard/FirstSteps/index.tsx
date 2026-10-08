import CheckWallet from '@/components/common/CheckWallet'
import EthHashInfo from '@/components/common/EthHashInfo'
import ModalDialog from '@/components/common/ModalDialog'
import QRCode from '@/components/common/QRCode'
import { CounterfactualFeature } from '@/features/counterfactual'
import { useLoadFeature } from '@/features/__core__'
import { selectUndeployedSafe } from '@/features/counterfactual/store'
import { isReplayedSafeProps } from '@/features/counterfactual/services'
import useBalances from '@/hooks/useBalances'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, setQrShortName } from '@/store/settingsSlice'
import { selectOutgoingTransactions } from '@/store/txHistorySlice'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useState } from 'react'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'
import { BannerType, useBannerVisibility, HnDashboardBannerWithNoBalanceCheck } from '@/features/hypernative'
import { calculateProgress } from '@views/components/dashboard/FirstSteps/utils'
import {
  ActivateSafeWidgetView,
  AddFundsWidgetView,
  FirstStepsView,
  FirstTransactionWidgetView,
} from '@views/components/dashboard/FirstSteps/FirstStepsView'

const AddFundsWidget = ({ completed }: { completed: boolean }) => {
  const [open, setOpen] = useState<boolean>(false)
  const { safeAddress } = useSafeInfo()
  const chain = useCurrentChain()
  const dispatch = useAppDispatch()
  const settings = useAppSelector(selectSettings)
  const qrPrefix = settings.shortName.qr ? `${chain?.shortName}:` : ''
  const qrCode = `${qrPrefix}${safeAddress}`

  const toggleDialog = () => {
    setOpen((prev) => !prev)
  }

  return (
    <AddFundsWidgetView
      completed={completed}
      renderModalDialog={(props) => <ModalDialog {...props} />}
      open={open}
      onToggleDialog={toggleDialog}
      nativeCurrencyName={chain?.nativeCurrency.name}
      chainShortName={chain?.shortName}
      isQrShortNameEnabled={settings.shortName.qr}
      onQrShortNameChange={(checked) => dispatch(setQrShortName(checked))}
      qrCode={<QRCode value={qrCode} size={160} />}
      addressInfo={
        <EthHashInfo
          address={safeAddress}
          showName={false}
          shortAddress={false}
          showCopyButton
          hasExplorer
          avatarSize={24}
        />
      }
    />
  )
}

const FirstTransactionWidget = ({
  completed,
  FirstTxFlow,
}: {
  completed: boolean
  FirstTxFlow?: React.ComponentType<{ open: boolean; onClose: () => void }>
}) => {
  const [open, setOpen] = useState<boolean>(false)

  return (
    <FirstTransactionWidgetView
      completed={completed}
      renderCheckWallet={(render) => <CheckWallet>{render}</CheckWallet>}
      onCreateTransaction={() => setOpen(true)}
      firstTxFlow={FirstTxFlow && <FirstTxFlow open={open} onClose={() => setOpen(false)} />}
    />
  )
}

const ActivateSafeWidget = ({
  chain,
  ActivateAccountButton,
  FirstTxFlow,
}: {
  chain: Chain | undefined
  ActivateAccountButton?: React.ComponentType
  FirstTxFlow?: React.ComponentType<{ open: boolean; onClose: () => void }>
}) => {
  const [open, setOpen] = useState<boolean>(false)

  return (
    <ActivateSafeWidgetView
      chainName={chain?.chainName}
      activateAccountButton={ActivateAccountButton && <ActivateAccountButton />}
      firstTxFlow={FirstTxFlow && <FirstTxFlow open={open} onClose={() => setOpen(false)} />}
    />
  )
}

const FirstSteps = () => {
  const { balances } = useBalances()
  const { safe, safeAddress } = useSafeInfo()
  const outgoingTransactions = useAppSelector(selectOutgoingTransactions)
  const chain = useCurrentChain()
  const undeployedSafe = useAppSelector((state) => selectUndeployedSafe(state, safe.chainId, safeAddress))
  const { ActivateAccountButton, FirstTxFlow } = useLoadFeature(CounterfactualFeature)

  // NoBalanceCheck because the banner should also show for undeployed (non-active) safes
  const { showBanner: showHnDashboardBanner } = useBannerVisibility(BannerType.NoBalanceCheck)

  const isMultiSig = safe.threshold > 1
  const isReplayedSafe = undeployedSafe && isReplayedSafeProps(undeployedSafe?.props)

  const hasNonZeroBalance = balances && (balances.items.length > 1 || BigInt(balances.items[0]?.balance || 0) > 0)
  const hasOutgoingTransactions = !!outgoingTransactions && outgoingTransactions.length > 0
  const completedItems = [hasNonZeroBalance, hasOutgoingTransactions]

  const progress = calculateProgress(completedItems)
  const stepsCompleted = completedItems.filter((item) => item).length

  if (safe.deployed) return null

  const isActivating = undeployedSafe?.status.status !== 'AWAITING_EXECUTION'

  return (
    <FirstStepsView
      isActivating={isActivating}
      progress={progress}
      stepsCompleted={stepsCompleted}
      totalSteps={completedItems.length}
      hasChain={!!chain}
      explorerLink={
        chain && undeployedSafe?.status.txHash
          ? getExplorerLink(undeployedSafe.status.txHash, chain.blockExplorerUriTemplate).href
          : undefined
      }
      showActivateSafe={!!(isMultiSig || isReplayedSafe)}
      showHnDashboardBanner={showHnDashboardBanner}
      addFundsWidget={<AddFundsWidget completed={hasNonZeroBalance} />}
      activateSafeWidget={
        <ActivateSafeWidget chain={chain} ActivateAccountButton={ActivateAccountButton} FirstTxFlow={FirstTxFlow} />
      }
      firstTransactionWidget={<FirstTransactionWidget completed={hasOutgoingTransactions} FirstTxFlow={FirstTxFlow} />}
      hnDashboardBanner={<HnDashboardBannerWithNoBalanceCheck />}
    />
  )
}

export default FirstSteps
