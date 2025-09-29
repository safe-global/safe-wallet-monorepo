import { Avatar, Box, Button, Divider, List, ListItemButton, Stack, Typography } from '@mui/material'
import ChainIndicator from '@/components/common/ChainIndicator'
import EthHashInfo from '@/components/common/EthHashInfo'
import type { AppInfo } from '@/services/safe-wallet-provider'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'

const getSafeDisplayName = (safe: SafeItem) => {
  return safe.name || safe.address
}

type WcChainSwitchModalProps = {
  appInfo: AppInfo
  chain: ChainInfo
  safes: SafeItem[]
  onSelectSafe: (safe: SafeItem) => void
  onCancel: () => void
}

const WcChainSwitchModal = ({ appInfo, chain, safes, onSelectSafe, onCancel }: WcChainSwitchModalProps) => {
  const hasSafes = safes.length > 0

  return (
    <Stack spacing={3} sx={{ minWidth: { xs: 'auto', sm: 420 } }}>
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
          : `You don't have any Safes on ${chain.chainName}.`}
      </Typography>

      <List disablePadding sx={{ borderRadius: 2, border: '1px solid var(--color-border-light)' }}>
        {hasSafes ? (
          safes.map((safe, index) => (
            <Box key={safe.address}>
              {index > 0 ? <Divider /> : null}
              <ListItemButton onClick={() => onSelectSafe(safe)}>
                <EthHashInfo
                  address={safe.address}
                  name={getSafeDisplayName(safe)}
                  showName
                  shortAddress
                  showCopyButton={false}
                  showAvatar={false}
                  chainId={Number(chain.chainId)}
                />
              </ListItemButton>
            </Box>
          ))
        ) : (
          <Box p={2}>
            <Typography variant="body2">You can load or create a Safe on this network to continue.</Typography>
          </Box>
        )}
      </List>

      <Button variant="outlined" onClick={onCancel} sx={{ alignSelf: 'flex-start' }}>
        Cancel
      </Button>
    </Stack>
  )
}

export default WcChainSwitchModal
