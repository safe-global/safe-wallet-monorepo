import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { Avatar, Box, Button, Stack, Typography } from '@mui/material'
import ChainIndicator from '@/components/common/ChainIndicator'
import type { AppInfo } from '@/services/safe-wallet-provider'
import { useLoadFeature } from '@/features/__core__'
import { type SafeItem } from '@/hooks/safes'
import { MyAccountsFeature, useSafeItemData } from '@/features/myAccounts'

type WcChainSwitchModalProps = {
  appInfo: AppInfo
  chain: Chain
  safes: SafeItem[]
  onSelectSafe: (safe: SafeItem) => Promise<void>
  onCancel: () => void
}

function WcSafeItem({ safeItem, onSelect }: { safeItem: SafeItem; onSelect: () => void }) {
  const feature = useLoadFeature(MyAccountsFeature)
  const { AccountItem } = feature
  const { name, safeOverview, threshold, owners, undeployedSafe, elementRef } = useSafeItemData(safeItem)

  if (!feature.$isReady || !AccountItem?.Button) {
    return null
  }

  return (
    <AccountItem.Button onClick={onSelect} elementRef={elementRef}>
      <AccountItem.Icon
        address={safeItem.address}
        chainId={safeItem.chainId}
        threshold={threshold}
        owners={owners.length}
      />
      <AccountItem.Info address={safeItem.address} chainId={safeItem.chainId} name={name} />
      <AccountItem.Balance fiatTotal={safeOverview?.fiatTotal} isLoading={!safeOverview && !undeployedSafe} />
    </AccountItem.Button>
  )
}

const WcChainSwitchModal = ({ appInfo, chain, safes, onSelectSafe, onCancel }: WcChainSwitchModalProps) => {
  const hasSafes = safes.length > 0

  return (
    <Stack spacing={3} sx={{ minWidth: { xs: 'auto', sm: 390 } }}>
      <Stack direction="row" spacing={2} alignItems="center">
        {appInfo.iconUrl ? <Avatar src={appInfo.iconUrl} alt={appInfo.name} sx={{ width: 48, height: 48 }} /> : null}
        <Box>
          <Typography variant="h5">{appInfo.name}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">wants to switch to</Typography>
            <ChainIndicator chainId={chain.chainId} onlyLogo />
            <Typography variant="body2" fontWeight="bold">
              {chain.chainName}
            </Typography>
          </Stack>
        </Box>
      </Stack>

      <Typography variant="body2" color="text.secondary">
        {hasSafes
          ? `Select one of your Safes on ${chain.chainName} to continue.`
          : `Connected dapp wants to switch to chain ${chain.chainName} but you don't have Safe Accounts deployed on that chain.`}
      </Typography>

      {hasSafes ? (
        <Box sx={{ maxHeight: 440, overflowY: 'auto' }}>
          {safes.map((safe) => (
            <WcSafeItem key={`${safe.chainId}-${safe.address}`} safeItem={safe} onSelect={() => onSelectSafe(safe)} />
          ))}
        </Box>
      ) : (
        <Box p={2} sx={{ borderRadius: 2, border: '1px solid var(--color-border-light)' }}>
          <Typography variant="body2">You can load or create a Safe on this network to continue.</Typography>
        </Box>
      )}

      <Button variant="outlined" onClick={onCancel} sx={{ alignSelf: 'flex-start' }}>
        Cancel
      </Button>
    </Stack>
  )
}

export default WcChainSwitchModal
