/**
 * @usedBy pages/balances/index.tsx (StakingBanner, useIsStakingBannerVisible)
 */
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import css from './styles.module.css'
import StakeIcon from '@/public/images/common/stake.svg'
import classNames from 'classnames'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useRouter } from 'next/router'
import NextLink from 'next/link'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import ExternalLink from '@/components/common/ExternalLink'
import { AppRoutes } from '@/config/routes'
import useIsStakingBannerVisible from '@/components/dashboard/StakingBanner/useIsStakingBannerVisible'

const LEARN_MORE_LINK = 'https://help.safe.global/articles/7497206492-Safe{Staking}'

const StakingBanner = ({
  hideLocalStorageKey = 'hideStakingBanner',
}: { large?: boolean; hideLocalStorageKey?: string } = {}) => {
  const isDarkMode = useDarkMode()
  const router = useRouter()
  const isStakingBannerVisible = useIsStakingBannerVisible()

  const [_, setWidgetHidden] = useLocalStorage<boolean>(hideLocalStorageKey)

  if (!isStakingBannerVisible) return null

  const onClick = () => {
    trackEvent(OVERVIEW_EVENTS.OPEN_STAKING_WIDGET)
  }

  const onHide = () => {
    setWidgetHidden(true)
    trackEvent(OVERVIEW_EVENTS.HIDE_STAKING_BANNER)
  }

  const onLearnMore = () => {
    trackEvent(OVERVIEW_EVENTS.OPEN_LEARN_MORE_STAKING_BANNER)
  }

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
                  <ExternalLink onClick={onLearnMore} href={LEARN_MORE_LINK}>
                    Learn more
                  </ExternalLink>
                </>
              )}
            </Typography>
          </div>

          <div className="flex flex-col items-center gap-4 md:flex-row md:items-end">
            <div>
              <Button variant="ghost" onClick={onHide} size="sm" className="whitespace-nowrap">
                Don&apos;t show again
              </Button>
            </div>
            <Button
              size="sm"
              className={classNames(css.stakeButton, 'w-full')}
              render={
                <NextLink
                  href={AppRoutes.stake && { pathname: AppRoutes.stake, query: { safe: router.query.safe } }}
                  rel="noreferrer"
                  onClick={onClick}
                />
              }
            >
              Stake
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default StakingBanner
