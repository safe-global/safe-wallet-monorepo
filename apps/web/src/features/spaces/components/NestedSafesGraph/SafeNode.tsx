import { type ReactElement } from 'react'
import { Box, Typography, SvgIcon } from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import EthHashInfo from '@/components/common/EthHashInfo'
import type { SafeNodeData } from './useNestedSafesGraph'

const borderColorToken = (data: SafeNodeData): string => {
  if (data.isCurrent) return 'success.main'
  if (data.trust === 'suspicious') return 'warning.main'
  if (!data.isSpaceMember) return 'text.disabled'
  return 'primary.main'
}

/**
 * Presentational node card (no reactflow context). Exported separately so it can
 * be unit-tested with plain props.
 */
export function SafeNodeContent({ data }: { data: SafeNodeData }): ReactElement {
  return (
    <Box
      data-testid="safe-node"
      data-current={data.isCurrent}
      sx={{
        width: 220,
        px: 1.5,
        py: 1,
        borderRadius: 1.5,
        backgroundColor: 'background.paper',
        border: '2px solid',
        borderStyle: data.isSpaceMember ? 'solid' : 'dashed',
        borderColor: borderColorToken(data),
        boxShadow: data.isCurrent ? ({ palette }) => `0 0 0 3px ${palette.success.main}33` : undefined,
        opacity: data.isSpaceMember ? 1 : 0.9,
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
        {data.name ? (
          <Typography variant="body2" fontWeight={700} noWrap>
            {data.name}
          </Typography>
        ) : (
          <EthHashInfo address={data.address} showName={false} showAvatar avatarSize={20} shortAddress />
        )}
        {data.trust === 'suspicious' && (
          <SvgIcon
            data-testid="node-suspicious-icon"
            component={WarningAmberIcon}
            fontSize="small"
            sx={{ color: 'warning.main', flexShrink: 0 }}
          />
        )}
      </Box>

      {data.name && (
        <Box mt={0.5}>
          <EthHashInfo address={data.address} showName={false} showAvatar={false} shortAddress />
        </Box>
      )}

      {data.fiatTotal && (
        <Typography variant="caption" fontWeight={700} color="success.main" sx={{ mt: 0.5, display: 'block' }}>
          {data.fiatTotal}
        </Typography>
      )}
    </Box>
  )
}

/** reactflow custom node: wraps the content with source/target handles. */
function SafeNode({ data }: NodeProps<Node<SafeNodeData>>): ReactElement {
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <SafeNodeContent data={data} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </>
  )
}

export default SafeNode
