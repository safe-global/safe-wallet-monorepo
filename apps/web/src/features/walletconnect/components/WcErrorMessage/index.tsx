import { splitError } from '../../services/utils'
import { Button, Typography } from '@mui/material'
import WcLogoHeader from '../WcLogoHeader'
import css from './styles.module.css'

const WcErrorMessage = ({ error, onClose }: { error: Error; onClose: () => void }) => {
  const message = error.message || 'An error occurred'
  const [summary, details] = splitError(message)

  return (
    <div className={css.errorContainer}>
      <WcLogoHeader errorMessage={summary} />

      {details && (
        <Typography mt={1} className={css.details}>
          {details}
        </Typography>
      )}

      <Button variant="contained" onClick={onClose} className={css.button}>
        OK
      </Button>
    </div>
  )
}

export default WcErrorMessage
