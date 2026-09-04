import * as THREE from 'three'

const cache = new Map<string, THREE.MeshStandardMaterial>()

export interface MaterialOptions {
  color: number
  emissive?: number
  emissiveIntensity?: number
  roughness?: number
  metalness?: number
  transparent?: boolean
  opacity?: number
  flat?: boolean
}

/** Shared, cached materials so hundreds of enemies/towers reuse the same GPU programs. */
export const material = (opts: MaterialOptions): THREE.MeshStandardMaterial => {
  const key = JSON.stringify(opts)
  const cached = cache.get(key)
  if (cached) return cached
  const mat = new THREE.MeshStandardMaterial({
    color: opts.color,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    roughness: opts.roughness ?? 0.55,
    metalness: opts.metalness ?? 0.25,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    flatShading: opts.flat ?? true,
  })
  cache.set(key, mat)
  return mat
}

export const glow = (color: number, intensity = 1.6): THREE.MeshStandardMaterial =>
  material({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.3, metalness: 0.1 })

export const dark = (color = 0x1c211f): THREE.MeshStandardMaterial =>
  material({ color, roughness: 0.7, metalness: 0.35 })

export const COLORS = {
  background: 0x070a09,
  ground: 0x0d1210,
  tileA: 0x18201c,
  tileB: 0x151c19,
  path: 0x242c29,
  pathEdge: 0x0f7a45,
  safeGreen: 0x12ff80,
  safeGreenDark: 0x0fda6d,
  danger: 0xff5f72,
  warning: 0xff8c00,
  info: 0x00bfe5,
  metal: 0x2b302e,
  text: 0xffffff,
}
