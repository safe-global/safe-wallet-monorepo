import { type ReactElement, useState, useCallback } from 'react'
import { Box, Button, Chip, Collapse, Divider, Paper, Skeleton, Stack, Tooltip, Typography } from '@mui/material'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import Link from 'next/link'
import { useRouter } from 'next/router'
import type { CheckDef } from '@/features/security/data/securityChecks'
import type { ScanResult } from '@/features/security/data/scanners/types'
import type { CheckStatus } from '@/features/security/data/securityTypes'
import { getGradeColor, getGradeBgColor } from '@/features/security/data/securityScoring'
import type { CardOverride } from './CheckGrid'

const STATUS_LABELS: Record<CheckStatus, string> = {
  clear: 'Healthy',
  issue: 'At risk',
  partial: 'Needs attention',
  not_applicable: 'N/A',
  inconclusive: 'Unverified',
}

type CheckCardProps = {
  def: CheckDef
  result?: ScanResult
  isScanning: boolean
  error?: string
  override?: CardOverride
}

const CheckCard = ({ def, result, isScanning, error, override }: CheckCardProps): ReactElement => {
  const [expanded, setExpanded] = useState(false)
  const toggle = useCallback(() => setExpanded((prev) => !prev), [])
  const router = useRouter()

  const isExcluded = result?.status === 'not_applicable' || result?.status === 'inconclusive'
  const color = result && !isExcluded ? getGradeColor(result.severity) : 'text.secondary'
  const needsFix = result ? result.status !== 'clear' && !isExcluded : false
  const fixHref = { pathname: def.fixRoute, query: { safe: router.query.safe } }
  const ctaLabel = needsFix
    ? (override?.ctaLabel ?? result?.ctaLabelOverride ?? def.ctaLabel)
    : (override?.clearCtaLabel ?? null)

  return (
    <Paper
      data-testid={`security-card-${def.id}`}
      sx={{
        borderRadius: '12px',
        cursor: 'pointer',
        overflow: 'hidden',
        opacity: isExcluded ? 0.6 : 1,
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
          <Typography variant="body1" fontWeight={700} noWrap>
            {override?.title ?? def.title}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1} flexShrink={0}>
            {override?.logo}
            <KeyboardArrowDownRoundedIcon
              aria-label={expanded ? 'Collapse details' : 'Expand details'}
              sx={{
                color: 'text.primary',
                fontSize: 24,
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
          </Stack>
        </Stack>

        <Typography variant="body2" color="primary.light" lineHeight={1.5}>
          {override?.description ?? def.shortDescription}
        </Typography>

        <Box flex={1} minHeight={16} />

        <Stack direction="row" justifyContent="space-between" alignItems="center" minHeight={32}>
          {isScanning && !result ? (
            <Skeleton width={80} height={24} />
          ) : result ? (
            isExcluded ? (
              <Tooltip
                title={
                  result.evidence.map((e) => (typeof e === 'string' ? e : e.value)).find((v) => v) ??
                  'This check does not apply to this Safe'
                }
              >
                <Chip
                  label={STATUS_LABELS[result.status]}
                  size="small"
                  sx={{
                    backgroundColor: 'border.light',
                    color,
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                  }}
                />
              </Tooltip>
            ) : (
              <Chip
                label={STATUS_LABELS[result.status]}
                size="small"
                sx={{
                  backgroundColor: getGradeBgColor(result.severity),
                  color,
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                }}
              />
            )
          ) : error ? (
            <Chip
              label="Error"
              size="small"
              sx={{
                backgroundColor: 'error.background',
                color: 'error.main',
                fontWeight: 700,
                letterSpacing: '0.5px',
              }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              —
            </Typography>
          )}
          {ctaLabel &&
            (override?.onCtaClick ? (
              <Button
                variant="text"
                size="small"
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  override.onCtaClick!()
                }}
                sx={{ px: 1 }}
              >
                {ctaLabel}
              </Button>
            ) : (
              <Link href={fixHref} passHref legacyBehavior>
                <Button
                  component="a"
                  variant="text"
                  size="small"
                  endIcon={<ArrowForwardRoundedIcon />}
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  sx={{ px: 1 }}
                >
                  {ctaLabel}
                </Button>
              </Link>
            ))}
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
                  <Typography key={`${i}-${item}`} variant="body2">
                    {item}
                  </Typography>
                ) : (
                  <Stack key={`${item.label}-${item.value}`} direction="row" spacing={1}>
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
        </Box>
      </Collapse>
    </Paper>
  )
}

export default CheckCard
