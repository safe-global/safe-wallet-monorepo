/**
 * Shim for `next/script` — dynamically injects a `<script>` tag via useEffect.
 *
 * Used by CaptchaProvider to load the Cloudflare Turnstile script.
 */
import { useEffect, useRef } from 'react'

interface ScriptProps {
  src: string
  strategy?: 'beforeInteractive' | 'afterInteractive' | 'lazyOnload' | 'worker'
  onReady?: () => void
  onError?: (error: unknown) => void
  onLoad?: () => void
  id?: string
}

function Script({ src, onReady, onError, onLoad, id }: ScriptProps) {
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    const script = document.createElement('script')
    script.src = src
    script.async = true
    if (id) script.id = id

    script.addEventListener('load', () => {
      onLoad?.()
      onReady?.()
    })

    script.addEventListener('error', (event) => {
      onError?.(event)
    })

    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [src, id, onReady, onError, onLoad])

  return null
}

export default Script
