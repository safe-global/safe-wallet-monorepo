import { useEffect, useState, type ReactElement } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import GppGoodIcon from '@mui/icons-material/GppGood'
import GppMaybeIcon from '@mui/icons-material/GppMaybe'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { SAFE_SHIELD_EVENTS, trackEvent } from '@/services/analytics'

const overlaySx = {
  position: 'absolute',
  inset: 0,
  zIndex: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: 2,
  backdropFilter: 'blur(8px)',
  borderRadius: '0px 0px 6px 6px',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    backgroundColor: 'var(--color-background-paper)',
    opacity: 0.7,
  },
  '& > *': {
    position: 'relative',
  },
} as const

/**
 * Paywall overlay shown on top of the blurred Safe Shield analysis details.
 *
 * A critical scan verdict is never hidden: the overall status header stays visible
 * above this overlay and the copy switches to a threat warning, so users always
 * know when a transaction was flagged — only the detailed breakdown is locked.
 */
export const EnhancedModePaywall = ({
  severity,
  price,
  onUnlock,
}: {
  severity?: Severity
  price: string
  onUnlock: () => void
}): ReactElement => {
  const [isConfirming, setIsConfirming] = useState(false)
  const isCritical = severity === Severity.CRITICAL

  useEffect(() => {
    trackEvent(SAFE_SHIELD_EVENTS.ENHANCED_MODE_SHOWN)
  }, [])

  const onCtaClick = () => {
    trackEvent(SAFE_SHIELD_EVENTS.ENHANCED_MODE_CTA_CLICKED)
    setIsConfirming(true)
  }

  const onCancel = () => {
    trackEvent(SAFE_SHIELD_EVENTS.ENHANCED_MODE_CANCELLED)
    setIsConfirming(false)
  }

  return (
    <Box data-testid="enhanced-mode-paywall" sx={overlaySx}>
      {isConfirming ? (
        <Stack gap={1} alignItems="center">
          <Typography variant="body2" fontWeight={700}>
            Run enhanced mode for {price}?
          </Typography>

          <Typography variant="caption" color="text.secondary">
            A {price} fee in the chain&apos;s native token is added to this transaction and sent to Safe Labs when it
            executes. You can review it in the transaction details before signing.
          </Typography>

          <Stack direction="row" gap={1}>
            <Button data-testid="enhanced-mode-cancel" size="small" variant="outlined" onClick={onCancel}>
              Cancel
            </Button>

            <Button data-testid="enhanced-mode-confirm" size="small" variant="contained" onClick={onUnlock}>
              Confirm and run
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Stack gap={1} alignItems="center">
          {isCritical ? (
            <GppMaybeIcon color="error" fontSize="large" />
          ) : (
            <GppGoodIcon color="primary" fontSize="large" />
          )}

          <Typography variant="body2" fontWeight={700}>
            {isCritical ? 'Threat detected' : 'Enhanced transaction checks'}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {isCritical
              ? 'Safe Shield flagged this transaction. Run enhanced mode to see the full analysis.'
              : 'Recipient, contract, threat and simulation analysis for this transaction.'}
          </Typography>

          <Button data-testid="enhanced-mode-cta" size="small" variant="contained" onClick={onCtaClick}>
            Run enhanced mode
          </Button>

          <Typography variant="caption" color="text.secondary">
            {price} per scan
          </Typography>
        </Stack>
      )}
    </Box>
  )
}
