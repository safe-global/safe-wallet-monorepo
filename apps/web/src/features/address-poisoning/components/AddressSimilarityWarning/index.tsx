import type { ReactElement } from 'react'
import { Box, Link, SvgIcon, Typography } from '@mui/material'
import { ChevronRight } from 'lucide-react'
import WarningIcon from '@/public/images/notifications/warning.svg'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'

/**
 * Inline warning shown when an entered/displayed address dangerously resembles a
 * trusted anchor. CRITICAL = both visible ends match (the truncated-display attack);
 * WARN = a single end matches. `onReview` opens the full-length side-by-side compare.
 *
 * Mirrors the visual language of the app's standard `ErrorMessage` (palette-driven
 * background, warning glyph, bold title) so it sits naturally inside the surrounding
 * MUI forms — without that component's store/tx coupling.
 */
const AddressSimilarityWarning = ({
  match,
  onReview,
}: {
  match: SimilarityMatch
  onReview?: () => void
}): ReactElement => {
  const isCritical = match.severity === Severity.CRITICAL
  const level = isCritical ? 'error' : 'warning'

  return (
    <Box
      role="alert"
      data-testid="address-similarity-warning"
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-1)',
        p: 'var(--space-2)',
        borderRadius: '6px',
        backgroundColor: `var(--color-${level}-background)`,
        color: `var(--color-${level}-dark)`,
      }}
    >
      <SvgIcon
        component={WarningIcon}
        inheritViewBox
        fontSize="medium"
        sx={{ flexShrink: 0, color: ({ palette }) => `${palette[level].main} !important` }}
      />
      <Box>
        <Typography variant="subtitle2" fontWeight={700}>
          {isCritical
            ? 'This address looks almost identical to one you trust'
            : 'This address resembles a trusted address'}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          It shares the {isCritical ? 'first and last characters' : 'visible characters'} of an address you trust but
          differs in the middle — a common address-poisoning pattern. Verify the full address before continuing.
        </Typography>
        {onReview && (
          <Link
            component="button"
            type="button"
            onClick={onReview}
            data-testid="address-similarity-review"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.25,
              mt: 1,
              fontWeight: 600,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            Compare full addresses
            <ChevronRight size={16} />
          </Link>
        )}
      </Box>
    </Box>
  )
}

export default AddressSimilarityWarning
