import { type ReactElement, useEffect, useRef } from 'react'
import { Box, Drawer, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import type { ScanContext, ScanResult } from '@/features/security/data/scanners/types'
import Identicon from '@/components/common/Identicon'
import useSecurityScan from '@/features/security/hooks/useSecurityScan'
import { useChain } from '@/hooks/useChains'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { SelectedSafe, SpaceSafeEntry } from './index'
import SecurityPanelView from './SecurityPanelView'

type SecurityReportDrawerProps = {
  selectedSafe: SelectedSafe | null
  selectedEntry: SpaceSafeEntry | undefined
  scanContext: ScanContext | null
  onClose: () => void
  onScanComplete: (address: string, chainId: string, timestamp: number, results: Record<string, ScanResult>) => void
}

const SecurityReportDrawer = ({
  selectedSafe,
  selectedEntry,
  scanContext,
  onClose,
  onScanComplete,
}: SecurityReportDrawerProps): ReactElement => {
  const { results, isComplete, lastScannedAt, rescan } = useSecurityScan(scanContext)
  const chain = useChain(selectedSafe?.chainId ?? '')
  const scanContextRef = useRef(scanContext)
  scanContextRef.current = scanContext

  // Forward scan completion to parent
  useEffect(() => {
    if (isComplete && lastScannedAt && onScanComplete && scanContextRef.current) {
      onScanComplete(scanContextRef.current.safeAddress, scanContextRef.current.chainId, lastScannedAt, results)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, lastScannedAt])

  return (
    <Drawer
      anchor="right"
      open={!!selectedSafe}
      onClose={onClose}
      variant="temporary"
      transitionDuration={200}
      sx={{ zIndex: (theme) => theme.zIndex.modal }}
      PaperProps={{
        sx: {
          width: 520,
          maxWidth: '100vw',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      {selectedSafe && (
        <>
          <Box
            sx={{
              px: 3,
              py: 2,
              borderBottom: 1,
              borderColor: 'border.light',
              backgroundColor: 'background.paper',
              flexShrink: 0,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5} spacing={1}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}
              >
                Security report
              </Typography>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Re-scan this Safe">
                  <span>
                    <IconButton onClick={rescan} size="small" disabled={!isComplete} aria-label="Re-scan">
                      <RefreshRoundedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <IconButton onClick={onClose} size="small" aria-label="Close security report">
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
              <Identicon address={selectedSafe.address} size={24} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  noWrap
                  sx={{ display: 'block', lineHeight: 1.2 }}
                  title={selectedEntry?.name || selectedSafe.address}
                >
                  {selectedEntry?.name || shortenAddress(selectedSafe.address)}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', lineHeight: 1.2 }}>
                  {chain?.shortName ? `${chain.shortName}:` : ''}
                  {shortenAddress(selectedSafe.address)}
                </Typography>
              </Box>
              {lastScannedAt && (
                <Box sx={{ flexShrink: 0, textAlign: 'right' }}>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    sx={{ display: 'block', lineHeight: 1.2, whiteSpace: 'nowrap' }}
                    title={new Date(lastScannedAt).toLocaleString()}
                  >
                    {new Date(lastScannedAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                    Last scanned
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pt: 2, pb: 3 }}>
            <SecurityPanelView
              key={`${selectedSafe.address}:${selectedSafe.chainId}`}
              scanContext={scanContext}
              results={results}
              isComplete={isComplete}
              safeQueryParam={chain?.shortName ? `${chain.shortName}:${selectedSafe.address}` : undefined}
            />
          </Box>
        </>
      )}
    </Drawer>
  )
}

export default SecurityReportDrawer
