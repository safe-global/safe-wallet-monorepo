import * as THREE from 'three'
import type { TowerDef } from '../config/types'
import { box, cone, cylinder, octahedron, ring, sphere, torus } from './geometry'
import { COLORS, dark, glow, material } from './materials'

export interface TowerModel {
  group: THREE.Group
  head: THREE.Object3D
  spinners: Array<{ object: THREE.Object3D; speed: number; axis: 'x' | 'y' | 'z' }>
  auraRing?: THREE.Mesh
}

const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, shadow = true): THREE.Mesh => {
  const m = new THREE.Mesh(geo, mat)
  m.castShadow = shadow
  m.receiveShadow = shadow
  return m
}

const addBase = (group: THREE.Group, def: TowerDef, level: number): void => {
  const base = mesh(cylinder(0.42, 0.48, 0.22, 8), dark(COLORS.metal))
  base.position.y = 0.11
  group.add(base)
  const rim = mesh(torus(0.4, 0.03, 8, 24), glow(def.color, 1.1), false)
  rim.rotation.x = Math.PI / 2
  rim.position.y = 0.23
  group.add(rim)
  for (let i = 0; i < level; i++) {
    const gem = mesh(octahedron(0.07), glow(def.color, 2), false)
    const angle = -Math.PI / 2 + (i - (level - 1) / 2) * 0.55
    gem.position.set(Math.cos(angle) * 0.36, 0.3, Math.sin(angle) * 0.36)
    group.add(gem)
  }
}

const buildShield = (def: TowerDef, level: number, model: TowerModel): void => {
  const column = mesh(cylinder(0.14, 0.18, 0.7, 8), dark(0x2f3a35))
  column.position.y = 0.57
  model.group.add(column)
  const head = new THREE.Group()
  head.position.y = 0.95
  for (let i = 0; i < 3; i++) {
    const plate = mesh(box(0.34, 0.42, 0.05), glow(def.color, 0.9))
    const angle = (i / 3) * Math.PI * 2
    plate.position.set(Math.cos(angle) * 0.26, 0, Math.sin(angle) * 0.26)
    plate.rotation.y = -angle + Math.PI / 2
    head.add(plate)
  }
  const orb = mesh(sphere(0.13 + level * 0.02), glow(0xffffff, 1.8), false)
  orb.position.y = 0.32
  head.add(orb)
  model.group.add(head)
  model.head = head
  model.spinners.push({ object: head, speed: 0.8, axis: 'y' })
}

const buildHypernative = (def: TowerDef, level: number, model: TowerModel): void => {
  const column = mesh(cylinder(0.12, 0.2, 0.6, 6), dark(0x1f2f36))
  column.position.y = 0.52
  model.group.add(column)
  const head = new THREE.Group()
  head.position.y = 0.9
  const dish = mesh(cylinder(0.05, 0.4, 0.22, 12), material({ color: 0x1c3f4a, metalness: 0.5, roughness: 0.35 }))
  dish.rotation.x = -0.9
  dish.position.y = 0.05
  head.add(dish)
  const emitter = mesh(sphere(0.09), glow(def.color, 2.2), false)
  emitter.position.set(0, 0.22, 0.2)
  head.add(emitter)
  const antenna = mesh(cylinder(0.02, 0.02, 0.45, 4), glow(def.color, 1.2), false)
  antenna.position.set(0, 0.35, -0.05)
  head.add(antenna)
  for (let i = 0; i < level; i++) {
    const orbit = mesh(torus(0.32 + i * 0.1, 0.015, 6, 32), glow(def.color, 1.4), false)
    orbit.rotation.x = Math.PI / 2 + i * 0.3
    orbit.position.y = 0.2
    head.add(orbit)
    model.spinners.push({ object: orbit, speed: 1.2 + i * 0.4, axis: 'z' })
  }
  model.group.add(head)
  model.head = head
}

const buildMultisig = (def: TowerDef, level: number, model: TowerModel): void => {
  const bunker = mesh(box(0.62, 0.42, 0.62), dark(0x3a3230))
  bunker.position.y = 0.42
  model.group.add(bunker)
  ;[-1, 1].forEach((x) =>
    [-1, 1].forEach((z) => {
      const post = mesh(box(0.12, 0.5, 0.12), dark(0x4a3a2c))
      post.position.set(x * 0.28, 0.5, z * 0.28)
      model.group.add(post)
    }),
  )
  const head = new THREE.Group()
  head.position.y = 0.76
  const turret = mesh(cylinder(0.3, 0.34, 0.24, 8), dark(0x50403a))
  head.add(turret)
  const barrels = level + 1
  for (let i = 0; i < barrels; i++) {
    const offset = (i - (barrels - 1) / 2) * 0.16
    const barrel = mesh(cylinder(0.06, 0.07, 0.62, 8), material({ color: 0x2b2725, metalness: 0.7, roughness: 0.3 }))
    barrel.rotation.x = Math.PI / 2
    barrel.position.set(offset, 0.06, 0.4)
    head.add(barrel)
    const muzzle = mesh(torus(0.07, 0.02, 6, 12), glow(def.color, 1.3), false)
    muzzle.position.set(offset, 0.06, 0.72)
    head.add(muzzle)
  }
  const sigil = mesh(sphere(0.1), glow(def.color, 1.5), false)
  sigil.position.set(0, 0.24, -0.05)
  head.add(sigil)
  model.group.add(head)
  model.head = head
}

const buildSimulator = (def: TowerDef, level: number, model: TowerModel): void => {
  const column = mesh(cylinder(0.14, 0.22, 1.05, 6), dark(0x24332c))
  column.position.y = 0.74
  model.group.add(column)
  const head = new THREE.Group()
  head.position.y = 1.32
  const lens = mesh(torus(0.22, 0.05, 8, 24), glow(def.color, 1.2), false)
  head.add(lens)
  const eye = mesh(sphere(0.12), glow(0xffffff, 2), false)
  eye.position.z = 0.02
  head.add(eye)
  const barrel = mesh(
    box(0.08, 0.08, 0.9 + level * 0.15),
    material({ color: 0x1b2621, metalness: 0.6, roughness: 0.3 }),
  )
  barrel.position.set(0, 0, 0.5)
  head.add(barrel)
  const tip = mesh(cone(0.06, 0.16, 6), glow(def.color, 2), false)
  tip.rotation.x = Math.PI / 2
  tip.position.set(0, 0, 1.0 + level * 0.07)
  head.add(tip)
  model.group.add(head)
  model.head = head
}

const buildSafenet = (def: TowerDef, level: number, model: TowerModel): void => {
  const column = mesh(cylinder(0.1, 0.18, 0.9, 6), dark(0x2a2438))
  column.position.y = 0.67
  model.group.add(column)
  const head = new THREE.Group()
  head.position.y = 1.15
  for (let i = 0; i < 3; i++) {
    const coil = mesh(torus(0.3 - i * 0.07, 0.03, 6, 20), glow(def.color, 0.8 + i * 0.4), false)
    coil.rotation.x = Math.PI / 2
    coil.position.y = -0.3 + i * 0.22
    head.add(coil)
    model.spinners.push({ object: coil, speed: (i % 2 === 0 ? 1 : -1) * (1.5 + i * 0.5), axis: 'z' })
  }
  const orb = mesh(sphere(0.14 + level * 0.02), glow(0xe6dcff, 2.4), false)
  orb.position.y = 0.3
  head.add(orb)
  model.group.add(head)
  model.head = head
}

const buildTimelock = (def: TowerDef, level: number, model: TowerModel): void => {
  const pedestal = mesh(cylinder(0.2, 0.3, 0.4, 6), dark(0x3a3320))
  pedestal.position.y = 0.42
  model.group.add(pedestal)
  const head = new THREE.Group()
  head.position.y = 1.0
  const top = mesh(cone(0.22, 0.34, 6), glow(def.color, 0.9))
  top.position.y = 0.17
  top.rotation.x = Math.PI
  head.add(top)
  const bottom = mesh(cone(0.22, 0.34, 6), glow(def.color, 0.9))
  bottom.position.y = -0.17
  head.add(bottom)
  const frame = mesh(torus(0.42, 0.035, 6, 32), material({ color: 0x8a6d1c, metalness: 0.7, roughness: 0.3 }), false)
  head.add(frame)
  model.spinners.push({ object: frame, speed: 0.6, axis: 'y' })
  model.spinners.push({ object: head, speed: 0.4 + level * 0.2, axis: 'y' })
  model.group.add(head)
  model.head = head
}

const buildRecovery = (def: TowerDef, level: number, model: TowerModel): void => {
  const obelisk = mesh(box(0.28, 0.95, 0.28), material({ color: 0xd8f5e4, roughness: 0.4, metalness: 0.1 }))
  obelisk.position.y = 0.7
  model.group.add(obelisk)
  const head = new THREE.Group()
  head.position.y = 1.3
  const orb = mesh(sphere(0.16), glow(COLORS.safeGreen, 2.2), false)
  head.add(orb)
  for (let i = 0; i < level + 1; i++) {
    const satellite = mesh(box(0.08, 0.08, 0.08), glow(COLORS.safeGreen, 1.6), false)
    const angle = (i / (level + 1)) * Math.PI * 2
    satellite.position.set(Math.cos(angle) * 0.35, 0, Math.sin(angle) * 0.35)
    head.add(satellite)
  }
  model.spinners.push({ object: head, speed: 1.4, axis: 'y' })
  model.group.add(head)
  model.head = head
  const aura = new THREE.Mesh(
    ring(def.levels[level - 1].range - 0.05, def.levels[level - 1].range, 64),
    new THREE.MeshBasicMaterial({ color: COLORS.safeGreen, transparent: true, opacity: 0.25, side: THREE.DoubleSide }),
  )
  aura.rotation.x = -Math.PI / 2
  aura.position.y = 0.26
  model.group.add(aura)
  model.auraRing = aura
}

const buildGuard = (def: TowerDef, level: number, model: TowerModel): void => {
  const chest = mesh(box(0.56, 0.42, 0.44), dark(0x2f3d1e))
  chest.position.y = 0.44
  model.group.add(chest)
  const lid = mesh(box(0.6, 0.12, 0.48), material({ color: 0x4a6a2a, roughness: 0.5, metalness: 0.3 }))
  lid.position.y = 0.71
  model.group.add(lid)
  const lock = mesh(torus(0.09, 0.03, 6, 12), glow(def.color, 1.4), false)
  lock.position.set(0, 0.5, 0.24)
  model.group.add(lock)
  const head = new THREE.Group()
  head.position.y = 0.86
  for (let i = 0; i < level + 2; i++) {
    const spike = mesh(cone(0.06, 0.32, 5), glow(def.color, 1.2))
    const angle = (i / (level + 2)) * Math.PI * 2
    spike.position.set(Math.cos(angle) * 0.2, 0.1, Math.sin(angle) * 0.2)
    spike.rotation.z = Math.cos(angle) * 0.4
    spike.rotation.x = -Math.sin(angle) * 0.4
    head.add(spike)
  }
  const nozzle = mesh(cylinder(0.05, 0.05, 0.4, 6), dark(0x1e2a14))
  nozzle.rotation.x = Math.PI / 2
  nozzle.position.set(0, 0.1, 0.3)
  head.add(nozzle)
  model.group.add(head)
  model.head = head
}

const BUILDERS: Record<TowerDef['id'], (def: TowerDef, level: number, model: TowerModel) => void> = {
  shield: buildShield,
  hypernative: buildHypernative,
  multisig: buildMultisig,
  simulator: buildSimulator,
  safenet: buildSafenet,
  timelock: buildTimelock,
  recovery: buildRecovery,
  guard: buildGuard,
}

export const buildTowerModel = (def: TowerDef, level: number): TowerModel => {
  const group = new THREE.Group()
  const model: TowerModel = { group, head: group, spinners: [] }
  addBase(group, def, level)
  BUILDERS[def.id](def, level, model)
  const scale = 1.15 + (level - 1) * 0.1
  group.scale.setScalar(scale)
  return model
}

/** Semi-transparent clone used as the placement preview. */
export const buildGhostModel = (def: TowerDef, valid: boolean): THREE.Group => {
  const model = buildTowerModel(def, 1)
  const color = valid ? COLORS.safeGreen : COLORS.danger
  const ghostMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  })
  model.group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.material = ghostMat
      obj.castShadow = false
      obj.receiveShadow = false
    }
  })
  return model.group
}
