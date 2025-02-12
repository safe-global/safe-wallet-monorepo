import SafenetLogo from '@/public/images/safenet/logo-safenet.svg'
import { Box } from '@mui/material'
import type { ReactElement } from 'react'
import css from './styles.module.css'

const SafenetTag = (): ReactElement => (
  <Box className={css.tag}>
    <SafenetLogo height="12" />
  </Box>
)

export default SafenetTag
