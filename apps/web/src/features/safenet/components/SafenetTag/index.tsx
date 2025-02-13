import { useDarkMode } from '@/hooks/useDarkMode'
import SafenetDarkLogo from '@/public/images/safenet/logo-safenet-dark-gradient.svg'
import SafenetLogo from '@/public/images/safenet/logo-safenet.svg'
import { Box } from '@mui/material'
import type { ReactElement } from 'react'
import css from './styles.module.css'

const SafenetTag = (): ReactElement => {
  const isDarkMode = useDarkMode()

  return <Box className={css.tag}>{isDarkMode ? <SafenetLogo height="12" /> : <SafenetDarkLogo height="12" />}</Box>
}

export default SafenetTag
