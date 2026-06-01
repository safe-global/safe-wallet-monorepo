import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import { Box, Drawer, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import type { ScanContext, ScanResult } from '@/features/security/types'
import Identicon from '@/components/common/Identicon'
import { useSecurityScan } from '@/features/security'
import { useChain } from '@/hooks/useChains'
import { useDarkMode } from '@/hooks/useDarkMode'
import { ShadcnProvider } from '@/components/ui/ShadcnProvider'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import SecurityPanelView from '../SecurityPanelView/SecurityPanelView'
import type { SelectedSafe, SpaceSafeEntry } from '../../types'

const MotionBox = motion.create(Box)

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
  const isDarkMode = useDarkMode()
  const scanContextRef = useRef(scanContext)
  scanContextRef.current = scanContext

  // Bump animationKey to replay the entrance animation on rescan.
  const [animationKey, setAnimationKey] = useState(0)
  const handleRescan = useCallback(() => {
    rescan()
    setAnimationKey((k) => k + 1)
  }, [rescan])

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
      transitionDuration={250}
      sx={{ zIndex: (theme) => theme.zIndex.modal }}
      PaperProps={{
        sx: {
          width: 520,
          maxWidth: '100vw',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          outline: 'none',
          '&:focus, &:focus-visible': { outline: 'none' },
        },
      }}
    >
      {/* Wrap drawer content in shadcn scope so the shadcn Card/tokens resolve —
          the MUI Drawer portals outside the app-level ShadcnProvider. */}
      <ShadcnProvider
        dark={isDarkMode}
        className="flex min-h-0 flex-1 flex-col overflow-hidden outline-none focus-visible:outline-none"
      >
        <AnimatePresence mode="wait">
          {selectedSafe && (
            <MotionBox
              key={`${selectedSafe.address}:${selectedSafe.chainId}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
            >
              {/* Docked header */}
              <MotionBox
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.05 }}
                sx={{
                  px: 4,
                  pt: 2,
                  pb: 3,
                  borderBottom: 1,
                  borderColor: 'border.light',
                  backgroundColor: 'background.paper',
                  flexShrink: 0,
                }}
              >
                {/* Top row — minimal action bar, right-aligned (Linear-style: drawer is its own context). */}
                <Stack direction="row" justifyContent="flex-end" spacing={0.25} mb={2.5}>
                  <Tooltip title="Re-scan this Safe">
                    <span>
                      <IconButton onClick={handleRescan} size="small" disabled={!isComplete} aria-label="Re-scan">
                        <RefreshRoundedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <IconButton onClick={onClose} size="small" aria-label="Close security report">
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>

                {/* Identity row — Safe is the hero; chain:address + last scanned support it. */}
                <Stack direction="row" alignItems="center" spacing={2} sx={{ minWidth: 0 }}>
                  <Identicon address={selectedSafe.address} size={36} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      noWrap
                      sx={{ lineHeight: 1.3 }}
                      title={selectedEntry?.name || selectedSafe.address}
                    >
                      {selectedEntry?.name || shortenAddress(selectedSafe.address)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      sx={{ display: 'block', lineHeight: 1.4 }}
                    >
                      {chain?.shortName ? `${chain.shortName}:` : ''}
                      {shortenAddress(selectedSafe.address)}
                    </Typography>
                  </Box>
                  {lastScannedAt && (
                    <Box sx={{ flexShrink: 0, textAlign: 'right' }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', lineHeight: 1.4, whiteSpace: 'nowrap' }}
                      >
                        Last scanned
                      </Typography>
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        sx={{ display: 'block', lineHeight: 1.4, whiteSpace: 'nowrap' }}
                        title={new Date(lastScannedAt).toLocaleString()}
                      >
                        {new Date(lastScannedAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </MotionBox>

              {/* Scrollable content — animationKey replays entrance on rescan */}
              <MotionBox
                key={animationKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                sx={{ flex: 1, overflowY: 'auto', px: 4, pt: 3, pb: 4 }}
              >
                <SecurityPanelView
                  key={`${selectedSafe.address}:${selectedSafe.chainId}`}
                  scanContext={scanContext}
                  results={results}
                  isComplete={isComplete}
                  safeQueryParam={chain?.shortName ? `${chain.shortName}:${selectedSafe.address}` : undefined}
                />
              </MotionBox>
            </MotionBox>
          )}
        </AnimatePresence>
      </ShadcnProvider>
    </Drawer>
  )
}

export default SecurityReportDrawer
