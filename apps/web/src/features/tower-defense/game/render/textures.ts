import * as THREE from 'three'

/** The Safe logo mark, taken from public/images/logo-no-text.svg (24x24 viewBox). */
export const SAFE_LOGO_PATH =
  'M21.757 11.998h-2.485c-.742 0-1.343.579-1.343 1.293v3.47c0 .714-.602 1.293-1.344 1.293H6.699c-.743 0-1.344.578-1.344 1.292v2.391c0 .714.601 1.293 1.344 1.293h10.458c.742 0 1.335-.579 1.335-1.293V19.82c0-.714.602-1.22 1.344-1.22h1.92c.743 0 1.344-.58 1.344-1.293v-4.03c0-.714-.601-1.278-1.343-1.278ZM5.355 7.249c0-.714.6-1.293 1.343-1.293h9.88c.743 0 1.344-.579 1.344-1.293v-2.39c0-.714-.601-1.293-1.344-1.293H6.125c-.742 0-1.343.579-1.343 1.293v1.842c0 .714-.602 1.292-1.344 1.292H1.526C.784 5.407.182 5.986.182 6.7v4.034c0 .714.604 1.264 1.346 1.264h2.485c.743 0 1.344-.579 1.344-1.293L5.355 7.25ZM10.472 9.485h2.387c.778 0 1.409.608 1.409 1.356v2.296c0 .748-.632 1.356-1.41 1.356h-2.386c-.778 0-1.409-.608-1.409-1.356v-2.296c0-.749.632-1.356 1.409-1.356Z'

const makeCanvas = (size: number): [HTMLCanvasElement, CanvasRenderingContext2D] => {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')
  return [canvas, ctx]
}

const roundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void => {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export const createSafeLogoTexture = (foreground = '#12ff80', background = '#121312'): THREE.CanvasTexture => {
  const size = 512
  const [canvas, ctx] = makeCanvas(size)
  ctx.fillStyle = background
  roundedRect(ctx, 0, 0, size, size, size * 0.12)
  ctx.fill()
  ctx.strokeStyle = foreground
  ctx.lineWidth = size * 0.02
  roundedRect(ctx, size * 0.04, size * 0.04, size * 0.92, size * 0.92, size * 0.1)
  ctx.stroke()
  ctx.save()
  const pad = size * 0.2
  const scale = (size - pad * 2) / 24
  ctx.translate(pad, pad)
  ctx.scale(scale, scale)
  ctx.fillStyle = foreground
  if (typeof Path2D !== 'undefined') {
    ctx.fill(new Path2D(SAFE_LOGO_PATH))
  }
  ctx.restore()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export const createPortalTexture = (): THREE.CanvasTexture => {
  const size = 256
  const [canvas, ctx] = makeCanvas(size)
  const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.05, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255, 95, 114, 0.95)')
  gradient.addColorStop(0.5, 'rgba(120, 10, 30, 0.85)')
  gradient.addColorStop(1, 'rgba(20, 0, 5, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  ctx.strokeStyle = 'rgba(255, 140, 150, 0.6)'
  ctx.lineWidth = 3
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size * (0.12 + i * 0.075), i * 0.9, i * 0.9 + Math.PI * 1.3)
    ctx.stroke()
  }
  ctx.fillStyle = '#ffe0e6'
  ctx.font = `bold ${size * 0.22}px "DM Sans", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('0x', size / 2, size / 2)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export const createGridTexture = (): THREE.CanvasTexture => {
  const size = 256
  const [canvas, ctx] = makeCanvas(size)
  ctx.fillStyle = '#0b0f0e'
  ctx.fillRect(0, 0, size, size)
  ctx.strokeStyle = 'rgba(18, 255, 128, 0.08)'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, size - 2, size - 2)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(60, 60)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
