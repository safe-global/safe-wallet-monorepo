import { splitError } from '../../services/utils'
import WcLogoHeader from '../WcLogoHeader'
import { WcErrorMessageView } from '@views/features/walletconnect/components/WcErrorMessage/WcErrorMessageView'

const WcErrorMessage = ({ error, onClose }: { error: Error; onClose: () => void }) => {
  // Without a message the view shows its own fallback copy
  const [summary, details] = error.message ? splitError(error.message) : []

  return (
    <WcErrorMessageView
      summary={summary}
      details={details}
      renderLogoHeader={(errorMessage) => <WcLogoHeader errorMessage={errorMessage} />}
      onClose={onClose}
    />
  )
}

export default WcErrorMessage
