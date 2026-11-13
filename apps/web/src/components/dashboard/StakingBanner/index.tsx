/**
 * @usedBy pages/balances/index.tsx (StakingBanner, useIsStakingBannerVisible)
 */
import { Typography } from '@safe-global/views/components/ui/typography'
import { Button } from '@safe-global/views/components/ui/button'
import { Link } from '@safe-global/views/components/ui/link'
import css from './styles.module.css'
import StakeIcon from '@/public/images/common/stake.svg'
import classNames from 'classnames'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useRouter } from 'next/router'
import NextLink from 'next/link'
import { OVERVIEW_EVENTS } from '@/services/analytics'
import Track from '@/components/common/Track'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { AppRoutes } from '@/config/routes'
import useIsStakingBannerVisible from '@/components/dashboard/StakingBanner/useIsStakingBannerVisible'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'

const LEARN_MORE_LINK = 'https://help.safe.global/articles/7497206492-Safe{Staking}'

const StakingBanner = ({
  hideLocalStorageKey = 'hideStakingBanner',
}: { large?: boolean; hideLocalStorageKey?: string } = {}) => {
  const isDarkMode = useDarkMode()
  const router = useRouter()
  const safeLinkQuery = useSafeLinkQuery()
  const isStakingBannerVisible = useIsStakingBannerVisible()

  const [_, setWidgetHidden] = useLocalStorage<boolean>(hideLocalStorageKey)

  if (!isStakingBannerVisible) return null

  return (
    <>
      <div className={classNames(css.bannerWrapper, 'overflow-hidden rounded-md bg-[var(--color-background-paper)]')}>
        {!isDarkMode && <div className={classNames(css.gradientBackground)} />}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="z-[1] flex flex-row items-center justify-center gap-4">
            <StakeIcon className="size-4" />

            <Typography variant="paragraph-small">
              <strong>Stake ETH and earn rewards up to 5% APY.</strong> Lock 32 ETH to become a validator via the Kiln
              widget. You can also{' '}
              <Link
                render={
                  <NextLink
                    href={{ pathname: AppRoutes.apps.index, query: { ...router.query, categories: ['Staking'] } }}
                  />
                }
              >
                explore Safe Apps
              </Link>{' '}
              and home staking for other options. Staking involves risks like slashing.
              {LEARN_MORE_LINK && (
                <>
                  {' '}
                  <Track {...OVERVIEW_EVENTS.OPEN_LEARN_MORE_STAKING_BANNER}>
                    <ExternalLink href={LEARN_MORE_LINK}>Learn more</ExternalLink>
                  </Track>
                </>
              )}
            </Typography>
          </div>

          <div className="flex flex-col items-center gap-4 md:flex-row md:items-end">
            <div>
              <Track {...OVERVIEW_EVENTS.HIDE_STAKING_BANNER}>
                <Button variant="ghost" onClick={() => setWidgetHidden(true)} size="sm" className="whitespace-nowrap">
                  Don&apos;t show again
                </Button>
              </Track>
            </div>
            <Track {...OVERVIEW_EVENTS.OPEN_STAKING_WIDGET}>
              <Button
                size="sm"
                className={classNames(css.stakeButton, 'w-full')}
                render={
                  <NextLink
                    href={
                      AppRoutes.stake && {
                        pathname: AppRoutes.stake,
                        query: safeLinkQuery,
                      }
                    }
                    rel="noreferrer"
                  />
                }
              >
                Stake
              </Button>
            </Track>
          </div>
        </div>
      </div>
    </>
  )
}

export default StakingBanner
