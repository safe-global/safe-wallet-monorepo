import { useState } from 'react'
import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import { lightPalette } from '@safe-global/theme'
import Domain from './Domain'

type UnknownAppWarningProps = {
  url?: string
  onHideWarning?: (hideWarning: boolean) => void
}

const UnknownAppWarning = ({ url, onHideWarning }: UnknownAppWarningProps): React.ReactElement => {
  const [toggleHideWarning, setToggleHideWarning] = useState(false)

  const handleToggleWarningPreference = (): void => {
    onHideWarning?.(!toggleHideWarning)
    setToggleHideWarning(!toggleHideWarning)
  }

  return (
    <Box display="flex" flexDirection="column" height="100%" alignItems="center">
      <Box display="block" alignItems="center" mt={6}>
        <WarningAmberOutlinedIcon fontSize="large" color="warning" />
        <Typography variant="h3" fontWeight={700} mt={2} color={lightPalette.warning.main}>
          Warning
        </Typography>
      </Box>
      <Typography my={2} fontWeight={700} color={lightPalette.warning.main}>
        The application you are trying to access is not in the default Safe Apps list
      </Typography>

      <Typography my={2} textAlign="center">
        Check the link you are using and ensure that it comes from a source you trust
      </Typography>

      {url && <Domain url={url} showInOneLine />}

      {onHideWarning && (
        <Box mt={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={toggleHideWarning}
                onChange={handleToggleWarningPreference}
                name="Warning message preference"
              />
            }
            label="Don't show this warning again"
          />
        </Box>
      )}
    </Box>
  )
}

export default UnknownAppWarning
