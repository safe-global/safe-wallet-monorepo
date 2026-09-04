import * as THREE from 'three'
import { box, capsule, cone, cylinder, sphere, torus } from './geometry'
import { glow, material } from './materials'

export interface VitalikModel {
  group: THREE.Group
  cape: THREE.Mesh
  trail: THREE.Mesh
}

/** A friendly, flying low-poly Vitalik: purple shirt, glasses, cape and an Ethereum-diamond jetpack. */
export const buildVitalikModel = (): VitalikModel => {
  const group = new THREE.Group()
  const shirt = material({ color: 0x7c3aed, roughness: 0.6 })
  const skin = material({ color: 0xf1d3b3, roughness: 0.7 })
  const hair = material({ color: 0xd9b46a, roughness: 0.9 })

  const torso = new THREE.Mesh(capsule(0.28, 0.5), shirt)
  torso.rotation.x = Math.PI / 2
  group.add(torso)

  const head = new THREE.Mesh(sphere(0.26, 12), skin)
  head.position.set(0, 0.12, 0.62)
  group.add(head)
  const hairMesh = new THREE.Mesh(sphere(0.27, 10), hair)
  hairMesh.position.set(0, 0.22, 0.56)
  hairMesh.scale.set(1, 0.6, 1)
  group.add(hairMesh)

  const frame = material({ color: 0x111111, metalness: 0.6 })
  ;[-1, 1].forEach((side) => {
    const lens = new THREE.Mesh(torus(0.08, 0.015, 6, 16), frame)
    lens.position.set(side * 0.11, 0.14, 0.86)
    group.add(lens)
    const arm = new THREE.Mesh(capsule(0.07, 0.4), shirt)
    arm.position.set(side * 0.36, -0.02, 0.1)
    arm.rotation.x = Math.PI / 2
    arm.rotation.z = side * 0.35
    group.add(arm)
    const hand = new THREE.Mesh(sphere(0.08, 8), skin)
    hand.position.set(side * 0.44, -0.02, 0.44)
    group.add(hand)
  })

  const legs = new THREE.Mesh(box(0.34, 0.2, 0.7), material({ color: 0x1f2937, roughness: 0.8 }))
  legs.position.set(0, -0.08, -0.55)
  group.add(legs)

  const cape = new THREE.Mesh(
    box(0.7, 0.05, 1.1),
    material({ color: 0x12ff80, emissive: 0x12ff80, emissiveIntensity: 0.4 }),
  )
  cape.position.set(0, 0.22, -0.55)
  group.add(cape)

  const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), glow(0xb388ff, 1.8))
  diamond.position.set(0, -0.32, 0.05)
  diamond.scale.y = 1.5
  group.add(diamond)

  const trail = new THREE.Mesh(
    cone(0.22, 1.6, 8),
    new THREE.MeshBasicMaterial({ color: 0xb388ff, transparent: true, opacity: 0.45, depthWrite: false }),
  )
  trail.rotation.x = Math.PI / 2
  trail.position.set(0, -0.32, -1.1)
  group.add(trail)

  const halo = new THREE.Mesh(cylinder(0.02, 0.02, 0.01, 4), glow(0xffffff, 1))
  halo.visible = false
  group.add(halo)

  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) obj.castShadow = true
  })
  return { group, cape, trail }
}
