import type { ReactElement } from 'react'
import { IconButton, SvgIcon, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import TokenIcon from '@/public/images/common/token.svg'
import ExternalLink from '@/components/common/ExternalLink'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import useChainId from '@/hooks/useChainId'
import { GTF_FEES_BANNER_DISMISSED_KEY } from '../../constants'
import css from './styles.module.css'

const LEARN_MORE_URL = 'https://help.safe.global/en/articles/618701-safe-wallet-gas-fees-faq'

const FeeInfoBanner = (): ReactElement | null => {
  const chainId = useChainId()
  const [dismissed, setDismissed] = useLocalStorage<boolean>(`${GTF_FEES_BANNER_DISMISSED_KEY}_${chainId}`)

  if (dismissed) {
    return null
  }

  return (
    <div className={css.feeInfoBanner}>
      <div className={css.feeInfoContent}>
        <span className={css.newTag}>New</span>

        <div className={css.feeInfoBody}>
          <Typography variant="subtitle2" fontWeight={700}>
            Soon, fees will be paid from your Safe balance.
          </Typography>

          <div className={css.feeInfoBullet}>
            <span className={css.bulletIconWrapper}>
              <SvgIcon component={AccountBalanceWalletOutlinedIcon} className={css.bulletIcon} />
            </span>
            <Typography variant="body2">No need to fund signing wallets</Typography>
          </div>

          <div className={css.feeInfoBullet}>
            <span className={css.bulletIconWrapper}>
              <SvgIcon component={TokenIcon} inheritViewBox className={css.bulletIcon} />
            </span>
            <Typography variant="body2">Pay fees in any supported token</Typography>
          </div>
        </div>

        <ExternalLink href={LEARN_MORE_URL} noIcon className={css.learnMoreLink}>
          <Typography variant="body2" fontWeight={700}>
            Learn more
          </Typography>
        </ExternalLink>
      </div>

      <IconButton size="small" aria-label="close" onClick={() => setDismissed(true)} className={css.feeInfoClose}>
        <CloseIcon className={css.closeIcon} />
      </IconButton>
    </div>
  )
}

export default FeeInfoBanner
