import React, { useState } from 'react'
import { Box, Checkbox, FormControlLabel, Typography, Link } from '@mui/material'
import css from './styles.module.css'

interface NoFeeNovemberTermsCheckboxProps {
  onAcceptanceChange: (accepted: boolean) => void
}

const NoFeeNovemberTermsCheckbox = ({ onAcceptanceChange }: NoFeeNovemberTermsCheckboxProps) => {
  const [accepted, setAccepted] = useState(false)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isAccepted = event.target.checked
    setAccepted(isAccepted)
    onAcceptanceChange(isAccepted)
  }

  return (
    <Box className={css.container}>
      <FormControlLabel
        control={<Checkbox checked={accepted} onChange={handleChange} className={css.checkbox} />}
        label={
          <Typography className={css.label}>
            I have read and accept the{' '}
            <Link href="https://help.safe.global/en/" target="_blank" rel="noopener noreferrer" className={css.link}>
              Terms and Conditions
            </Link>{' '}
            of the Safe Ecosystem Foundation No-Fee November sponsorship program.
          </Typography>
        }
        className={css.formControl}
      />
    </Box>
  )
}

export default NoFeeNovemberTermsCheckbox
