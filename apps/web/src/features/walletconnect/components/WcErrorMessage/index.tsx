import { splitError } from '../../services/utils'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import WcLogoHeader from '../WcLogoHeader'
import css from './styles.module.css'

const WcErrorMessage = ({ error, onClose }: { error: Error; onClose: () => void }) => {
  const message = error.message || 'An error occurred'
  const [summary, details] = splitError(message)

  return (
    <div className={css.errorContainer}>
      <WcLogoHeader errorMessage={summary} />

      {details && <Typography className={`mt-1 ${css.details}`}>{details}</Typography>}

      <Button
        variant="default"
        onClick={onClose}
        // eslint-disable-next-line no-restricted-syntax -- faithful css-module port, pixel-identical; bespoke values have no variant
        className="py-[var(--space-1)] px-[var(--space-4)] mt-[var(--space-3)]"
      >
        OK
      </Button>
    </div>
  )
}

export default WcErrorMessage
