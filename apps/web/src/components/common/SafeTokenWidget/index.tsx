import UnreadBadge from '@/components/common/UnreadBadge'
import { IS_PRODUCTION, SAFE_TOKEN_ADDRESSES, SAFE_LOCKING_ADDRESS } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import useChainId from '@/hooks/useChainId'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import type { Vesting } from '@/hooks/useSafeTokenAllocation'
import useSafeTokenAllocation, { useSafeVotingPower } from '@/hooks/useSafeTokenAllocation'
import { OVERVIEW_EVENTS } from '@/services/analytics'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { Box, ButtonBase, Skeleton, Tooltip, Typography } from '@mui/material'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Track from '../Track'
import SafeTokenIcon from '@/public/images/common/safe-token.svg'
import css from './styles.module.css'
import { useSanctionedAddress } from '@/hooks/useSanctionedAddress'

const TOKEN_DECIMALS = 18

const canRedeemSAPUnboostedAllocation = (allocation?: Vesting[]): boolean => {
  const sapUnboostedAllocation = allocation?.find(({ tag }) => tag === 'sap_unboosted')

  if (!sapUnboostedAllocation) {
    return false
  }

  return !sapUnboostedAllocation.isRedeemed && !sapUnboostedAllocation.isExpired
}

const SAP_REDEEM_DEADLINE = '06.12.2025'

export const getSafeTokenAddress = (chainId: string): string | undefined => {
  return SAFE_TOKEN_ADDRESSES[chainId]
}

export const getSafeLockingAddress = (chainId: string): string | undefined => {
  return SAFE_LOCKING_ADDRESS[chainId]
}

const GOVERNANCE_APP_URL = IS_PRODUCTION ? 'https://community.safe.global' : 'https://safe-dao-governance.dev.5afe.dev'

const SafeTokenWidget = () => {
  const chainId = useChainId()
  const query = useSearchParams()
  const isSafeOwner = useIsSafeOwner()

  const [allocationData, , allocationDataLoading] = useSafeTokenAllocation()
  const [allocation, , allocationLoading] = useSafeVotingPower(allocationData)

  const sanctionedAddress = useSanctionedAddress()

  const tokenAddress = getSafeTokenAddress(chainId)
  if (!tokenAddress || Boolean(sanctionedAddress)) {
    return null
  }

  const url = {
    pathname: AppRoutes.apps.open,
    query: { safe: query?.get('safe'), appUrl: GOVERNANCE_APP_URL },
  }

  const flooredSafeBalance = formatVisualAmount(allocation || BigInt(0), TOKEN_DECIMALS, 0)
  const canRedeemSAPUnboosted = canRedeemSAPUnboostedAllocation(allocationData) && isSafeOwner

  return (
    <Box className={css.container}>
      <Tooltip
        title={
          url
            ? canRedeemSAPUnboosted
              ? `Redeem your allocation before ${SAP_REDEEM_DEADLINE} to be eligible!`
              : 'Go to Safe{DAO} Governance'
            : ''
        }
      >
        <span>
          <Track {...OVERVIEW_EVENTS.SAFE_TOKEN_WIDGET}>
            <Link href={url} passHref legacyBehavior>
              <ButtonBase aria-describedby="safe-token-widget" className={css.tokenButton} disabled={url === undefined}>
                <SafeTokenIcon width={24} height={24} />
                <Typography
                  component="div"
                  variant="body2"
                  lineHeight={1}
                  // Badge does not accept className so must be here
                  className={css.allocationBadge}
                >
                  <UnreadBadge
                    invisible={!canRedeemSAPUnboosted}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                  >
                    {allocationDataLoading || allocationLoading ? (
                      <Skeleton width="16px" animation="wave" />
                    ) : (
                      flooredSafeBalance
                    )}
                  </UnreadBadge>
                </Typography>
              </ButtonBase>
            </Link>
          </Track>
        </span>
      </Tooltip>
    </Box>
  )
}

export default SafeTokenWidget
