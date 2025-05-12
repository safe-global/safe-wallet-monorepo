import ImageFallback from '@/components/common/ImageFallback'
import useAsync from '@safe-global/utils/hooks/useAsync'
import type { SVGAttributes } from 'react'

const APP_LOGO_FALLBACK_IMAGE = `/images/apps/app-placeholder.svg`

const SafeAppIconCard = ({
  src,
  alt,
  width = 48,
  height = 48,
  fallback = APP_LOGO_FALLBACK_IMAGE,
}: {
  src: string
  alt: string
  width?: number
  height?: number
  fallback?: string
}) => {
  const [svg] = useAsync<SVGSVGElement | null>(async () => {
    if (!src || !src.endsWith('.svg')) {
      return null
    }

    const res = await fetch(src)
    const svg = await res.text()

    const parser = new DOMParser()
    const doc = parser.parseFromString(svg, 'image/svg+xml')
    return doc.querySelector('svg')
  }, [src])

  if (svg) {
    return (
      <svg
        {..._svgAttributesToProps(svg.attributes)}
        width={width}
        height={height}
        dangerouslySetInnerHTML={{ __html: svg.innerHTML }}
      />
    )
  }

  return <ImageFallback src={src} alt={alt} width={width} height={height} fallbackSrc={fallback} />
}

export function _svgAttributesToProps(attributes: NamedNodeMap): Partial<SVGAttributes<SVGSVGElement>> {
  const exceptions: Record<string, string> = {
    class: 'className',
    for: 'htmlFor',
    viewbox: 'viewBox',
    tabindex: 'tabIndex',
    readonly: 'readOnly',
    maxlength: 'maxLength',
    contenteditable: 'contentEditable',
    crossorigin: 'crossOrigin',
  }

  return Array.from(attributes).reduce<Record<string, string>>((acc, attr) => {
    const name = exceptions[attr.name] || attr.name
    acc[name] = attr.value
    return acc
  }, {})
}

export default SafeAppIconCard
