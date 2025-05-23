import type { VaultDepositTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Box, Stack, Typography } from '@mui/material'
import TokenIcon from '@/components/common/TokenIcon'
import TokenAmount from '@/components/common/TokenAmount'
import { vaultTypeToLabel } from '@/features/earn/utils'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { DataTable } from '@/components/common/Table/DataTable'
import { DataRow } from '@/components/common/Table/DataRow'
import ExternalLink from '@/components/common/ExternalLink'
import IframeIcon from '@/components/common/IframeIcon'
import { InfoTooltip } from '@/features/stake/components/InfoTooltip'
import { BRAND_NAME } from '@/config/constants'

const AdditionalRewards = ({ txInfo }: { txInfo: VaultDepositTransactionInfo }) => {
  if (!txInfo.additionalRewards[0]) return null

  return (
    <Stack sx={{ border: '1px solid #ddd', borderRadius: '6px', padding: '12px', mt: 1 }}>
      <DataTable
        header="Additional reward"
        rows={[
          <DataRow key="Token" title="Token">
            {txInfo.additionalRewards[0].tokenInfo.name}{' '}
            <Typography component="span" color="primary.light">
              {txInfo.additionalRewards[0].tokenInfo.symbol}
            </Typography>
          </DataRow>,

          <DataRow key="Reward rate" title="Reward rate">
            {formatPercentage(txInfo.additionalRewardsNrr / 100)}
          </DataRow>,

          <Typography
            key="Powered by"
            variant="caption"
            color="text.secondary"
            display="flex"
            alignItems="center"
            gap={0.5}
            mt={1}
          >
            Powered by <IframeIcon src={txInfo.vaultInfo.logoUri} alt="Morpho logo" width={16} height={16} /> Morpho
          </Typography>,
        ]}
      />
    </Stack>
  )
}

const ConfirmationHeader = ({ txInfo }: { txInfo: VaultDepositTransactionInfo }) => {
  const totalNrr = (txInfo.baseNrr + txInfo.additionalRewardsNrr) / 100

  return (
    <Stack key="amount" direction="row" gap={1} mb={1}>
      <Stack
        direction="row"
        sx={{
          flexWrap: 'wrap',
          alignItems: 'center',
          width: '50%',
          bgcolor: 'border.background',
          position: 'relative',
          borderRadius: 1,
          py: 2,
          px: 3,
        }}
      >
        {txInfo.tokenInfo && (
          <Box width={40} mr={2}>
            <TokenIcon size={40} logoUri={txInfo.tokenInfo.logoUri || ''} tokenSymbol={txInfo.tokenInfo.symbol} />
          </Box>
        )}

        <Box flex={1}>
          <Typography variant="body2" color="primary.light">
            {vaultTypeToLabel[txInfo.type]}
          </Typography>

          <Typography variant="h4" fontWeight="bold" component="div">
            {txInfo.tokenInfo ? (
              <TokenAmount
                tokenSymbol={txInfo.tokenInfo.symbol}
                value={txInfo.value}
                decimals={txInfo.tokenInfo.decimals}
              />
            ) : (
              txInfo.value
            )}
          </Typography>
        </Box>
      </Stack>

      <Stack
        direction="row"
        sx={{
          flexWrap: 'wrap',
          alignItems: 'center',
          width: '50%',
          bgcolor: 'border.background',
          position: 'relative',
          borderRadius: 1,
          py: 2,
          px: 3,
        }}
      >
        <Box flex={1}>
          <Typography variant="body2" color="primary.light">
            Earn
          </Typography>

          <Typography variant="h4" fontWeight="bold" component="div">
            {formatPercentage(totalNrr)}
          </Typography>
        </Box>
      </Stack>
    </Stack>
  )
}

const VaultDepositConfirmation = ({
  txInfo,
  isTxDetails = false,
}: {
  txInfo: VaultDepositTransactionInfo
  isTxDetails?: boolean
}) => {
  if (!txInfo.vaultInfo) return null

  const annualReward = Number(txInfo.expectedAnnualReward).toFixed(0)
  const monthlyReward = Number(txInfo.expectedMonthlyReward).toFixed(0)

  return (
    <>
      <DataTable
        rows={[
          <>{!isTxDetails && <ConfirmationHeader txInfo={txInfo} />}</>,

          <DataRow key="Deposit via" title="Deposit via">
            <ExternalLink href={txInfo.vaultInfo.dashboardUri!}>
              <IframeIcon src={txInfo.vaultInfo.logoUri} alt="Morpho logo" width={24} height={24} />
              <Typography component="span" ml={1} fontWeight="bold">
                {txInfo.vaultInfo.name}
              </Typography>
            </ExternalLink>
          </DataRow>,

          <DataRow key="Expected annual reward" title="Exp. annual reward">
            <TokenAmount
              tokenSymbol={txInfo.tokenInfo.symbol}
              value={annualReward}
              decimals={txInfo.tokenInfo.decimals}
            />
          </DataRow>,

          <DataRow key="Expected monthly reward" title="Exp. monthly reward">
            <TokenAmount
              tokenSymbol={txInfo.tokenInfo.symbol}
              value={monthlyReward}
              decimals={txInfo.tokenInfo.decimals}
            />
          </DataRow>,

          <DataRow
            key="Widget fee"
            title={
              <>
                Widget fee
                <InfoTooltip
                  title={`The widget fee incurred here is charged by Kiln for the operation of this widget. The fee is calculated automatically. Part of the fee will contribute to a license fee that supports the Safe Community. Neither the Safe Ecosystem Foundation nor ${BRAND_NAME} operates the Kiln Widget and/or Kiln.`}
                />
              </>
            }
          >
            {formatPercentage(txInfo.fee, true)}
          </DataRow>,

          <AdditionalRewards key="Additional rewards" txInfo={txInfo} />,

          <Typography key="Vault description" variant="body2" color="text.secondary" mt={1}>
            {txInfo.vaultInfo.description}
          </Typography>,
        ]}
      />
    </>
  )
}

export default VaultDepositConfirmation
