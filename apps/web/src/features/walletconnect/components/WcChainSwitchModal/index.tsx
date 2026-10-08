import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import ChainIndicator from '@/components/common/ChainIndicator'
import type { AppInfo } from '@/services/safe-wallet-provider'
import { useLoadFeature } from '@/features/__core__'
import { type SafeItem } from '@/hooks/safes'
import { MyAccountsFeature, useSafeItemData } from '@/features/myAccounts'
import { WcChainSwitchModalView } from '@views/features/walletconnect/components/WcChainSwitchModal/WcChainSwitchModalView'

type WcChainSwitchModalProps = {
  appInfo: AppInfo
  chain: Chain
  safes: SafeItem[]
  onSelectSafe: (safe: SafeItem) => Promise<void>
  onCancel: () => void
}

function WcSafeItem({ safeItem, onSelect }: { safeItem: SafeItem; onSelect: () => void }) {
  const { AccountItemButton, AccountItemIcon, AccountItemInfo, AccountItemBalance } = useLoadFeature(MyAccountsFeature)
  const { name, safeOverview, threshold, owners, undeployedSafe, elementRef } = useSafeItemData(safeItem)

  return (
    <AccountItemButton onClick={onSelect} elementRef={elementRef}>
      <AccountItemIcon
        address={safeItem.address}
        chainId={safeItem.chainId}
        threshold={threshold}
        owners={owners.length}
      />
      <AccountItemInfo address={safeItem.address} chainId={safeItem.chainId} name={name} />
      <AccountItemBalance fiatTotal={safeOverview?.fiatTotal} isLoading={!safeOverview && !undeployedSafe} />
    </AccountItemButton>
  )
}

const WcChainSwitchModal = ({ appInfo, chain, safes, onSelectSafe, onCancel }: WcChainSwitchModalProps) => {
  const hasSafes = safes.length > 0

  return (
    <WcChainSwitchModalView
      appName={appInfo.name}
      appIconUrl={appInfo.iconUrl}
      chainName={chain.chainName}
      chainLogo={<ChainIndicator chainId={chain.chainId} onlyLogo />}
      hasSafes={hasSafes}
      safeItems={safes.map((safe) => (
        <WcSafeItem key={`${safe.chainId}-${safe.address}`} safeItem={safe} onSelect={() => onSelectSafe(safe)} />
      ))}
      onCancel={onCancel}
    />
  )
}

export default WcChainSwitchModal
