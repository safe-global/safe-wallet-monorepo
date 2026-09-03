import * as THREE from 'three'
import type { EnemyDef } from '../config/types'
import { box, capsule, cone, cylinder, icosahedron, octahedron, plane, sphere, torus } from './geometry'
import { COLORS, material } from './materials'

export interface EnemyModel {
  group: THREE.Group
  body: THREE.Group
  legs: THREE.Object3D[]
  wings: THREE.Object3D[]
  spinners: THREE.Object3D[]
  tintable: THREE.MeshStandardMaterial[]
  shield?: THREE.Mesh
  hpGroup: THREE.Group
  hpFg: THREE.Mesh
  height: number
  hoverHeight: number
}

/** Enemies need their own material instances so they can be tinted (slow, stun, stealth) individually. */
const own = (color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.2, flatShading: true, ...opts })

const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, shadow = true): THREE.Mesh => {
  const m = new THREE.Mesh(geo, mat)
  m.castShadow = shadow
  return m
}

const eyes = (model: EnemyModel, y: number, z: number, spread = 0.07, color = 0xffffff): void => {
  const mat = material({ color, emissive: color, emissiveIntensity: 2.5 })
  ;[-1, 1].forEach((side) => {
    const eye = mesh(sphere(0.03, 6), mat, false)
    eye.position.set(side * spread, y, z)
    model.body.add(eye)
  })
}

const legs = (model: EnemyModel, color: number, spread = 0.1, length = 0.28): void => {
  ;[-1, 1].forEach((side) => {
    const pivot = new THREE.Group()
    pivot.position.set(side * spread, length, 0)
    const leg = mesh(cylinder(0.05, 0.04, length, 5), own(color))
    leg.position.y = -length / 2
    pivot.add(leg)
    model.body.add(pivot)
    model.legs.push(pivot)
  })
}

const humanoid = (model: EnemyModel, def: EnemyDef, bodyColor: number, headColor: number): void => {
  const bodyMat = own(bodyColor)
  const headMat = own(headColor)
  model.tintable.push(bodyMat, headMat)
  legs(model, headColor)
  const torso = mesh(capsule(0.2, 0.3), bodyMat)
  torso.position.y = 0.62
  model.body.add(torso)
  const head = mesh(sphere(0.16, 10), headMat)
  head.position.y = 1.02
  model.body.add(head)
  eyes(model, 1.04, 0.13, 0.06, def.color)
}

const buildPhisher = (model: EnemyModel, def: EnemyDef): void => {
  humanoid(model, def, 0x3a2a44, 0xd9a2a9)
  const hoodMat = own(def.color)
  model.tintable.push(hoodMat)
  const hood = mesh(cone(0.22, 0.4, 6), hoodMat)
  hood.position.y = 1.25
  model.body.add(hood)
  const rod = mesh(cylinder(0.015, 0.015, 0.9, 4), own(0x8b5a2b))
  rod.position.set(0.25, 0.9, 0.1)
  rod.rotation.z = -0.5
  model.body.add(rod)
}

const buildDust = (model: EnemyModel, def: EnemyDef): void => {
  const mat = own(def.color, { emissive: def.color, emissiveIntensity: 0.7 })
  model.tintable.push(mat)
  const core = mesh(octahedron(0.22), mat)
  core.position.y = 0.4
  model.body.add(core)
  model.spinners.push(core)
}

const buildPoisoner = (model: EnemyModel, def: EnemyDef): void => {
  const mat = own(def.color, { emissive: def.color, emissiveIntensity: 0.35 })
  model.tintable.push(mat)
  const core = mesh(octahedron(0.42), mat)
  core.position.y = 0.72
  model.body.add(core)
  model.spinners.push(core)
  for (let i = 0; i < 6; i++) {
    const spike = mesh(cone(0.06, 0.24, 4), own(0x5e2c6b))
    const angle = (i / 6) * Math.PI * 2
    spike.position.set(Math.cos(angle) * 0.42, 0.72, Math.sin(angle) * 0.42)
    spike.rotation.z = -Math.PI / 2 + 0.0001
    spike.rotation.y = -angle
    spike.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0)
    core.add(spike)
  }
  eyes(model, 0.8, 0.36, 0.1, 0xffffff)
  legs(model, 0x3a1d42, 0.14, 0.32)
}

const buildDrainer = (model: EnemyModel, def: EnemyDef): void => {
  const mat = own(def.color, { emissive: def.color, emissiveIntensity: 0.5, metalness: 0.6 })
  model.tintable.push(mat)
  const hull = mesh(box(0.34, 0.2, 0.7), mat)
  hull.position.y = 0.32
  model.body.add(hull)
  const nose = mesh(cone(0.17, 0.3, 4), mat)
  nose.rotation.x = Math.PI / 2
  nose.rotation.y = Math.PI / 4
  nose.position.set(0, 0.32, 0.5)
  model.body.add(nose)
  const wheel = own(0x1a1a1a)
  ;[-1, 1].forEach((side) => {
    const w = mesh(cylinder(0.12, 0.12, 0.08, 8), wheel)
    w.rotation.z = Math.PI / 2
    w.position.set(side * 0.22, 0.14, 0)
    model.body.add(w)
    model.spinners.push(w)
  })
  eyes(model, 0.4, 0.3, 0.08, 0xffffff)
}

const buildBlindSigner = (model: EnemyModel, def: EnemyDef): void => {
  const bodyMat = own(def.color, { metalness: 0.5, roughness: 0.4 })
  model.tintable.push(bodyMat)
  legs(model, 0x50596b, 0.18, 0.34)
  const torso = mesh(box(0.62, 0.7, 0.44), bodyMat)
  torso.position.y = 0.72
  model.body.add(torso)
  const head = mesh(box(0.34, 0.3, 0.32), own(0xe0c9b0))
  head.position.y = 1.25
  model.body.add(head)
  const blindfold = mesh(box(0.38, 0.1, 0.36), own(0x111111))
  blindfold.position.y = 1.29
  model.body.add(blindfold)
  const ledger = mesh(box(0.14, 0.3, 0.05), own(0x222222, { metalness: 0.8 }))
  ledger.position.set(0.38, 0.85, 0.2)
  model.body.add(ledger)
  const screen = mesh(
    plane(0.1, 0.16),
    material({ color: 0x9be7ff, emissive: 0x9be7ff, emissiveIntensity: 1.5 }),
    false,
  )
  screen.position.set(0.38, 0.88, 0.226)
  model.body.add(screen)
}

const buildLazarus = (model: EnemyModel, def: EnemyDef, commander = false): void => {
  const bodyMat = own(0x2b2f36, { metalness: 0.5, roughness: 0.4 })
  model.tintable.push(bodyMat)
  legs(model, 0x1f2328, 0.12, 0.34)
  const torso = mesh(box(0.42, 0.55, 0.3), bodyMat)
  torso.position.y = 0.76
  model.body.add(torso)
  const emblem = mesh(
    octahedron(0.08),
    material({ color: def.color, emissive: def.color, emissiveIntensity: 1.6 }),
    false,
  )
  emblem.position.set(0, 0.9, 0.17)
  model.body.add(emblem)
  const head = mesh(sphere(0.16, 10), own(0xe6c9a8))
  head.position.y = 1.2
  model.body.add(head)
  const helmet = mesh(sphere(0.19, 10), own(def.color, { metalness: 0.6 }))
  helmet.position.y = 1.26
  helmet.scale.y = 0.7
  model.body.add(helmet)
  const rifle = mesh(box(0.06, 0.06, 0.62), own(0x111111, { metalness: 0.8 }))
  rifle.position.set(0.28, 0.8, 0.2)
  model.body.add(rifle)
  eyes(model, 1.2, 0.14, 0.06, 0xff4040)
  if (commander) {
    const cape = mesh(box(0.5, 0.8, 0.05), own(0x5a0a12))
    cape.position.set(0, 0.7, -0.2)
    model.body.add(cape)
    for (let i = 0; i < 5; i++) {
      const spike = mesh(cone(0.04, 0.2, 4), material({ color: 0xffd166, emissive: 0xffd166, emissiveIntensity: 1.2 }))
      const angle = (i / 5) * Math.PI * 2
      spike.position.set(Math.cos(angle) * 0.14, 1.48, Math.sin(angle) * 0.14)
      model.body.add(spike)
    }
  }
}

const buildSocialEngineer = (model: EnemyModel, def: EnemyDef): void => {
  const bodyMat = own(0x304a5a, { transparent: true, opacity: 0.9 })
  const headMat = own(0xf1d3b3, { transparent: true, opacity: 0.9 })
  model.tintable.push(bodyMat, headMat)
  legs(model, 0x243845, 0.1, 0.3)
  const torso = mesh(capsule(0.2, 0.3), bodyMat)
  torso.position.y = 0.62
  model.body.add(torso)
  const head = mesh(sphere(0.16, 10), headMat)
  head.position.y = 1.02
  model.body.add(head)
  const tie = mesh(box(0.06, 0.28, 0.03), own(def.color, { emissive: def.color, emissiveIntensity: 0.8 }))
  tie.position.set(0, 0.72, 0.21)
  model.body.add(tie)
  const badge = mesh(
    box(0.14, 0.09, 0.02),
    material({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 }),
    false,
  )
  badge.position.set(0.12, 0.8, 0.21)
  model.body.add(badge)
  eyes(model, 1.04, 0.13, 0.06, 0xffffff)
}

const buildDelegatecall = (model: EnemyModel, def: EnemyDef): void => {
  const mat = own(def.color, { emissive: def.color, emissiveIntensity: 0.6, metalness: 0.5 })
  model.tintable.push(mat)
  const core = mesh(octahedron(0.3), mat)
  core.scale.y = 1.5
  model.body.add(core)
  model.spinners.push(core)
  ;[-1, 1].forEach((side) => {
    const pivot = new THREE.Group()
    pivot.position.set(side * 0.15, 0.05, 0)
    const wing = mesh(box(0.55, 0.03, 0.28), own(0x3a1f3f, { transparent: true, opacity: 0.85 }), false)
    wing.position.x = side * 0.3
    pivot.add(wing)
    model.body.add(pivot)
    model.wings.push(pivot)
  })
  eyes(model, 0.05, 0.25, 0.08, 0xffffff)
}

const buildMevBot = (model: EnemyModel, def: EnemyDef): void => {
  const mat = own(0x1d2b33, { metalness: 0.7, roughness: 0.3 })
  model.tintable.push(mat)
  const disc = mesh(cylinder(0.32, 0.36, 0.12, 8), mat)
  model.body.add(disc)
  const lens = mesh(sphere(0.1), material({ color: def.color, emissive: def.color, emissiveIntensity: 2 }), false)
  lens.position.y = -0.05
  model.body.add(lens)
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4
    const arm = mesh(box(0.3, 0.03, 0.05), mat, false)
    arm.position.set(Math.cos(angle) * 0.35, 0.05, Math.sin(angle) * 0.35)
    arm.rotation.y = -angle
    model.body.add(arm)
    const rotor = mesh(box(0.28, 0.01, 0.05), own(0x9be7ff, { transparent: true, opacity: 0.7 }), false)
    rotor.position.set(Math.cos(angle) * 0.5, 0.1, Math.sin(angle) * 0.5)
    model.body.add(rotor)
    model.spinners.push(rotor)
  }
}

const buildSpoofedUi = (model: EnemyModel, def: EnemyDef): void => {
  const frameMat = own(0x0c1712, { metalness: 0.3 })
  model.tintable.push(frameMat)
  legs(model, 0x1d2a24, 0.16, 0.3)
  const frame = mesh(box(0.74, 0.58, 0.08), frameMat)
  frame.position.y = 0.72
  model.body.add(frame)
  const screen = mesh(plane(0.64, 0.46), material({ color: 0x081b12, emissive: 0x0f4a2b, emissiveIntensity: 1 }), false)
  screen.position.set(0, 0.72, 0.045)
  model.body.add(screen)
  const logo = mesh(
    box(0.14, 0.14, 0.02),
    material({ color: def.color, emissive: def.color, emissiveIntensity: 1.5 }),
    false,
  )
  logo.position.set(-0.2, 0.82, 0.06)
  model.body.add(logo)
  for (let i = 0; i < 3; i++) {
    const line = mesh(
      box(0.28, 0.03, 0.01),
      material({ color: 0xa1a3a7, emissive: 0xa1a3a7, emissiveIntensity: 0.6 }),
      false,
    )
    line.position.set(0.1, 0.86 - i * 0.1, 0.06)
    model.body.add(line)
  }
  const button = mesh(
    box(0.22, 0.07, 0.01),
    material({ color: def.color, emissive: def.color, emissiveIntensity: 1.8 }),
    false,
  )
  button.position.set(0.14, 0.55, 0.06)
  model.body.add(button)
  eyes(model, 0.72, 0.06, 0.32, 0xff5f72)
}

const buildApprovalHijacker = (model: EnemyModel, def: EnemyDef): void => {
  const bodyMat = own(0x4a3b1f, { roughness: 0.5 })
  model.tintable.push(bodyMat)
  legs(model, 0x2f2614, 0.16, 0.3)
  const belly = mesh(sphere(0.4, 10), bodyMat)
  belly.position.y = 0.72
  belly.scale.set(1, 0.85, 0.85)
  model.body.add(belly)
  const head = mesh(sphere(0.16, 10), own(0xe3c7a1))
  head.position.y = 1.2
  model.body.add(head)
  const coin = mesh(
    torus(0.22, 0.06, 8, 20),
    material({ color: def.color, emissive: def.color, emissiveIntensity: 0.9, metalness: 0.8 }),
  )
  coin.position.set(0, 0.9, -0.38)
  model.body.add(coin)
  model.spinners.push(coin)
  const infinity = mesh(
    torus(0.08, 0.025, 6, 12),
    material({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.5 }),
    false,
  )
  infinity.position.set(0, 0.78, 0.4)
  model.body.add(infinity)
  eyes(model, 1.22, 0.14, 0.06, def.color)
}

const buildRugWhale = (model: EnemyModel, def: EnemyDef): void => {
  const mat = own(def.color, { roughness: 0.4, metalness: 0.3 })
  model.tintable.push(mat)
  const bodyMesh = mesh(capsule(0.42, 0.9), mat)
  bodyMesh.rotation.x = Math.PI / 2
  bodyMesh.position.y = 0.65
  model.body.add(bodyMesh)
  const belly = mesh(capsule(0.34, 0.8), own(0xcfe7ff))
  belly.rotation.x = Math.PI / 2
  belly.position.set(0, 0.45, 0.05)
  model.body.add(belly)
  const tail = mesh(box(0.7, 0.08, 0.35), mat)
  tail.position.set(0, 0.7, -0.95)
  model.body.add(tail)
  model.wings.push(tail)
  ;[-1, 1].forEach((side) => {
    const fin = mesh(box(0.5, 0.06, 0.28), mat)
    fin.position.set(side * 0.55, 0.5, 0.15)
    fin.rotation.z = side * 0.3
    model.body.add(fin)
  })
  const rug = mesh(box(0.6, 0.05, 0.7), material({ color: 0xff5f72, emissive: 0xff5f72, emissiveIntensity: 0.4 }))
  rug.position.set(0, 1.08, 0.1)
  model.body.add(rug)
  eyes(model, 0.85, 0.75, 0.22, 0xffffff)
}

const buildSupplyWorm = (model: EnemyModel, def: EnemyDef): void => {
  const mat = own(def.color, { roughness: 0.5 })
  model.tintable.push(mat)
  for (let i = 0; i < 6; i++) {
    const r = i === 0 ? 0.42 : 0.36 - i * 0.03
    const segment = mesh(sphere(r, 10), i % 2 === 0 ? mat : own(0x5f8f2e))
    segment.position.set(0, 0.45, -i * 0.55)
    model.body.add(segment)
    if (i > 0) model.wings.push(segment)
  }
  const cube = mesh(box(0.22, 0.22, 0.22), material({ color: 0xcb3837, emissive: 0xcb3837, emissiveIntensity: 1.1 }))
  cube.position.set(0, 0.9, 0)
  model.body.add(cube)
  model.spinners.push(cube)
  eyes(model, 0.6, 0.4, 0.16, 0xffff66)
}

const BUILDERS: Record<EnemyDef['id'], (model: EnemyModel, def: EnemyDef) => void> = {
  phisher: buildPhisher,
  dust: buildDust,
  poisoner: buildPoisoner,
  drainer: buildDrainer,
  blindSigner: buildBlindSigner,
  lazarus: (m, d) => buildLazarus(m, d),
  socialEngineer: buildSocialEngineer,
  delegatecall: buildDelegatecall,
  mevBot: buildMevBot,
  spoofedUi: buildSpoofedUi,
  approvalHijacker: buildApprovalHijacker,
  rugWhale: buildRugWhale,
  supplyWorm: buildSupplyWorm,
  lazarusCommander: (m, d) => buildLazarus(m, d, true),
}

/** Enemies are drawn a little larger than their gameplay footprint so they read well from the RTS camera. */
const VISUAL_SCALE = 1.6

const HEIGHTS: Partial<Record<EnemyDef['id'], number>> = {
  dust: 0.7,
  poisoner: 1.2,
  drainer: 0.7,
  blindSigner: 1.6,
  lazarusCommander: 1.8,
  rugWhale: 1.4,
  supplyWorm: 1.3,
  delegatecall: 0.7,
  mevBot: 0.5,
}

export const buildEnemyModel = (def: EnemyDef): EnemyModel => {
  const group = new THREE.Group()
  const body = new THREE.Group()
  group.add(body)
  const hpGroup = new THREE.Group()
  const hpBg = new THREE.Mesh(
    plane(0.8, 0.1),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 }),
  )
  const hpFg = new THREE.Mesh(plane(0.8, 0.1), new THREE.MeshBasicMaterial({ color: COLORS.safeGreen }))
  hpFg.position.z = 0.001
  hpGroup.add(hpBg, hpFg)
  group.add(hpGroup)
  const model: EnemyModel = {
    group,
    body,
    legs: [],
    wings: [],
    spinners: [],
    tintable: [],
    hpGroup,
    hpFg,
    height: (HEIGHTS[def.id] ?? 1.4) * def.scale * VISUAL_SCALE,
    hoverHeight: def.flying ? 1.8 * def.scale : 0,
  }
  BUILDERS[def.id](model, def)
  body.scale.setScalar(def.scale * VISUAL_SCALE)
  if (def.shieldHits) {
    const shield = new THREE.Mesh(
      icosahedron(0.8 * def.scale * VISUAL_SCALE),
      new THREE.MeshStandardMaterial({
        color: 0x9be7ff,
        emissive: 0x3fa9ff,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
        flatShading: true,
      }),
    )
    shield.position.y = model.height * 0.5
    group.add(shield)
    model.shield = shield
  }
  hpGroup.position.y = model.height + 0.25
  hpGroup.scale.setScalar(Math.max(0.9, Math.min(2.2, def.scale * 1.3)))
  return model
}
