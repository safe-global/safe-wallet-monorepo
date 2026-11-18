'use client'

import { useEffect } from 'react'
import { previews } from '@/generated/previews'
import { PREVIEW_HEIGHT_MESSAGE } from '@/lib/preview-config'

export function PreviewRoot({ component, exportName }: { component: string; exportName: string }) {
  const Preview = previews[component]

  useEffect(() => {
    if (window.parent === window) return
    const root = document.getElementById('story-root')
    if (!root) return
    const post = () =>
      window.parent.postMessage(
        { type: PREVIEW_HEIGHT_MESSAGE, height: root.getBoundingClientRect().height },
        window.location.origin,
      )
    const observer = new ResizeObserver(post)
    observer.observe(root)
    post()
    return () => observer.disconnect()
  }, [])

  return <div id="story-root">{Preview ? <Preview name={exportName} /> : null}</div>
}
