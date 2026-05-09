import type { ReactElement } from 'react'
import { Grid, Box, Typography, Checkbox, FormControlLabel } from '@mui/material'
import { Controller, type Control } from 'react-hook-form'
import { CookieAndTermType } from '@/store/cookiesAndTermsSlice'
import { styles } from './constants'

type CookieFormData = {
  [CookieAndTermType.TERMS]: boolean
  [CookieAndTermType.NECESSARY]: boolean
  [CookieAndTermType.UPDATES]: boolean
  [CookieAndTermType.ANALYTICS]: boolean
}

const CookieCheckbox = ({
  label,
  checked,
  checkboxProps,
}: {
  label: string
  checked: boolean
  checkboxProps: React.ComponentProps<typeof Checkbox>
}) => <FormControlLabel label={label} checked={checked} control={<Checkbox {...checkboxProps} />} sx={{ mt: '-9px' }} />

const CookieOptionsList = ({ control }: { control: Control<CookieFormData> }): ReactElement => {
  return (
    <Grid item xs={12} sm>
      <Box sx={styles.optionBox}>
        <CookieCheckbox checkboxProps={{ id: 'necessary', disabled: true }} label="Necessary" checked />
        <br />
        <Typography variant="body2">Locally stored data for core functionality</Typography>
      </Box>

      <Box sx={styles.optionBox}>
        <Controller
          name={CookieAndTermType.UPDATES}
          control={control}
          render={({ field }) => (
            <CookieCheckbox
              checkboxProps={{
                ...field,
                checked: field.value,
                id: 'beamer',
              }}
              label="Beamer"
              checked={field.value}
            />
          )}
        />
        <br />
        <Typography variant="body2">New features and product announcements</Typography>
      </Box>

      <Box>
        <Controller
          name={CookieAndTermType.ANALYTICS}
          control={control}
          render={({ field }) => (
            <CookieCheckbox
              checkboxProps={{
                ...field,
                checked: field.value,
                id: 'ga',
              }}
              label="Analytics"
              checked={field.value}
            />
          )}
        />
        <br />
        <Typography variant="body2">Analytics tools to understand usage patterns.</Typography>
      </Box>
    </Grid>
  )
}

export default CookieOptionsList
