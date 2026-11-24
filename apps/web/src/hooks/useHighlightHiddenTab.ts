import { useEffect } from 'react'

const ALT_FAVICON = '/favicons/favicon-dot.ico'
const TITLE_PREFIX = '‼️ '

const setFavicon = (favicon: HTMLLinkElement | null, href: string) => {
  if (favicon) {
    favicon.href = href
  }
}

const setDocumentTitle = (isPrefixed: boolean) => {
  document.title = isPrefixed ? TITLE_PREFIX + document.title : document.title.replace(TITLE_PREFIX, '')
}

const blinkFavicon = (
  favicon: HTMLLinkElement | null,
  originalHref: string,
  isBlinking = false,
): ReturnType<typeof setInterval> => {
  const onBlink = () => {
    setDocumentTitle(isBlinking)
    setFavicon(favicon, isBlinking ? ALT_FAVICON : originalHref)
    isBlinking = !isBlinking
  }

  onBlink()

  return setInterval(onBlink, 300)
}

/**
 * Blink favicon when the tab is hidden
 */
const useHighlightHiddenTab = () => {
  useEffect(() => {
    const favicon = document.querySelector<HTMLLinkElement>('link[rel*="icon"]')
    const originalHref = favicon?.href || ''
    let interval: ReturnType<typeof setInterval>

    const reset = () => {
      clearInterval(interval)
      setFavicon(favicon, originalHref)
      setDocumentTitle(false)
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        interval = blinkFavicon(favicon, originalHref)
      } else {
        reset()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    handleVisibilityChange()

    return () => {
      reset()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
}

export default useHighlightHiddenTab
