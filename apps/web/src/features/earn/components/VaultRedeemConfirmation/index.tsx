import type { VaultRedeemTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Box, Stack, Typography } from '@mui/material'
import TokenIcon from '@/components/common/TokenIcon'
import TokenAmount from '@/components/common/TokenAmount'
import { vaultTypeToLabel } from '@/features/earn/utils'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { DataTable } from '@/components/common/Table/DataTable'
import { DataRow } from '@/components/common/Table/DataRow'
import IframeIcon from '@/components/common/IframeIcon'

// TODO: Check if additional rewards can actually appear for a withdraw/redeem
const AdditionalRewards = ({ txInfo }: { txInfo: VaultRedeemTransactionInfo }) => {
  if (!txInfo.additionalRewards[0]) return null

  const additionalRewardsClaimable = Number(txInfo.additionalRewards[0].claimable) > 0

  if (!additionalRewardsClaimable) return null

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

          <DataRow key="Earn" title="Earn">
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

const ConfirmationHeader = ({ txInfo }: { txInfo: VaultRedeemTransactionInfo }) => {
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
            Current reward
          </Typography>

          <Typography variant="h4" fontWeight="bold" component="div">
            <TokenAmount
              value={txInfo.currentReward}
              tokenSymbol={txInfo.tokenInfo.symbol}
              decimals={txInfo.tokenInfo.decimals}
            />
          </Typography>
        </Box>
      </Stack>
    </Stack>
  )
}

const VaultRedeemConfirmation = ({
  txInfo,
  isTxDetails = false,
}: {
  txInfo: VaultRedeemTransactionInfo
  isTxDetails?: boolean
}) => {
  return (
    <>
      <DataTable
        rows={[
          <>{!isTxDetails && <ConfirmationHeader txInfo={txInfo} />}</>,

          <>
            {isTxDetails && (
              <DataRow key="Current reward" title="Current reward">
                <TokenAmount
                  value={txInfo.currentReward}
                  tokenSymbol={txInfo.tokenInfo.symbol}
                  decimals={txInfo.tokenInfo.decimals}
                  logoUri={txInfo.tokenInfo.logoUri ?? undefined}
                />
              </DataRow>
            )}
          </>,

          <DataRow key="Withdraw from" title="Withdraw from">
            <Stack direction="row" alignItems="center">
              <IframeIcon src={txInfo.vaultInfo.logoUri} alt="Morpho logo" width={24} height={24} />
              <Typography component="span" ml={1} fontWeight="bold">
                {txInfo.vaultInfo.name}
              </Typography>
            </Stack>
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

export default VaultRedeemConfirmation
