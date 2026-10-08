import type { ReactNode } from 'react'
import type { PromoBannerProps } from '@/components/common/PromoBanner'
import { Link } from '@/components/ui/link'

export type NoFeeCampaignPromoProps = Pick<
  PromoBannerProps,
  'title' | 'description' | 'ctaLabel' | 'ctaVariant' | 'imageSrc' | 'imageAlt'
>

export type NoFeeCampaignBannerViewProps = {
  renderPromoBanner: (props: NoFeeCampaignPromoProps) => ReactNode
}

export const NoFeeCampaignBannerView = ({ renderPromoBanner }: NoFeeCampaignBannerViewProps) => {
  return (
    <>
      {renderPromoBanner({
        title: 'Enjoy Free January',
        description: (
          <>
            No-Fee for Ethena USDe holders on Ethereum Mainnet, this January!{' '}
            <Link
              href="https://help.safe.global/articles/9605526657-no-fee-january-campaign"
              target="_blank"
              rel="noopener noreferrer"
              variant="inherit"
              className="font-bold underline"
            >
              Learn more
            </Link>
          </>
        ),
        ctaLabel: 'New transaction',
        ctaVariant: 'contained',
        imageSrc: '/images/common/no-fee-campaign/Cards_USDe.svg',
        imageAlt: 'USDe logo',
      })}
    </>
  )
}
