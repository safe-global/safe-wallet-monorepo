import { useContext } from 'react'
import Link from 'next/link'
import { TxModalContext } from '@/components/tx-flow'
import { NewTxFlow } from '@/components/tx-flow/flows'
import CheckWallet from '@/components/common/CheckWallet'
import PromoBanner from '@/components/common/PromoBanner/PromoBanner'

export const noFeeNovemberBannerID = 'noFeeNovemberBanner'

const NoFeeNovemberBanner = ({ onDismiss }: { onDismiss: () => void }) => {
  const { setTxFlow } = useContext(TxModalContext)

  const handleNewTransaction = () => {
    setTxFlow(<NewTxFlow />, undefined, false)
  }

  const description = (
    <>
      SAFE holders enjoy gasless transactions on Ethereum Mainnet this November.{' '}
      <Link
        href="https://help.safe.global/en/articles/456540-no-fee-november"
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'underline', fontWeight: 'bold' }}
      >
        Learn more
      </Link>
    </>
  )

  return (
    <CheckWallet allowSpendingLimit>
      {(isOk) => (
        <PromoBanner
          title="Enjoy No-Fee November"
          description={description}
          ctaLabel="New transaction"
          onCtaClick={handleNewTransaction}
          ctaDisabled={!isOk}
          onDismiss={onDismiss}
          imageSrc="/images/common/no-fee-november/Cards.svg"
          imageAlt="No-Fee November Cards"
          trackOpenProps={{ category: 'overview', action: 'open_no_fee_november_new_tx' }}
          trackHideProps={{ category: 'overview', action: 'hide_no_fee_november_banner' }}
          customBackground="linear-gradient(135deg, #12FF80 0%, #7A2BF4 100%)"
          customTitleColor="var(--color-static-main)"
          customFontColor="var(--color-static-light)"
          customCloseIconColor="var(--color-static-main)"
        />
      )}
    </CheckWallet>
  )
}

export default NoFeeNovemberBanner
