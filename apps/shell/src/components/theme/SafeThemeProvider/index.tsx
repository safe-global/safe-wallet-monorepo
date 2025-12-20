import { useMemo, type ReactNode } from 'react'
import { generateMuiTheme } from '@safe-global/theme'
import type { Theme } from '@mui/material/styles'

interface SafeThemeProviderProps {
  mode: 'light' | 'dark'
  children: (theme: Theme) => ReactNode
}

const SafeThemeProvider = ({ mode, children }: SafeThemeProviderProps) => {
  const theme = useMemo(() => generateMuiTheme(mode) as Theme, [mode])

  return <>{children(theme)}</>
}

export default SafeThemeProvider
