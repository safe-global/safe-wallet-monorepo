import classNames from 'classnames'
import type { CoreTypes } from '@walletconnect/types'
import { Typography } from '@/components/ui/typography'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import SafeLogo from '@/public/images/logo-no-text.svg'
import ConnectionDots from '@/public/images/common/connection-dots.svg'
import css from './styles.module.css'

const WcConnectionState = ({ metadata, isDelete }: { metadata?: CoreTypes.Metadata; isDelete: boolean }) => {
  const name = metadata?.name || 'dApp'
  const icon = metadata?.icons[0] || ''

  return (
    <div data-testid="wc-connection-state" className={css.container}>
      <div>
        <SafeLogo alt="Safe logo" width="28px" height="28px" />

        <ConnectionDots
          data-testid="connection-dots"
          className={classNames('mx-4 size-6', css.dots, { [css.errorDots]: isDelete })}
        />

        <SafeAppIconCard src={icon} width={28} height={28} alt={`${name} logo`} />
      </div>

      <Typography variant="h4" className="mt-6">
        {isDelete ? `${name} disconnected` : `${name} successfully connected!`}
      </Typography>
    </div>
  )
}

export default WcConnectionState
