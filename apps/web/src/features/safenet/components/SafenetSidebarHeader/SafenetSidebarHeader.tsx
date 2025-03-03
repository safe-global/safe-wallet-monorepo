import SafenetDarkLogo from '@/public/images/safenet/logo-safenet-dark-gradient.svg'
import { Box } from '@mui/material'
import type { ReactElement } from 'react'
import css from './styles.module.css'

const SafenetSidebarHeader = (): ReactElement => (
  <Box className={css.safenetHeader}>
    <SafenetDarkLogo height="14" />
  </Box>
)

export default SafenetSidebarHeader
