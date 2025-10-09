import { Avatar, Box, Button, Stack, Typography } from '@mui/material'
import ChainIndicator from '@/components/common/ChainIndicator'
import type { AppInfo } from '@/services/safe-wallet-provider'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import SingleAccountItem from '@/features/myAccounts/components/AccountItems/SingleAccountItem'

type WcChainSwitchModalProps = {
  appInfo: AppInfo
  chain: ChainInfo
  safes: SafeItem[]
  onSelectSafe: (safe: SafeItem) => Promise<void>
  onCancel: () => void
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
            <SingleAccountItem
              key={`${safe.chainId}-${safe.address}`}
              safeItem={safe}
              onSelectSafe={() => onSelectSafe(safe)}
              showActions={false}
            />
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
