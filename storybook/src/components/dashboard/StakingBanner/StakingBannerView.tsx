import type { ReactElement } from 'react'
import NextLink, { type LinkProps } from 'next/link'
import classNames from 'classnames'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import ExternalLink from '@/components/common/ExternalLink'
import StakeIcon from '@/public/images/common/stake.svg'
import css from './styles.module.css'

const LEARN_MORE_LINK = 'https://help.safe.global/articles/7497206492-Safe{Staking}'

export type StakingBannerViewProps = {
  isDarkMode: boolean
  exploreAppsHref: LinkProps['href']
  stakeHref: LinkProps['href']
  onStakeClick: () => void
  onHide: () => void
  onLearnMore: () => void
}

export function StakingBannerView({
  isDarkMode,
  exploreAppsHref,
  stakeHref,
  onStakeClick,
  onHide,
  onLearnMore,
}: StakingBannerViewProps): ReactElement {
  return (
    <>
      <div className={classNames(css.bannerWrapper, 'overflow-hidden rounded-md bg-[var(--color-background-paper)]')}>
        {!isDarkMode && <div className={classNames(css.gradientBackground)} />}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="z-[1] flex flex-row items-center justify-center gap-4">
            <StakeIcon className="size-4" />

            <Typography variant="paragraph-small">
              <strong>Stake ETH and earn rewards up to 5% APY.</strong> Lock 32 ETH to become a validator via the Kiln
              widget. You can also <Link render={<NextLink href={exploreAppsHref} />}>explore Safe Apps</Link> and home
              staking for other options. Staking involves risks like slashing.
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
              render={<NextLink href={stakeHref} rel="noreferrer" onClick={onStakeClick} />}
            >
              Stake
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
