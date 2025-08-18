import EnhancedTable from '@/components/common/EnhancedTable'
import EthHashInfo from '@/components/common/EthHashInfo'
import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import Identicon from '@/components/common/Identicon'
import { Box, Stack, Tooltip } from '@mui/material'
import NetworkLogosList from '@/features/multichain/components/NetworkLogosList'
import ChainIndicator from '@/components/common/ChainIndicator'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import SpaceAddressBookActions from '@/features/spaces/components/SpaceAddressBook/SpaceAddressBookActions'

const headCells = [
  { id: 'contact', label: 'Contact', disableSort: true },
  { id: 'networks', label: 'Networks', disableSort: true },
  { id: 'actions', label: '' },
]

type SpaceAddressBookTableProps = {
  entries: SpaceAddressBookItemDto[]
}

function SpaceAddressBookTable({ entries }: SpaceAddressBookTableProps) {
  const rows = entries.map((entry) => ({
    cells: {
      contact: {
        rawValue: entry.address,
        content: (
          <Stack direction="row" spacing={1} alignItems="center">
            <Identicon address={entry.address} size={32} />
            <Stack direction="column" spacing={0.5}>
              <EthHashInfo showAvatar={false} address={entry.address} shortAddress={false} hasExplorer showCopyButton />
            </Stack>
          </Stack>
        ),
      },
      networks: {
        rawValue: entry.chainIds.length,
        content: (
          <>
            <Tooltip
              title={
                <Box>
                  {entry.chainIds.map((chainId) => (
                    <Box key={chainId} sx={{ p: '4px 0px' }}>
                      <ChainIndicator chainId={chainId} />
                    </Box>
                  ))}
                </Box>
              }
              arrow
            >
              <Box sx={{ display: 'inline-block' }}>
                <NetworkLogosList networks={entry.chainIds.map((chainId) => ({ chainId }))} />
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
            <SpaceAddressBookActions entry={entry} />
          </div>
        ),
      },
    },
  }))

  return <EnhancedTable rows={rows} headCells={headCells} mobileVariant />
}

export default SpaceAddressBookTable
