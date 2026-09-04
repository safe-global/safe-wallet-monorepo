import * as THREE from 'three'
import { cellToWorld, directionAlongPath, pointAlongPath, type MapDef, type PathModel, cellKey } from '../config/map'
import { box, cone, cylinder, icosahedron, plane, sphere, torus } from './geometry'
import { COLORS, dark, glow, material } from './materials'
import { createGridTexture, createPortalTexture, createSafeLogoTexture } from './textures'

export interface Environment {
  group: THREE.Group
  vaultGroup: THREE.Group
  portalGroup: THREE.Group
  update(dt: number, time: number, treasuryRatio: number, damageFlash: number): void
  dispose(): void
}

const FLOW_MARKERS = 36
const FLOW_SPEED = 2.2

const shadowMesh = (geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh => {
  const m = new THREE.Mesh(geo, mat)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

const buildDecor = (kind: number, rng: () => number): THREE.Group => {
  const group = new THREE.Group()
  if (kind === 0) {
    const rack = shadowMesh(box(0.5, 0.9 + rng() * 0.4, 0.5), dark(0x1b1f24))
    rack.position.y = 0.45
    group.add(rack)
    for (let i = 0; i < 4; i++) {
      const led = new THREE.Mesh(box(0.05, 0.05, 0.02), glow(i % 3 === 0 ? COLORS.danger : COLORS.safeGreen, 2))
      led.position.set(-0.15 + i * 0.1, 0.3 + (i % 2) * 0.2, 0.26)
      group.add(led)
    }
  } else if (kind === 1) {
    const crystal = shadowMesh(icosahedron(0.3 + rng() * 0.2), glow(COLORS.safeGreenDark, 0.35))
    crystal.position.y = 0.4
    crystal.rotation.set(rng(), rng(), rng())
    group.add(crystal)
    const shard = shadowMesh(icosahedron(0.16), glow(COLORS.safeGreen, 0.6))
    shard.position.set(0.3, 0.2, 0.2)
    group.add(shard)
  } else {
    const trunk = shadowMesh(cylinder(0.06, 0.09, 0.5, 5), dark(0x3a2a1c))
    trunk.position.y = 0.25
    group.add(trunk)
    const canopy = shadowMesh(cone(0.36, 0.9 + rng() * 0.4, 6), material({ color: 0x14432b, roughness: 0.8 }))
    canopy.position.y = 0.9
    group.add(canopy)
  }
  group.rotation.y = rng() * Math.PI * 2
  return group
}

const buildVault = (): {
  group: THREE.Group
  halo: THREE.Mesh
  pad: THREE.MeshStandardMaterial
  logos: THREE.MeshStandardMaterial[]
  core: THREE.MeshStandardMaterial
} => {
  const group = new THREE.Group()
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1e1c, metalness: 0.7, roughness: 0.3 })
  const body = shadowMesh(box(1.7, 1.7, 1.7), bodyMat)
  body.position.y = 0.95
  group.add(body)
  const trim = shadowMesh(box(1.8, 0.12, 1.8), dark(0x2c3330))
  trim.position.y = 1.8
  group.add(trim)
  const texture = createSafeLogoTexture()
  const logos: THREE.MeshStandardMaterial[] = []
  ;[
    { pos: [0, 0.95, 0.86], rot: [0, 0, 0] },
    { pos: [0.86, 0.95, 0], rot: [0, Math.PI / 2, 0] },
    { pos: [-0.86, 0.95, 0], rot: [0, -Math.PI / 2, 0] },
    { pos: [0, 0.95, -0.86], rot: [0, Math.PI, 0] },
  ].forEach(({ pos, rot }) => {
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      emissive: 0xffffff,
      emissiveMap: texture,
      emissiveIntensity: 0.8,
      roughness: 0.5,
    })
    const face = new THREE.Mesh(plane(1.3, 1.3), mat)
    face.position.set(pos[0], pos[1], pos[2])
    face.rotation.set(rot[0], rot[1], rot[2])
    group.add(face)
    logos.push(mat)
  })
  const coreMat = new THREE.MeshStandardMaterial({
    color: COLORS.safeGreen,
    emissive: COLORS.safeGreen,
    emissiveIntensity: 1.2,
  })
  const core = new THREE.Mesh(sphere(0.26, 12), coreMat)
  core.position.y = 2.35
  group.add(core)
  const halo = new THREE.Mesh(torus(0.7, 0.04, 8, 48), glow(COLORS.safeGreen, 1.6))
  halo.position.y = 2.35
  group.add(halo)
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x0f3b24,
    emissive: COLORS.safeGreen,
    emissiveIntensity: 0.35,
    roughness: 0.6,
  })
  const pad = new THREE.Mesh(cylinder(1.5, 1.6, 0.12, 10), padMat)
  pad.position.y = 0.06
  pad.receiveShadow = true
  group.add(pad)
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4
    const pillar = shadowMesh(cylinder(0.08, 0.1, 1.4, 6), dark(0x2c3330))
    pillar.position.set(Math.cos(angle) * 1.35, 0.7, Math.sin(angle) * 1.35)
    group.add(pillar)
    const tip = new THREE.Mesh(sphere(0.1, 8), glow(COLORS.safeGreen, 2))
    tip.position.set(Math.cos(angle) * 1.35, 1.45, Math.sin(angle) * 1.35)
    group.add(tip)
  }
  return { group, halo, pad: padMat, logos, core: coreMat }
}

const buildPortal = (facing: THREE.Vector3): { group: THREE.Group; ring: THREE.Mesh; disc: THREE.Mesh } => {
  const group = new THREE.Group()
  const ring = new THREE.Mesh(torus(0.85, 0.09, 10, 48), glow(COLORS.danger, 1.3))
  ring.position.y = 1.0
  group.add(ring)
  const disc = new THREE.Mesh(
    plane(1.6, 1.6),
    new THREE.MeshBasicMaterial({
      map: createPortalTexture(),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  disc.position.y = 1.0
  group.add(disc)
  const base = shadowMesh(cylinder(1.0, 1.1, 0.14, 12), dark(0x2a1418))
  base.position.y = 0.07
  group.add(base)
  for (let i = 0; i < 3; i++) {
    const spike = shadowMesh(cone(0.12, 0.6 + i * 0.2, 5), dark(0x3a1c22))
    const angle = Math.PI + (i - 1) * 0.7
    spike.position.set(Math.cos(angle) * 0.9, 0.35, Math.sin(angle) * 0.9)
    group.add(spike)
  }
  group.lookAt(group.position.clone().add(facing))
  return { group, ring, disc }
}

export const buildEnvironment = (map: MapDef, path: PathModel, rng: () => number): Environment => {
  const group = new THREE.Group()

  const ground = new THREE.Mesh(
    plane(90, 90),
    new THREE.MeshStandardMaterial({ map: createGridTexture(), color: 0xffffff, roughness: 0.95, metalness: 0 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.02
  ground.receiveShadow = true
  group.add(ground)

  const decorKeys = new Set(map.decor.map((d) => cellKey(d.c, d.r)))
  const tileGeo = box(0.94, 0.2, 0.94)
  const tileCount = map.cols * map.rows
  const tilesA = new THREE.InstancedMesh(
    tileGeo,
    material({ color: COLORS.tileA, roughness: 0.85, metalness: 0.05 }),
    tileCount,
  )
  const tilesB = new THREE.InstancedMesh(
    tileGeo,
    material({ color: COLORS.tileB, roughness: 0.85, metalness: 0.05 }),
    tileCount,
  )
  const pathTiles = new THREE.InstancedMesh(
    box(1, 0.12, 1),
    material({ color: COLORS.path, roughness: 0.7, metalness: 0.2 }),
    tileCount,
  )
  ;[tilesA, tilesB, pathTiles].forEach((m) => {
    m.receiveShadow = true
    m.castShadow = false
  })
  const dummy = new THREE.Object3D()
  let a = 0
  let b = 0
  let p = 0
  for (let c = 0; c < map.cols; c++) {
    for (let r = 0; r < map.rows; r++) {
      const world = cellToWorld(map, { c, r })
      const key = cellKey(c, r)
      if (path.cells.has(key)) {
        dummy.position.set(world.x, 0.06, world.z)
        dummy.updateMatrix()
        pathTiles.setMatrixAt(p++, dummy.matrix)
        continue
      }
      dummy.position.set(world.x, 0.1, world.z)
      dummy.updateMatrix()
      if ((c + r) % 2 === 0) tilesA.setMatrixAt(a++, dummy.matrix)
      else tilesB.setMatrixAt(b++, dummy.matrix)
      if (decorKeys.has(key)) {
        const decor = buildDecor((c * 7 + r * 3) % 3, rng)
        decor.position.set(world.x, 0.2, world.z)
        group.add(decor)
      }
    }
  }
  tilesA.count = a
  tilesB.count = b
  pathTiles.count = p
  group.add(tilesA, tilesB, pathTiles)

  // Glowing data stream down the centre of the path.
  const ribbonMat = glow(COLORS.pathEdge, 0.9)
  for (let i = 1; i < path.points.length; i++) {
    const start = path.points[i - 1]
    const end = path.points[i]
    const len = Math.hypot(end.x - start.x, end.z - start.z)
    const ribbon = new THREE.Mesh(plane(len, 0.14), ribbonMat)
    ribbon.rotation.x = -Math.PI / 2
    ribbon.rotation.z = -Math.atan2(end.z - start.z, end.x - start.x)
    ribbon.position.set((start.x + end.x) / 2, 0.125, (start.z + end.z) / 2)
    group.add(ribbon)
  }

  const markers = new THREE.InstancedMesh(cone(0.13, 0.32, 4), glow(COLORS.safeGreen, 0.9), FLOW_MARKERS)
  group.add(markers)

  // Border decor outside the playable grid frames the map.
  for (let c = -3; c < map.cols + 3; c++) {
    for (let r = -3; r < map.rows + 3; r++) {
      const inside = c >= 0 && r >= 0 && c < map.cols && r < map.rows
      if (inside || rng() > 0.32) continue
      const world = cellToWorld(map, { c, r })
      const decor = buildDecor(Math.floor(rng() * 3), rng)
      decor.position.set(world.x + (rng() - 0.5) * 0.4, 0, world.z + (rng() - 0.5) * 0.4)
      decor.scale.setScalar(0.7 + rng() * 0.6)
      group.add(decor)
    }
  }

  const vaultWorld = path.points[path.points.length - 1]
  const vault = buildVault()
  vault.group.position.set(vaultWorld.x, 0.12, vaultWorld.z)
  group.add(vault.group)

  const spawnWorld = path.points[0]
  const dir = directionAlongPath(path, 0.1)
  const portal = buildPortal(new THREE.Vector3(dir.x, 0, dir.z))
  portal.group.position.set(spawnWorld.x, 0.12, spawnWorld.z)
  group.add(portal.group)

  const markerDummy = new THREE.Object3D()
  const update = (dt: number, time: number, treasuryRatio: number, damageFlash: number): void => {
    for (let i = 0; i < FLOW_MARKERS; i++) {
      const dist = ((i / FLOW_MARKERS) * path.length + time * FLOW_SPEED) % path.length
      const pos = pointAlongPath(path, dist)
      const d = directionAlongPath(path, dist)
      markerDummy.position.set(pos.x, 0.2, pos.z)
      markerDummy.rotation.set(Math.PI / 2, 0, -Math.atan2(d.x, d.z) + Math.PI)
      markerDummy.updateMatrix()
      markers.setMatrixAt(i, markerDummy.matrix)
    }
    markers.instanceMatrix.needsUpdate = true

    vault.halo.rotation.y += dt * 0.8
    vault.halo.rotation.x = Math.sin(time * 0.5) * 0.3
    const pulse = 0.6 + Math.sin(time * 2.5) * 0.25
    const health = 0.25 + treasuryRatio * 0.75
    vault.core.emissiveIntensity = (0.8 + pulse * 0.6) * health + damageFlash * 3
    vault.core.emissive.setHex(damageFlash > 0.05 ? COLORS.danger : COLORS.safeGreen)
    vault.pad.emissiveIntensity = 0.25 * health + damageFlash * 1.5
    vault.pad.emissive.setHex(damageFlash > 0.05 ? COLORS.danger : COLORS.safeGreen)
    vault.logos.forEach((m) => {
      m.emissiveIntensity = (0.55 + pulse * 0.35) * health
    })

    portal.disc.rotation.z -= dt * 1.5
    portal.ring.rotation.z += dt * 0.6
  }

  return {
    group,
    vaultGroup: vault.group,
    portalGroup: portal.group,
    update,
    dispose: () => {
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshBasicMaterial && obj.material.map) {
          obj.material.map.dispose()
        }
      })
    },
  }
}
