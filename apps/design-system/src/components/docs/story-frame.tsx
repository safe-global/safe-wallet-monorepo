'use client'

import { useEffect, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { withBasePath } from '@/lib/env'
import { PREVIEW_HEIGHT_MESSAGE, previewMinHeight } from '@/lib/preview-config'

export function StoryFrame({ component, story, title }: { component: string; story: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const minHeight = previewMinHeight(component)
  const [height, setHeight] = useState(minHeight)
  const src = withBasePath(`/preview/${component}/${story}/`)

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== ref.current?.contentWindow) return
      if (event.data?.type !== PREVIEW_HEIGHT_MESSAGE || typeof event.data.height !== 'number') return
      const next = Math.max(minHeight, Math.ceil(event.data.height))
      setHeight((current) => (Math.abs(next - current) < 2 ? current : next))
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [minHeight])

  return (
    <div className="not-prose overflow-hidden rounded-xl border bg-background">
      <iframe
        ref={ref}
        src={src}
        title={`${title} preview`}
        loading="lazy"
        className="block w-full"
        style={{ height }}
        data-story-frame={`${component}/${story}`}
      />
      <div className="flex justify-end border-t px-3 py-1.5">
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Open in new tab
          <ExternalLink className="size-3" aria-hidden />
        </a>
      </div>
    </div>
  )
}
