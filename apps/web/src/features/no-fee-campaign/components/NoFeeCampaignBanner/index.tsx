import { useContext } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import { NewTxFlow } from '@/components/tx-flow/flows'
import PromoBanner from '@/components/common/PromoBanner/PromoBanner'
import useWallet from '@/hooks/wallets/useWallet'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { Link } from '@mui/material'

const NoFeeCampaignBanner = ({ onDismiss }: { onDismiss: () => void }) => {
  const { setTxFlow } = useContext(TxModalContext)
  const wallet = useWallet()
  const isSafeOwner = useIsSafeOwner()
  const safeSDK = useSafeSDK()
  const ctaDisabled = !wallet || !isSafeOwner || !safeSDK

  const handleNewTransaction = () => {
    setTxFlow(<NewTxFlow />, undefined, false)
  }

  return (
    <PromoBanner
      title="Enjoy Free January"
      description={
        <>
          No-Fee for Ethena USDe holders on Ethereum Mainnet, this January!{' '}
          <Link
            href="https://help.safe.global/en/articles/484423-no-fee-january-campaign"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: 'inherit', textDecoration: 'underline', fontWeight: 'bold' }}
          >
            Learn more
          </Link>
        </>
      }
      ctaLabel="New transaction"
      onCtaClick={handleNewTransaction}
      ctaVariant="contained"
      ctaDisabled={ctaDisabled}
      imageSrc="/images/common/no-fee-campaign/Cards_USDe.svg"
      imageAlt="USDe logo"
      trackingEvents={{ category: 'overview', action: 'open_no_fee_campaign_new_tx' }}
      trackHideProps={{ category: 'overview', action: 'hide_no_fee_campaign_banner' }}
      onDismiss={onDismiss}
    />
  )
}

export default NoFeeCampaignBanner
