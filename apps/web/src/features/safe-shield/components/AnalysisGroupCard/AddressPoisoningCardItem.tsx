import { Box, Stack, Typography } from '@mui/material'
import { Severity, type AnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import { getCommonAffixLengths } from '@safe-global/utils/utils/addressSimilarity'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { useCurrentChain } from '@/hooks/useChains'
import ExplorerButton from '@/components/common/ExplorerButton'
import CopyTooltip from '@/components/common/CopyTooltip'
import { SEVERITY_COLORS } from '../../constants'
import { HighlightedAddress } from '../HighlightedAddress'

interface AddressRowProps {
  label: string
  address: string
  prefixLen: number
  suffixLen: number
  explorerHref?: string
}

const AddressRow = ({ label, address, prefixLen, suffixLen, explorerHref }: AddressRowProps) => (
  <Box padding="8px" bgcolor="background.paper" borderRadius="4px">
    <Stack spacing={0.5}>
      <Typography variant="body2" color="text.secondary" fontSize={12}>
        {label}
      </Typography>
      <Stack direction="row" alignItems="flex-start" gap={0.5}>
        <CopyTooltip text={address} initialToolTipText="Copy address">
          <Typography
            variant="body2"
            fontSize={12}
            lineHeight="20px"
            sx={{ cursor: 'pointer', color: 'primary.light', flex: 1, '&:hover': { color: 'text.primary' } }}
          >
            <HighlightedAddress address={address} prefixLen={prefixLen} suffixLen={suffixLen} />
          </Typography>
        </CopyTooltip>
        {explorerHref && (
          <Box component="span" color="text.secondary">
            <ExplorerButton href={explorerHref} />
          </Box>
        )}
      </Stack>
    </Stack>
  </Box>
)

interface AddressPoisoningCardItemProps {
  result: AnalysisResult
}

/**
 * Dedicated renderer for the ADDRESS_POISONING group: shows the entered address and the trusted
 * address it resembles side by side (no "Show all" dropdown), with the matching front/back
 * characters bolded. Scoped to poisoning results only — other Copilot cards are unaffected.
 */
export const AddressPoisoningCardItem = ({ result }: AddressPoisoningCardItemProps) => {
  const chain = useCurrentChain()
  const [entered, anchor] = result.addresses ?? []
  const { prefixLen, suffixLen } =
    entered && anchor ? getCommonAffixLengths(entered.address, anchor.address) : { prefixLen: 0, suffixLen: 0 }
  const borderColor = SEVERITY_COLORS[result.severity]?.main ?? SEVERITY_COLORS[Severity.CRITICAL].main
  const explorerHref = (address: string) => (chain ? getBlockExplorerLink(chain, address)?.href : undefined)

  return (
    <Box bgcolor="background.main" borderRadius="4px" overflow="hidden">
      <Box sx={{ borderLeft: `4px solid ${borderColor}`, padding: '12px' }}>
        <Stack gap={2}>
          <Typography variant="body2" color="primary.light" sx={{ wordBreak: 'break-word' }}>
            {result.description}
          </Typography>

          <Stack gap={1}>
            {entered && (
              <AddressRow
                label="Address entered"
                address={entered.address}
                prefixLen={prefixLen}
                suffixLen={suffixLen}
                explorerHref={explorerHref(entered.address)}
              />
            )}
            {anchor && (
              <AddressRow
                label={anchor.name ? `Saved address: ${anchor.name}` : 'Saved address'}
                address={anchor.address}
                prefixLen={prefixLen}
                suffixLen={suffixLen}
                explorerHref={explorerHref(anchor.address)}
              />
            )}
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}
