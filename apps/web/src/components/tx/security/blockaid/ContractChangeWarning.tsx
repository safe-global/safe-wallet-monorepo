import { Box, Stack, Typography } from '@mui/material'
import type { ContractManagementChange } from '@/services/security/modules/BlockaidModule/types'
import { SecuritySeverity } from '@/services/security/modules/types'
import { mapSecuritySeverity } from '../utils'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Warning } from '.'

export const CONTRACT_CHANGE_TITLES_MAPPING: Record<ContractManagementChange['type'], string> = {
  PROXY_UPGRADE: 'This transaction will change the mastercopy of the Safe',
  OWNERSHIP_CHANGE: 'This transaction will change the ownership of the Safe',
  MODULE_CHANGE: 'This transaction contains a Safe module change',
}

export const ProxyUpgradeSummary = ({
  beforeAddress,
  afterAddress,
}: {
  beforeAddress: string
  afterAddress: string
}) => {
  return (
    <Stack direction="column" spacing={0.5}>
      <Typography variant="body2">Current mastercopy:</Typography>
      <Box sx={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'background.paper' }}>
        <EthHashInfo address={beforeAddress} showCopyButton hasExplorer shortAddress={false} showAvatar={false} />
      </Box>

      <Typography variant="body2">New mastercopy:</Typography>
      <Box sx={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'background.paper' }}>
        <EthHashInfo address={afterAddress} showCopyButton hasExplorer shortAddress={false} showAvatar={false} />
      </Box>
    </Stack>
  )
}

export const ContractChangeWarning = ({ contractChange }: { contractChange: ContractManagementChange }) => {
  const title = CONTRACT_CHANGE_TITLES_MAPPING[contractChange.type]
  const severityProps = mapSecuritySeverity[SecuritySeverity.MEDIUM]
  const { before, after, type } = contractChange

  const warningContent =
    type === 'PROXY_UPGRADE' ? (
      <ProxyUpgradeSummary beforeAddress={before.address} afterAddress={after.address} />
    ) : (
      <Typography variant="body2">Please verify that these changes are correct before proceeding.</Typography>
    )

  return <Warning title={title} severityProps={severityProps} content={warningContent} isTransaction={true} />
}
