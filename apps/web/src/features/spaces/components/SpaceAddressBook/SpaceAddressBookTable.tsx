import EnhancedTable from '@/components/common/EnhancedTable'
import Button from '@mui/material/Button'
import EthHashInfo from '@/components/common/EthHashInfo'
import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import Identicon from '@/components/common/Identicon'
import { Box, Stack, Tooltip } from '@mui/material'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import NetworkLogosList from '@/features/multichain/components/NetworkLogosList'
import AddressBookContextMenu from './AddressBookContextMenu'
import ChainIndicator from '@/components/common/ChainIndicator'

const headCells = [
  { id: 'contact', label: 'Contact' },
  { id: 'Box, networks', label: 'Networks' },
  { id: 'actions', label: '' },
]

type SpaceAddressBookTableProps = {
  entries: { address: string; name: string; networks: ChainInfo[] }[]
}

function SpaceAddressBookTable({ entries }: SpaceAddressBookTableProps) {
  const rows = entries.map(({ address, name, networks }) => ({
    cells: {
      contact: {
        rawValue: address,
        content: (
          <Stack direction="row" spacing={1} alignItems="center">
            <Identicon address={address} size={32} />
            <Stack direction="column" spacing={0.5}>
              <EthHashInfo
                name={name}
                showAvatar={false}
                address={address}
                shortAddress={false}
                hasExplorer
                showCopyButton
              />
            </Stack>
          </Stack>
        ),
      },
      networks: {
        rawValue: '',
        content: (
          <>
            <Tooltip
              title={
                <Box>
                  {networks.map((safeItem) => (
                    <Box key={safeItem.chainId} sx={{ p: '4px 0px' }}>
                      <ChainIndicator chainId={safeItem.chainId} />
                    </Box>
                  ))}
                </Box>
              }
              arrow
            >
              <Box sx={{ display: 'inline-block' }}>
                <NetworkLogosList networks={networks.map(({ chainId }) => ({ chainId }))} />
              </Box>
            </Tooltip>
          </>
        ),
      },
      actions: {
        rawValue: '',
        sticky: true,
        content: (
          <div className={tableCss.actions}>
            <Button data-testid="send-btn" variant="contained" color="primary" size="small" onClick={() => {}}>
              Send
            </Button>
            <AddressBookContextMenu />
          </div>
        ),
      },
    },
  }))

  return <EnhancedTable rows={rows} headCells={headCells} mobileVariant />
}

export default SpaceAddressBookTable
