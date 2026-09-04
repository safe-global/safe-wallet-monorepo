import * as THREE from 'three'

const cache = new Map<string, THREE.BufferGeometry>()

/** Memoised geometry factory: identical shapes share one GPU buffer. */
export const geometry = <T extends THREE.BufferGeometry>(key: string, create: () => T): T => {
  const cached = cache.get(key)
  if (cached) return cached as T
  const geo = create()
  cache.set(key, geo)
  return geo
}

export const box = (w: number, h: number, d: number): THREE.BoxGeometry =>
  geometry(`box:${w}:${h}:${d}`, () => new THREE.BoxGeometry(w, h, d))

export const cylinder = (rTop: number, rBottom: number, h: number, segments = 8): THREE.CylinderGeometry =>
  geometry(`cyl:${rTop}:${rBottom}:${h}:${segments}`, () => new THREE.CylinderGeometry(rTop, rBottom, h, segments))

export const cone = (r: number, h: number, segments = 6): THREE.ConeGeometry =>
  geometry(`cone:${r}:${h}:${segments}`, () => new THREE.ConeGeometry(r, h, segments))

export const sphere = (r: number, segments = 10): THREE.SphereGeometry =>
  geometry(`sphere:${r}:${segments}`, () => new THREE.SphereGeometry(r, segments, Math.max(6, segments - 2)))

export const torus = (r: number, tube: number, radial = 8, tubular = 24): THREE.TorusGeometry =>
  geometry(`torus:${r}:${tube}:${radial}:${tubular}`, () => new THREE.TorusGeometry(r, tube, radial, tubular))

export const octahedron = (r: number): THREE.OctahedronGeometry =>
  geometry(`octa:${r}`, () => new THREE.OctahedronGeometry(r, 0))

export const icosahedron = (r: number): THREE.IcosahedronGeometry =>
  geometry(`ico:${r}`, () => new THREE.IcosahedronGeometry(r, 0))

export const capsule = (r: number, len: number): THREE.CapsuleGeometry =>
  geometry(`capsule:${r}:${len}`, () => new THREE.CapsuleGeometry(r, len, 3, 8))

export const plane = (w: number, h: number): THREE.PlaneGeometry =>
  geometry(`plane:${w}:${h}`, () => new THREE.PlaneGeometry(w, h))

export const ring = (inner: number, outer: number, segments = 48): THREE.RingGeometry =>
  geometry(`ring:${inner}:${outer}:${segments}`, () => new THREE.RingGeometry(inner, outer, segments))
