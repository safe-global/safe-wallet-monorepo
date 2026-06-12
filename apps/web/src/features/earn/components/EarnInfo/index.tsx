import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import EarnIllustrationLight from '@/public/images/common/earn-illustration-light.png'

import CheckIcon from '@/public/images/common/check.svg'
import StarIcon from '@/public/images/common/star.svg'
import EyeIcon from '@/public/images/common/eye.svg'
import FiatIcon from '@/public/images/common/fiat.svg'
import Track from '@/components/common/Track'
import useBalances from '@/hooks/useBalances'
import { EligibleEarnTokens, VaultAPYs } from '../../constants'
import useChainId from '@/hooks/useChainId'
import TokenIcon from '@/components/common/TokenIcon'
import TokenAmount from '@/components/common/TokenAmount'
import FiatValue from '@/components/common/FiatValue'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import css from './styles.module.css'
import Kiln from '@/public/images/common/kiln-symbol.svg'
import Morpho from '@/public/images/common/morpho-symbol.svg'
import Cross from '@/public/images/common/cross.svg'
import classNames from 'classnames'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { EARN_EVENTS, EARN_LABELS } from '@/services/analytics/events/earn'
import ExternalLink from '@/components/common/ExternalLink'
import { APYDisclaimer, EARN_HELP_ARTICLE, ApproximateAPY } from '../../constants'

export const EarnPoweredBy = () => {
  const isDarkMode = useDarkMode()

  return (
    <div className="flex flex-row gap-2">
      <Typography variant="paragraph-mini-bold" color="muted">
        Powered by
      </Typography>
      <Morpho className={classNames(css.morphoIcon, { [css.kilnIconDarkMode]: isDarkMode })} />
      <Cross width={12} height={12} className={classNames({ [css.kilnIconDarkMode]: isDarkMode })} />
      <Kiln className={classNames(css.kilnIcon, { [css.kilnIconDarkMode]: isDarkMode })} />
    </div>
  )
}

export const EarnBannerCopy = () => {
  const isDarkMode = useDarkMode()

  return (
    <>
      <Typography variant="h2" className={classNames(css.header, { [css.gradientText]: isDarkMode })}>
        Earn up to{' '}
        <span className={classNames({ [css.gradientText]: isDarkMode })}>{formatPercentage(ApproximateAPY)} APY*</span>{' '}
        and get MORPHO rewards
      </Typography>

      <Typography variant="paragraph" className={classNames(css.content, 'mt-4')}>
        Deposit stablecoins, wstETH, ETH, and WBTC straight from your account and let your assets compound in minutes.{' '}
        <Track {...EARN_EVENTS.OPEN_EARN_LEARN_MORE} label={EARN_LABELS.safe_dashboard_banner}>
          <ExternalLink href={EARN_HELP_ARTICLE}>Learn more</ExternalLink>
        </Track>
      </Typography>
    </>
  )
}

const EarnInfo = ({ onGetStarted }: { onGetStarted: () => void }) => {
  const { balances } = useBalances()
  const chainId = useChainId()
  const router = useRouter()

  const eligibleAssets = balances.items.filter((token) => EligibleEarnTokens[chainId].includes(token.tokenInfo.address))

  return (
    <div className="m-6">
      <Card className="p-8">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="flex flex-col gap-6 md:w-7/12">
            <div className="z-[2]">
              <EarnPoweredBy />
            </div>

            <div className="z-[2] max-w-[600px]">
              <EarnBannerCopy />
            </div>

            <div className="text-center">
              <Track {...EARN_EVENTS.GET_STARTED_WITH_EARN}>
                <Button className="w-full md:w-auto" onClick={onGetStarted}>
                  Get started
                </Button>
              </Track>
            </div>
          </div>

          <div className="relative hidden items-center justify-center bg-[var(--color-background-main)] sm:flex md:w-5/12">
            <Image src={EarnIllustrationLight} alt="Earn illustration" width={239} height={239} />
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex-1">
          <Typography variant="h3" className="mb-4 mt-6 font-bold">
            Your benefits
          </Typography>
          <Card className="p-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-row gap-4">
                <div className={css.benefitIcon}>
                  <CheckIcon className="size-5 text-[var(--color-success-main)]" />
                </div>
                <div>
                  <Typography className="mb-1 font-bold">Never leave the app</Typography>
                  <Typography>Interact with your assets right in Safe Wallet UI.</Typography>
                </div>
              </div>

              <div className={classNames('flex flex-row gap-4', css.benefit)}>
                <div className={css.benefitIcon}>
                  <StarIcon className="size-5 text-[var(--color-success-main)]" />
                </div>
                <div>
                  <Typography className="mb-1 font-bold">Collect earnings every day</Typography>
                  <Typography>Your balance keeps working for you.</Typography>
                </div>
              </div>

              <div className={classNames('flex flex-row gap-4', css.benefit)}>
                <div className={css.benefitIcon}>
                  <EyeIcon className="size-5 text-[var(--color-success-main)]" />
                </div>
                <div>
                  <Typography className="mb-1 font-bold">Understand every transaction</Typography>
                  <Typography>User-friendly transactions that are easy to understand for all signers.</Typography>
                </div>
              </div>

              <div className={classNames('flex flex-row gap-4', css.benefit)}>
                <div className={css.benefitIcon}>
                  <FiatIcon className="size-5 text-[var(--color-success-main)]" />
                </div>
                <div>
                  <Typography className="mb-1 font-bold">Cash out whenever you want</Typography>
                  <Typography>Zero lock-ups, zero penalties.</Typography>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {eligibleAssets.length > 0 && (
          <div className="flex-1">
            <Typography variant="h3" className="mb-4 mt-6 font-bold">
              Eligible assets
            </Typography>

            <div className="flex flex-col gap-4">
              {eligibleAssets.map((asset) => {
                const vaultAPY = formatPercentage(VaultAPYs[chainId][asset.tokenInfo.address] / 100)

                const onEarnClick = () => {
                  onGetStarted()

                  trackEvent({ ...EARN_EVENTS.OPEN_EARN_PAGE, label: EARN_LABELS.info_asset })

                  router.push({
                    pathname: AppRoutes.earn,
                    query: {
                      ...router.query,
                      asset_id: `${chainId}_${asset.tokenInfo.address}`,
                    },
                  })
                }

                return (
                  <Card key={asset.tokenInfo.address} className="p-4">
                    <div className="flex flex-row items-center justify-between gap-2">
                      <div className="flex flex-row items-center gap-4">
                        <TokenIcon logoUri={asset.tokenInfo.logoUri} tokenSymbol={asset.tokenInfo.symbol} size={32} />
                        <div className="flex flex-col">
                          <Typography variant="paragraph-small">
                            <TokenAmount
                              value={asset.balance}
                              decimals={asset.tokenInfo.decimals}
                              tokenSymbol={asset.tokenInfo.symbol}
                              logoUri={undefined}
                            />
                          </Typography>
                          <Typography variant="paragraph-small">
                            <FiatValue value={asset.fiatBalance} />
                          </Typography>
                        </div>
                      </div>
                      <div className="flex flex-row items-center gap-4">
                        <Tooltip>
                          <TooltipTrigger
                            render={<span className={classNames('text-xs leading-4', css.apy)}>Up to {vaultAPY}*</span>}
                          />
                          <TooltipContent>as of 03.06.2025</TooltipContent>
                        </Tooltip>

                        <Button variant="outline" size="sm" onClick={onEarnClick}>
                          Earn
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <Typography variant="paragraph-mini" className="z-[2] mt-4 block">
        {APYDisclaimer}
      </Typography>
    </div>
  )
}

export default EarnInfo
