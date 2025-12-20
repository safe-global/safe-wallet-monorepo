import type { ReactElement } from 'react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { CacheProvider, type EmotionCache } from '@emotion/react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'
import SafeThemeProvider from '@/components/theme/SafeThemeProvider'
import { BRAND_NAME } from '@/config/constants'
import createEmotionCache from '@/utils/createEmotionCache'
import '@/styles/globals.css'

const clientSideEmotionCache = createEmotionCache()

interface SafeShellAppProps extends AppProps {
  emotionCache?: EmotionCache
}

const SafeShellApp = ({
  Component,
  pageProps,
  emotionCache = clientSideEmotionCache,
}: SafeShellAppProps): ReactElement => {
  return (
    <>
      <Head>
        <title key="default-title">{BRAND_NAME}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <CacheProvider value={emotionCache}>
        <SafeThemeProvider mode="light">
          {(safeTheme: Theme) => (
            <ThemeProvider theme={safeTheme}>
              <CssBaseline />
              <Component {...pageProps} />
            </ThemeProvider>
          )}
        </SafeThemeProvider>
      </CacheProvider>
    </>
  )
}

export default SafeShellApp
