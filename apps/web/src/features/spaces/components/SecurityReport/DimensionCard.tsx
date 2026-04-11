import { type ReactElement, useState, useCallback } from 'react'
import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import RefreshIcon from '@mui/icons-material/Refresh'
import Link from 'next/link'
import type { DimensionDef } from '@/features/spaces/data/securityDimensions'
import type { ScanResult } from '@/features/spaces/data/scanners/types'
import type { DimensionStatus } from '@/features/spaces/data/securityTypes'
import { getGradeColor, getGradeBgColor } from '@/features/spaces/data/securityScoring'
import { formatTimestamp } from '@/features/spaces/data/scanners/utils'

const STATUS_LABELS = {
  clear: 'Healthy',
  issue: 'At risk',
  partial: 'Needs attention',
} satisfies Record<DimensionStatus, string>

type DimensionCardProps = {
  def: DimensionDef
  result?: ScanResult
  isScanning: boolean
  onRescan?: (id: string) => void
}

const DimensionCard = ({ def, result, isScanning, onRescan }: DimensionCardProps): ReactElement => {
  const [expanded, setExpanded] = useState(false)
  const toggle = useCallback(() => setExpanded((prev) => !prev), [])

  const color = result ? getGradeColor(result.severity) : 'text.secondary'
  const needsFix = result ? result.status !== 'clear' : false

  return (
    <Paper
      data-testid={`security-card-${def.id}`}
      sx={{
        borderRadius: '12px',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        border: 1,
        borderColor: expanded ? 'border.light' : 'transparent',
        '&:hover': { boxShadow: 3, borderColor: 'border.light' },
      }}
      onClick={toggle}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggle()
        }
      }}
    >
      <Box sx={{ p: 2.5, minHeight: 170, display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body1" fontWeight={700}>
            {def.title}
          </Typography>
          <KeyboardArrowDownRoundedIcon
            sx={{
              color: 'text.primary',
              fontSize: 20,
              flexShrink: 0,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          />
        </Stack>

        <Typography variant="caption" color="text.secondary" lineHeight={1.5}>
          {def.shortDescription}
        </Typography>

        <Box flex={1} minHeight={16} />

        <Stack direction="row" justifyContent="space-between" alignItems="center" minHeight={32}>
          {isScanning && !result ? (
            <Skeleton width={80} height={24} />
          ) : result ? (
            <Chip
              label={STATUS_LABELS[result.status]}
              size="small"
              sx={{
                backgroundColor: getGradeBgColor(result.severity),
                color,
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
              }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              —
            </Typography>
          )}
          {needsFix && (
            <Button
              component={Link}
              href={def.fixRoute}
              target="_blank"
              variant="text"
              size="small"
              endIcon={<ArrowForwardIcon />}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              sx={{ px: 1 }}
            >
              {result?.ctaLabelOverride ?? def.ctaLabel}
            </Button>
          )}
        </Stack>
      </Box>

      <Collapse in={expanded && !!result}>
        <Divider />
        <Box sx={{ p: 2.5 }}>
          <Box
            sx={{ p: 1.5, borderRadius: '8px', backgroundColor: 'background.main', mb: result?.remediation ? 1.5 : 0 }}
          >
            <Typography variant="body2" fontWeight={700} mb={0.75}>
              Findings
            </Typography>
            <Stack spacing={0.5}>
              {result?.evidence.map((item, i) =>
                typeof item === 'string' ? (
                  <Typography key={i} variant="body2">
                    {item}
                  </Typography>
                ) : (
                  <Stack key={i} direction="row" spacing={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120, flexShrink: 0 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {item.value}
                    </Typography>
                  </Stack>
                ),
              )}
            </Stack>
          </Box>

          {result?.remediation && (
            <Box sx={{ p: 1.5, borderRadius: '8px', backgroundColor: 'background.main' }}>
              <Typography variant="body2" fontWeight={700} mb={0.5}>
                Recommendation
              </Typography>
              <Typography variant="body2">{result.remediation}</Typography>
            </Box>
          )}

          <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
            {result?.lastChecked && (
              <Typography variant="caption" color="text.secondary">
                Checked {formatTimestamp(new Date(result.lastChecked).getTime())}
              </Typography>
            )}
            {onRescan && (
              <Tooltip title="Re-check">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRescan(def.id)
                  }}
                  disabled={isScanning}
                  sx={{ ml: 'auto' }}
                >
                  <RefreshIcon
                    fontSize="small"
                    sx={{
                      animation: isScanning ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  )
}

export default DimensionCard
